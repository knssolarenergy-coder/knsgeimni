import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Phone, HelpCircle } from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  whatsappNumber,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Salam! I am your K&S Solar Assistant. How can I help you today? You can ask about solar panel washing, inverter monitoring, or system sizing.',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    const updated: Message[] = [...messages, { sender: 'user', text: userText }];
    setMessages(updated);
    setInput('');

    setTimeout(() => {
      let reply = 'Thank you for your message! Our solar engineering team is on standby.';
      const lower = userText.toLowerCase();
      if (lower.includes('wash') || lower.includes('clean') || lower.includes('dhulai')) {
        reply = 'Solar panel washing increases energy yield by up to 30%. You can book a wash directly from the Home screen or tap Book Wash below!';
      } else if (lower.includes('inverter') || lower.includes('wifi') || lower.includes('growatt') || lower.includes('solis')) {
        reply = 'For inverter issues, you can access your inverter cloud portal from the Inverter tab or file a ticket in Complaints.';
      } else if (lower.includes('cost') || lower.includes('price') || lower.includes('size') || lower.includes('roi')) {
        reply = 'You can calculate your estimated cost and monthly savings instantly in our Solar ROI Calculator tab!';
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  const handleOpenWhatsApp = () => {
    const clean = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent('Salam K&S Solar Energy, I need quick assistance regarding my solar system.')}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full h-[520px] shadow-2xl flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00695c] to-[#004d40] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <span>AI Solar Assistant</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-emerald-100">Instant energy guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-[#0096aa] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Live WhatsApp switch button */}
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-emerald-900 font-semibold">Need official support?</span>
          <button
            onClick={handleOpenWhatsApp}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3 fill-white" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0096aa]/30 focus:border-[#0096aa]"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-2xl bg-[#0096aa] hover:bg-[#008799] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
