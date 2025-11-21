import React from "react";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div>© {new Date().getFullYear()} MetaTag · NPN Hackathon</div>
          <div className="links">
            <a href="mailto:you@domain.com">Contact  </a>
            <a href="/contact">Feedback  </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
