
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, Phone, MessageSquare, Mail, Facebook } from 'lucide-react';

export default function RestrictedAccountModal({ onClose, reason }: { onClose: () => void, reason: 'trial' | 'pending' }) {
  const message = reason === 'trial' 
    ? "the 3hours free trial account has been consumed. thank you for using automotive buddy. if you are satisfied with our service, directly message the developer or admin for the approval of your account."
    : "your account is pending system administration approval. thank you for your patience.";

  useEffect(() => {
    const speakMessage = () => {
       const utterance = new SpeechSynthesisUtterance(message);
       utterance.lang = 'en-US';
       window.speechSynthesis.speak(utterance);
    };
    speakMessage();
  }, [reason]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#050A15] border border-brand/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl text-center"
      >
        <div className="text-brand mb-6 flex justify-center"><Volume2 size={48} /></div>
        <h2 className="text-2xl font-display font-bold uppercase text-white mb-4">{reason === 'trial' ? 'Trial Consumed' : 'Pending Approval'}</h2>
        <p className="text-text-secondary mb-8">{message}</p>
        
        <div className="bg-white/5 rounded-xl p-6 text-left space-y-4 text-white">
           <h4 className="text-sm text-brand font-bold uppercase mb-2">Developer Contact</h4>
           <div className="flex items-center gap-3 text-xs"><Phone size={14}/> +63 994 6072 426</div>
           <div className="flex items-center gap-3 text-xs"><MessageSquare size={14}/> Viber: +63 994 6072 426</div>
           <div className="flex items-center gap-3 text-xs"><Mail size={14}/> rubenlleg12@gmail.com</div>
           <div className="flex items-center gap-3 text-xs"><Facebook size={14}/> Facebook: https://www.facebook.com/share/18fRUFTpKH/</div>
        </div>
        
        {/* Placeholder for QR Code */}
        <div className="mt-6 flex justify-center">
            <div className="w-32 h-32 bg-white flex items-center justify-center rounded-lg">
               <span className="text-[10px] text-black">ADMIN QR CODE</span>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
