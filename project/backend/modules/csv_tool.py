# modules/csv_tool.py
import pandas as pd
from langchain.tools import Tool
import os

CSV_PATH = os.getenv("CSV_PATH", "./processed_sentiment/character_sentiment.csv")

def query_csv(question: str) -> str:
    try:
        if not os.path.exists(CSV_PATH):
            return f"[CSV tool error] File not found: {CSV_PATH}"

        df = pd.read_csv(CSV_PATH)

        # Very simple keyword search across all text columns
        results = []
        for col in df.columns:
            matches = df[df[col].astype(str).str.contains(question, case=False, na=False)]
            if not matches.empty:
                results.append(matches.head(5).to_dict(orient="records"))

        if not results:
            return "[CSV] No matches found."

        return str(results)
    except Exception as e:
        return f"[CSV tool error] {type(e).__name__}: {e}"


csv_tool = Tool(
    name="CSVQuery",
    func=query_csv,
    description=(
        "You MUST use this tool whenever the user asks about processed sentiment data, "
        "CSV exports, or analytics not stored in Neo4j. Input: natural language query, "
        "output: relevant rows."
    ),
)
