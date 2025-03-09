"use client";

import Image from "next/image";
import Chat from "./components/Chat";

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-[#040d17] text-white">
      <nav className="flex justify-between items-center p-4">
        
      <h1 className="highlighted-text text-xl font-semibold">VersusAI</h1>
        <h1 className="text-xl font-semibold">
          Welcome to <span className="highlighted-text">The Trivium Forum</span>
        </h1>
      </nav>
      <div className="flex-grow overflow-hidden">
        <Chat />
      </div>
    </main>
  );
}
