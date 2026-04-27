/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVehicleStore } from './store/vehicleStore';
import { 
  Wrench, Cpu, Map, History, Star, Shield, UserPlus,
  ChevronRight, LogOut, LayoutDashboard, Database, 
  MessageSquare, User, Users, Bell, Settings, 
  Plus, Trash2, Edit, CheckCircle2, AlertTriangle, 
  Info, X, Crown, ShieldCheck, Mail, Lock, 
  Zap, Activity, Send, Menu, Filter, Save, Globe, 
  BookOpen, Truck, Tractor, Bike, Car, Download, CloudDownload,
  Calendar, FileText, ChevronDown, Search, ArrowRight,
  Phone, Eye, EyeOff, Check, Heart, Clock, Printer, Cable,
  Share2, Wrench as ToolIcon, CreditCard, Award, MousePointer2, Volume2, VolumeX,
  Mic, MicOff, Camera, Loader2, Brain
} from 'lucide-react';
import { useStore, User as UserType, DTC, VehicleUnit, SavedItem, SearchHistory, Announcement, ActivityLog, ChatMessage } from './lib/store';
import { vehicleDatabase, fordDTCDatabase, otherMfrDTCs, genericDTCs, komatsuDTCs } from './lib/dtcData';
import dtcMasterDataRaw from './lib/dtc_master.json';
const dtcMasterData: any = dtcMasterDataRaw;

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateDynamicVehicleData, askAutomotiveAssistant, performDeepDTCSearch } from './services/ai';

import DiagnosticInterface from './components/DiagnosticInterface';
import api, { diagnoseDTC } from './services/api';
import HUDPanel from './components/HUDPanel';
import EnhancedDashboard from './components/Dashboard';
import { Card, Badge, ProgressBar, Button } from './components/ui';
import { saveDTCOffline, getDTCOffline, addOfflineLog } from './offline/db';
import { syncData } from './sync/syncEngine';
import { auth, db, signInWithGoogle, logOut } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

// --- UI Helper Components ---

function FloatingBackground() {
  const icons = [Wrench, Cpu, Map, History, Shield, Zap, Activity, Car, Truck, ToolIcon];
  return (
    <div className="floating-bg">
      {[...Array(20)].map((_, i) => {
        const Icon = icons[i % icons.length];
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const size = 20 + Math.random() * 30;
        return (
          <div 
            key={i}
            className="float-icon absolute"
            style={{ 
              top: `${top}%`, 
              left: `${left}%`, 
              animationDelay: `${delay}s`,
              fontSize: `${size}px`
            }}
          >
            <Icon size={size} strokeWidth={1} />
          </div>
        );
      })}
    </div>
  );
}

function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      syncData();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className={`p-2 text-sm text-center font-bold tracking-widest uppercase transition-colors ${online ? "text-green-400 bg-green-500/10" : "text-amber-400 bg-amber-500/10"}`}>
      {online ? "SYSTEM ONLINE - SYNC ACTIVE" : "OFFLINE MODE - LOCAL DB ACTIVE"}
    </div>
  );
}

function LiveDataTab() {
  const [data, setData] = useState({ rpm: 0, temp: 0 });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/live/all");
        setData(res.data);
      } catch (e) {
        console.error('Failed to fetch telemetry');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <Activity size={24} className="text-brand" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">LIVE TELEMETRY STREAM</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HUDPanel>
          <div className="flex flex-col items-center justify-center py-6">
             <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-2">Engine RPM</div>
             <div className="text-5xl md:text-6xl text-brand font-accent font-bold tracking-tighter">
                {data.rpm}
             </div>
             <div className="text-[9px] uppercase mt-2 text-text-muted">Revolutions Per Minute</div>
          </div>
        </HUDPanel>

        <HUDPanel>
          <div className="flex flex-col items-center justify-center py-6">
             <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-2">Intake Temp</div>
             <div className="text-5xl md:text-6xl text-blue-400 font-accent font-bold tracking-tighter">
                {data.temp}°C
             </div>
             <div className="text-[9px] uppercase mt-2 text-text-muted">Celsius</div>
          </div>
        </HUDPanel>
      </div>
    </div>
  );
}

function AIMaintenanceTab({ user, store }: any) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [aiVoiceOn, setAiVoiceOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }
      setQuery('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') {
      e.preventDefault();
    }
    
    // Unlock speech synthesis immediately on user interaction
    if ('speechSynthesis' in window) {
      const unlock = new SpeechSynthesisUtterance('');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
    
    const searchQuery = typeof e === 'string' ? e : query;
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setLoading(true);
    setResult("");
    
    // Stop any ongoing speech
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      const { searchMaintenanceGuides } = await import('./services/ai');
      const text = await searchMaintenanceGuides(searchQuery, store.vehicle);
      setResult(text);
      
      if (aiVoiceOn && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        
        const cleanText = text.replace(/[*#`]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
        // Split by sentences (approximately) to avoid Chrome TTS length limit bug
        const chunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
        
        const voices = window.speechSynthesis.getVoices();
        const techVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Microsoft')));
        
        chunks.forEach((chunk, index) => {
          if (!chunk.trim()) return;
          const utterance = new SpeechSynthesisUtterance(chunk.trim());
          utterance.rate = 0.9;
          if (techVoice) {
            utterance.voice = techVoice;
          }
          if (index === chunks.length - 1) {
            utterance.onend = () => setIsSpeaking(false);
          }
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        });
      }
    } catch (err: any) {
      setResult("Error fetching guide: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlobalVehicleSelector />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20 shadow-[0_0_15px_rgba(0, 212, 255,0.2)]">
            <Search className="text-brand" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-display font-medium text-white tracking-widest uppercase">Maintenance Guides</h2>
            <p className="text-xs text-text-secondary font-accent uppercase tracking-widest">AI SEARCH ENGINE</p>
          </div>
        </div>
      </div>

      <HUDPanel className="p-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 input-field"
            placeholder={isListening ? "Listening..." : "e.g. How to change oil, Brake pad replacement tips..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={toggleListen}
            className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
              isListening ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 text-text-secondary hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Voice Input (Listen)"
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (aiVoiceOn && isSpeaking) {
                synthRef.current?.cancel();
                setIsSpeaking(false);
              }
              setAiVoiceOn(!aiVoiceOn);
            }}
            className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
              aiVoiceOn ? (isSpeaking ? 'bg-brand/20 border-brand/50 text-brand animate-pulse shadow-[0_0_15px_rgba(0, 212, 255,0.3)]' : 'bg-white/10 border-brand/50 text-brand') : 'bg-white/5 border-white/10 text-text-secondary hover:text-white hover:bg-white/10'
            }`}
            title="Toggle AI Voice Answer"
          >
            {aiVoiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button type="submit" disabled={loading} className="btn-primary py-2 px-6 shadow-[0_0_15px_rgba(0, 212, 255,0.3)]">
            {loading ? <span className="animate-pulse">Searching...</span> : 'Search'}
          </button>
        </form>

        
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3 font-bold">Suggested Searches:</div>
          <div className="flex flex-wrap gap-2">
            {[
              "Recommended oil type and capacity?",
               "How to manually reset maintenance light?",
               "What is the spark plug gap and torque?",
               "Serpentine belt replacement procedure",
               "Transmission fluid change interval"
            ].map((q, i) => (
              <button 
                key={i}
                onClick={() => handleSearch(q)}
                className="text-xs border border-white/10 bg-white/5 hover:bg-brand/10 hover:border-brand/20 text-text-secondary hover:text-white px-3 py-1.5 rounded-full transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </HUDPanel>

      {(loading || result) && (
        <HUDPanel className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-50">
               <div className="loader w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
               <div className="text-xs text-brand tracking-widest uppercase font-bold animate-pulse">Consulting Neural Network...</div>
            </div>
          ) : (
            <div className="prose prose-invert prose-brand max-w-none prose-sm sm:prose-base font-accent prose-headings:font-display prose-headings:tracking-widest prose-headings:uppercase prose-a:text-brand">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          )}
        </HUDPanel>
      )}
    </div>
  );
}

function UnitManualsTab() {
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchManual = async () => {
    setLoading(true);
    try {
      const res = await api.get("/manual");
      setManual(res.data.content);
    } catch (e) {
      console.error("Failed to load generic manual");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={24} className="text-brand" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">GENERIC TECHNICAL MANUALS</h2>
      </div>

      <button onClick={fetchManual} disabled={loading} className="btn-primary">
        {loading ? "DOWNLOADING..." : "LOAD GLOBAL SERVICE PROTOCOL"}
      </button>

      {manual && (
        <HUDPanel>
          <div className="markdown-body font-sans text-sm">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{manual}</ReactMarkdown>
          </div>
        </HUDPanel>
      )}
    </div>
  );
}

function UserAvatar({ user, size = "md", className = "", onUpdate }: { user: any, size?: "xs" | "sm" | "md" | "lg" | "xl", className?: string, onUpdate?: (url: string) => void }) {
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl]);
  
  const sizeClasses = {
    xs: "w-6 h-6 text-[8px]",
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-48 h-48 text-4xl"
  };

  const currentSize = sizeClasses[size];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdate) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 250;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // Compress aggressive
          onUpdate(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = () => {
    if (user?.avatarUrl && !imageError) {
      return (
        <img 
          src={user.avatarUrl} 
          alt={user?.fullName || "Guest"} 
          className={`${currentSize} rounded-full border-2 border-brand bg-[#0A1224] object-cover shrink-0 ${className}`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      );
    }

    const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'G';

    return (
      <div className={`${currentSize} rounded-full border-2 border-brand bg-[#0A1224] flex items-center justify-center font-bold text-white shrink-0 uppercase ${className}`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="relative group">
      {renderContent()}
      {onUpdate && (
        <>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <Camera size={size === 'xl' ? 32 : 16} className="text-white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </>
      )}
    </div>
  );
}

const LogoHex = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hexagon Shield */}
    <path d="M60 10 L105 35 L105 80 L60 105 L15 80 L15 35 Z" stroke="url(#hexGrad)" strokeWidth="6" strokeLinejoin="round"/>
    
    {/* Circuit Lines Left */}
    <circle cx="8" cy="45" r="3" fill="#00D4FF"/>
    <path d="M8 45 L15 45 L20 40 L30 40" stroke="#00D4FF" strokeWidth="2"/>
    <circle cx="12" cy="70" r="3" fill="#00D4FF"/>
    <path d="M12 70 L20 70 L25 65 L35 65" stroke="#00D4FF" strokeWidth="2"/>
    
    {/* Circuit Lines Right */}
    <circle cx="112" cy="45" r="3" fill="#7C3AED"/>
    <path d="M112 45 L105 45 L100 50 L90 50" stroke="#7C3AED" strokeWidth="2"/>
    <circle cx="108" cy="70" r="3" fill="#7C3AED"/>
    <path d="M108 70 L100 70 L95 65 L85 65" stroke="#7C3AED" strokeWidth="2"/>

    {/* Car Silhouette */}
    <path d="M35 65 C40 45 45 40 50 38 L70 38 C75 40 80 45 85 65 L90 85 C90 88 88 90 85 90 L80 90 L75 80 L45 80 L40 90 L35 90 C32 90 30 88 30 85 Z" fill="rgba(255,255,255,0.02)" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"/>
    
    {/* Windshield */}
    <path d="M40 60 C45 48 50 45 60 45 C70 45 75 48 80 60 Z" fill="rgba(255,255,255,0.05)" stroke="#A1A1AA" strokeWidth="1.5"/>
    
    {/* Headlights (Cyan/Purple glow) */}
    <path d="M33 70 L43 66 L48 66" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px #00D4FF)"/>
    <path d="M87 70 L77 66 L72 66" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px #00D4FF)"/>
    
    {/* Grille */}
    <path d="M45 75 L75 75 M46 80 L74 80 M48 85 L72 85" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>

    {/* ECG Pulse breaking the shield */}
    <path d="M45 105 L50 105 L55 90 L65 120 L75 105 L80 105" stroke="url(#hexGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>

    <defs>
      <linearGradient id="hexGrad" x1="0" y1="0" x2="120" y2="120">
        <stop offset="0%" stopColor="#00D4FF" />
        <stop offset="50%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
  </svg>
);

