import { useState } from "react";
import "./Metacritic.css";
import Header from "../../ui/Header";

function Metacritic() {
  const [formData, setFormData] = useState({
    year: "",
    imdb_rating: "",
    imdb_votes: "",
    budget: "",
    opening_weekend: "",
    text: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/metacritic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "⚠️ Error: Could not connect to backend" });
    }
    setLoading(false);
  };

  return (
    <div><Header/>
    <div className="metacritic-container">
        
      <h1 className="title">🎬 Metacritic Score Predictor</h1>
      <p className="subtitle">
        Enter movie details below and get an AI-powered predicted Metacritic score.
      </p>

      <div className="form-box">
        {[
          { name: "year", label: "Year" },
          { name: "imdb_rating", label: "IMDb User Rating" },
          { name: "imdb_votes", label: "IMDb Votes" },
          { name: "budget", label: "Budget ($)" },
          { name: "opening_weekend", label: "Opening Weekend ($)" },
        ].map((field) => (
          <div key={field.name} className="form-group">
            <label>{field.label}</label>
            <input
              type="number"
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={`Enter ${field.label}`}
            />
          </div>
        ))}

        <div className="form-group">
          <label>Movie Description</label>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Optional: plot summary or description"
          />
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ Predicting..." : "🚀 Predict Score"}
        </button>
      </div>

      {result && (
        <div className="result-box">
          {result.output && (
            <p className="success">✅ {result.output}</p>
          )}
          {result.error && (
            <p className="error">{result.error}</p>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

export default Metacritic;
