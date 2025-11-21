import { Routes, Route } from "react-router-dom";
import Hero from "./ui/Hero";
import Home from "./pages/Home";
import ChatBox from "./components/ChatBox/ChatBox";
import "./styles/global.css"
import Feedback from "./components/Feedback/Feedback";
import ChatBot from "./components/Chatbot/Chatbot";
import Metacritic from "./components/Metacritic/Metacritic";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<ChatBox />} />
      <Route path="/contact" element={<Feedback />} />
      <Route path="/rag" element={<ChatBot />} />
      <Route path="/metacritic" element={<Metacritic />} />
    </Routes>
  );
}

export default App;