const Logo = ({ className = "", size = "normal" }: { className?: string, size?: "small" | "normal" | "large" }) => {
  const widthClass = size === 'small' ? 'w-32' : size === 'large' ? 'w-64' : 'w-48';
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src="/horizontal-logo.png" alt="AutoMotive Buddy" className={`${widthClass} h-auto object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(0,212,255,0.2)]`} />
    </div>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'warning' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'border-green text-green bg-green/10',
    error: 'border-red text-red bg-red/10 animate-shake',
    warning: 'border-yellow text-yellow bg-yellow/10',
    info: 'border-blue text-blue bg-blue/10'
  };

  const icons = {
    success: <CheckCircle2 size={16} />,
    error: <AlertTriangle size={16} />,
    warning: <Info size={16} />,
    info: <ShieldCheck size={16} />
  };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: 100, opacity: 0 }}
      className={`fixed top-6 right-6 z-[1000] px-6 py-4 rounded-xl border ${colors[type]} glass-card shadow-2xl flex items-center gap-4 min-w-[300px]`}
    >
      {icons[type]}
      <span className="text-[11px] font-accent font-bold uppercase tracking-widest flex-1">{message}</span>
      <button onClick={onClose} className="hover:text-white transition-colors"><X size={14} /></button>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  const store = useStore();
  const [flowStep, setFlowStep] = useState<'landing' | 'app'>('landing');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hash, setHash] = useState(window.location.hash || '#home');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: any }[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthLoading(true);
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid)).catch(e => {
             handleFirestoreError(e, OperationType.GET, `users/${fbUser.uid}`);
             throw e;
          });
          
          let uData: UserType;
          if (userDoc.exists()) {
            uData = userDoc.data() as UserType;
            if (uData.role === 'trial' && uData.trialExpiration) {
               if (new Date(uData.trialExpiration).getTime() < Date.now()) {
                  // Trial expired
                  uData.status = 'rejected'; // essentially suspending them 
                  addToast('Trial expired', 'error');
               }
            }
            setCurrentUser(uData);
          } else {
            // New user via Google login or Anonymous
            const isAnon = fbUser.isAnonymous;
            const expirationTime = isAnon ? new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() : undefined;
            const newUser: UserType = {
              id: fbUser.uid,
              username: fbUser.email?.split('@')[0] || (isAnon ? `anon_${fbUser.uid.slice(0,6)}` : 'user'),
              fullName: fbUser.displayName || (isAnon ? 'Trial User' : 'Guest User'),
              email: fbUser.email || '',
              role: fbUser.email === 'rubenlleg12@gmail.com' ? 'admin' : (isAnon ? 'trial' : 'member'),
              status: fbUser.email === 'rubenlleg12@gmail.com' || isAnon ? 'approved' : 'pending',
              createdAt: new Date().toISOString(),
              avatarUrl: fbUser.photoURL || '',
              ...(expirationTime ? { trialExpiration: expirationTime } : {})
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser).catch(e => {
               handleFirestoreError(e, OperationType.CREATE, `users/${fbUser.uid}`);
               throw e;
            });
            uData = newUser;
            setCurrentUser(uData);
          }
          
          // Redirect if currently on login/register view
          if (window.location.hash === '#login' || window.location.hash === '#register') {
            window.location.hash = uData.role === 'admin' ? '#admin-overview' : '#dashboard';
            addToast(`Greetings, ${uData.fullName?.split(' ')[0] || 'User'}. Neural link established.`, 'success');
          }
        } catch (error) {
          console.error("Firestore getDoc error intercepted:", error);
          addToast('Database connection error during login. Try again.', 'error');
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('SW registered');
        }).catch(err => {
          console.log('SW failed', err);
        });
      });
    }

    const handleHash = () => setHash(window.location.hash || '#home');
    window.addEventListener('hashchange', handleHash);

    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        addToast('Installation protocol initiated.', 'success');
      }
      setDeferredPrompt(null);
    } else {
      addToast('App is already installed or not compatible for standalone mode.', 'info');
    }
  };

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (!error) return;
      
      let errMsg = typeof error === 'string' ? error : (error.message || String(error));
      
      try {
        if (errMsg.startsWith('{') && errMsg.includes('operationType')) {
          const parsed = JSON.parse(errMsg);
          errMsg = parsed.error;
        }
      } catch(e) {}
      
      if (errMsg.includes('exceeds the maximum allowed size')) {
        addToast('Error: Data payload is too large. Document exceeds 1MB limit. Try a smaller file.', 'error');
        // We don't necessarily call preventDefault() here because we want it to still appear in dev tools if needed, but we could.
      } else if (errMsg.includes('Missing or insufficient permissions')) {
        addToast('Error: Permission Denied. You do not have the clearance for this operation. Wait for Admin approval or check your access.', 'error');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const login = (user: UserType) => {
    // With Firebase, onAuthStateChanged sets the user, but we can do local nav stuff here
    window.location.hash = user.role === 'admin' ? '#admin-overview' : '#dashboard';
    addToast(`Greetings, ${user.fullName?.split(' ')[0] || 'User'}. Neural link established.`, 'success');
  };

  const updateAvatar = async (newUrl: string) => {
    if (currentUser) {
      try {
        const updated = { ...currentUser, avatarUrl: newUrl };
        await setDoc(doc(db, 'users', currentUser.id), { avatarUrl: newUrl }, { merge: true });
        setCurrentUser(updated);
        
        // If Ruben updates his avatar, also save it specifically so the public page can easily see it if needed
        if (updated.username === 'rubenllego' || updated.role === 'admin') {
          localStorage.setItem('ab_admin_avatar', newUrl);
        }
        
        addToast('Profile avatar updated.', 'success');
      } catch (error: any) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
        } catch (wrappedError: any) {
          let errMsg = wrappedError.message || String(wrappedError);
          try {
            if (errMsg.startsWith('{') && errMsg.includes('operationType')) {
              const parsed = JSON.parse(errMsg);
              errMsg = parsed.error;
            }
          } catch (e) {}

          if (errMsg.includes('exceeds the maximum allowed size')) {
            addToast('Error: Image file is too large (exceeds 1MB limit). Please try a smaller file.', 'error');
          } else if (errMsg.includes('Missing or insufficient permissions')) {
            addToast('Error: Permission Denied. You do not have the clearance to modify this profile data. Wait for Admin approval or try again.', 'error');
          } else {
            addToast(`Error updating profile: ${errMsg}`, 'error');
          }
        }
      }
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await setDoc(doc(db, 'logs', Math.random().toString(36).substr(2, 9)), {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id, username: currentUser.username,
          action: 'Logout', details: 'User session terminated',
          timestamp: new Date().toISOString()
        });
      }
      await logOut();
      window.location.hash = '#home';
    } catch (error) {
      console.error(error);
    }
  };

  // Simplified Router
  const renderContent = () => {
    const h = hash.split('?')[0];

    // Public
    if (h === '#home') return <LandingPage onNavigate={setHash} user={currentUser} onUpdateAvatar={updateAvatar} />;
    if (h === '#login') return <AuthPage mode="login" onBack={() => window.location.hash = '#home'} toast={addToast} />;
    if (h === '#register') return <AuthPage mode="register" onBack={() => window.location.hash = '#home'} toast={addToast} />;

    // Wait until firebase auth is initialized before deciding what protected view to show
    if (authLoading) return <div className="h-screen w-full flex items-center justify-center font-display uppercase tracking-widest text-text-secondary animate-pulse gap-3"><Loader2 className="animate-spin" size={24}/> Establishing Neural Link...</div>;

    // Protected
    if (!currentUser) {
      // Redirect to login safely inside a setTimeout to avoid React warnings about side effects during render
      setTimeout(() => { if (window.location.hash !== '#login') window.location.hash = '#login'; }, 0);
      return null;
    }

    if (currentUser.role === 'admin') {
      return <AdminDashboard h={h} user={currentUser} store={store} onLogout={logout} toast={addToast} onInstall={handleInstallApp} showInstall={!!deferredPrompt} onUpdateAvatar={updateAvatar} />;
    }

    if (currentUser.status === 'rejected') {
       return (
         <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center space-y-6">
           <Wrench size={64} className="text-red-500 opacity-80" />
           <h2 className="text-2xl font-bold font-display uppercase text-red-400 tracking-widest">Access Denied</h2>
           <p className="text-sm text-text-secondary max-w-md mx-auto">Your account {currentUser.role === 'trial' ? 'trial has expired' : 'has been suspended'}. Please contact your administrator to restore access.</p>
           <button onClick={logout} className="btn-secondary py-3 px-8 text-xs">LOGOUT</button>
         </div>
       );
    }

    return (
       <>
          {currentUser.role === 'trial' && currentUser.status === 'approved' && (
             <div className="fixed top-0 left-0 right-0 z-[100] p-1.5 text-center text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400 backdrop-blur-md border-b border-blue-500/20">
               TRIAL ACCOUNT ACTIVE — EXPIRES EN 3 HOURS
             </div>
          )}
          <div className={currentUser.role === 'trial' ? 'pt-6' : ''}>
             <MemberDashboard h={h} user={currentUser} store={store} onLogout={logout} toast={addToast} onInstall={handleInstallApp} showInstall={!!deferredPrompt} onUpdateAvatar={updateAvatar} />
          </div>
       </>
    );
  };

  return (
    <div className="relative">
      <div className="noise-texture" />
      <div className="mesh-bg" />
      <FloatingBackground />
      
      <NetworkStatus />
      
      <AnimatePresence>
        {renderContent()}
      </AnimatePresence>

      <AnimatePresence>
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </AnimatePresence>

      <ChatBot currentUser={currentUser} store={store} toast={addToast} />
    </div>
  );
}

// --- Home/Landing Page ---

