
import os
import chromadb
from langchain.tools import Tool
from sentence_transformers import SentenceTransformer

client = chromadb.PersistentClient(path="./embedded")
collection = client.get_or_create_collection("movies")

emb_model = SentenceTransformer("all-MiniLM-L6-v2")

def query_chroma(query: str, k: int = 5) -> str:
    """
    Query ChromaDB for top-k similar results with metadata.
    """
    try:
        embedding = emb_model.encode([query], convert_to_numpy=True).tolist()[0]
        res = collection.query(query_embeddings=[embedding], n_results=k)

        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]

        if not docs:
            return "[VectorDB] No relevant context found."

        pieces = []
        for i, doc in enumerate(docs):
            meta = metas[i] if i < len(metas) else {}
            movie = meta.get("movie", "unknown")
            character = meta.get("character", "unknown")
            header = f"[{movie} :: {character}]"
            pieces.append(header + "\n" + doc)

        return "\n\n---\n\n".join(pieces)

    except Exception as e:
        return f"[VectorDB tool error] {type(e).__name__}: {e}"


chroma_tool = Tool(
    name="ChromaVectorDB",
    func=query_chroma,
    description="Search dialogue/character embeddings and return relevant context with metadata."
)