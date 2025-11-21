import React from "react";
import Header from "../ui/Header";
import Hero from "../ui/Hero";
import Features from "../ui/Features";
import Footer from "../ui/Footer";
import "../styles/home.css";

export default function Home() {
  return (
    <div className="page-root">
      <Header />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
