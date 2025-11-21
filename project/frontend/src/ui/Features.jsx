import React from "react";
import "./features.css";

export default function Features() {
  return (
    <section id="features" className="features container">
      <h2>Core features</h2>
      <div className="feature-grid">
        <article className="feature-card">
          <h3>Topics & Keywords</h3>
          <p>Automatic extraction of themes and recurring motifs across scenes and scripts.</p>
        </article>

        <article className="feature-card">
          <h3>Named Entities</h3>
          <p>Detect people, organizations, locations and link them in the graph.</p>
        </article>

        <article className="feature-card">
          <h3>Sentiment & Emotion</h3>
          <p>Scene-level sentiment and emotion detection using transformer models.</p>
        </article>

        <article className="feature-card">
          <h3>Speaker & Scene Tagging</h3>
          <p>Time-aligned speaker segmentation and scene metadata for precise search.</p>
        </article>
      </div>
    </section>
  );
}
