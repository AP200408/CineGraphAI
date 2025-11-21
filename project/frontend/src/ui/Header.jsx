import React, { useState } from "react";
import { Link } from "react-router-dom"; // use Link for SPA navigation
import "./header.css";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header" role="banner">
      <div className="container header-inner">

        {/* LEFT: Brand */}
        <a className="brand" href="/" aria-label="MetaTag home">
          <div className="logo-mark" aria-hidden>🎬</div>
          <div className="brand-text">
            <strong className="brand-name">MetaTag</strong>
            <span className="brand-sub">film intelligence</span>
          </div>
        </a>

        {/* CENTER: optional search */}
        <div className="header-center">
          <div className="search-wrap" role="search" aria-label="Search">
            <svg className="search-icon" viewBox="0 0 24 24" aria-hidden>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="11" cy="11" r="5.2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
            </svg>
          </div>
        </div>

        {/* RIGHT: nav + CTA */}
        <div className="header-right">
          <nav className={`nav ${open ? "open" : ""}`} aria-label="Primary">
            <Link to="/rag" className="nav-link">How it Works</Link>

            {/* Predictors dropdown */}
            <div className="nav-link dropdown">
              <span className="dropdown-title">Predictors ▾</span>
              <div className="dropdown-menu">
                <Link to="/award" className="dropdown-item">Award Predictor</Link>
                <Link to="/metacritic" className="dropdown-item">Metacritic Score Predictor</Link>
                <Link to="/winningRate" className="dropdown-item">Award Winning Rate Predictor</Link>
              </div>
            </div>

            <Link to="/chat" className="nav-link cta">Chat with Agent</Link>
          </nav>

          {/* mobile hamburger */}
          <button
            className={`hamburger ${open ? "is-open" : ""}`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

      </div>

      {/* Mobile slide menu */}
      <div className={`mobile-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <Link to="/rag" className="mobile-link" onClick={() => setOpen(false)}>How it Works</Link>
        <div className="mobile-dropdown">
          <span className="mobile-link">Predictors ▾</span>
          <div className="mobile-submenu">
            <Link to="/award" className="mobile-link" onClick={() => setOpen(false)}>Award Predictor</Link>
            <Link to="/metacritic" className="mobile-link" onClick={() => setOpen(false)}>Metacritic Score Predictor</Link>
            <Link to="/winningRate" className="mobile-link" onClick={() => setOpen(false)}>Award Winning Rate Predictor</Link>
          </div>
        </div>
        <Link to="/chat" className="mobile-link mobile-cta" onClick={() => setOpen(false)}>Chat with Agent</Link>
      </div>
    </header>
  );
}