function LandingPage({ onNavigate, user, onUpdateAvatar }: { onNavigate: (h: string) => void, user: any, onUpdateAvatar?: (url: string) => void }) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 px-6 py-4 flex items-center justify-between ${scrollY > 50 ? 'bg-bg-base-start/80 backdrop-blur-md border-b border-white/5 py-3' : ''}`}>
        <Logo size="small" />
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'Features', 'Pricing', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-accent font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-brand transition-colors">{item}</a>
          ))}
          <div className="h-4 w-px bg-white/10" />
          <button onClick={() => window.location.hash = '#login'} className="btn-secondary min-h-[40px] px-5">Operator Login</button>
          <button onClick={() => window.location.hash = '#register'} className="btn-primary min-h-[40px] px-5 ripple">Protocol Register</button>
        </div>
        <button className="md:hidden text-brand p-2"><Menu /></button>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        <div className="container max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <div className="mb-4 flex items-center gap-2 justify-center">
              <div className="h-px w-8 bg-brand" />
              <span className="text-[11px] font-accent font-bold text-brand uppercase tracking-[0.5em]">Automotive Intelligence</span>
              <div className="h-px w-8 bg-brand" />
            </div>
            <h1 className="text-5xl md:text-[72px] font-display font-bold leading-[1.05] tracking-tight mb-8">
              DIAGNOSE. REPAIR. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-dark">MASTER YOUR VEHICLE.</span>
            </h1>
            <p className="text-text-secondary text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light">
              The most complete automotive diagnostic and repair guidance platform. <br className="hidden md:block" />
              Professional-grade tools for Cars, Motorcycles, Heavy Equipment, and Agriculture.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center mb-16">
              <button onClick={() => window.location.hash = '#register'} className="btn-primary h-14 px-10 text-base shadow-2xl ripple group">
                Get Started Free <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#features" className="btn-secondary h-14 px-10 text-base">Explore Features</a>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <div className="w-full max-w-5xl mx-auto glass-card flex flex-wrap justify-center md:items-center gap-6 py-8 px-10 grid grid-cols-2 md:grid-cols-4 lg:flex lg:justify-between">
             {[
               { label: 'DTC Protocols', value: '500+' },
               { label: 'Multi-System', value: 'Light/Heavy' },
               { label: 'Diagnostics', value: 'Neural AI' },
               { label: 'Wiring Intel', value: 'Color Coding' },
               { label: 'Power Mapping', value: 'Fuses/Relays' },
               { label: 'Network Sync', value: 'Offline/Online' },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center gap-1">
                 <span className="text-xl font-accent font-bold text-text-primary">{stat.value}</span>
                 <span className="text-[9px] font-accent text-text-muted uppercase tracking-widest text-center">{stat.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Floating Car Silhouette */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-5 pointer-events-none animate-drift">
          <Car size={800} className="text-brand" strokeWidth={0.5} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative bg-bg-base-end overflow-hidden">
        <div className="diagonal-divider bg-bg-base-start absolute top-0 left-0 w-full h-full -z-10" />
        
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">EVERYTHING YOU NEED. IN ONE PLATFORM.</h2>
            <div className="w-20 h-1 bg-brand mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Database, title: '500+ DTC Protocols', desc: 'Full fault code database with symptoms, causes, step-by-step DIY fix guides and estimated repair costs, featuring Offline and Online sync.' },
              { icon: Cpu, title: 'Neural AI Diagnostics', desc: 'Direct access to the Neural DB for advanced real-time fault analysis, live chat support, and predictive failure modeling.' },
              { icon: Zap, title: 'Integrated Fuses & Relays', desc: 'Complete fuse box layouts and relay locations directly tied into the DTC database for seamless electrical fault tracing.' },
              { icon: Cable, title: 'Circuit Intent Analysis', desc: 'Advanced wiring color coding reference tool to identify circuit intent and electrical paths.' },
              { icon: Activity, title: 'Multi-System Support', desc: 'Diagnostic logic adapted specifically for standard light vehicles, heavy trucks, and complex heavy equipment.' },
              { icon: MessageSquare, title: 'Voice-Enabled Assistant', desc: 'Advanced voice-activated AI assistant to help with rapid troubleshooting and fault identification.' }
            ].map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Selector Preview Section */}
      <section className="py-32 px-6">
        <div className="container max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-display font-bold mb-12">GLOBAL FLEET COVERAGE</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Car, label: 'Car / Truck', count: '1,200+' },
              { icon: Bike, label: 'Motorcycle', count: '850+' },
              { icon: Tractor, label: 'Agricultural', count: '450+' },
              { icon: Truck, label: 'Heavy Equipment', count: '600+' }
            ].map((cat, i) => (
              <div key={i} className="glass-card flex flex-col items-center gap-4 group cursor-pointer">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand/20 group-hover:scale-110 transition-all duration-300">
                  <cat.icon size={32} className="text-brand" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-accent font-bold text-text-primary uppercase tracking-widest">{cat.label}</div>
                  <div className="text-[9px] font-accent text-brand bg-brand/10 rounded-full px-2 py-0.5">{cat.count} Models</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-12 text-text-secondary uppercase text-[11px] tracking-[0.3em] font-bold">Select your vehicle to get started after subscribing</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-black/40 relative overflow-hidden">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">CHOOSE YOUR PERFORMANCE TIER</h2>
            <p className="text-text-secondary tracking-widest uppercase text-xs">Unlock professional grade diagnostics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
             <PricingCard 
               title="Single Phase" price="500" duration="1 Month" icon={Shield} 
               benefits={['500+ DTC Lookup', 'Fuse & Relay Mapping', 'Offline Mode Basics', 'Neural AI Chatbot Support', 'Member Community Access']}
             />
             <PricingCard 
               title="Quarterly Sync" price="1,000" duration="3 Months" icon={Zap}
               benefits={['Everything in 1 Month', 'Priority Database Updates', 'Wiring Color Coding', 'Multi-System Access', 'Standard Support']}
             />
             <PricingCard 
               title="Semi-Annual" price="1,500" duration="6 Months" icon={Star} active
               benefits={['Everything in Quarterly', 'DIY Repair Guides', 'Detailed Wire Maps', 'Component Finder', 'Maintenance Schedules']}
             />
             <PricingCard 
               title="Infinite Cycle" price="2,000" duration="1 Year" icon={Award} featured
               benefits={['Everything in Semi-Annual', 'Voice Protocol Access', 'Export Bulk Stats', 'Partner Perks', 'Certificate of Access']}
             />
          </div>
          <p className="mt-16 text-center text-text-muted italic text-[11px] tracking-widest">
            All prices in Philippine Peso ₱. Access activated after admin payment verification. <br />
            Owner: Ruben Llego O. — AutoMotive Buddy
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 relative">
        <div className="container max-w-5xl mx-auto">
          <div className="glass-card overflow-hidden flex flex-col lg:flex-row shadow-[0_0_50px_rgba(0, 212, 255,0.1)] border-white/5">
            {/* Left: Ruben's Profile */}
            <div className="lg:w-1/2 p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/5">
              <div className="flex flex-col items-center lg:items-start gap-8 text-center lg:text-left">
                <div className="w-40 h-40 rounded-full border-4 border-brand/20 p-2 shrink-0 shadow-[0_0_40px_var(--color-brand-glow)] relative group">
                  <div className="w-full h-full rounded-full bg-brand/10 flex items-center justify-center overflow-hidden">
                    <UserAvatar 
                      user={user?.role === 'admin' ? user : { fullName: "Ruben Llego O.", avatarUrl: localStorage.getItem('ab_admin_avatar') || "/ruben_avatar.jpg" }} 
                      size="xl" 
                      onUpdate={user?.role === 'admin' ? onUpdateAvatar : undefined}
                      className="border-none bg-transparent hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-brand text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-4 border-bg-card">
                    <Award size={18} />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-display font-bold tracking-tight">RUBEN LLEGO O.</h3>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      <span className="badge badge-high bg-brand/20 text-brand border-brand/30">OWNER & FOUNDER</span>
                      <span className="badge badge-medium">LEAD DEVELOPER</span>
                      <span className="badge badge-low">AUTOMOTIVE EXPERT</span>
                    </div>
                  </div>
                  
                  <p className="text-text-secondary leading-relaxed text-base italic">
                    "AutoMotive Buddy was built to empower every driver, mechanic, and fleet operator with professional-grade diagnostic and repair tools. Our mission is to democratize automotive intelligence through technology."
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-3 text-text-muted hover:text-brand transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Mail size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest">info@automotivebuddy.io</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted hover:text-brand transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Globe size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest">automotivebuddy.io</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted hover:text-brand transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Award size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest">Ruben Llego Management</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted hover:text-brand transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Phone size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest">@ruben.llego.ben</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: QR Code & Contact Call-to-Action */}
            <div className="lg:w-1/2 bg-white/5 p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="space-y-8 max-w-sm">
                <div className="space-y-2">
                  <h4 className="text-xl font-display font-bold uppercase tracking-widest text-brand">Direct Connection</h4>
                  <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Scan to Message or Call Ruben Llego</p>
                </div>
                
                <div className="relative p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] group">
                  <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white">
                    <img 
                      src="/ruben_qr.jpg" 
                      alt="Ruben Llego QR Contact" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://facebook.com/ruben.llego.ben";
                      }}
                    />
                  </div>
                  <div className="absolute -inset-2 rounded-[2rem] border-2 border-brand/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                
                <div className="space-y-4">
                  <p className="text-text-muted text-[10px] uppercase font-bold tracking-[.2em] leading-relaxed">
                    Personalized support and fleet bulk licensing available through direct admin consult.
                  </p>
                  <button onClick={() => window.location.href = 'mailto:info@automotivebuddy.io'} className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2">
                    <Mail size={18} />
                    SEND DIRECT INQUIRY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 pb-12 px-6 border-t border-white/5 relative bg-sidebar-bg/50">
        <div className="container max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Logo />
            <p className="text-text-secondary text-[13px] leading-relaxed">Your professional smart companion for master-level vehicle diagnostics and repairs across all sectors.</p>
          </div>
          <div>
            <h4 className="font-accent font-bold text-[11px] text-text-primary tracking-widest mb-6">QUICK NAVIGATION</h4>
            <ul className="space-y-3 text-[11px] font-bold text-text-muted uppercase tracking-widest">
              <li><a href="#home" className="hover:text-brand transition-colors">Home Terminal</a></li>
              <li><a href="#features" className="hover:text-brand transition-colors">Tool Modules</a></li>
              <li><a href="#pricing" className="hover:text-brand transition-colors">Pricing Protocol</a></li>
              <li><button onClick={() => window.location.hash = '#login'} className="hover:text-brand transition-colors">Auth Access</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-accent font-bold text-[11px] text-text-primary tracking-widest mb-6">FLEET COVERAGE</h4>
            <ul className="space-y-3 text-[11px] font-bold text-text-muted uppercase tracking-widest">
              <li>Passenger Vehicles</li>
              <li>Light Commercial Trucks</li>
              <li>Heavy Construction Gear</li>
              <li>Agricultural Machinery</li>
            </ul>
          </div>
          <div>
            <h4 className="font-accent font-bold text-[11px] text-text-primary tracking-widest mb-6">CONTACT PROTOCOL</h4>
            <ul className="space-y-3 text-[11px] font-bold text-text-muted uppercase tracking-widest">
              <li className="flex items-center gap-2"><Mail size={12} /> info@automotivebuddy.io</li>
              <li className="flex items-center gap-2"><Globe size={12} /> automotivebuddy.io</li>
              <li className="flex items-center gap-2"><Award size={12} /> Ruben Llego Management</li>
            </ul>
          </div>
        </div>
        <div className="container max-w-7xl mx-auto text-center border-t border-white/5 pt-12">
          <p className="text-[10px] font-accent font-bold text-text-muted uppercase tracking-[0.3em]">
            © 2025 AutoMotive Buddy | Owned & Managed by Ruben Llego | Built with Precision
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub Components ---

function FeatureCard({ icon: Icon, title, desc, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-card group hover:bg-brand/5 border-white/5 hover:border-brand/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
        <Icon size={24} className="text-brand" />
      </div>
      <h3 className="text-xl font-display font-bold text-text-primary mb-3 uppercase tracking-wider">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function PricingCard({ title, price, duration, icon: Icon, benefits, featured, active }: any) {
  return (
    <motion.div 
      whileHover={{ y: featured ? -12 : -8 }}
      className={`
        glass-card flex flex-col p-9 relative rounded-[2rem] border transition-all duration-500
        ${featured ? 'scale-105 z-10 border-brand/40 shadow-[0_20px_60px_rgba(0, 212, 255,0.2)] bg-brand/5' : 'opacity-90 hover:opacity-100 hover:border-white/20'}
        ${active && !featured ? 'border-blue/40 shadow-[0_15px_40px_rgba(59,130,246,0.15)] bg-blue/5' : ''}
      `}
    >
      {featured && (
        <div className="absolute -top-4 -right-4 bg-brand text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl animate-pulse flex items-center gap-2">
          <Star size={10} fill="currentColor" /> Best Value <Star size={10} fill="currentColor" />
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
          <Icon size={32} className={featured ? 'text-brand' : 'text-text-primary'} />
        </div>
        {active && !featured && <span className="text-[9px] font-accent text-blue uppercase tracking-widest border border-blue/30 px-3 py-1 rounded-full bg-blue/10">Most Popular</span>}
      </div>

      <h3 className="text-2xl font-display font-bold mb-1 tracking-widest">{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-5xl font-accent font-bold text-brand">₱{price}</span>
        <span className="text-text-muted text-xs uppercase font-bold tracking-widest">/ {duration}</span>
      </div>
      
      <div className="w-full h-px bg-gradient-to-r from-brand/50 to-transparent my-8" />

      <ul className="space-y-4 mb-12 flex-1">
        {benefits.map((b: string, i: number) => (
          <li key={i} className="flex items-center gap-3 text-[11px] text-text-secondary uppercase tracking-tight font-bold">
            <Check size={14} className="text-green shrink-0" strokeWidth={3} /> {b}
          </li>
        ))}
      </ul>

      <button 
        onClick={() => window.location.hash = '#register'}
        className={`${featured ? 'btn-primary' : 'btn-secondary'} w-full text-xs py-4 uppercase tracking-[0.2em] relative overflow-hidden group`}
      >
        <span className="relative z-10">Get Started Now</span>
        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
      </button>
    </motion.div>
  );
}

// --- Authentication Page ---

function AuthPage({ mode, onBack, toast }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and Password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { loginWithEmail, registerWithEmail } = await import('./lib/firebase');
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (e: any) {
      let errMsg = e.message;
      if (e.code === 'auth/invalid-credential') {
         errMsg = 'Invalid credentials or Email/Password provider not enabled in Firebase Console.';
      } else if (e.code === 'auth/operation-not-allowed') {
         errMsg = 'Email/Password auth is not enabled in Firebase setup. Please enable it in the Firebase Console -> Authentication -> Sign-in method.';
      }
      setError(`Auth Failed: ${errMsg}`);
      toast('Access Denied', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <FloatingBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className={`w-full ${mode === 'register' ? 'max-w-5xl' : 'max-w-[460px]'} glass-card p-0 overflow-hidden flex flex-col md:flex-row shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-white/10`}
      >
        {mode === 'register' && (
          <div className="hidden md:flex flex-col justify-between w-2/5 bg-sidebar-bg/50 p-12 border-r border-white/5 relative">
            <div className="space-y-8 relative z-10">
               <Logo size="small" />
               <h2 className="text-3xl font-display font-bold leading-tight">JOIN THE <br /><span className="text-brand">DIAGNOSTIC ELITE</span></h2>
               <div className="space-y-4">
                 {[
                   'Full DTC Lookup Access',
                   'Complete PDF Service Manuals',
                   'ASCII/SVG Wiring Diagrams',
                   'Visual Fuse Box Layouts',
                   '24/7 AI Troubleshooting'
                 ].map(f => (
                   <div key={f} className="flex items-center gap-3 text-[11px] font-accent font-bold uppercase tracking-widest text-text-secondary italic">
                     <CheckCircle2 size={14} className="text-brand" /> {f}
                   </div>
                 ))}
               </div>
            </div>
            <div className="space-y-4 relative z-10 pt-12 border-t border-white/5 mt-auto">
               <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Verified by</p>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand"><Award size={20} /></div>
                  <div className="text-[11px] font-bold">RUBEN LLEGO <br /><span className="text-brand/60">Lead Developer</span></div>
               </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10"><Wrench size={260} /></div>
          </div>
        )}

        <div className={`flex-1 p-10 md:p-14 relative ${error ? 'animate-shake' : ''}`}>
          <header className={`mb-10 ${mode === 'login' ? 'text-center' : ''}`}>
            {mode === 'login' && <Logo className="justify-center mb-8" size="normal" />}
            <h2 className="text-2xl font-display font-bold tracking-widest uppercase">{mode === 'login' ? 'System Authorization' : 'Member Registration'}</h2>
            <p className="text-text-secondary text-[10px] uppercase tracking-[0.3em] font-medium mt-2">Enter credentials or select provider</p>
          </header>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
            <div>
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="input-field w-full text-center tracking-widest uppercase bg-black/40 border-white/10" 
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                className="input-field w-full text-center tracking-widest uppercase bg-black/40 border-white/10" 
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 text-sm flex items-center justify-center gap-3 mt-2"
            >
              {loading ? 'AUTHORIZING...' : (mode === 'login' ? 'INITIALIZE LOGIN' : 'CREATE NEURAL LINK')}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-text-muted uppercase tracking-[0.3em]">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  const { signInWithGoogle } = await import('./lib/firebase');
                  await signInWithGoogle();
                  // onAuthStateChanged in App.tsx takes care of the rest
                } catch (e: any) {
                  setError(`Authorization Failed: ${e.message}`);
                  toast('Access Denied', 'error');
                }
                setLoading(false);
              }}
              disabled={loading}
              className="btn-secondary w-full py-4 text-xs flex items-center justify-center gap-3 relative overflow-hidden group border-white/10 hover:border-brand/50 hover:bg-brand/10"
            >
              <Globe className="text-brand" size={16} />
              <span>CONTINUE WITH GOOGLE</span>
            </button>
            <button
               type="button"
               onClick={async () => {
                 setLoading(true);
                 setError('');
                 try {
                   const { startTrialAccount } = await import('./lib/firebase');
                   await startTrialAccount();
                 } catch (e: any) {
                   setError(`Trial Activation Failed. Please enable Anonymous Auth in Firebase. ${e.message}`);
                   toast('Access Denied', 'error');
                 }
                 setLoading(false);
               }}
               disabled={loading}
               className="btn-secondary w-full py-4 text-xs flex items-center justify-center gap-3 relative overflow-hidden group border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10"
             >
               <Clock className="text-blue-400" size={16} />
               <span>START 3-HOUR FREE TRIAL</span>
             </button>
            {error && (
              <div className="text-red-500 text-xs font-accent tracking-widest text-center mt-2 px-4 py-2 bg-red-500/10 rounded-md border border-red-500/20 shadow-inner leading-relaxed">
                {error}
              </div>
            )}
          </div>

          <footer className="mt-14 text-center flex flex-col gap-4 border-t border-white/10 pt-8">
            <button onClick={onBack} className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-text-muted hover:text-brand transition-colors">Return to External Interface</button>
            <div className="text-[11px] text-text-secondary">
              {mode === 'login' ? (
                <>New to the framework? <button onClick={() => window.location.hash = '#register'} className="text-brand font-bold hover:underline ml-1">Register Service Access</button></>
              ) : (
                <>Already in the matrix? <button onClick={() => window.location.hash = '#login'} className="text-brand font-bold hover:underline ml-1">Member Authorize</button></>
              )}
            </div>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

// --- Shared Utilities ---
const isTagalog = (text: string) => {
  const commonTagalog = [
    'ang', 'ng', 'mga', 'sa', 'ay', 'may', 'ito', 'siya', 'ako', 'po', 'opo', 'ano', 'saan', 'kailan', 'bakit', 'paano', 'salamat', 'kamusta', 'tagalog',
    'kumusta', 'mabuti', 'natin', 'inyo', 'kami', 'tayo', 'sila', 'ito', 'iyon', 'doon', 'dito', 'gaano', 'alin', 'sino', 'kanino', 'nasaan',
    'magkano', 'ilan', 'kasi', 'dahil', 'ngunit', 'pero', 'subalit', 'habang', 'kapag', 'kung', 'maging', 'para', 'upang', 'kahit', 'bagaman',
    'pwedeng', 'pwede', 'nagawa', 'gagawin', 'tulungan', 'tulong', 'kotse', 'sasakyan', 'makina'
  ];
  const words = text.toLowerCase().split(/\W+/);
  return words.some(word => commonTagalog.includes(word));
};

const speakText = (text: string, enabled: boolean) => {
  if (!enabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  // Remove markdown and unwanted symbols
  const cleanText = text.replace(/[*_#]/g, '').replace(/\[.*?\]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Wait for voices to be loaded if they aren't
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const isTagalogText = isTagalog(cleanText);
    
    if (isTagalogText) {
      utterance.lang = 'tl-PH';
      // Priority: Natural/Google voices usually sound better
      const filVoices = voices.filter(v => v.lang.includes('tl') || v.lang.includes('fil') || v.name.toLowerCase().includes('tagalog') || v.name.toLowerCase().includes('filipino'));
      const bestFil = filVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || filVoices[0];
      if (bestFil) utterance.voice = bestFil;
      utterance.rate = 1.0; 
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-US';
      const enVoices = voices.filter(v => v.lang.includes('en-US'));
      const bestEn = enVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || enVoices[0];
      if (bestEn) utterance.voice = bestEn;
      utterance.rate = 1.0;
    }
  };

  getBestVoice();
  // Some browsers need a tiny delay or event listener for getVoices()
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = getBestVoice;
  }

  window.speechSynthesis.speak(utterance);
};

// --- AI ChatBot Components ---

function ChatBot({ currentUser, store, toast }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true); // enabled by default for welcome msg since user wants voice activated
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasWelcomedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasWelcomedRef.current) {
      hasWelcomedRef.current = true;
      const welcomeText = `Welcome to AutoMotive Buddy — your intelligent automotive diagnostic companion. Designed to simplify vehicle troubleshooting, AutoMotive Buddy uses advanced AI to analyze diagnostic trouble codes, identify issues, and guide you toward the right solution — faster and smarter. Whether you're a professional mechanic or a car owner, our system empowers you with real-time insights, accurate diagnostics, and a seamless user experience. AutoMotive Buddy is proudly developed and led by Ruben Llego, owner and lead web developer, with a vision to revolutionize automotive diagnostics through intelligent technology. Get ready to experience the future of vehicle diagnostics. AutoMotive Buddy — Diagnose smarter. Drive better.`;
      
      const userId = currentUser?.id || 'guest';
      const hasPreviousMessages = store.chatLogs.some((m: any) => m.userId === userId);
      
      if (!hasPreviousMessages) {
         store.addChatMessage(userId, 'ai', welcomeText);
      }
      
      if (autoSpeak) {
         speakText(welcomeText, true);
      }
    }
  }, [isOpen, currentUser, store, autoSpeak]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Speech recognition is not supported in your browser.", "error");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    // Default to Tagalog if the text likely is Tagalog or if starting fresh
    recognition.lang = (input && isTagalog(input)) ? 'tl-PH' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Optional: auto-send if you want it faster
      // setTimeout(() => handleSend(), 500); 
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [store.chatLogs, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    const userId = currentUser?.id || 'guest';
    store.addChatMessage(userId, 'user', userMsg);

    setIsTyping(true);
    
    try {
      const { make, model, year, engine } = useVehicleStore.getState();
      const response = await askAutomotiveAssistant(userMsg, { make, model, year, engine });
      store.addChatMessage(userId, 'ai', response);
      if (autoSpeak) speakText(response, true);
    } catch (err) {
      const errMsg = "System temporarily offline. Please try again later.";
      store.addChatMessage(userId, 'ai', errMsg);
      if (autoSpeak) speakText(errMsg, true);
    } finally {
       setIsTyping(false);
    }
  };

  const currentChats = store.chatLogs.filter((m: any) => m.userId === (currentUser?.id || 'guest'));

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] z-[500] flex items-center justify-center animate-pulse-glow hover:scale-110 transition-transform group"
      >
        <Wrench className="w-7 h-7 group-hover:rotate-45 transition-transform duration-500" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-28 right-8 w-[90%] max-w-[400px] h-[560px] glass-card p-0 shadow-2xl z-[500] flex flex-col border-brand/20 overflow-hidden"
          >
             <header className="p-5 bg-sidebar-bg/50 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center relative">
                      <Cpu size={20} className="text-brand" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green rounded-full border-2 border-bg-card" />
                   </div>
                   <div>
                      <div className="text-[11px] font-accent font-bold tracking-widest text-text-primary uppercase">AutoBot AI</div>
                      <div className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Online Diagnostics Matrix</div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => {
                        const newState = !autoSpeak;
                        setAutoSpeak(newState);
                        if (!newState) window.speechSynthesis.cancel();
                        toast(newState ? "AI Voice established" : "AI Voice deactivated", newState ? "success" : "info");
                     }} 
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${autoSpeak ? 'bg-brand/10 border-brand/40 text-brand shadow-[0_0_10px_rgba(0, 212, 255,0.2)]' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}
                   >
                     {autoSpeak ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
                     <span className="text-[9px] font-bold uppercase tracking-wider">{autoSpeak ? 'Voice On' : 'Voice Off'}</span>
                   </button>
                   <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"><X size={18} /></button>
                </div>
             </header>

             <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/10">
                {currentChats.length === 0 && (
                  <div className="text-center py-10 opacity-30 flex flex-col items-center gap-4">
                     <MessageSquare size={48} />
                     <p className="text-[11px] font-accent font-bold uppercase tracking-[0.2em]">Neural Link Standby...</p>
                  </div>
                )}
                {currentChats.map((m: any) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] leading-relaxed break-words ${
                      m.role === 'user' 
                        ? 'bg-brand text-white rounded-tr-none text-right' 
                        : 'glass-card bg-bg-card border-white/5 rounded-tl-none text-left font-mono'
                    } shadow-xl`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      <div className={`text-[8px] mt-2 font-bold uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-left' : 'text-right'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="glass-card bg-bg-card border-white/5 rounded-2xl rounded-tl-none p-3 px-5 flex gap-1 items-center">
                       <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                       <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
             </div>

             <footer className="p-4 bg-sidebar-bg/50 border-t border-white/5">
                <div className="flex justify-between items-center mb-3">
                   <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                      {['🔍 Search DTC', '🚗 Guide', '💳 Pricing', '🆘 Support', '🇵🇭 Tagalog Help'].map(chip => (
                         <button key={chip} onClick={() => setInput(chip.replace(/[^a-zA-Z\s]/g, '').trim())} className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-accent font-bold uppercase tracking-widest text-text-muted hover:border-brand hover:text-brand transition-all cursor-pointer">
                           {chip}
                         </button>
                      ))}
                   </div>
                   {autoSpeak && (
                     <div className="flex items-center gap-1.5 text-brand animate-pulse ml-2 px-2 py-1 bg-brand/5 rounded-md border border-brand/20">
                        <Volume2 size={10} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">AI Voice</span>
                     </div>
                   )}
                </div>
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                   <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Inquire the matrix..." 
                        className="w-full bg-[#0A1224] border border-white/10 rounded-xl px-4 py-3 text-[11px] text-text-primary focus:outline-none focus:border-brand/50 transition-all pr-10"
                        value={input}
                        onChange={e => setInput(e.target.value.slice(0, 500))}
                        maxLength={500}
                      />
                      <button 
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red text-white animate-pulse' : 'text-text-muted hover:text-white'}`}
                      >
                        {isListening ? <Mic size={14} /> : <Mic size={14} />}
                      </button>
                   </div>
                   <button type="submit" className="w-10 h-10 shrink-0 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors ripple shadow-lg shadow-brand/20">
                     <ArrowRight size={18} />
                   </button>
                </form>
             </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function InstallDrawer({ isOpen, onClose, onInstall, hasPrompt }: { isOpen: boolean, onClose: () => void, onInstall: () => void, hasPrompt: boolean }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-sm h-full bg-background-glass border-l border-border-glass shadow-2xl relative z-10 flex flex-col"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <Download className="text-brand" size={24} />
            <h2 className="text-xl font-display font-medium uppercase tracking-widest text-[#E0E0E0]">Install WebApp</h2>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5 hover:border-white/20"><X size={20} /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4">
            <h3 className="text-sm font-bold text-brand tracking-widest uppercase mb-2">Automotive Buddy App</h3>
            <p className="text-xs text-text-secondary leading-relaxed font-accent">
              Install the Progressive Web App (PWA) to your device for offline support, fast loading, and an immersive native-like experience.
            </p>
          </div>

          {hasPrompt ? (
             <button onClick={onInstall} className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2">
               <Download size={18} /> INSTALL APP NOW
             </button>
          ) : (
             <div className="space-y-6">
                <div>
                   <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={14}/> iOS / Safari</h4>
                   <ol className="text-xs text-text-secondary space-y-2 list-decimal list-inside font-accent">
                     <li>Tap the <strong>Share</strong> button at the bottom of the screen.</li>
                     <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                     <li>Confirm by tapping <strong>Add</strong>.</li>
                   </ol>
                </div>
                <div>
                   <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={14}/> Android / Chrome</h4>
                   <ol className="text-xs text-text-secondary space-y-2 list-decimal list-inside font-accent">
                     <li>Tap the <strong>Menu (3 dots)</strong> at the top right.</li>
                     <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                     <li>Follow the prompts to install.</li>
                   </ol>
                </div>
                <div>
                   <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={14}/> Desktop</h4>
                   <p className="text-xs text-text-secondary font-accent">
                     Look for the installation icon (monitor with a down arrow) in the right side of your browser's address bar.
                   </p>
                </div>
             </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// --- Removed Mock AI Assistant Logic ---

// --- Dashboard Layout Logic ---

function AdminDashboard({ h, user, store, onLogout, toast, onInstall, showInstall, onUpdateAvatar }: any) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false);
  const activeTab = h.startsWith('#admin-') ? h.replace('#admin-', '') : (h === '#admin' ? 'overview' : (h.replace('#', '') || 'overview'));

  const navigateTo = (tab: string) => {
    window.location.hash = `#admin-${tab}`;
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        {(!sidebarCollapsed || mobileMenuOpen) && <Logo />}
        <button onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : setSidebarCollapsed(!sidebarCollapsed)} className="text-text-muted hover:text-brand transition-colors cursor-pointer hidden lg:block">
          <Menu size={20} />
        </button>
      </div>

      <nav className="sidebar-nav overflow-y-auto space-y-2">
        <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('overview')} />
        <NavItem icon={Users} label="Member Core" active={activeTab === 'members'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('members')} />
        <NavItem icon={Database} label="DTC Database" active={activeTab === 'dtc'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('dtc')} />
        <NavItem icon={Activity} label="Audit Registry" active={activeTab === 'logs'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('logs')} />
        <NavItem icon={User} label="Admin Profile" active={activeTab === 'profile'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('profile')} />
        <NavItem icon={Settings} label="Core Config" active={activeTab === 'settings'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('settings')} />
      </nav>

      <div className="px-4 py-2 border-t border-white/5 bg-brand/5">
        <button 
          onClick={() => setInstallDrawerOpen(true)} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all ${sidebarCollapsed && !mobileMenuOpen ? 'justify-center px-0' : ''}`}
          title="Install Application"
        >
          <Download size={18} />
          {(!sidebarCollapsed || mobileMenuOpen) && <span className="text-[10px] font-bold uppercase tracking-widest">Install App</span>}
        </button>
      </div>

      <div className="sidebar-footer space-y-4">
        <div className={`sidebar-user transition-all ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : ''}`}>
          <UserAvatar user={user} size="md" onUpdate={onUpdateAvatar} key={`admin-v-${user.avatarUrl}`} />
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex-1 min-w-0">
              <div className="font-sans font-semibold text-sm truncate">{user.fullName}</div>
              <div className="text-[11px] text-brand font-bold uppercase tracking-widest">Master Admin</div>
            </div>
          )}
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <button onClick={onLogout} className="text-text-secondary hover:text-red-500 transition-colors cursor-pointer">
              <LogOut size={18} />
            </button>
          )}
        </div>
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="pt-2 flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
            <div className="h-px w-4 bg-white/20" />
            <span className="text-[9px] font-accent font-bold uppercase tracking-[0.2em] whitespace-nowrap">Developed by Ruben Llego</span>
            <div className="h-px w-4 bg-white/20" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: sidebarCollapsed ? 80 : 280 }} 
        className="sidebar hidden lg:flex flex-col shrink-0 relative z-20"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: -280 }} 
              animate={{ x: 0 }} 
              exit={{ x: -280 }}
              className="sidebar fixed left-0 top-0 bottom-0 w-[280px] z-[101] lg:hidden flex flex-col pt-4 overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-[0.08] mix-blend-screen">
           <img src="/horizontal-logo.png" alt="background watermark" className="w-[180%] md:w-[100%] max-w-none opacity-50 drop-shadow-[0_0_30px_rgba(0,212,255,0.8)]" />
        </div>
        <div className="relative z-10 w-full">
          <InstallDrawer isOpen={installDrawerOpen} onClose={() => setInstallDrawerOpen(false)} onInstall={() => { onInstall(); setInstallDrawerOpen(false); }} hasPrompt={showInstall} />
          <header className="mb-8 md:mb-12 flex justify-between items-center bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-text-secondary hover:text-brand hover:border-brand/30 transition-all">
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl text-brand mb-1 uppercase tracking-tighter font-display font-bold mix-blend-lighten shadow-brand">Admin Central</h1>
                <p className="text-text-secondary text-[10px] md:text-sm font-accent tracking-widest uppercase opacity-70">Fleet & Diagnostic Management</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="badge badge-red py-2 px-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                Admin Node 01 - SECURE
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <OverviewTab key="adm-ov" user={user} store={store} />}
            {activeTab === 'members' && <MembersTab key="adm-mbr" store={store} user={user} toast={toast} />}
            {activeTab === 'dtc' && <DTCLookupTab key="adm-dtc" store={store} user={user} toast={toast} />}
            {activeTab === 'logs' && <LogsTab key="adm-log" store={store} />}
            {activeTab === 'profile' && <ProfileTab user={user} store={store} onUpdateAvatar={onUpdateAvatar} />}
            {activeTab === 'announcements' && <div className="glass-panel text-center py-20 opacity-50 uppercase tracking-widest text-[10px]">Announcements Module - Interface Integration Pending</div>}
            {activeTab === 'settings' && <div className="glass-panel text-center py-20 opacity-50 uppercase tracking-widest text-[10px]">Settings Module - Configuration Lock Engaged</div>}
          </AnimatePresence>
        </div>
      </main>
      <GlobalSearchOverlay isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} store={store} user={user} />
    </div>
  );
}

function MemberDashboard({ h, user, store, onLogout, toast, onInstall, showInstall, onUpdateAvatar }: any) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false);
  const [flowStep, setFlowStep] = useState<'landing' | 'app'>('landing'); // Moved here

  const activeTab = h.replace('#', '') || 'dashboard';

  const navigateTo = (tab: string) => {
    window.location.hash = `#${tab}`;
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        {(!sidebarCollapsed || mobileMenuOpen) && <Logo />}
        <button onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : setSidebarCollapsed(!sidebarCollapsed)} className="text-text-muted hover:text-brand transition-colors cursor-pointer hidden lg:block">
          <Menu size={20} />
        </button>
      </div>

      <nav className="sidebar-nav overflow-y-auto space-y-1 md:space-y-2">
        <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'dashboard'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('dashboard')} />
        <NavItem icon={Search} label="DTC Database" active={activeTab === 'dtc'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('dtc')} />
        <NavItem icon={Cable} label="Wiring Color Coding" active={activeTab === 'wiring'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('wiring')} />
        <NavItem icon={Star} label="Neural Library" active={activeTab === 'saved'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('saved')} />
        <div className="border-t border-white/5 my-4 mx-4 pt-4" />
        <NavItem icon={User} label="Profile" active={activeTab === 'profile'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('profile')} />
        <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('settings')} />
      </nav>

      <div className="px-4 py-2 border-t border-white/5 bg-brand/5">
        <button 
          onClick={() => setInstallDrawerOpen(true)} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all ${sidebarCollapsed && !mobileMenuOpen ? 'justify-center px-0' : ''}`}
          title="Install Application"
        >
          <Download size={18} />
          {(!sidebarCollapsed || mobileMenuOpen) && <span className="text-[10px] font-bold uppercase tracking-widest">Install App</span>}
        </button>
      </div>

      <div className="sidebar-footer space-y-4">
        <div className={`sidebar-user transition-all ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : ''}`}>
          <UserAvatar user={user} size="md" onUpdate={onUpdateAvatar} key={`member-v-${user.avatarUrl}`} />
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex-1 min-w-0">
              <div className="font-sans font-semibold text-sm truncate">{user.fullName}</div>
              <div className="text-[11px] text-text-secondary">Premium Member</div>
            </div>
          )}
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <button onClick={onLogout} className="text-text-secondary hover:text-red-500 transition-colors cursor-pointer">
              <LogOut size={18} />
            </button>
          )}
        </div>
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="pt-2 flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
            <div className="h-px w-4 bg-white/20" />
            <span className="text-[9px] font-accent font-bold uppercase tracking-[0.2em] whitespace-nowrap">Developed by Ruben Llego</span>
            <div className="h-px w-4 bg-white/20" />
          </div>
        )}
      </div>
    </>
  );
  
  return (
    <>
      {flowStep === 'landing' ? (
        <LandingScreen onEnter={() => setFlowStep('app')} />
        ) : (
        <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
          {/* Desktop Sidebar */}
          <motion.aside 
            animate={{ width: sidebarCollapsed ? 80 : 280 }} 
            className="sidebar hidden lg:flex flex-col shrink-0 z-20 relative"
          >
            <SidebarContent />
          </motion.aside>
...

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                />
                <motion.aside 
                  initial={{ x: -280 }} 
                  animate={{ x: 0 }} 
                  exit={{ x: -280 }}
                  className="sidebar fixed left-0 top-0 bottom-0 w-[280px] z-[101] lg:hidden flex flex-col overflow-hidden"
                >
                  <SidebarContent />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-[0.08] mix-blend-screen">
              <img src="/horizontal-logo.png" alt="background watermark" className="w-[180%] md:w-[100%] max-w-none opacity-50 drop-shadow-[0_0_30px_rgba(0,212,255,0.8)]" />
            </div>
            <div className="relative z-10 w-full">
            <InstallDrawer isOpen={installDrawerOpen} onClose={() => setInstallDrawerOpen(false)} onInstall={() => { onInstall(); setInstallDrawerOpen(false); }} hasPrompt={showInstall} />
            <header className="mb-8 md:mb-12 flex justify-between items-center bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
              <div className="flex items-center gap-4">
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-text-secondary hover:text-brand hover:border-brand/30 transition-all">
                  <Menu size={24} />
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl text-brand mb-1 uppercase tracking-tighter font-display font-bold shadow-brand">AutoMotive Buddy</h1>
                  <p className="text-text-secondary text-[10px] md:text-sm font-accent tracking-widest uppercase opacity-70">Your Smart Automotive Companion</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <button onClick={() => setGlobalSearchOpen(true)} className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-text-muted hover:text-brand hover:border-brand/30 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                  <Search size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100 italic">Neural Matrix Search</span>
                  <kbd className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded ml-2 text-white/50">⌘K</kbd>
                </button>
                <div className="badge badge-blue py-2 px-4 shadow-[0_0_15px_rgba(59,130,246,0.1)] uppercase text-[10px] tracking-widest font-bold border-blue/30 bg-blue/10 text-blue border">
                  Stable Link
                </div>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && <OverviewTab key="mbr-ov" user={user} store={store} />}
              {activeTab === 'dtc' && <DTCLookupTab key="mbr-dtc" store={store} user={user} toast={toast} />}
              {activeTab === 'wiring' && <WiringColorTab key="mbr-wiring" store={store} user={user} toast={toast} />}
              {activeTab === 'saved' && <SavedItemsTab key="mbr-saved" user={user} store={store} />}
              {activeTab === 'profile' && <ProfileTab user={user} store={store} onUpdateAvatar={onUpdateAvatar} />}
              {activeTab === 'settings' && <div className="glass-panel text-center py-20 opacity-50 uppercase tracking-widest text-[10px]">User Preferences Interface Pending</div>}
            </AnimatePresence>
            </div>
          </main>
          <GlobalSearchOverlay isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} store={store} user={user} />
        </div>
      )}
    </>
  );
}

function LandingScreen({ onEnter }: { onEnter: () => void }) {
  const adminAvatar = localStorage.getItem('ab_admin_avatar') || 'https://ui-avatars.com/api/?name=Ruben+Llego&background=0a0e1a&color=00d4ff&size=256';

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      <FloatingBackground />
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl space-y-8 flex flex-col items-center"
      >
        <motion.div 
           initial={{ scale: 0.8 }} 
           animate={{ scale: 1 }} 
           transition={{ duration: 0.8, type: "spring" }}
           className="mx-auto w-[90%] max-w-[600px] drop-shadow-[0_0_20px_rgba(0,212,255,0.3)] mb-4"
        >
          <img src="/horizontal-logo.png" alt="AutoMotive Buddy" className="w-full h-auto object-contain mix-blend-screen" />
        </motion.div>
        
        <div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/80">
             <span className="px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(0,212,255,0.1)]">Neural AI Diagnostics</span>
             <span className="px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(0,212,255,0.1)]">500+ DTC Support</span>
             <span className="px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(0,212,255,0.1)]">Offline & Online Modes</span>
             <span className="px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(0,212,255,0.1)]">Wiring & Relays</span>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnter} 
          className="btn-primary py-4 px-10 text-sm sm:text-base tracking-[0.2em] font-bold shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_50px_rgba(0,212,255,0.6)] w-full sm:w-auto mt-4 transition-all duration-300"
        >
          ENTER DIAGNOSTIC MATRIX
        </motion.button>

        {/* Credentials / Creator Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center gap-4 w-full"
        >
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-brand/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-brand/0 via-brand/10 to-brand/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative">
                <div className="absolute inset-0 bg-brand blur-md opacity-40 rounded-full" />
                <img src={adminAvatar} alt="Ruben Llego" className="w-14 h-14 rounded-full border-2 border-brand relative z-10 object-cover" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-0.5 group-hover:text-brand transition-colors">Ruben Llego O.</h3>
                <p className="text-[10px] text-brand uppercase tracking-widest font-bold">Owner & Lead Web Developer</p>
                <div className="flex items-center gap-2 mt-1">
                  <Wrench size={10} className="text-text-muted" />
                  <p className="text-[9px] text-text-muted uppercase tracking-widest font-medium">
                     Certified AI Specialist
                  </p>
                </div>
              </div>
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

const NavItem = ({ icon: Icon, label, active, collapsed, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`sidebar-nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''} group relative`}
    title={collapsed ? label : ''}
  >
    <Icon size={18} className={`shrink-0 ${active ? 'text-brand' : 'text-text-secondary group-hover:text-text-primary'}`} />
    {!collapsed && <span className="font-sans font-medium whitespace-nowrap overflow-hidden transition-all duration-200">{label}</span>}
    
    {collapsed && (
      <div className="fixed left-[90px] bg-sidebar-bg border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] shadow-xl">
        {label}
      </div>
    )}
  </button>
);

// --- Sub-Tabs ---

function ProfileTab({ user, store, onUpdateAvatar }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div className="glass-panel p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <UserAvatar user={user} size="xl" onUpdate={onUpdateAvatar} className="w-32 h-32 md:w-48 md:h-48 border-4 border-brand shadow-[0_0_30px_rgba(0, 212, 255,0.3)]" />
        <div className="flex-1 flex flex-col items-center md:items-start w-full">
          <div className="flex flex-col items-center md:items-start gap-4 mb-6 w-full">
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight">{user.fullName}</h2>
            <div className="w-full">
              <div className="border border-white/20 rounded-full py-2 px-4 shadow-[0_0_15px_rgba(0,212,255,0.2)] text-center w-full bg-white/5 backdrop-blur-md">
                <span className="font-accent font-bold tracking-[0.2em] uppercase text-white shadow-brand">
                  {user.role.toUpperCase() === 'ADMIN' ? 'DEVELOPER / OWNER' : `${user.role.toUpperCase()} LEVEL 01`}
                </span>
              </div>
            </div>
          </div>
          <p className="text-text-secondary uppercase text-xs tracking-widest mb-6 text-center md:text-left w-full">Neural Access Credential:<br className="md:hidden"/> <span className="text-brand font-accent mt-1 block md:inline">{user.id}</span></p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="px-4 py-2 bg-white/5 border border-border-glass rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="text-text-secondary">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}
            </div>
            <div className="px-4 py-2 bg-white/5 border border-border-glass rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <span className="text-text-secondary">Status:</span> <span className="text-green-400">{user.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest border-b border-border-glass pb-4 flex items-center gap-2">
             <Shield size={16} className="text-brand" /> Security Protocols
          </h3>
          <div className="space-y-4">
             <div>
               <label className="text-[9px] uppercase font-bold text-text-secondary tracking-widest mb-2 block">Matrix Email</label>
               <div className="p-3 bg-black/40 border border-border-glass rounded text-xs select-none opacity-60">ADMIN_ENCRYPTED_LOG</div>
             </div>
             <div>
               <label className="text-[9px] uppercase font-bold text-text-secondary tracking-widest mb-2 block">Credential Access</label>
               <button className="btn-secondary w-full py-3 text-[10px] font-bold">REGENERATE NEURAL KEY</button>
             </div>
          </div>
        </div>

        <div className="glass-panel space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest border-b border-border-glass pb-4 flex items-center gap-2">
             <Activity size={16} className="text-brand" /> Recent Telemetry
          </h3>
          <div className="space-y-3">
             {store.logs.filter((l: any) => l.username === user.username).slice(0, 3).map((l: any) => (
               <div key={l.id} className="flex gap-3 items-center text-[10px] border-b border-white/5 pb-2 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <div className="flex-1 text-text-primary uppercase tracking-tight">{l.action}</div>
                  <div className="text-text-secondary font-accent">{new Date(l.timestamp).toLocaleDateString()}</div>
               </div>
             ))}
             {store.logs.filter((l: any) => l.username === user.username).length === 0 && (
               <div className="text-center py-8 opacity-30 text-[10px] uppercase font-bold tracking-widest italic">No telemetry recorded</div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OverviewTab({ user, store }: any) {
  return <EnhancedDashboard user={user} store={store} />;
}

function StatItem({ label, value }: any) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function GlobalVehicleSelector() {
  const { make, model, year, engine, setVehicle } = useVehicleStore();

  const selectedMfr = vehicleDatabase.manufacturers.find(m => m.name.toLowerCase() === (make || '').toLowerCase());
  const selectedMod = selectedMfr?.models.find(m => m.name.toLowerCase() === (model || '').toLowerCase());

  return (
    <div className="glass-panel border-brand/20 bg-brand/5 p-6 md:p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Car size={24} className="text-brand" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">PHASE 1: DYNAMIC MATRIX SELECTOR</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="space-y-2">
          <label className="text-[9px] uppercase font-bold text-text-secondary tracking-widest block ml-1">Manufacturer</label>
          <input 
            list="makes"
            value={make}
            onChange={(e) => setVehicle({ make: e.target.value, model: '', year: '', engine: '' })}
            placeholder="e.g. Ford, Toyota..."
            className="input-field w-full bg-black/40"
          />
          <datalist id="makes">
            {vehicleDatabase.manufacturers.map(mfr => (
              <option key={mfr.id} value={mfr.name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase font-bold text-text-secondary tracking-widest block ml-1">Model</label>
          <input 
            list="models"
            value={model}
            onChange={(e) => setVehicle({ model: e.target.value, year: '', engine: '' })}
            placeholder="e.g. F-150, Hilux..."
            className="input-field w-full bg-black/40"
            disabled={!make}
          />
          <datalist id="models">
            {selectedMfr?.models.map(mdl => (
              <option key={mdl.id} value={mdl.name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase font-bold text-text-secondary tracking-widest block ml-1">Year</label>
          <input 
            list="years"
            type="number"
            value={year}
            onChange={(e) => setVehicle({ year: e.target.value })}
            placeholder="e.g. 2023"
            className="input-field w-full bg-black/40"
            disabled={!model}
          />
          <datalist id="years">
            {selectedMod?.years.map(yr => (
              <option key={yr} value={yr} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase font-bold text-text-secondary tracking-widest block ml-1">Engine Configuration</label>
          <input 
            list="engines"
            value={engine}
            onChange={(e) => setVehicle({ engine: e.target.value })}
            placeholder="e.g. 3.5L V6, 2.0L Diesel..."
            className="input-field w-full bg-black/40"
             disabled={!model}
          />
          <datalist id="engines">
            {(selectedMod?.engines || []).map(eng => (
              <option key={eng} value={eng} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/5 border border-brand/20 rounded-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand shrink-0">
           <Shield size={24} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-text-primary mb-1 uppercase">
            {make || 'UNKNOWN'} {model} — {year || 'ANY'} SERIES
          </div>
          <div className="text-[10px] text-text-secondary uppercase tracking-widest">
            DEPLOYED POWERPLANT: <span className="text-brand font-accent">{engine || 'ANY IDENTIFIED CONSTRUCT'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DTC Lookup Tool Component ---
function DTCLookupTab({ store, toast, user, ...props }: any) {
  return (
    <div className="max-w-4xl mx-auto -mt-8 md:mt-0">
      <DiagnosticInterface 
        user={user} 
        toast={toast}
        onRunDiagnostics={(data) => {
          store.addSearchHistory({
            userId: user.id,
            query: data.codes,
            type: 'dtc',
            timestamp: new Date().toISOString()
          });
          store.addLog(user.id, user.username, `DTC Search`, `Searched for fault code ${data.codes}`);
        }}
      />
    </div>
  );
}



// --- Wiring Color Coding Tab Component ---
function WiringColorTab({ store, user, toast }: any) {
  const globalVehicle = useVehicleStore();
  const [make, setMake] = useState(globalVehicle.make);
  const [model, setModel] = useState(globalVehicle.model);
  const [year, setYear] = useState(globalVehicle.year);
  const [engine, setEngine] = useState(globalVehicle.engine);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedMfr = vehicleDatabase.manufacturers.find(m => m.name.toLowerCase() === (make || '').toLowerCase());
  const selectedMod = selectedMfr?.models.find(m => m.name.toLowerCase() === (model || '').toLowerCase());

  const handleSearch = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const prompt = `Provide standardized wiring color codes for ${make} ${model} ${year} ${engine}. Focus on common circuits (e.g., Ground, Ignition, Constant Power, CAN Bus). Format as JSON: { "circuits": [{"intent": "e.g. Ground", "color": "e.g. Black", "note": "Commonly connects to chassis"} ] }`;
      const data = await generateDynamicVehicleData('wiring', make, model, year, prompt);
      
      let parsedData;
      try {
          if (typeof data === 'string' && data.includes("### DATA TEMPORARILY UNAVAILABLE")) {
             throw new Error(data);
          }
          let cleanedData = data;
          if (typeof data === 'string') {
            const match = data.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
              cleanedData = match[1];
            } else {
              const start = data.indexOf('{');
              const end = data.lastIndexOf('}');
              if (start !== -1 && end !== -1 && end > start) {
                cleanedData = data.substring(start, end + 1);
              }
            }
          }
          parsedData = typeof cleanedData === 'string' ? JSON.parse(cleanedData) : cleanedData;
      } catch (parseErr) {
          console.error("Failed to parse AI JSON or received error message:", parseErr, data);
          throw new Error(data && typeof data === 'string' && data.includes("###") ? data : "Received malformed data from AI.");
      }
      setResult(parsedData);
    } catch(err: any) {
      if (toast) toast(err.message || 'Failed to retrieve wiring data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto -mt-8 md:mt-0 pt-4">
      <div className="w-full mx-auto min-h-[80vh] flex flex-col font-sans text-white pb-12 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-full h-[40%] bg-brand/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-[-5%] right-[-10%] w-full h-[30%] bg-brand-dark/5 blur-[100px] rounded-full -z-10" />

        {/* Header */}
        <header className="px-6 pb-2 md:pb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 flex justify-center w-full">
            <h2 className="text-xl md:text-2xl font-bold font-display tracking-widest text-center uppercase relative">
              <span className="text-brand">Wiring</span> Color Coding
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand/50 rounded-full" />
            </h2>
          </div>
        </header>

        <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
             <div className="md:col-span-2">
               <div className="diag-card group">
                 {/* Accent Top Line */}
                 <div className="absolute top-0 left-0 w-full h-[2px] overflow-hidden">
                   <div className="w-1/3 h-full bg-brand animate-[shimmer_infinite_3s] opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Make</label>
                        <input className="diag-input" list="wiring-makes" placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
                        <datalist id="wiring-makes">
                          {vehicleDatabase.manufacturers.map(mfr => (
                            <option key={mfr.id} value={mfr.name} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Model</label>
                        <input className="diag-input" list="wiring-models" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
                        <datalist id="wiring-models">
                          {selectedMfr?.models.map(mdl => (
                            <option key={mdl.id} value={mdl.name} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Year</label>
                        <input className="diag-input" list="wiring-years" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
                        <datalist id="wiring-years">
                          {selectedMod?.years.map(yr => (
                            <option key={yr} value={yr} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Engine</label>
                        <input className="diag-input" list="wiring-engines" placeholder="Engine" value={engine} onChange={(e) => setEngine(e.target.value)} />
                        <datalist id="wiring-engines">
                          {(selectedMod?.engines || []).map(eng => (
                            <option key={eng} value={eng} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <button 
                          onClick={handleSearch}
                          disabled={isLoading}
                          className="diag-primary-btn group mt-4 w-full"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Cable size={16} />}
                      {isLoading ? "RETRIEVING CODES..." : "ANALYZE CIRCUIT INTENT"}
                      {!isLoading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform ml-auto" />}
                    </button>
                 </div>
               </div>
             </div>
             
             <div className="md:col-span-3">
               {result ? (
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-3"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.circuits?.map((c: any, i: number) => (
                          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:border-brand/30 transition-colors">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[10px] uppercase font-bold shadow-inner bg-zinc-900 border border-zinc-800 shrink-0" style={{color: c.color?.toLowerCase() === 'black' ? 'white' : 'black', backgroundColor: c.color?.toLowerCase() === 'black' ? '#222' : c.color?.toLowerCase() || 'gray'}}>
                                  {c.color}
                              </div>
                              <div className="flex-1">
                                  <div className="text-sm font-bold text-white">{c.intent}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{c.note}</div>
                              </div>
                          </div>
                      ))}
                    </div>
                </motion.div>
               ) : (
                <div className="diag-card h-full min-h-[250px] flex items-center justify-center text-center">
                    <div className="flex flex-col items-center">
                      {isLoading ? (
                        <>
                          <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
                          <h3 className="text-sm font-bold text-brand uppercase tracking-widest animate-pulse">Scanning Blueprint...</h3>
                        </>
                      ) : (
                        <>
                          <Cable size={32} className="text-zinc-600 mb-4" />
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Wiring Data Ready</h3>
                          <p className="text-[10px] text-zinc-600 max-w-[200px] mt-2 uppercase tracking-wide leading-relaxed">Enter vehicle details and analyze circuit intent to load standardized wiring color references.</p>
                        </>
                      )}
                    </div>
                </div>
               )}
             </div>
           </div>
        </main>
      </div>
    </div>
  );
}

// --- Fuse & Relay Tab Component ---
function FuseRelayTab({ store, user, toast }: any) {
  const globalVehicle = useVehicleStore();
  const [make, setMake] = useState(globalVehicle.make);
  const [model, setModel] = useState(globalVehicle.model);
  const [year, setYear] = useState(globalVehicle.year);
  const [engine, setEngine] = useState(globalVehicle.engine);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const selectedMfr = vehicleDatabase.manufacturers.find(m => m.name.toLowerCase() === (make || '').toLowerCase());
  const selectedMod = selectedMfr?.models.find(m => m.name.toLowerCase() === (model || '').toLowerCase());

  const categories = ['Engine Bay', 'Interior Cabin', 'Lighting', 'Power Distribution', 'Ignition/Starting'];

  const handleSearch = async (category: string) => {
    setIsLoading(true);
    setResult(null);
    setActiveCategory(category);
    try {
      const prompt = `Provide fuses and relays information for ${make} ${model} ${year} ${engine}. 
      Focus on category: ${category}. 
      Format as JSON: { "fuses": [{"id": "Fuse #", "amperage": "A", "color": "Color", "circuit": "Circuit"}], "relays": [{"id": "Relay #", "function": "Function"}] }`;
      
      const data = await generateDynamicVehicleData('fuses', make, model, year, prompt);
      
      let parsedData;
      try {
          if (typeof data === 'string' && data.includes("### DATA TEMPORARILY UNAVAILABLE")) {
             throw new Error(data);
          }
          let cleanedData = data;
          if (typeof data === 'string') {
            const match = data.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
              cleanedData = match[1];
            } else {
              const start = data.indexOf('{');
              const end = data.lastIndexOf('}');
              if (start !== -1 && end !== -1 && end > start) {
                cleanedData = data.substring(start, end + 1);
              }
            }
          }
          parsedData = typeof cleanedData === 'string' ? JSON.parse(cleanedData) : cleanedData;
      } catch (parseErr) {
          console.error("Failed to parse AI JSON or received error message:", parseErr, data);
          throw new Error(data && typeof data === 'string' && data.includes("###") ? data : "Received malformed data from AI.");
      }
      setResult(parsedData);
    } catch(err: any) {
      if (toast) toast(err.message || 'Failed to retrieve fuse/relay data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto -mt-8 md:mt-0">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col font-sans text-white pb-24 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-full h-[40%] bg-purple-600/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-[-5%] right-[-10%] w-full h-[30%] bg-purple-900/5 blur-[100px] rounded-full -z-10" />

        {/* Header */}
        <header className="p-6 pb-2 md:pb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 flex justify-center w-full">
            <h2 className="text-xl font-bold font-display tracking-widest text-center uppercase relative">
              <span className="text-purple-500">Fuses</span> & Relays
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-purple-500/50 rounded-full" />
            </h2>
          </div>
        </header>

        <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar space-y-6">
           <div className="diag-card group">
             {/* Accent Top Line */}
             <div className="absolute top-0 left-0 w-full h-[2px] overflow-hidden">
               <div className="w-1/3 h-full bg-purple-500 animate-[shimmer_infinite_3s] opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
             
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Make</label>
                    <input className="diag-input" list="fuses-makes" placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
                    <datalist id="fuses-makes">
                      {vehicleDatabase.manufacturers.map(mfr => (
                        <option key={mfr.id} value={mfr.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Model</label>
                    <input className="diag-input" list="fuses-models" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
                    <datalist id="fuses-models">
                      {selectedMfr?.models.map(mdl => (
                        <option key={mdl.id} value={mdl.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Year</label>
                    <input className="diag-input" list="fuses-years" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
                    <datalist id="fuses-years">
                      {selectedMod?.years.map(yr => (
                        <option key={yr} value={yr} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Engine</label>
                    <input className="diag-input" list="fuses-engines" placeholder="Engine" value={engine} onChange={(e) => setEngine(e.target.value)} />
                    <datalist id="fuses-engines">
                      {(selectedMod?.engines || []).map(eng => (
                        <option key={eng} value={eng} />
                      ))}
                    </datalist>
                  </div>
                </div>
             </div>
           </div>

           <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Systems</h3>
             <div className="grid grid-cols-2 gap-2">
               {categories.map((cat) => (
                   <motion.button 
                     key={cat}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleSearch(cat)}
                     disabled={isLoading}
                     className={`px-3 py-3 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-start gap-2 shadow-sm border ${activeCategory === cat ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                   >
                     {isLoading && activeCategory === cat ? <Loader2 className="animate-spin shrink-0 text-purple-300" size={14} /> : <Zap size={14} className={activeCategory === cat ? 'text-purple-300' : 'text-zinc-600'} />}
                     <span className="truncate">{cat}</span>
                   </motion.button>
               ))}
             </div>
           </div>
           
           <AnimatePresence mode="wait">
             {result ? (
              <motion.div 
                 key="results"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="space-y-6"
              >
                  {result.fuses && result.fuses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1 flex items-center gap-2">
                        <Zap size={10} className="text-purple-500" />
                        Relevant Fuses
                      </h3>
                      {result.fuses.map((f: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 hover:border-purple-500/30 transition-colors">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xs uppercase font-bold shadow-inner bg-zinc-900 border border-zinc-800 shrink-0" style={{backgroundColor: f.color?.toLowerCase() || 'gray'}}>
                                  {f.amperage}
                              </div>
                              <div className="flex-1">
                                  <div className="text-sm font-bold text-white">{f.id}</div>
                                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{f.circuit}</div>
                              </div>
                          </div>
                      ))}
                    </div>
                  )}
                  {result.relays && result.relays.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1 flex items-center gap-2">
                        <Activity size={10} className="text-blue-500" />
                        Relevant Relays
                      </h3>
                      {result.relays.map((r: any, i: number) => (
                          <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 hover:border-blue-500/30 transition-colors">
                             <div className="text-sm font-bold text-white">{r.id}</div>
                             <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{r.function}</div>
                          </div>
                      ))}
                    </div>
                  )}
              </motion.div>
             ) : !isLoading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="diag-card py-16 text-center flex flex-col items-center"
              >
                  <Zap size={32} className="text-zinc-600 mb-4" />
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Select System</h3>
                  <p className="text-[10px] text-zinc-600 max-w-[200px] mt-2 uppercase tracking-wide leading-relaxed">Select a category above to load fuse block and relay logic maps.</p>
              </motion.div>
             )}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- Dynamic Resource Tab Component ---
