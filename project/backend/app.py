# app.py
import os
import json
from flask import Flask, request, jsonify, make_response, Response, flash
from modules.agent import app as agent_app
from flask_cors import CORS
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import traceback

from modules.chatbot import ChatBot 
from models.metacritic import process_userinput, predict_metascore

from dotenv import load_dotenv
from flask_mail import Mail, Message

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
import tensorflow as tf

import warnings
warnings.filterwarnings("ignore", message=".*flash attention.*")



system_instruction = """
You are an assistant connected to tools.
- For any question about movies, genres, people, awards, reviews, or data stored in the Neo4j graph, ALWAYS use the Neo4jGraphQA tool.
- For real-world facts not in the graph, use the WebSearch tool.
- Do not answer directly without using a tool unless the question is purely about yourself or general instructions.
"""

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print("Current Working Directory:", os.getcwd())

app = Flask(__name__)

app.secret_key = os.getenv("SECRET_KEY")
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("EMAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_DEFAULT_SENDER")


CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})



mail = Mail(app)
bot = ChatBot()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status":"ok"}), 200



@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "")

        # Invoke agent
        result = agent_app.invoke(
            {
                "messages": [
                    SystemMessage(content=system_instruction),  # inject instruction
                    HumanMessage(content=user_message),
                ]
            },
            config={"configurable": {"thread_id": "default-thread"}},
        )

        # Safely extract AI response
        answer = None
        if "messages" in result and result["messages"]:
            # find the last AI message
            ai_messages = [m for m in result["messages"] if isinstance(m, AIMessage)]
            if ai_messages:
                answer = ai_messages[-1].content
            else:
                answer = result["messages"][-1].content
        else:
            # fallback
            answer = result.get("output", "(no output)")

        return jsonify({"answer": answer}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

@app.route("/feedback", methods=["OPTIONS", "POST"])
def feedback():
    # respond to preflight quickly
    if request.method == "OPTIONS":
        return make_response("", 200)

    try:
        data = request.get_json(force=True)  # force=True helps if content-type header missing
        user_message = data.get("user_message", "")
        bot_message = data.get("bot_message", "")
        feedback = data.get("feedback", "down")  # 'up' or 'down'

        # helpful debugging log (check your Flask console)
        print(f"[FEEDBACK] user_message={user_message[:80]!r} bot_message={bot_message[:80]!r} feedback={feedback!r}")

        # Build a retry prompt (adjust as needed)
        system_txt = (
            "You are an assistant that can use tools (Neo4j/WebSearch). "
            "The user said the previous answer was not good; produce an improved, concise reply."
        )

        retry_prompt = (
            f"The user originally asked: {user_message}\n\n"
            f"The assistant responded:\n{bot_message}\n\n"
            f"The user rated the previous answer: {feedback}.\n\n"
            "Produce an improved, concise and actionable answer. Use the graph or web tools if necessary."
        )

        # Invoke the agent (adjust to match your agent API)
        # If your agent expects a dict like earlier, use that; here I follow your existing pattern.
        from modules.agent import app as agent_app  # import inside function to avoid import loops


        result = agent_app.invoke(
            {
                "messages": [
                    SystemMessage(content=system_txt),
                    HumanMessage(content=retry_prompt)
                ]
            },
            config={"configurable": {"thread_id": "default-thread"}},
        )

        # Robust extraction of AI text
        answer = None
        if "messages" in result and result["messages"]:
            # prefer last AIMessage
            ai_msgs = [m for m in result["messages"] if hasattr(m, "content") and m.__class__.__name__.endswith("AIMessage")]
            if ai_msgs:
                answer = ai_msgs[-1].content
            else:
                last = result["messages"][-1]
                answer = getattr(last, "content", str(last))
        else:
            answer = result.get("output", "(no output)")

        return jsonify({"answer": answer}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
bot = None

def get_bot():
    """
    Lazy loader for ChatBot. Creates the ChatBot instance the first time it's needed.
    Returns the bot or raises an Exception if initialization fails (so route can respond).
    """
    global bot
    if bot is None:
        try:
            # Import inside function to avoid heavy imports at module import time
            from modules.chatbot import ChatBot
            bot = ChatBot()
        except Exception as e:
            # Log the error and re-raise so callers can handle it.
            import traceback
            traceback.print_exc()
            raise RuntimeError(f"Failed to initialize ChatBot: {e}")
    return bot


@app.route("/rag", methods=["POST"])
def rag_chat():
    data = request.get_json()
    if not data or "question" not in data:
        return jsonify({"error": "No question provided."}), 400

    question = data["question"]

    try:
        bot_instance = get_bot()
    except Exception as e:
        # Return 500 with helpful message so frontend doesn't just see connection refused
        return jsonify({
            "error": "ChatBot initialization failed on the server.",
            "details": str(e)
        }), 500

    def generate():
        # stream_answer is expected to be a generator yielding chunks
        for chunk in bot_instance.stream_answer(question):
            yield chunk

    return Response(generate(), mimetype="text/plain")




    

@app.route("/metacritic", methods=["POST"])
def metacritic():
    try:
        data = request.get_json()

        mapped_data = {
            "year": data.get("year"),
            "imdb user rating": data.get("imdb_rating"),
            "number of imdb user votes": data.get("imdb_votes"),
            "budget": data.get("budget"),
            "opening weekend": data.get("opening_weekend"),
            "text": data.get("text", ""),
        }

        preprocessed = process_userinput(mapped_data)
        preds = predict_metascore(preprocessed)

        score = round(float(preds[0]), 2)

        return jsonify({
            "output": f"🎯 Predicted Metacritic Score: {score}/100"
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"⚠️ Oops! Something went wrong: {str(e)}"
        }), 500


import traceback

def send_email(name, email, message_text):
    """
    Returns (True, None) on success, or (False, "error message") on failure.
    Always returns a tuple so callers can unpack safely.
    """
    try:
        # Resolve sender & recipient
        sender = (
            app.config.get("MAIL_DEFAULT_SENDER")
            or os.getenv("MAIL_DEFAULT_SENDER")
            or app.config.get("MAIL_USERNAME")
            or os.getenv("EMAIL_USERNAME")
        )
        recipient = os.getenv("RECIPIENT_EMAIL") or app.config.get("RECIPIENT_EMAIL")

        # Validation
        if not recipient:
            msg = "RECIPIENT_EMAIL is not configured."
            print("[SEND_EMAIL] ERROR:", msg)
            return False, msg
        if not sender:
            msg = "MAIL_DEFAULT_SENDER or EMAIL_USERNAME is not configured."
            print("[SEND_EMAIL] ERROR:", msg)
            return False, msg

        # Build the message
        msg = Message(
            subject="Contact Form Submission",
            sender=sender,
            recipients=[recipient],
        )
        msg.body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message_text}"

        # Send
        mail.send(msg)
        print(f"[SEND_EMAIL] Email sent OK -> {recipient}")
        return True, None

    except Exception as e:
        # Full traceback printed to console to help debugging
        traceback.print_exc()
        err_str = str(e) or "Unknown error while sending email"
        print(f"[SEND_EMAIL] Exception: {err_str}")
        return False, err_str


@app.route('/contact', methods=['GET', 'OPTIONS', 'POST'])
def contact():
    if request.method == "OPTIONS":
        return make_response("", 200)

    if request.method == "GET":
        return jsonify({
            "message": "This endpoint accepts POST with JSON {name,email,message}. Use POST to send contact data."
        }), 200

    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.get_json(force=True, silent=True) or request.form.to_dict() or {}

        if not data:
            print("[CONTACT] No data parsed. Headers:", dict(request.headers))
            return jsonify({"message": "Invalid request data."}), 400

        name = data.get("name")
        email = data.get("email")
        message_text = data.get("message")

        ok, err = send_email(name, email, message_text)  # safe unpacking now
        if ok:
            return jsonify({"message": "Your message has been sent successfully!"}), 200
        else:
            # Return error info for debugging (strip in production)
            return jsonify({
                "message": "There was an error sending your message. Please try again later.",
                "error": err
            }), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Server error", "error": str(e)}), 500


    


if __name__ == "__main__":
    # BEFORE running, ensure your env vars are set (EMAIL_USERNAME, EMAIL_PASSWORD, RECIPIENT_EMAIL, etc.)
    print("MAIL config:", {
        "MAIL_USERNAME": app.config.get("MAIL_USERNAME"),
        "MAIL_DEFAULT_SENDER": app.config.get("MAIL_DEFAULT_SENDER"),
        "RECIPIENT_EMAIL(env)": os.getenv("RECIPIENT_EMAIL"),
    })
    ok, err = send_email("Local Test", "tester@example.com", "This is a test.")
    print("send_email ->", ok, err)
    app.run(port=8000, debug=True, use_reloader=False)


