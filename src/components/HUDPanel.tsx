import { motion } from "framer-motion";
import React from 'react';

export default function HUDPanel({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative bg-black/40 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-brand/30 shadow-[0_0_20px_rgba(0,212,255,0.15)] ${className}`}
    >
      <div className="absolute inset-0 border border-brand/20 rounded-2xl animate-pulse pointer-events-none"></div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand/50 rounded-tl-xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand/50 rounded-tr-xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand/50 rounded-bl-xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand/50 rounded-br-xl pointer-events-none"></div>
      
      {children}
    </motion.div>
  );
}
