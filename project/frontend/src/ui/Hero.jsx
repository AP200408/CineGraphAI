import React from "react";
import "./hero.css";
import { useNavigate } from "react-router-dom";

export default function Hero() {

  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-left">
          <h1>AI-powered metadata for movie scripts & transcripts</h1>
          <p className="lead">
            Extract topics, named entities, sentiments, speaker tags, and scene-aligned
            metadata — then explore your corpus with a conversational graph + vector
            agent.
          </p>

           <div className="hero-ctas">
            <button
              className="btn primary"
              onClick={() => navigate("/chat")}
            >
              Talk to the Agent
            </button>
            <a href="/rag" className="btn ghost">
              See features
            </a>
          </div>

          <ul className="trust">
            <li>🎯 2,800+ scripts</li>
            <li>🧠 Transformer embeddings</li>
            <li>🕸️ Neo4j graph + Chroma vector store</li>
          </ul>
        </div>

        <div className="hero-right" aria-hidden>
          <div className="card-visual">
            <div className="movie-card">
              <div className="movie-title">3:10 to Yuma</div>
              <div className="movie-meta">Dialogue • Ben Wade</div>
              <p className="movie-snippet">
                "You don't know what you're talking about... it's a matter of principle."
              </p>
              <div className="movie-tags">
                <span>Action</span>
                <span>Drama</span>
                <span>Western</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
