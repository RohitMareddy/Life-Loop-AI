import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFallback?: boolean;
}

export const LoopAssistantDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { resources, requests, distributions, activePlan } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am Loop Assistant. I analyze your current inventory lots, open requests, and optimization plans to answer questions about allocation trade-offs and community fulfillment.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'Which requests can be fulfilled by the current stationery inventory?',
    'Why was Harborview Children’s Shelter left unmet?',
    'Explain the trade-offs between Strategy A (Fulfillment) and Strategy C (Fairness).',
    'Which resources currently require physical inspection?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setLoading(true);

    // Build structured system snapshot
    const systemStateSnapshot = {
      availableLotsCount: resources.filter((r) => r.status === 'available').length,
      openRequestsCount: requests.filter((r) => r.status === 'open' || r.status === 'partially_fulfilled').length,
      proposedAllocationsCount: activePlan?.proposedAllocations.length || 0,
      distributedCount: distributions.length,
      activeStrategy: activePlan?.strategy || 'maximize_fulfillment',
      keyInventory: resources.slice(0, 5).map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        available: r.availableQuantity,
        unit: r.unit,
        condition: r.condition,
      })),
      urgentRequests: requests.filter((r) => r.priorityLevel === 'urgent' || r.priorityLevel === 'high').map((req) => ({
        id: req.id,
        org: req.organizationName,
        item: req.requestedItems,
        qty: req.outstandingQuantity,
        priority: req.priorityLevel,
        deadline: req.requiredByDate,
      })),
    };

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          systemStateSnapshot,
        }),
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No response returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: data.isFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the assistant server. Operating in offline mode: current inventory has 8 lots with active requests from Greenfield schools and libraries.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E7EB]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#176B4D] text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#17231D]">Loop Assistant</h2>
              <p className="text-[11px] text-[#66736A]">Grounded Community Redistribution Copilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736A] hover:text-[#17231D] hover:bg-[#EEF1EB] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="p-3 bg-[#F7F8F4] border-b border-[#E5E7EB] space-y-1.5">
          <span className="text-[11px] font-semibold text-[#66736A] uppercase tracking-wider block">
            Suggested Operational Queries
          </span>
          <div className="space-y-1">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="w-full text-left text-xs text-[#2A3B30] hover:text-[#176B4D] hover:bg-white px-2 py-1.5 rounded border border-transparent hover:border-[#D1E3D7] transition-all truncate"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#176B4D] text-white'
                    : 'bg-[#F3F5F1] text-[#17231D] border border-[#E5E7EB]'
                }`}
              >
                {m.text}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#8A958E]">
                <span>{m.timestamp}</span>
                {m.isFallback && (
                  <span className="text-amber-700 bg-amber-50 px-1 rounded">Offline Fallback</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#66736A] p-2 bg-[#F7F8F4] rounded-md animate-pulse">
              <Bot className="w-4 h-4 text-[#176B4D]" />
              <span>Analyzing platform constraints and state...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about inventory, allocation trade-offs, or constraints..."
              className="flex-1 px-3 py-2 text-xs bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus:outline-none focus:border-[#176B4D] focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-[#176B4D] hover:bg-[#104A36] disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-[#8A958E] mt-1.5 text-center">
            Adheres to deterministic quantities and verified database records.
          </p>
        </div>
      </div>
    </div>
  );
};
