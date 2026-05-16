"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  // State variables for the hackathon simulation
  const [isLooping, setIsLooping] = useState(false);
  const [budget, setBudget] = useState(100.0); // Starts at 100%
  const [aiStatus, setAiStatus] = useState<"NORMAL" | "RUNAWAY" | "FALLBACK">("NORMAL");
  const [logs, setLogs] = useState<string[]>(["[System]: Guard system initialized. Monitoring AI budget..."]);

  // Simulate high frequency requests when "Infinite Loop Button" is pushed
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLooping && budget > 0) {
      setAiStatus("RUNAWAY");
      interval = setInterval(async () => {
        // 1. Visually plunge the budget quickly
        setBudget((prev) => {
          const nextBudget = +(prev - Math.random() * 4).toFixed(2);
          if (nextBudget <= 0) {
            setIsLooping(false);
            setAiStatus("FALLBACK");
            setLogs((l) => ["[CRITICAL]: On-chain budget exhausted!熔断!", "[Fallback]: Switched to local Llama-3 free model.", ...l]);
            return 0;
          }
          return nextBudget;
        });

        // 2. Add realistic logs for presentation effect
        setLogs((l) => [
          `[Agent - GPT-4]: Processing rogue request loop # ${Math.floor(Math.random() * 1000)}... (Charging Monad Contract)`,
          ...l,
        ]);

        // 3. Trigger Member C's background proxy (Uncomment this after 2:30 PM once Member C code is ready)
        /*
        try {
          await fetch("/api/agent", { method: "POST" });
        } catch (e) {
          console.error(e);
        }
        */
      }, 400); // 400ms high-frequency blast
    }
    return () => clearInterval(interval);
  }, [isLooping, budget]);

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-purple-400">🤖 MONAD AI GUARD</h1>
          <p className="text-xs text-zinc-500">Autonomous Budget Circuit-Breaker</p>
        </div>
        <ConnectButton />
      </header>

      {/* Main Grid Workspace */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto max-w-6xl w-full mx-auto">
        
        {/* Left Side: Water Meter Dashboard */}
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur flex flex-col justify-between h-[340px]">
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">On-Chain Remaining Budget</h2>
            <div className="mt-6 flex items-baseline">
              <span className={`text-7xl font-extrabold tracking-tighter transition-all duration-100 ${
                budget > 30 ? "text-emerald-400" : budget > 0 ? "text-amber-500 animate-pulse" : "text-rose-500"
              }`}>
                {budget}
              </span>
              <span className="text-2xl font-bold text-zinc-500 ml-2">MON</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-auto">
            <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${
                  budget > 50 ? "bg-emerald-500" : budget > 15 ? "bg-amber-500" : "bg-rose-600"
                }`}
                style={{ width: `${budget}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>0.00 MON (Breaker Point)</span>
              <span>100.00 MON Limit</span>
            </div>
          </div>
        </div>

        {/* Right Side: Status Display Lights & Controls */}
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur flex flex-col justify-between h-[340px]">
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">AI Gateway Core Engine</h2>
            
            {/* Dynamic Status Light Section */}
            <div className="mt-6 flex items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className={`relative flex h-4 w-4`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  aiStatus === "NORMAL" ? "bg-emerald-400" : aiStatus === "RUNAWAY" ? "bg-rose-500" : "bg-cyan-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 ${
                  aiStatus === "NORMAL" ? "bg-emerald-500" : aiStatus === "RUNAWAY" ? "bg-rose-600" : "bg-cyan-500"
                }`}></span>
              </span>
              <div>
                <p className="text-xs text-zinc-500 font-mono">CURRENT WORKLOAD STATUS</p>
                <p className="text-md font-bold tracking-wide">
                  {aiStatus === "NORMAL" && <span className="text-emerald-400">GPT-4 Engine: Normal Operations</span>}
                  {aiStatus === "RUNAWAY" && <span className="text-rose-500 animate-pulse">CRITICAL: Rogue AI Loop Detected!</span>}
                  {aiStatus === "FALLBACK" && <span className="text-cyan-400">🔒 LIQUIDATION BREAKER: Llama-3 Active</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Core Action Trigger */}
          <button
            onClick={() => {
              if (budget <= 0) {
                setBudget(100);
                setAiStatus("NORMAL");
                setLogs((l) => ["[System]: Budget refilled for next test run.", ...l]);
              } else {
                setIsLooping(!isLooping);
              }
            }}
            className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide uppercase transition-all shadow-lg active:scale-[0.98] ${
              budget <= 0 
                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                : isLooping 
                ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950" 
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30"
            }`}
          >
            {budget <= 0 ? "🔄 Reset Hackathon Demo" : isLooping ? "⏸️ Pause Rogue Loop Simulation" : "🔥 Trigger Rogue AI Infinite Loop"}
          </button>
        </div>
      </main>

      {/* Live Logs Panel for Judge presentation */}
      <footer className="mt-8 border-t border-zinc-900 pt-4 max-w-6xl w-full mx-auto">
        <p className="text-xs font-mono text-zinc-500 mb-2">🔴 REAL-TIME TRANSACTION LOGS (HACKATHON EVENT STREAM)</p>
        <div className="bg-zinc-950/80 border border-zinc-900 p-4 rounded-xl font-mono text-xs text-zinc-400 h-32 overflow-y-auto flex flex-col gap-1 select-none">
          {logs.map((log, index) => (
            <div key={index} className={log.includes("CRITICAL") ? "text-rose-500 font-bold" : log.includes("System") ? "text-purple-400" : ""}>
              {log}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}