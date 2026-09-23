import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatProps {
  whatsappNumber: string;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ whatsappNumber }) => {
  const handleClick = () => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(
      'Hello K&S Solar Energy, I would like to inquire about your solar services.',
    )}`;
    window.open(url, '_blank');
  };

  return (
    <button
      id="floating-whatsapp-btn"
      onClick={handleClick}
      title="Chat with K&S Solar on WhatsApp"
      className="fixed bottom-6 right-6 z-40 p-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white"
    >
      <MessageCircle className="w-6 h-6 stroke-[2.5]" />
    </button>
  );
};
