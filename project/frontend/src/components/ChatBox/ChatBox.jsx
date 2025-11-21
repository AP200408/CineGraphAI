// ChatBox.jsx (full updated component)
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatBox.css";
import Header from "../../ui/Header";

function ChatBox() {
  const [messages, setMessages] = useState([]); // { role, text, feedback }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackLoadingIndex, setFeedbackLoadingIndex] = useState(null);
  const [toast, setToast] = useState(null); // string or null
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
    }
  }, [messages, loading, feedbackLoadingIndex]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    const userMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const botText = data.answer || data.error || "Error: No response";
      setMessages((prev) => [...prev, { role: "bot", text: botText, feedback: null }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "⚠️ Error connecting to backend", feedback: null }]);
    } finally {
      setLoading(false);
    }
  };

  const findUserBefore = (botIndex) => {
    for (let i = botIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].text;
    }
    return "";
  };

  // handle feedback
  const handleFeedback = async (botIndex, which) => {
    // up => show a short toast only
    if (which === "up") {
      setToast("Hooray! Thanks for the feedback 🎉");
      setTimeout(() => setToast(null), 3000);
      // optionally set local state to show selected up for that message
      setMessages((prev) => prev.map((m, idx) => (idx === botIndex ? { ...m, feedback: "up" } : m)));
      return;
    }

    // For 'down' do the retry flow
    if (feedbackLoadingIndex !== null) return; // prevent concurrent retries
    setMessages((prev) => prev.map((m, idx) => (idx === botIndex ? { ...m, feedback: "down" } : m)));
    const botMessage = messages[botIndex]?.text || "";
    const userMessage = findUserBefore(botIndex) || "";

    setFeedbackLoadingIndex(botIndex);
    try {
      const res = await fetch("http://localhost:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: userMessage,
          bot_message: botMessage,
          feedback: "down",
        }),
      });
      const data = await res.json();
      const improved = data.answer || data.error || "No improved answer.";
      setMessages((prev) => [...prev, { role: "bot", text: improved, feedback: null }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "⚠️ Feedback failed — can't retry right now.", feedback: null }]);
    } finally {
      setFeedbackLoadingIndex(null);
    }
  };

  return (
    <div className="chatbox-container">
      

      <Header />

      <div className="messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === "bot" ? (
              <div className="bot-block">
                <div className="bot-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>

                <div className="feedback-row">
                  <button
                    className={`thumb-btn ${msg.feedback === "up" ? "selected up" : ""}`}
                    title="I like this answer"
                    onClick={() => handleFeedback(i, "up")}
                    disabled={feedbackLoadingIndex !== null}
                  >
                    👍
                  </button>

                  <button
                    className={`thumb-btn ${msg.feedback === "down" ? "selected down" : ""}`}
                    title="This didn't help — retry"
                    onClick={() => handleFeedback(i, "down")}
                    disabled={feedbackLoadingIndex !== null}
                  >
                    👎
                  </button>

                  {feedbackLoadingIndex === i && <span className="feedback-loading">Retrying…</span>}
                </div>
              </div>
            ) : (
              <div className="user-text">{msg.text}</div>
            )}
          </div>
        ))}

        {loading && <div className="loading">🤖 Agent is thinking...</div>}
      </div>

      <div className="input-container">
        <input
          className="chat-input"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-btn" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>

      {/* Toast area */}
      {toast && <div className="feedback-toast">{toast}</div>}
    </div>
  );
}

export default ChatBox;
