import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import Header from "../../ui/Header"; // keeps your header component if it renders a logo/title

const BotAvatar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(7,34,68,0.12)"/>
    <path d="M8 14h8" stroke="#064E8A" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="9.2" cy="9.2" r="1.2" fill="#064E8A"/>
    <circle cx="14.8" cy="9.2" r="1.2" fill="#064E8A"/>
  </svg>
);

const UserAvatar = () => (
  <div style={{ fontSize: 12, fontWeight: 700 }}>You</div>
);

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight + 200;
    }
  }, [chatHistory]);

  const sendQuestion = async () => {
    const question = input.trim();
    if (!question) return;

    setChatHistory((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setStreaming(true);

    try {
      const response = await fetch("http://localhost:8000/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        setChatHistory((prev) => [
          ...prev,
          { role: "bot", text: "Error: Unable to get response." },
        ]);
        setStreaming(false);
        return;
      }

      setChatHistory((prev) => [...prev, { role: "bot", text: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botAnswer += decoder.decode(value, { stream: true });

        setChatHistory((prev) => {
          const lastBotIndex = [...prev].map(m => m.role).lastIndexOf("bot");
          if (lastBotIndex === -1) return prev;
          const updated = [...prev];
          updated[lastBotIndex] = { ...updated[lastBotIndex], text: botAnswer };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", text: "Error: streaming failed." },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!streaming) sendQuestion();
    }
  };

  return (
    <div className="chatbot-root">
        <Header />
      <header className="app-header">
        <div className="header-left">
          {/* use your Header component if it contains logo/title; otherwise keep this fallback */}
          
        </div>

        <div className="header-center">
          <div className="brand-title">General Query Chatbot</div>
          <div className="brand-sub">AI-assisted guide to our App.</div>
        </div>

        <div className="header-right">
          <div className="status-dot" title="Connected"></div>
          <div className="status-text">Connected · Ready</div>
        </div>
      </header>

      <main className="chatbot-container">
        <div className="chatbot-card full-width">
          <div className="chat-main full-width">
            <div ref={historyRef} className="chat-history full-width">
              {chatHistory.length === 0 && (
                <div className="welcome">
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    Welcome — Ask anything about our work
                  </div>
                  <div style={{ color: "rgba(230,238,248,0.75)" }}>
                    Example: "What is this application about?".
                  </div>
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role === "user" ? "user" : "bot"}`}
                >
                  <div className="avatar">
                    {msg.role === "user" ? <UserAvatar /> : <BotAvatar />}
                  </div>

                  <div className="chat-bubble">
                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, "<br/>") }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input-area full-width">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={streaming ? "Awaiting response..." : "Type your question here... (Enter to send)"}
                className="chat-input"
                disabled={streaming}
              />
              <button
                onClick={sendQuestion}
                disabled={streaming || input.trim() === ""}
                className="chat-send-button"
              >
                {streaming ? "Waiting…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