function DynamicResourceTab({ type, title, icon: Icon, store, user, toast }: any) {
  const { make, model, year, engine } = useVehicleStore();
  
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [typeCategory, setTypeCategory] = useState<string>('General');
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    store.addLog(user.id, user.username, `AI Data Generation`, `Generated ${type} for ${year} ${make} ${model} [Category: ${typeCategory}]`);

    try {
      // Pass category as extra context
      const promptContext = typeCategory !== 'General' ? ` focus on ${typeCategory}` : '';
      const data = await generateDynamicVehicleData(type, make, model, year, engine + promptContext);
      setResult(data);
    } catch(err: any) {
      if (toast) toast(err.message || 'Failed to retrieve vehicle data module from cloud matrix.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlobalVehicleSelector />
      
      <div className="glass-panel p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Icon size={24} className="text-brand" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">VEHICLE SELECT: {title}</h2>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <select 
                className="input-field bg-white/5 border-white/10"
                value={typeCategory}
                onChange={(e) => setTypeCategory(e.target.value)}
            >
                <option value="General">General/Overview</option>
                <option value="Engine Controls">Engine Controls (ECU)</option>
                <option value="Lighting/Signal">Lighting/Signal</option>
                <option value="Body Controller/Interior">Body Controller/Interior</option>
                <option value="Power Distribution">Power Distribution</option>
            </select>
            <button 
              type="submit"
              disabled={isLoading || !make || !model || !year || !engine} 
              className="btn-primary w-full max-w-sm h-[50px] gap-2"
            >
              <Search size={16} />
              {isLoading ? "Querying..." : "Analyze Diagnostic Matrix"}
            </button>
        </form>
      </div>

      {isLoading && (
        <div className="glass-panel p-12 text-center space-y-4">
           <div className="animate-spin text-brand flex justify-center"><CloudDownload size={32} /></div>
           <p className="text-text-secondary uppercase tracking-[0.2em] text-xs">Querying neural matrix and compiling structural vehicle report</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="glass-panel p-6 md:p-10 space-y-6">
          <div className="border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
             <h3 className="text-lg text-brand font-bold uppercase">{year} {make} {model} - {title}</h3>
             <button onClick={() => {
                store.addSavedItem({
                  userId: user.id,
                  type: 'Article (AI)',
                  itemId: `${type}-${year}-${model}`,
                  title: `${year} ${make} ${model} - ${title}`
                });
                if (toast) toast('Report saved to Neural Library', 'success');
             }} className="btn-secondary h-10 px-4 gap-2 text-[10px]">
                <Save size={14} /> SAVE TO LIBRARY
             </button>
          </div>
          <div className="markdown-body text-sm font-sans leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Manual Guide Tool Component ---
function ManualsTab({ store, toast, user, ...props }: any) {
  const [filter, setFilter] = useState<any>({ category: '', make: '', year: '' });
  const [selectedUnit, setSelectedUnit] = useState<VehicleUnit | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedContent, setRetrievedContent] = useState<string[]>([]); // Tracks which units have been "retrieved"
  const resultsRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'specs' | 'service' | 'wiring' | 'fuses' | 'fluids' | 'torque'>('specs');

  const categories = ['Car', 'Heavy Equipment', 'Motorcycle', 'Agriculture', 'Electric', 'All'];
  
  const handleSave = (unit: VehicleUnit) => {
    store.addSavedItem({
      userId: user.id,
      type: 'Vehicle',
      itemId: unit.id,
      title: `${unit.yearRange} ${unit.make} ${unit.model}`
    });
    if (toast) toast('Vehicle Technical Sheet archived to your library', 'success');
  };
  
  const filtered = useMemo(() => {
    return store.units.filter((u: VehicleUnit) => {
      const matchCategory = !filter.category || filter.category === 'All' || u.category === filter.category;
      const searchStr = (filter.make || '').toLowerCase();
      
      const matchSearch = !searchStr || 
        (u.make && u.make.toLowerCase().includes(searchStr)) || 
        (u.model && u.model.toLowerCase().includes(searchStr)) ||
        (u.specs && Object.values(u.specs).some(v => v && String(v).toLowerCase().includes(searchStr))) ||
        (u.commonIssues && u.commonIssues.some(i => i.toLowerCase().includes(searchStr)));
      
      const matchYear = !filter.year || (u.yearRange && (
        u.yearRange.includes(filter.year) || 
        (() => {
          const years = u.yearRange.match(/\d{4}/g);
          if (years && years.length === 2) {
            const start = parseInt(years[0]);
            const end = parseInt(years[1]);
            const target = parseInt(filter.year);
            return target >= start && target <= end;
          }
          return false;
        })()
      ));
      
      return matchCategory && matchSearch && matchYear;
    });
  }, [store.units, filter]);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      if (window.innerWidth < 1024) {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
  };

  const handleRetrieve = (unitId: string) => {
    setIsRetrieving(true);
    setTimeout(() => {
      setIsRetrieving(false);
      setRetrievedContent(prev => [...prev, unitId]);
    }, 2000);
  };

  const RetrievalPlaceholder = ({ unitId, data, children }: { unitId: string, data: any, children: React.ReactNode }) => {
    const hasData = retrievedContent.includes(unitId) || (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0));
    
    if (isRetrieving) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
           <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
           <div className="flex flex-col items-center gap-2">
             <div className="text-[11px] font-accent font-bold text-brand uppercase tracking-[.3em] animate-pulse">Establishing Satellite Link...</div>
             <div className="text-[9px] text-text-secondary uppercase tracking-widest font-medium">Downloading Encrypted Repair Guide</div>
           </div>
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="flex flex-col items-center justify-center py-24 glass-panel border-dashed bg-black/20">
           <CloudDownload size={48} className="text-text-secondary/20 mb-6" />
           <h4 className="text-sm font-display font-bold text-text-primary uppercase tracking-widest mb-2">Extended Database Record</h4>
           <p className="text-[10px] text-text-secondary uppercase tracking-[.2em] mb-8 max-w-xs text-center leading-relaxed">
             This unit's full technical database is stored in our high-density cloud. Activate retrieval protocol to download.
           </p>
           <button 
             onClick={() => handleRetrieve(unitId)}
             className="btn-primary px-8 py-4 flex items-center gap-3 text-[10px] shadow-[0_0_20px_rgba(0, 212, 255,0.3)]"
           >
             <Zap size={16} /> ACTIVATE RETRIEVAL PROTOCOL
           </button>
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Category Selectors using new Panel style */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilter({ ...filter, category: filter.category === cat ? '' : cat })}
            className={`glass-panel flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 transition-all cursor-pointer ${filter.category === cat ? 'border-brand bg-brand/10 shadow-[0_0_20px_rgba(0, 212, 255,0.15)]' : 'hover:bg-white/5'}`}
          >
            <div className={`p-2 rounded-lg ${filter.category === cat ? 'bg-brand text-white' : 'bg-white/5 text-text-secondary'}`}>
              {cat === 'Car' && <Car size={20} />}
              {cat === 'Heavy Equipment' && <Truck size={20} />}
              {cat === 'Motorcycle' && <Bike size={20} />}
              {cat === 'Agriculture' && <Tractor size={20} />}
              {cat === 'Electric' && <Zap size={20} />}
            </div>
            <span className="font-display font-semibold text-[10px] md:text-[11px] uppercase tracking-widest text-center">{cat}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6 md:gap-8">
        <div className="space-y-6" ref={resultsRef}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {isSearching ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="glass-panel h-[160px] animate-pulse border-white/5 bg-white/5" />
              ))
            ) : filtered.length > 0 ? filtered.map((u: VehicleUnit) => (
              <motion.div 
                layoutId={u.id}
                key={u.id} 
                className="glass-panel group hover:border-brand/50 transition-all cursor-pointer p-0 overflow-hidden"
                onClick={() => setSelectedUnit(u)}
              >
                <div className="p-5 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-[9px] md:text-[10px] font-accent font-bold text-brand uppercase truncate">{u.yearRange} {u.make}</div>
                        <span className="px-1.5 py-0.5 bg-white/10 rounded text-[7px] text-text-secondary uppercase font-bold">{u.category}</span>
                      </div>
                      <div className="text-lg md:text-xl font-display font-bold text-text-primary uppercase tracking-tight truncate">{u.model}</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg shrink-0"><ChevronRight size={16} className="text-text-secondary group-hover:text-brand group-hover:translate-x-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-black/20 p-2 rounded border border-border-glass">
                      <div className="text-[7px] md:text-[8px] text-text-secondary uppercase font-bold">Engine</div>
                      <div className="text-[9px] md:text-[10px] text-text-primary uppercase font-accent truncate">{u.specs.Engine || u.specs['Engine Type'] || 'N/A'}</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded border border-border-glass">
                      <div className="text-[7px] md:text-[8px] text-text-secondary uppercase font-bold">Category</div>
                      <div className="text-[9px] md:text-[10px] text-text-primary uppercase font-accent truncate">{u.category}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 px-6 py-2.5 border-t border-border-glass flex justify-between items-center group-hover:bg-brand/10">
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-text-secondary group-hover:text-brand">Access Catalog</span>
                  <BookOpen size={12} className="text-text-secondary group-hover:text-brand" />
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 glass-panel border-dashed text-center">
                <Search size={32} className="mx-auto mb-4 opacity-20 text-text-secondary" />
                <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">No units found matching "{filter.make}"</div>
                <p className="text-[9px] text-text-muted mt-2">Try adjusting your filters or category selection</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6 order-first lg:order-last">
          <div className="glass-panel sticky top-4">
            <h4 className="text-[10px] md:text-[11px] uppercase font-bold tracking-widest text-text-primary mb-6 flex items-center gap-2">
              <Filter size={14} className="text-brand" /> 
              FILTER CATALOG
            </h4>
            <div className="space-y-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] uppercase font-bold text-text-secondary ml-1">MANUFACTURER</label>
                <div className="relative">
                   <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                   <input 
                     type="text" 
                     list="manual-brand-suggestions"
                     className="input-field pl-10 h-[48px] text-xs font-medium" 
                     placeholder="E.g. Honda, Toyota..." 
                     value={filter.make} 
                     onChange={e => setFilter({ ...filter, make: e.target.value })} 
                   />
                   <datalist id="manual-brand-suggestions">
                     {store.units.map((u: any) => u.make).filter((v: any, i: any, a: any) => a.indexOf(v) === i).map((brand: string) => (
                       <option key={brand} value={brand} />
                     ))}
                   </datalist>
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] uppercase font-bold text-text-secondary ml-1">PRODUCTION YEAR</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select 
                    className="input-field pl-10 h-[48px] text-xs px-2 appearance-none font-medium w-full bg-[#0A1224]"
                    value={filter.year}
                    onChange={e => setFilter({...filter, year: e.target.value})}
                  >
                    <option value="">All Models</option>
                    <option value="2024">2024 Release</option>
                    <option value="2023">2023 Release</option>
                    <option value="2022">2022 Release</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
              <button onClick={handleSearch} className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50" disabled={isSearching}>
                {isSearching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                {isSearching ? 'EXECUTING...' : 'EXECUTE SEARCH'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel w-full max-w-5xl h-[90vh] flex flex-col p-0 relative overflow-y-auto md:overflow-hidden bg-[#0a0e1a] border-brand/30">
              <div className="flex-none md:flex-1 flex flex-col md:flex-row min-h-full md:min-h-0">
                {/* Left Sidebar Info */}
                <div className="flex-none md:w-72 bg-black/40 border-b md:border-b-0 md:border-r border-border-glass p-6 md:p-8 flex flex-col">
                  <button onClick={() => setSelectedUnit(null)} className="md:hidden absolute top-4 right-4 text-text-secondary z-10"><X size={20} /></button>
                  
                  <div className="w-14 h-14 bg-brand/20 rounded-xl flex items-center justify-center mb-6 border border-brand/30">
                    <Wrench className="text-brand" size={28} />
                  </div>
                  
                  <div className="mb-8">
                    <div className="text-[10px] font-accent font-bold text-brand uppercase tracking-[0.2em] mb-1">{selectedUnit.category} UNIT</div>
                    <h3 className="text-2xl font-display font-bold text-white uppercase leading-tight">{selectedUnit.make} {selectedUnit.model}</h3>
                    <div className="text-xs font-bold text-text-secondary mt-1">{selectedUnit.yearRange} PRODUCTION</div>
                  </div>

                  <div className="flex-none md:flex-1 space-y-2 overflow-y-auto">
                    {[
                      { id: 'specs', label: 'Tech Specs', icon: <Cpu size={16} /> },
                      { id: 'service', label: 'Service Manual', icon: <ToolIcon size={16} /> },
                      { id: 'wiring', label: 'Wiring Diagrams', icon: <Activity size={16} /> },
                      { id: 'fluids', label: 'Fluids & Caps', icon: <Globe size={16} /> },
                      { id: 'torque', label: 'Torque Specs', icon: <Settings size={16} /> },
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-white/5'}`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                    <button 
                      onClick={() => handleSave(selectedUnit)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all text-text-secondary hover:bg-star/10 hover:text-brand border border-dashed border-white/10 mt-4"
                    >
                      <Star size={16} /> SAVE TO LIBRARY
                    </button>
                  </div>

                  <button className="mt-8 btn-primary w-full text-[10px] py-4" onClick={() => window.print()}>
                    <Printer size={14} className="mr-2" /> PRINT DATA SHEET
                  </button>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col">
                  <header className="p-6 md:px-10 md:py-8 border-b border-border-glass flex justify-between items-center bg-[#0a0e1a] sticky top-0 z-10">
                    <div className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                      {activeTab === 'specs' && <><Cpu size={16} className="text-brand"/> UNIT SPECIFICATIONS</>}
                      {activeTab === 'service' && <><ToolIcon size={16} className="text-brand"/> STEP-BY-STEP SERVICE GUIDE</>}
                      {activeTab === 'wiring' && <><Activity size={16} className="text-brand"/> ELECTRICAL SCHEMATICS</>}
                      {activeTab === 'fluids' && <><Globe size={16} className="text-brand"/> FLUID SPECIFICATIONS</>}
                      {activeTab === 'torque' && <><Settings size={16} className="text-brand"/> TIGHTENING TORQUE DATA</>}
                    </div>
                    <button onClick={() => setSelectedUnit(null)} className="hidden md:block text-text-secondary hover:text-white transition-colors cursor-pointer"><X size={24} /></button>
                  </header>

                  <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    {activeTab === 'specs' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.specs}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(selectedUnit.specs || {}).map(([key, val]) => (
                            <div key={key} className="glass-panel p-5 border-white/5">
                              <div className="text-[9px] uppercase font-bold text-text-secondary tracking-widest mb-1">{key}</div>
                              <div className="text-base font-accent font-bold text-text-primary uppercase">{val as string}</div>
                            </div>
                          ))}
                        </div>
                      </RetrievalPlaceholder>
                    )}

                    {activeTab === 'service' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.serviceManual}>
                        <div className="space-y-8">
                          {(Array.isArray(selectedUnit.serviceManual) ? selectedUnit.serviceManual : []).map((chap: any, idx: number) => (
                            <div key={idx} className="space-y-4">
                              <h4 className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[10px]">{idx + 1}</span>
                                {chap.title}
                              </h4>
                              <div className="space-y-3 pl-8">
                                {(Array.isArray(chap.steps) ? chap.steps : []).map((step: string, sIdx: number) => (
                                  <div key={sIdx} className="flex gap-3 text-xs text-text-secondary group">
                                    <span className="text-brand font-bold font-accent">•</span>
                                    <span className="group-hover:text-text-primary transition-colors">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </RetrievalPlaceholder>
                    )}

                    {activeTab === 'wiring' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.wiringDiagrams}>
                        <div className="space-y-6">
                          {(Array.isArray(selectedUnit.wiringDiagrams) ? selectedUnit.wiringDiagrams : []).map((diagram: any) => (
                            <div key={diagram.id} className="glass-panel p-6 border-white/5 bg-black/40">
                              <div className="flex justify-between items-center mb-4">
                                <h5 className="text-xs font-bold text-text-primary uppercase tracking-tight">{diagram.system}</h5>
                                <span className="text-[8px] font-accent text-text-secondary uppercase">{diagram.description}</span>
                              </div>
                              <pre className="bg-black/60 p-4 font-mono text-[10px] text-green-400/80 border border-white/5 rounded overflow-x-auto">
                                {diagram.content}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </RetrievalPlaceholder>
                    )}

                    {activeTab === 'fluids' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.fluids}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(Array.isArray(selectedUnit.fluids) ? selectedUnit.fluids : []).map((fluid: any, idx: number) => (
                            <motion.div 
                              key={idx} 
                              className="glass-panel p-6 bg-black/20 hover:bg-black/30 transition-all hover:border-brand/30"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                            >
                              <h6 className="text-[10px] font-bold text-brand uppercase mb-3 tracking-widest">{fluid.name}</h6>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
                                  <span className="text-text-secondary uppercase">Spec</span>
                                  <span className="text-text-primary font-accent uppercase font-bold">{fluid.spec}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
                                  <span className="text-text-secondary uppercase">Capacity</span>
                                  <span className="text-text-primary font-accent font-bold">{fluid.capacity}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-text-secondary uppercase">Interval</span>
                                  <span className="text-text-primary font-accent font-bold uppercase">{fluid.interval}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </RetrievalPlaceholder>
                    )}

                    {activeTab === 'torque' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.torqueSpecs}>
                        <div className="glass-panel p-0 overflow-hidden">
                          <table className="w-full text-left text-[10px]">
                            <thead className="bg-white/5 text-text-secondary uppercase font-accent">
                              <tr>
                                <th className="p-4">Component</th>
                                <th className="p-4">N.m</th>
                                <th className="p-4">Ft-Lb</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-accent">
                              {(Array.isArray(selectedUnit.torqueSpecs) ? selectedUnit.torqueSpecs : []).map((t: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/2">
                                  <td className="p-4 text-text-primary uppercase font-bold">{t.component}</td>
                                  <td className="p-4 text-brand font-bold">{t.nm} Nm</td>
                                  <td className="p-4 text-text-secondary">{t.ftlb} Ft-Lb</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </RetrievalPlaceholder>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Admin and Core Management Components ---

function AIChatTab({ user, store, ...props }: any) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { make, model, year, engine } = useVehicleStore();

  const myMessages = store.chatLogs.filter((m: any) => m.userId === user.id);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [myMessages, loading]);

  const send = async (e?: any) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    store.addChatMessage(user.id, 'user', userText);
    setLoading(true);

    try {
      const resp = await askAutomotiveAssistant(userText, { make, model, year, engine });
      store.addChatMessage(user.id, 'ai', resp);
      if (autoSpeak) speakText(resp, true);
    } catch (err: any) {
      const errMsg = `Uplink synchronization failure: ${err?.message?.includes('404') ? 'Model Mismatch' : 'Network Interruption'}. Attempting local diagnostic fallback...`;
      store.addChatMessage(user.id, 'ai', errMsg);
      if (autoSpeak) speakText(errMsg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] lg:h-[600px] max-w-4xl mx-auto glass-panel overflow-hidden p-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
        {myMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-12 opacity-40">
            <Cpu size={48} className="text-brand mb-6" />
            <h4 className="text-base md:text-lg font-display font-bold mb-2 text-text-primary uppercase tracking-tight">Neural Matrix Standby</h4>
            <p className="text-[9px] md:text-xs uppercase tracking-widest max-w-xs text-text-secondary">AI Assistant ready for mechanical diagnostics, code analysis, and maintenance guidance.</p>
          </div>
        )}
        {myMessages.map((m: any) => (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[80%] flex gap-3 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'user' ? (
                <UserAvatar user={user} size="sm" className="w-7 h-7 md:w-8 md:h-8 border-brand" />
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 font-bold border border-blue-500/30 text-blue-400 bg-blue-500/20 text-[10px] md:text-xs font-accent">
                   AI
                </div>
              )}
              <div className={`p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand/10 border border-brand/20 text-white rounded-tr-none' : 'bg-white/5 border border-border-glass text-text-primary rounded-tl-none'}`}>
                {m.content}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="text-[9px] text-blue-400 font-accent animate-pulse uppercase tracking-[0.3em] px-4 md:px-8">Processing...</div>
          </div>
        )}
      </div>
      <div className="p-4 md:p-6 border-t border-border-glass bg-white/5">
        <form onSubmit={send} className="relative">
          <input 
            type="text" 
            placeholder="QUERY VEHICLE SYSTEM..." 
            className="input-field pr-32 h-[50px] md:h-[56px] text-xs font-accent uppercase tracking-widest" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            disabled={loading} 
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => {
                setAutoSpeak(!autoSpeak);
                if (autoSpeak) window.speechSynthesis.cancel();
              }}
              title={autoSpeak ? "Voice Response ON" : "Voice Response OFF"}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors ${autoSpeak ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-text-muted hover:text-white'}`}
            >
              {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button type="submit" disabled={!input.trim() || loading} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-brand text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

function MembersTab({ user, store, toast, ...props }: any) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uDocs: UserType[] = [];
      snapshot.forEach(d => uDocs.push(d.data() as UserType));
      setUsers(uDocs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
    return () => unsubscribe();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPass || !newUserName) return;
    setIsCreatingUser(true);
    try {
       const { createAdminUser } = await import('./lib/firebase');
       const { serverTimestamp, setDoc, doc } = await import('firebase/firestore');
       
       const newUser = await createAdminUser(newUserEmail, newUserPass);
       const d = new Date();
       d.setDate(d.getDate() + 30);
       
       await setDoc(doc(db, 'users', newUser.uid), {
           id: newUser.uid,
           email: newUser.email,
           fullName: newUserName,
           username: newUserName.split(' ').join('').toLowerCase() + Math.random().toString(36).substring(2,5),
           role: 'technician',
           status: 'approved',
           subscription: { plan: 'pro', expiryDate: d.toISOString() },
           createdAt: serverTimestamp(),
           updatedAt: serverTimestamp(),
           avatarUrl: '',
           xp: 0,
           level: 1
       });
       
       toast('User account created and registered successfully.', 'success');
       setIsModalOpen(false);
       setNewUserEmail('');
       setNewUserPass('');
       setNewUserName('');
    } catch (error: any) {
       toast(`Error creating user: ${error.message}`, 'error');
    }
    setIsCreatingUser(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl text-white font-display uppercase tracking-widest">Registry Roster</h2>
          <p className="text-[10px] text-text-secondary font-accent uppercase tracking-widest">Active nodes in the system</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs py-2 group overflow-hidden relative cursor-pointer"
        >
           <span className="relative z-10 flex items-center gap-2">
             <UserPlus size={14} /> Add Account
           </span>
           <div className="absolute inset-0 bg-brand/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-[9px] uppercase font-accent tracking-widest text-text-secondary border-b border-border-glass">
            <tr>
              <th className="p-6">User / Member</th>
              <th className="p-6">Access Status</th>
              <th className="p-6">Subscription</th>
              <th className="p-6">Registered</th>
              <th className="p-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass">
            {users.map((u: UserType) => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} size="sm" className="border-border-glass bg-[#0A1224]" />
                    <div><div className="text-sm font-bold text-text-primary uppercase">{u.fullName}</div><div className="text-[9px] text-text-secondary uppercase">@{u.username}</div></div>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`badge ${u.status === 'approved' ? 'badge-green' : 'animate-pulse'}`}>{u.status}</span>
                </td>
                <td className="p-6">
                  {u.subscription && <div className="text-[10px]"><span className="text-brand font-bold uppercase">{u.subscription.plan}</span><div className="text-[9px] text-text-secondary mt-1 uppercase font-accent">Exp: {new Date(u.subscription.expiryDate).toLocaleDateString()}</div></div>}
                </td>
                <td className="p-6 text-[10px] font-accent text-text-secondary uppercase">{typeof u.createdAt === 'string' ? new Date(u.createdAt).toLocaleDateString() : ((u.createdAt as any)?.toDate?.()?.toLocaleDateString() || 'N/A')}</td>
                <td className="p-6">
                  <div className="flex gap-2">
                    {u.status === 'pending' && (
                      <button 
                        onClick={async () => {
                          try {
                             await setDoc(doc(db, 'users', u.id), { status: 'approved' }, { merge: true });
                             toast(`Member ${u.username} has been approved. Access granted.`, 'success');
                             await setDoc(doc(db, 'logs', Math.random().toString(36).substr(2, 9)), {
                               id: Math.random().toString(36).substr(2, 9),
                               userId: user.id, username: user.username,
                               action: 'Approval', details: `Approved user ${u.fullName} (@${u.username})`,
                               timestamp: new Date().toISOString()
                             });
                          } catch (error) {
                             handleFirestoreError(error, OperationType.UPDATE, `users/${u.id}`);
                          }
                        }} 
                        className="p-2 bg-green-500/20 text-green-500 rounded hover:scale-110 transition-all cursor-pointer"
                        title="Approve Member"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}
                    <button className="p-2 bg-blue-500/20 text-blue-400 rounded hover:scale-110 transition-all cursor-pointer" title="Edit Access"><Edit size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#050A15] border border-border-glass rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-border-glass/30 flex justify-between items-center bg-black/20">
                <h3 className="font-display uppercase tracking-widest text-brand font-bold text-lg">Create System Access</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-secondary hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                 <p className="text-xs text-text-muted mb-6">Manually register a new operative into the system. This avoids logging out of your current session.</p>
                 <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-text-secondary font-accent uppercase tracking-widest block mb-2">Operative Name</label>
                      <input 
                        type="text" 
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="form-input w-full"
                        placeholder="e.g. John Matrix"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-secondary font-accent uppercase tracking-widest block mb-2">System Email</label>
                      <input 
                        type="email" 
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="form-input w-full"
                        placeholder="john.matrix@sector7.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-secondary font-accent uppercase tracking-widest block mb-2">Access Code (Password)</label>
                      <input 
                        type="password" 
                        value={newUserPass}
                        onChange={(e) => setNewUserPass(e.target.value)}
                        className="form-input w-full"
                        placeholder="Enter secure password"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="pt-2">
                       <button
                         type="submit"
                         disabled={isCreatingUser}
                         className="btn-primary w-full py-3"
                       >
                         {isCreatingUser ? "INITIALIZING NODE..." : "GRANT ACCESS"}
                       </button>
                    </div>
                 </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SavedItemsTab({ user, store }: any) {
  const myItems = store.savedItems.filter((i: any) => i.userId === user.id);

  return (
    <div className="space-y-6">
      <div className="glass-panel py-8 text-center border-b-2 border-brand/20">
        <Star className="mx-auto mb-4 text-brand animate-pulse" size={32} />
        <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Saved Neural Records</h2>
        <p className="text-[10px] text-text-secondary uppercase tracking-[0.3em] mt-2">Personal diagnostic archive for quick retrieval</p>
      </div>

      {myItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.map((item: any) => (
            <motion.div 
              layoutId={item.id}
              key={item.id} 
              className="glass-panel group hover:border-brand/50 transition-all p-0 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                    item.type === 'DTC' ? 'bg-red-500/10 text-red-500' : 
                    item.type === 'Vehicle' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {item.type}
                  </div>
                  <button onClick={() => store.removeSavedItem(item.id)} className="text-text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <h4 className="text-base font-display font-bold text-text-primary uppercase tracking-tight mb-2 line-clamp-1">{item.title}</h4>
                <div className="flex items-center gap-2 text-[9px] text-text-secondary uppercase font-accent">
                  <Clock size={10} /> Saved on {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
              <button 
                onClick={() => {
                  if (item.type === 'DTC') window.location.hash = `#dtc?id=${item.itemId}`;
                  else if (item.type === 'Vehicle') window.location.hash = `#manuals?id=${item.itemId}`;
                }}
                className="w-full bg-white/5 py-3 border-t border-border-glass text-[9px] font-bold uppercase tracking-widest text-text-secondary group-hover:text-brand group-hover:bg-brand/10 transition-all"
              >
                Restore Entry Access
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel py-20 text-center opacity-40 border-dashed">
          <Database size={48} className="mx-auto mb-4" />
          <p className="text-[10px] uppercase font-bold tracking-widest">Archive storage empty. Bookmark tools to populate.</p>
        </div>
      )}
    </div>
  );
}

function SearchHistoryTab({ user, store }: any) {
  const myHistory = store.searchHistory.filter((h: any) => h.userId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Search Logs</h2>
          <p className="text-[10px] text-text-secondary uppercase tracking-[0.3em] mt-1">Full audit of your diagnostic inquiries</p>
        </div>
        <button 
          onClick={() => store.clearSearchHistory(user.id)}
          className="text-[9px] font-accent font-bold uppercase tracking-widest text-red-500 hover:underline flex items-center gap-2"
        >
          <Trash2 size={12} /> Clear History
        </button>
      </div>

      <div className="glass-panel p-0 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto divide-y divide-border-glass">
          {myHistory.length > 0 ? myHistory.map((h: any) => (
            <div key={h.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-white/2 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand">
                  {h.type === 'DTC' ? <Search size={18} /> : <BookOpen size={18} />}
                </div>
                <div>
                  <div className="text-xs md:text-sm font-bold text-text-primary uppercase tracking-tight">"{h.query}"</div>
                  <div className="text-[9px] text-text-secondary uppercase tracking-widest font-accent">{h.type} QUERY • {new Date(h.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <button 
                 onClick={() => {
                   if (h.type === 'DTC') window.location.hash = `#dtc?q=${encodeURIComponent(h.query)}`;
                   else window.location.hash = `#manuals?q=${encodeURIComponent(h.query)}`;
                 }}
                 className="text-text-muted hover:text-brand p-2 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )) : (
            <div className="p-20 text-center opacity-40 uppercase text-[10px] font-bold tracking-widest">No previous telemetry found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function GlobalSearchOverlay({ isOpen, onClose, store, user }: any) {
  const [query, setQuery] = useState("");
  
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    
    const dtcMatches = store.dtcs.filter((d: any) => 
      (d.code || '').toLowerCase().includes(q) || 
      (d.description || '').toLowerCase().includes(q) ||
      (Array.isArray(d.symptoms) ? d.symptoms.some((s: string) => s.toLowerCase().includes(q)) : false)
    ).map((d: any) => ({ ...d, gType: 'DTC' }));

    const vehicleMatches = store.units.filter((u: any) => 
      (u.make || '').toLowerCase().includes(q) || 
      (u.model || '').toLowerCase().includes(q) ||
      (u.specs ? Object.values(u.specs).some((v: any) => String(v).toLowerCase().includes(q)) : false)
    ).map((u: any) => ({ ...u, gType: 'Vehicle' }));

    return [...dtcMatches, ...vehicleMatches].slice(0, 10);
  }, [query, store]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-24 p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl glass-panel p-0 overflow-hidden border-brand/40 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
      >
        <div className="p-6 border-b border-border-glass relative">
           <Search size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-brand" />
           <input 
             autoFocus
             type="text" 
             className="w-full bg-transparent pl-16 pr-12 py-4 text-lg font-display uppercase tracking-widest focus:outline-none text-text-primary placeholder-text-muted" 
             placeholder="CROSS-DATABASE INQUIRY..." 
             value={query}
             onChange={e => setQuery(e.target.value)}
           />
           <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto bg-black/40">
           {results.length > 0 ? (
             <div className="divide-y divide-border-glass">
                {results.map((r: any) => (
                  <button 
                    key={r.id} 
                    className="w-full p-6 text-left hover:bg-brand/5 flex items-center justify-between group transition-all"
                    onClick={() => {
                      if (r.gType === 'DTC') window.location.hash = `#dtc?id=${r.id}`;
                      else window.location.hash = `#manuals?id=${r.id}`;
                      store.addSearchHistory({ userId: user.id, type: r.gType, query });
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${r.gType === 'DTC' ? 'border-red-500/30 text-red-500 bg-red-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'}`}>
                          {r.gType === 'DTC' ? <Cpu size={20} /> : <Car size={20} />}
                       </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-accent font-bold text-text-secondary uppercase tracking-[.2em]">{r.gType === 'DTC' ? 'FAULT PROTOCOL' : 'TECHNICAL UNIT'}</span>
                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-[7px] text-text-muted uppercase font-bold">{r.category || (r.gType === 'DTC' ? 'Diagnostics' : 'Vehicle')}</span>
                          </div>
                          <div className="text-base font-display font-bold text-text-primary uppercase group-hover:text-brand transition-colors">
                            {r.gType === 'DTC' ? `${r.code} - ${r.description}` : `${r.make} ${r.model}`}
                          </div>
                       </div>
                    </div>
                    <ArrowRight size={20} className="text-text-muted group-hover:translate-x-1 transition-all group-hover:text-brand" />
                  </button>
                ))}
             </div>
           ) : query ? (
             <div className="p-20 text-center opacity-30 uppercase tracking-[0.5em] font-bold text-[10px]">No Neural Matches Found</div>
           ) : (
             <div className="p-20 text-center opacity-20 uppercase tracking-[0.2em] font-bold text-[11px]">Type to scan the automotive matrix</div>
           )}
        </div>
      </motion.div>
    </div>
  );
}

function LogsTab({ store, ...props }: any) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: any[] = [];
      snapshot.forEach(d => docs.push(d.data()));
      setLogs(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'logs'));
    return () => unsubscribe();
  }, []);

  return (
    <div className="glass-panel max-h-[600px] overflow-y-auto p-0">
      <div className="p-4 border-b border-border-glass bg-white/5 uppercase text-[9px] font-bold tracking-widest text-text-secondary">Protocol Log Feed</div>
      <div className="p-6 space-y-4">
        {logs.map((l: any) => (
          <div key={l.id} className="flex gap-4 items-start border-b border-border-glass/50 pb-4 last:border-0 group">
             <div className="w-1 h-8 bg-brand/50 group-hover:bg-brand transition-colors" />
             <div>
               <div className="flex items-center gap-3 mb-1">
                 <span className="text-[10px] font-accent text-brand font-bold uppercase tracking-widest">{l.action}</span>
                 <span className="text-[9px] text-text-secondary font-accent">{new Date(l.timestamp).toLocaleString()}</span>
               </div>
               <div className="text-xs text-text-primary uppercase tracking-tight mb-1 font-medium">{l.details}</div>
               <div className="text-[10px] text-text-secondary uppercase tracking-widest flex items-center gap-1"><User size={10} /> {l.username}</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
