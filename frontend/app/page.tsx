"use client";

import { useState, useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import MonadStreamABI from "../MonadStream.json"; 

const CONTRACT_ADDRESS = "0xd325B3f6bB0CC0bd130959A429F0F36E365581B5"; 

interface Message {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  model?: string;
}

export default function Home() {
  const { writeContractAsync } = useWriteContract();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 真实读取链上合约的剩余预算
  const { data: onChainBudget, refetch: refetchBudget } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MonadStreamABI.abi,
    functionName: "getRemainingBudget",
  });

  // 2. 真实读取链上合约是否已经熔断
  const { data: isContractFrozen, refetch: refetchFrozen } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MonadStreamABI.abi,
    functionName: "isFrozen",
  });

  const [budget, setBudget] = useState(0.0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [aiStatus, setAiStatus] = useState<"NORMAL" | "RUNAWAY" | "FALLBACK">("NORMAL");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: "1", sender: "system", text: "🛜 Monad x402 AI Settle Gateway synchronized successfully. System is live." }
  ]);

  // 同步链上预算
  useEffect(() => {
    if (onChainBudget !== undefined) {
      const formattedBudget = Number(onChainBudget) / 1e18;
      setBudget(formattedBudget);

      if (formattedBudget <= 0 || isContractFrozen) {
        setIsLooping(false);
        setAiStatus("FALLBACK");
      } else if (isLooping) {
        setAiStatus("RUNAWAY");
      } else {
        setAiStatus("NORMAL");
      }
    }
  }, [onChainBudget, isContractFrozen, isLooping]);

  // 自动滚动到聊天底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // -------------------------------------------------------------
  // 🧠 ChatGPT 经典发送逻辑：真联网 + x402 弹窗拦截扣费
  // -------------------------------------------------------------
  async function handleSendPrompt() {
    if (!customPrompt.trim() || isSending) return;
    
    const userQuery = customPrompt;
    setChatHistory((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: userQuery }]);
    setCustomPrompt("");
    setIsSending(true);

    try {
      // 🚀 第一次冲锋
      let response = await fetch("/api/agent", {
        method: "POST",
        body: JSON.stringify({ userPrompt: userQuery }),
      });

      let result = await response.json();

      // 🚨 触发 x402 拦截
      if (response.status === 402) {
        setChatHistory((prev) => [...prev, { 
          id: Date.now().toString(), 
          sender: "system", 
          text: "⚠️ [x402 Intercept]: Heavy Analysis Detected. Invoking Monad transaction for 0.01 MON..." 
        }]);

        // 唤起小狐狸付钱买单
        const tx = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: MonadStreamABI.abi,
          functionName: "topUpBudget",
          value: parseEther("0.01"),
        });

        setChatHistory((prev) => [...prev, { 
          id: Date.now().toString(), 
          sender: "system", 
          text: `🔗 [MetaMask Signed]: Hash ${tx.substring(0, 12)}... Validating ticket on-chain...` 
        }]);

        // 🎫 第二次请求
        response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-PAYMENT": tx },
          body: JSON.stringify({ userPrompt: userQuery }),
        });
        
        result = await response.json();
      }

      // 推入 AI 的真实解答气泡
      setChatHistory((prev) => [...prev, { 
        id: Date.now().toString(), 
        sender: "ai", 
        text: result.answer,
        model: result.aiModelUsed
      }]);
      
      refetchBudget();
      refetchFrozen();

    } catch (e) {
      console.error(e);
      setChatHistory((prev) => [...prev, { id: Date.now().toString(), sender: "system", text: "❌ Interaction rejected or node connection error." }]);
    } finally {
      setIsSending(false);
    }
  }

  // 原本的高频恶意循环测试按钮（保留作为后手演示）
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLooping && budget > 0) {
      interval = setInterval(async () => {
        const mockPrompt = `Rogue agent rapid script check ${Math.floor(Math.random() * 100)}`;
        try {
          let response = await fetch("/api/agent", {
            method: "POST",
            body: JSON.stringify({ userPrompt: mockPrompt }),
          });
          if (response.status === 402) {
            const tx = await writeContractAsync({
              address: CONTRACT_ADDRESS,
              abi: MonadStreamABI.abi,
              functionName: "topUpBudget",
              value: parseEther("0.01"),
            });
            response = await fetch("/api/agent", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-PAYMENT": tx },
              body: JSON.stringify({ userPrompt: mockPrompt }),
            });
          }
          refetchBudget();
          refetchFrozen();
        } catch (e) {}
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLooping, budget, writeContractAsync, refetchBudget, refetchFrozen]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col h-screen font-sans relative overflow-hidden">
      
      {/* 🟢 TOP NAVBAR */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-zinc-200">MONAD AI HUB</h1>
            <p className="text-[10px] text-purple-400 font-mono tracking-tight">Autonomous Multi-Model Multi-Route Gateway</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Workload Badge */}
          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
            <span className={`h-2 w-2 rounded-full ${aiStatus === "NORMAL" ? "bg-emerald-500 animate-pulse" : aiStatus === "RUNAWAY" ? "bg-rose-500 animate-ping" : "bg-cyan-400"}`} />
            {aiStatus === "NORMAL" && <span className="text-emerald-400">Intelligent Routing</span>}
            {aiStatus === "RUNAWAY" && <span className="text-rose-500">Rogue Attack</span>}
            {aiStatus === "FALLBACK" && <span className="text-cyan-400">Circuit Breaker</span>}
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* 🟢 CENTER WORKSPACE: 100% PURE CHATGPT WINDOW */}
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-4xl mx-auto px-4 relative pb-24">
        
        {/* Chat History Flow Container */}
        <div className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-none pr-2">
          {chatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col w-full ${
                msg.sender === "user" ? "items-end" : msg.sender === "system" ? "items-center my-3" : "items-start"
              }`}
            >
              {/* Model Tag Assigned Indicator */}
              {msg.model && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mb-1.5 ml-4">
                  <span className={`h-1.5 w-1.5 rounded-full ${msg.model.includes("Live") ? "bg-emerald-400" : "bg-purple-400"}`} />
                  Gateway Assigned: <span className={msg.model.includes("Live") ? "text-emerald-400" : "text-purple-400 font-bold"}>{msg.model}</span>
                </div>
              )}

              {/* Chat Bubble Structure */}
              <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed rounded-2xl shadow-md ${
                msg.sender === "user" 
                  ? "bg-purple-600 text-white rounded-tr-none font-medium" 
                  : msg.sender === "system"
                  ? "bg-zinc-900/30 text-zinc-500 text-xs font-mono border border-zinc-900/60 py-1.5 text-center max-w-full w-full rounded-xl"
                  : "bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800/80"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Dock Box Container */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-10">
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800/80 rounded-2xl focus-within:border-purple-500/80 shadow-2xl transition-all px-4 py-3">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
              placeholder="Ask Monad Gateway Anything... (e.g., 'Say hello' or 'analyze smart contract')"
              disabled={isSending}
              className="flex-1 bg-transparent text-sm text-zinc-100 focus:outline-none placeholder-zinc-600 disabled:opacity-50"
            />
            <button
              onClick={handleSendPrompt}
              disabled={isSending || !customPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              {isSending ? "..." : "Send"}
            </button>
          </div>
          <p className="text-[10px] text-center text-zinc-600 font-mono mt-2.5">
            💡 Sandbox Rules: Casual prompts use free Llama-3. Prompts containing 'analyze', 'audit', or 'contract' trigger x402 native payment gate.
          </p>
        </div>
      </div>

      {/* 🟢 RIGHT-BOTTOM FLOATING PANEL (悬浮窗：收纳钱包、链上合约数据与演示控制) */}
      <div className="absolute bottom-6 right-6 w-72 bg-zinc-900/95 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-20 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-[11px] font-mono font-bold text-zinc-400">🔗 MONAD LEDGER CONSOLE</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        
        {/* On-Chain Wallet Balance */}
        <div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">Contract Budget Pool</p>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{budget.toFixed(4)}</span>
            <span className="text-xs font-bold text-zinc-500 ml-1">MON</span>
          </div>
          <p className="text-[8px] text-zinc-600 font-mono select-all truncate mt-0.5">📍 {CONTRACT_ADDRESS}</p>
        </div>

        {/* Attack Demo Backdoor Button */}
        <button
          onClick={() => {
            if (budget <= 0 || isContractFrozen) return;
            setIsLooping(!isLooping);
          }}
          className={`w-full py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all active:scale-[0.97] ${
            isLooping 
              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950" 
              : "bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30"
          }`}
        >
          {isLooping ? "⏸️ Stop Loop Simulation" : "🔥 Trigger Rogue Loop Attack"}
        </button>
      </div>

    </div>
  );
}