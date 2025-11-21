# combined_agent.py
import re
import os
from typing import List, TypedDict
import json
from dotenv import load_dotenv

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print("Current Working Directory:", os.getcwd())

load_dotenv()

# Neo4j / Graph QA LLM
from langchain_neo4j import Neo4jGraph, GraphCypherQAChain
from langchain_groq import ChatGroq
from langchain.tools import Tool
from langchain.prompts import PromptTemplate
from langchain_core.messages import BaseMessage
from modules.csv_tool import csv_tool



# Vector DB (Chroma)
# from modules.chroma_client import chroma_tool

# LangGraph
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

def clean_response(output: str) -> str:
    return re.sub(r"<think>.*?</think>", "", output, flags=re.DOTALL).strip()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NEO4J_URL = os.getenv("NEO4J_URL", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "12345678")
NEO4J_DB = os.getenv("NEO4J_DB", "moviesdb")

llm = ChatGroq(
    model="deepseek-r1-distill-llama-70b",
    temperature=0.0,
    max_tokens=10000,
    max_retries=2,
    timeout=None,
    api_key=GROQ_API_KEY
)

cypher_prompt = PromptTemplate(
    input_variables=["question", "schema"],
    template="""
You are a Cypher Query Language expert. Given a natural language question and the database schema, 
generate a safe and correct Cypher query. If there are any errors, make sure you say that something is wrong instead of outputing the error.

If there is any error

Schema:
{schema}

Question:
{question}

Return only the Cypher query, nothing else.
""",
)


graph = Neo4jGraph(
    url="bolt://localhost:7687",
    username="neo4j",
    password="12345678",
    database="moviesdb"
)

graph_qa = GraphCypherQAChain.from_llm(
    llm=llm,
    graph=graph,
    cypher_prompt=cypher_prompt,
    response_format="text",
    allow_dangerous_requests=True
)

def neo4j_tool_fn(question: str) -> str:
    try:
        raw = graph_qa.invoke(question)
        return clean_response(raw)
    except Exception as e:
        return f"[Neo4j tool error] {type(e).__name__}: {e}"


neo4j_tool = Tool(
    name="Neo4jGraphQA",
    func=neo4j_tool_fn,
    description=(
        "You MUST use this tool whenever the user asks about movies, genres, people, "
        "awards, reviews, or anything that could be stored in a graph database. "
        "The input should always be the natural language question. "
        "This tool translates the question into Cypher, runs it on Neo4j, "
        "and returns the results."
    )
)


system_instruction = """
You are an assistant connected to two tools that help users find and analize more about MovieDB.
- Neo4J graph query tool
- CSV Query tool

Important: Make sure to always follow the Rules.

RULES:
- For questions about movies, genres, people, awards, or anything stored in the Neo4j graph, ALWAYS use the Neo4jGraphQA tool. Make sure to always check the schema of the graph before answering. 
- For questions about CSV sentiment/metadata (like character emotions, sentiment arcs, or analytics stored in CSVs), ALWAYS use the CSVQuery tool.
- NEVER answer directly from your own knowledge. Always call the relevant tool, parse its output, and then return the result.
- If the tool result is empty, state clearly that no relevant data was found.
- Think thoroughly on how you will approach the User request
- Your job is not to answer general queries, just about your job and anything related to it.
"""


class AgentState(TypedDict):
    messages: List[BaseMessage]
    output: str


memory = MemorySaver()

tools = [neo4j_tool, ]
app = create_react_agent(model=llm, tools=tools, checkpointer=memory,)




