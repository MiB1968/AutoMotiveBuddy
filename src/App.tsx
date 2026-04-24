/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVehicleStore } from './store/vehicleStore';
import { 
  Wrench, Cpu, Map, History, Star, Shield, 
  ChevronRight, LogOut, LayoutDashboard, Database, 
  MessageSquare, User, Users, Bell, Settings, 
  Plus, Trash2, Edit, CheckCircle2, AlertTriangle, 
  Info, X, Crown, ShieldCheck, Mail, Lock, 
  Zap, Activity, Send, Menu, Filter, Save, Globe, 
  BookOpen, Truck, Tractor, Bike, Car, Download, CloudDownload,
  Calendar, FileText, ChevronDown, Search, ArrowRight,
  Phone, Eye, EyeOff, Check, Heart, Clock, Printer,
  Share2, Wrench as ToolIcon, CreditCard, Award, MousePointer2, Volume2, VolumeX,
  Mic, MicOff
} from 'lucide-react';
import { useStore, User as UserType, DTC, VehicleUnit, SavedItem, SearchHistory, Announcement, ActivityLog, ChatMessage } from './lib/store';
import { vehicleDatabase, fordDTCDatabase, otherMfrDTCs, genericDTCs, komatsuDTCs } from './lib/dtcData';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateDynamicVehicleData, askAutomotiveAssistant, performDeepDTCSearch } from './services/ai';

import api from './services/api';
import HUDPanel from './components/HUDPanel';
import { saveDTCOffline, getDTCOffline, addOfflineLog } from './offline/db';
import { syncData } from './sync/syncEngine';

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
        <Activity size={24} className="text-primary-orange" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">LIVE TELEMETRY STREAM</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HUDPanel>
          <div className="flex flex-col items-center justify-center py-6">
             <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-2">Engine RPM</div>
             <div className="text-5xl md:text-6xl text-primary-orange font-accent font-bold tracking-tighter">
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

function AdminNodeTab() {
  const [logs, setLogs] = useState<{action: string, timestamp: string}[]>([]);

  useEffect(() => {
    api.get("/admin/logs").then((res) => setLogs(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary-orange" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">ADMIN NODE: AUDIT REGISTRY</h2>
      </div>
      
      <HUDPanel className="p-0 overflow-hidden bg-black/40">
        <div className="max-h-[600px] overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="p-4 border-b border-white/5 mx-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="text-sm font-bold text-text-primary uppercase tracking-tight">{log.action}</div>
              <div className="text-[10px] font-accent text-text-secondary">{new Date(log.timestamp).toLocaleString()}</div>
            </div>
          ))}
          {logs.length === 0 && <div className="p-20 text-center opacity-30 uppercase tracking-widest text-[10px] font-bold">No Audit Logs Received</div>}
        </div>
      </HUDPanel>
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
        <BookOpen size={24} className="text-primary-orange" />
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

function UserAvatar({ user, size = "md", className = "" }: { user: any, size?: "xs" | "sm" | "md" | "lg" | "xl", className?: string }) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: "w-6 h-6 text-[8px]",
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-48 h-48 text-4xl"
  };

  const currentSize = sizeClasses[size];

  if (user.avatarUrl && !imageError) {
    return (
      <img 
        src={user.avatarUrl} 
        alt={user.fullName} 
        className={`${currentSize} rounded-full border-2 border-primary-orange bg-[#1e293b] object-cover shrink-0 ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${currentSize} rounded-full border-2 border-primary-orange bg-[#1e293b] flex items-center justify-center font-bold text-white shrink-0 uppercase ${className}`}>
      {user.fullName.charAt(0)}
    </div>
  );
}

const Logo = ({ className = "", size = "normal" }: { className?: string, size?: "small" | "normal" | "large" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className={`
      ${size === 'small' ? 'w-8 h-8' : size === 'large' ? 'w-16 h-16' : 'w-10 h-10'}
      bg-gradient-to-br from-orange to-orange-dark rounded-xl flex items-center justify-center 
      shadow-[0_0_20px_var(--color-orange-glow)] relative overflow-hidden group
    `}>
      <Wrench className={`${size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-8 h-8' : 'w-5 h-5'} text-white z-10`} />
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
    </div>
    <div className="flex flex-col leading-none">
      <span className={`font-display font-bold ${size === 'large' ? 'text-3xl' : size === 'small' ? 'text-lg' : 'text-xl'} tracking-wider text-text-primary`}>
        AUTO<span className="text-orange">MOTIVE</span>
      </span>
      {size !== 'small' && <span className="text-[9px] font-accent text-orange/80 tracking-[0.3em] uppercase">Buddy</span>}
    </div>
  </div>
);

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hash, setHash] = useState(window.location.hash || '#home');
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = sessionStorage.getItem('ab_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [toasts, setToasts] = useState<{ id: string; message: string; type: any }[]>([]);

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

  const login = (user: UserType) => {
    setCurrentUser(user);
    sessionStorage.setItem('ab_session', JSON.stringify(user));
    window.location.hash = user.role === 'admin' ? '#admin-overview' : '#dashboard';
    addToast(`Greetings, ${user.fullName.split(' ')[0]}. Neural link established.`, 'success');
    store.addLog(user.id, user.username, 'Login', 'Encrypted connection initialized');
  };

  const logout = () => {
    if (currentUser) store.addLog(currentUser.id, currentUser.username, 'Logout', 'User session terminated');
    setCurrentUser(null);
    sessionStorage.removeItem('ab_session');
    window.location.hash = '#home';
  };

  // Simplified Router
  const renderContent = () => {
    const h = hash.split('?')[0];

    // Public
    if (h === '#home') return <LandingPage onNavigate={setHash} />;
    if (h === '#login') return <AuthPage mode="login" onLogin={login} onBack={() => window.location.hash = '#home'} store={store} toast={addToast} />;
    if (h === '#register') return <AuthPage mode="register" onLogin={login} onBack={() => window.location.hash = '#home'} store={store} toast={addToast} />;

    // Protected
    if (!currentUser) {
      window.location.hash = '#login';
      return null;
    }

    if (currentUser.role === 'admin') {
      return <AdminDashboard h={h} user={currentUser} store={store} onLogout={logout} toast={addToast} onInstall={handleInstallApp} showInstall={!!deferredPrompt} />;
    }

    return <MemberDashboard h={h} user={currentUser} store={store} onLogout={logout} toast={addToast} onInstall={handleInstallApp} showInstall={!!deferredPrompt} />;
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

function LandingPage({ onNavigate }: { onNavigate: (h: string) => void }) {
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
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-accent font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-orange transition-colors">{item}</a>
          ))}
          <div className="h-4 w-px bg-white/10" />
          <button onClick={() => window.location.hash = '#login'} className="btn-secondary min-h-[40px] px-5">Operator Login</button>
          <button onClick={() => window.location.hash = '#register'} className="btn-primary min-h-[40px] px-5 ripple">Protocol Register</button>
        </div>
        <button className="md:hidden text-orange p-2"><Menu /></button>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        <div className="container max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <div className="mb-4 flex items-center gap-2 justify-center">
              <div className="h-px w-8 bg-orange" />
              <span className="text-[11px] font-accent font-bold text-orange uppercase tracking-[0.5em]">Automotive Intelligence</span>
              <div className="h-px w-8 bg-orange" />
            </div>
            <h1 className="text-5xl md:text-[72px] font-display font-bold leading-[1.05] tracking-tight mb-8">
              DIAGNOSE. REPAIR. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange to-orange-dark">MASTER YOUR VEHICLE.</span>
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
               { label: 'DTC Codes', value: '35+' },
               { label: 'Vehicle Brands', value: '50+' },
               { label: 'Warning Lights', value: '100+' },
               { label: 'Wiring Diagrams', value: 'SVG/Text' },
               { label: 'Fuse Box Guides', value: 'Visual' },
               { label: 'AI Chatbot', value: '24/7' },
               { label: 'Maintenance Guides', value: 'DIY' }
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
          <Car size={800} className="text-orange" strokeWidth={0.5} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative bg-bg-base-end overflow-hidden">
        <div className="diagonal-divider bg-bg-base-start absolute top-0 left-0 w-full h-full -z-10" />
        
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">EVERYTHING YOU NEED. IN ONE PLATFORM.</h2>
            <div className="w-20 h-1 bg-orange mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Database, title: 'OBD2 Fault Codes', desc: 'Full fault code database with symptoms, causes, step-by-step DIY fix guides and estimated repair costs.' },
              { icon: Zap, title: 'Fuse & Relay Diagrams', desc: 'Complete fuse box layouts and relay locations with amp ratings for the engine bay, interior, and trunk.' },
              { icon: Map, title: 'Component Locations', desc: 'Visual finders for OBD ports, specific sensors, filters, and fluid reservoirs across hundreds of vehicles.' },
              { icon: Eye, title: 'Warning Lights Guide', desc: 'Comprehensive visual guide to dashboard warning lights, what they mean, and how to safely reset them.' },
              { icon: Clock, title: 'Maintenance Schedules', desc: 'Factory-recommended service intervals, fluid capacities, and step-by-step guides for routine DIY maintenance.' },
              { icon: Activity, title: 'Electrical Wiring', desc: 'Full electrical system diagrams by model. Visual layouts of starting, charging, and engine control circuits.' },
              { icon: Truck, title: 'Multi-Vehicle Support', desc: 'Extensive coverage for Cars, Motorcycles, Heavy Construction Equipment, and Agricultural machines worldwide.' },
              { icon: MessageSquare, title: 'Voice-Enabled AI Chatbot', desc: 'Advanced 24/7 intelligent automotive assistant to help with troubleshooting, manual lookups, and system navigation.' },
              { icon: Globe, title: 'Community Insights', desc: 'Search real-world repair experiences, known common problems, and verified solutions contributed by our community of owners.' }
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
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-orange/20 group-hover:scale-110 transition-all duration-300">
                  <cat.icon size={32} className="text-orange" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-accent font-bold text-text-primary uppercase tracking-widest">{cat.label}</div>
                  <div className="text-[9px] font-accent text-orange bg-orange/10 rounded-full px-2 py-0.5">{cat.count} Models</div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto items-end">
             <PricingCard 
               title="BASIC" price="1,000" duration="1 Month" icon={Shield} 
               benefits={['Full OBD2 DTC Lookup', 'Fuse & Relay Layouts', 'Dashboard Warning Lights', 'Real-time AI Chatbot', 'Member Community', 'Basic Profile', 'Search History']}
             />
             <PricingCard 
               title="STANDARD" price="3,000" duration="6 Months" icon={Star} active
               benefits={['Everything in Basic', 'Full Maintenance Schedules', 'DIY Step-by-Step Fix Guides', 'Detailed Wiring Diagrams', 'Component Locations', 'Priority AI Support', 'Fluid Capacities']}
             />
             <PricingCard 
               title="PREMIUM" price="5,000" duration="1 Year" icon={Award} featured
               benefits={['Everything in Standard', 'Voice-Enabled AI Assistant', 'Experimental AI Features', 'Bulk Data Export', 'Voucher & Partner Perks', 'Certificate of Completion', 'Best Value Tier']}
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
        <div className="container max-w-4xl mx-auto glass-card flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
           <div className="w-48 h-48 rounded-full border-4 border-orange/20 p-2 shrink-0 shadow-[0_0_40px_var(--color-orange-glow)] relative">
              <div className="w-full h-full rounded-full bg-orange/10 flex items-center justify-center overflow-hidden">
                <UserAvatar user={{ fullName: "Ruben Llego O.", avatarUrl: "/ruben_avatar.jpg" }} size="xl" className="border-none bg-transparent" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-orange text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-bg-card">
                <Award size={20} />
              </div>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-display font-bold">RUBEN LLEGO</h3>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="badge badge-high">OWNER</span>
                  <span className="badge badge-medium">LEAD DEVELOPER</span>
                  <span className="badge badge-low">AUTOMOTIVE EXPERT</span>
                </div>
              </div>
              <p className="text-text-secondary leading-relaxed">
                "Founded and managed by Ruben Llego O., AutoMotive Buddy was built to empower every driver, mechanic, and fleet operator with professional-grade diagnostic and repair tools. Our mission is to democratize automotive intelligence through technology."
              </p>
              <div className="flex gap-6 justify-center md:justify-start pt-4">
                 <a href="#" className="text-text-muted hover:text-orange transition-colors"><Globe size={20} /></a>
                 <a href="#" className="text-text-muted hover:text-orange transition-colors"><Mail size={20} /></a>
                 <a href="#" className="text-text-muted hover:text-orange transition-colors"><Phone size={20} /></a>
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
              <li><a href="#home" className="hover:text-orange transition-colors">Home Terminal</a></li>
              <li><a href="#features" className="hover:text-orange transition-colors">Tool Modules</a></li>
              <li><a href="#pricing" className="hover:text-orange transition-colors">Pricing Protocol</a></li>
              <li><button onClick={() => window.location.hash = '#login'} className="hover:text-orange transition-colors">Auth Access</button></li>
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
      className="glass-card group hover:bg-orange/5 border-white/5 hover:border-orange/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
        <Icon size={24} className="text-orange" />
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
        ${featured ? 'scale-105 z-10 border-orange/40 shadow-[0_20px_60px_rgba(249,115,22,0.2)] bg-orange/5' : 'opacity-90 hover:opacity-100 hover:border-white/20'}
        ${active && !featured ? 'border-blue/40 shadow-[0_15px_40px_rgba(59,130,246,0.15)] bg-blue/5' : ''}
      `}
    >
      {featured && (
        <div className="absolute -top-4 -right-4 bg-orange text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl animate-pulse flex items-center gap-2">
          <Star size={10} fill="currentColor" /> Best Value <Star size={10} fill="currentColor" />
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
          <Icon size={32} className={featured ? 'text-orange' : 'text-text-primary'} />
        </div>
        {active && !featured && <span className="text-[9px] font-accent text-blue uppercase tracking-widest border border-blue/30 px-3 py-1 rounded-full bg-blue/10">Most Popular</span>}
      </div>

      <h3 className="text-2xl font-display font-bold mb-1 tracking-widest">{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-5xl font-accent font-bold text-orange">₱{price}</span>
        <span className="text-text-muted text-xs uppercase font-bold tracking-widest">/ {duration}</span>
      </div>
      
      <div className="w-full h-px bg-gradient-to-r from-orange/50 to-transparent my-8" />

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

function AuthPage({ mode, onLogin, onBack, store, toast, users }: any) {
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', plan: 'Basic', email: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const allUsers = store.users;
      if (mode === 'login') {
        const u = allUsers.find((u: any) => u.username === formData.username && u.password === formData.password);
        if (u) {
          onLogin(u);
        } else {
          setError('Authorization Failed: Invalid Credentials');
          toast('Access Denied: Check username/password', 'error');
        }
      } else {
        const exists = allUsers.find((u: any) => u.username === formData.username);
        if (exists) {
          setError('Registration Failed: ID already in use');
          toast('User ID already exists in the matrix', 'error');
        } else {
          const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            username: formData.username,
            password: formData.password,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: 'member',
            status: 'pending',
            createdAt: new Date().toISOString(),
            subscription: {
              plan: formData.plan,
              startDate: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          };
          store.addUser(newUser);
          toast('Protocol Initialized: Account pending admin approval', 'success');
          window.location.hash = '#login';
        }
      }
      setLoading(false);
    }, 1500);
  };

  const getPassStrength = () => {
    if (!formData.password) return { val: 0, label: 'NONE', color: 'bg-text-muted' };
    if (formData.password.length < 6) return { val: 33, label: 'WEAK', color: 'bg-red' };
    if (formData.password.length < 10) return { val: 66, label: 'FAIR', color: 'bg-yellow' };
    return { val: 100, label: 'STRONG', color: 'bg-green text-shadow-glow' };
  };

  const strength = getPassStrength();

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
               <h2 className="text-3xl font-display font-bold leading-tight">JOIN THE <br /><span className="text-orange">DIAGNOSTIC ELITE</span></h2>
               <div className="space-y-4">
                 {[
                   'Full DTC Lookup Access',
                   'Complete PDF Service Manuals',
                   'ASCII/SVG Wiring Diagrams',
                   'Visual Fuse Box Layouts',
                   '24/7 AI Troubleshooting'
                 ].map(f => (
                   <div key={f} className="flex items-center gap-3 text-[11px] font-accent font-bold uppercase tracking-widest text-text-secondary italic">
                     <CheckCircle2 size={14} className="text-orange" /> {f}
                   </div>
                 ))}
               </div>
            </div>
            <div className="space-y-4 relative z-10 pt-12 border-t border-white/5 mt-auto">
               <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Verified by</p>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange"><Award size={20} /></div>
                  <div className="text-[11px] font-bold">RUBEN LLEGO <br /><span className="text-orange/60">Lead Developer</span></div>
               </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10"><Wrench size={260} /></div>
          </div>
        )}

        <div className={`flex-1 p-10 md:p-14 relative ${error ? 'animate-shake' : ''}`}>
          <header className={`mb-10 ${mode === 'login' ? 'text-center' : ''}`}>
            {mode === 'login' && <Logo className="justify-center mb-8" size="normal" />}
            <h2 className="text-2xl font-display font-bold tracking-widest uppercase">{mode === 'login' ? 'System Authorization' : 'Member Registration'}</h2>
            <p className="text-text-secondary text-[10px] uppercase tracking-[0.3em] font-medium mt-2">{mode === 'login' ? 'Input credentials to establish link' : 'Complete the following fields to join'}</p>
          </header>

          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {mode === 'register' && (
              <div className="input-group md:col-span-2">
                <input type="text" placeholder=" " className="input-field" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                <label className="input-label">Full Name</label>
                <User className="input-icon" size={18} />
              </div>
            )}
            
            <div className={`input-group ${mode === 'login' ? 'md:col-span-1' : ''}`}>
              <input type="text" placeholder=" " className="input-field" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              <label className="input-label">Username / Member ID</label>
              <Cpu className="input-icon" size={18} />
            </div>

            {mode === 'register' && (
              <div className="input-group">
                <input type="email" placeholder=" " className="input-field" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                <label className="input-label">Email Address</label>
                <Mail className="input-icon" size={18} />
              </div>
            )}

            <div className="input-group group relative">
              <input type={showPassword ? "text" : "password"} placeholder=" " className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <label className="input-label">Access Passcode</label>
              <Lock className="input-icon" size={18} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-orange transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {mode === 'register' && (
                <div className="mt-4 flex items-center justify-between gap-4 px-1">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-500`} style={{ width: `${strength.val}%` }} />
                  </div>
                  <span className={`text-[8px] font-accent font-bold tracking-widest ${strength.val > 0 ? strength.color.replace('bg-', 'text-') : 'text-text-muted'}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div className="input-group">
                <input type="tel" placeholder=" " className="input-field" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                <label className="input-label">Phone Number</label>
                <Phone className="input-icon" size={18} />
              </div>
            )}

            {mode === 'register' && (
              <div className="md:col-span-2 mb-8">
                 <label className="text-[10px] font-accent font-bold text-text-secondary uppercase tracking-[0.3em] mb-4 block ml-1">Subscription Selection</label>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   {[
                     { id: 'Basic', price: '1k', label: 'Basic' },
                     { id: 'Standard', price: '3k', label: 'Standard' },
                     { id: 'Premium', price: '5k', label: 'Premium' }
                   ].map(p => (
                     <button 
                       key={p.id} type="button" 
                       onClick={() => setFormData({ ...formData, plan: p.id })}
                       className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all duration-300 ${formData.plan === p.id ? 'border-orange bg-orange/10 shadow-[0_0_15px_var(--color-orange-glow)] scale-105' : 'border-white/5 hover:border-white/10'}`}
                     >
                        <span className="text-[9px] font-accent font-bold uppercase tracking-widest text-text-secondary">{p.label}</span>
                        <span className="text-xl font-display font-bold text-orange">₱{p.price}</span>
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between mb-2 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <div className="w-4 h-4 rounded border border-white/10 group-hover:border-orange transition-colors flex items-center justify-center">
                     <div className="w-2 h-2 rounded-sm bg-orange scale-0 group-hover:scale-100 transition-transform" />
                   </div>
                   <span className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">Remember Member Link</span>
                </label>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full md:col-span-2 py-5 text-sm shadow-2xl ripple mt-8 group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              {loading ? (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="animate-pulse">Authorizing...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10">{mode === 'login' ? 'Establish Secure Link' : 'Initialize Account Protocol'} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
              )}
            </button>
          </form>

          <footer className="mt-10 text-center flex flex-col gap-4">
            <button onClick={onBack} className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-text-muted hover:text-orange transition-colors">Return to External Interface</button>
            <div className="text-[11px] text-text-secondary">
              {mode === 'login' ? (
                <>New to the framework? <button onClick={() => window.location.hash = '#register'} className="text-orange font-bold hover:underline ml-1">Register Service Access</button></>
              ) : (
                <>Already in the matrix? <button onClick={() => window.location.hash = '#login'} className="text-orange font-bold hover:underline ml-1">Member Authorize</button></>
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
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-orange to-orange-dark text-white shadow-[0_0_30px_var(--color-orange-glow)] z-[500] flex items-center justify-center animate-pulse-glow hover:scale-110 transition-transform group"
      >
        <Wrench className="w-7 h-7 group-hover:rotate-45 transition-transform duration-500" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red rounded-full border-2 border-bg-base-end" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-28 right-8 w-[90%] max-w-[400px] h-[560px] glass-card p-0 shadow-2xl z-[500] flex flex-col border-orange/20 overflow-hidden"
          >
             <header className="p-5 bg-sidebar-bg/50 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center relative">
                      <Cpu size={20} className="text-orange" />
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
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${autoSpeak ? 'bg-orange/10 border-orange/40 text-orange shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}
                   >
                     {autoSpeak ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
                     <span className="text-[9px] font-bold uppercase tracking-wider">{autoSpeak ? 'Voice On' : 'Voice Off'}</span>
                   </button>
                   <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-orange hover:bg-orange/10 transition-all"><X size={18} /></button>
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
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-orange text-white rounded-tr-none' : 'glass-card bg-bg-card border-white/5 rounded-tl-none'} shadow-xl`}>
                      {m.content}
                      <div className={`text-[8px] mt-1.5 font-bold uppercase tracking-widest opacity-40 text-right`}>
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
                         <button key={chip} onClick={() => setInput(chip.replace(/[^a-zA-Z\s]/g, '').trim())} className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-accent font-bold uppercase tracking-widest text-text-muted hover:border-orange hover:text-orange transition-all cursor-pointer">
                           {chip}
                         </button>
                      ))}
                   </div>
                   {autoSpeak && (
                     <div className="flex items-center gap-1.5 text-orange animate-pulse ml-2 px-2 py-1 bg-orange/5 rounded-md border border-orange/20">
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
                        className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-[11px] text-text-primary focus:outline-none focus:border-orange/50 transition-all pr-10"
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
                   <button type="submit" className="w-10 h-10 shrink-0 rounded-xl bg-orange text-white flex items-center justify-center hover:bg-orange-dark transition-colors ripple shadow-lg shadow-orange/20">
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

// --- Removed Mock AI Assistant Logic ---

// --- Dashboard Layout Logic ---

function AdminDashboard({ h, user, store, onLogout, toast, onInstall, showInstall }: any) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const activeTab = h.startsWith('#admin-') ? h.replace('#admin-', '') : (h === '#admin' ? 'overview' : (h.replace('#', '') || 'overview'));

  const navigateTo = (tab: string) => {
    window.location.hash = `#admin-${tab}`;
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 mb-8 flex items-center justify-between">
        {(!sidebarCollapsed || mobileMenuOpen) && <Logo />}
        <button onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : setSidebarCollapsed(!sidebarCollapsed)} className="text-text-muted hover:text-primary-orange transition-colors cursor-pointer hidden lg:block">
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('overview')} />
        <NavItem icon={Users} label="Member Core" active={activeTab === 'members'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('members')} />
        <NavItem icon={Database} label="DTC Database" active={activeTab === 'dtc'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('dtc')} />
        <NavItem icon={Eye} label="Warning Lights Guide" active={activeTab === 'warning_lights'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('warning_lights')} />
        <NavItem icon={Map} label="Component Locations" active={activeTab === 'components'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('components')} />
        <NavItem icon={Zap} label="Fuses & Relays" active={activeTab === 'fuses'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('fuses')} />
        <NavItem icon={Bell} label="Transmissions" active={activeTab === 'announcements'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('announcements')} />
        <NavItem icon={Activity} label="Audit Registry" active={activeTab === 'logs'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('logs')} />
        <NavItem icon={Settings} label="Core Config" active={activeTab === 'settings'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('settings')} />
      </nav>

      {showInstall && (
        <div className="px-4 py-2 border-t border-white/5 bg-orange/5">
          <button 
            onClick={onInstall} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange/10 border border-orange/20 text-orange hover:bg-orange/20 transition-all ${sidebarCollapsed && !mobileMenuOpen ? 'justify-center px-0' : ''}`}
            title="Install Application"
          >
            <Download size={18} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="text-[10px] font-bold uppercase tracking-widest">Install App</span>}
          </button>
        </div>
      )}

      <div className="p-4 border-t border-border-glass space-y-4">
        <div className={`flex items-center gap-3 transition-all ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : ''}`}>
          <UserAvatar user={user} size="md" />
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex-1 min-w-0">
              <div className="font-sans font-semibold text-sm truncate">{user.fullName}</div>
              <div className="text-[11px] text-orange font-bold uppercase tracking-widest">Master Admin</div>
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
        className="hidden lg:flex bg-[#0d1117] border-r border-border-glass flex-col z-20 shrink-0"
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
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0d1117] border-r border-border-glass flex flex-col z-[101] lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <header className="mb-8 md:mb-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-text-secondary hover:text-orange transition-colors">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl text-primary-orange mb-1 uppercase tracking-tighter font-display font-bold">Admin Central</h1>
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
          {activeTab === 'warning_lights' && <DynamicResourceTab key="adm-lights" type="warning_lights" title="Warning Lights Guide" icon={Eye} store={store} user={user} toast={toast} />}
          {activeTab === 'components' && <DynamicResourceTab key="adm-comps" type="components" title="Component Locations" icon={Map} store={store} user={user} toast={toast} />}
          {activeTab === 'fuses' && <DynamicResourceTab key="adm-fuses" type="fuses" title="Fuses & Relays" icon={Zap} store={store} user={user} toast={toast} />}
          {activeTab === 'logs' && <LogsTab key="adm-log" store={store} />}
          {activeTab === 'announcements' && <div className="glass-panel text-center py-20 opacity-50 uppercase tracking-widest text-[10px]">Announcements Module - Interface Integration Pending</div>}
          {activeTab === 'settings' && <div className="glass-panel text-center py-20 opacity-50 uppercase tracking-widest text-[10px]">Settings Module - Configuration Lock Engaged</div>}
        </AnimatePresence>
      </main>
      <GlobalSearchOverlay isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} store={store} user={user} />
    </div>
  );
}

function MemberDashboard({ h, user, store, onLogout, toast, onInstall, showInstall }: any) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const activeTab = h.replace('#', '') || 'dashboard';

  const navigateTo = (tab: string) => {
    window.location.hash = `#${tab}`;
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 mb-8 flex items-center justify-between">
        {(!sidebarCollapsed || mobileMenuOpen) && <Logo />}
        <button onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : setSidebarCollapsed(!sidebarCollapsed)} className="text-text-muted hover:text-primary-orange transition-colors cursor-pointer hidden lg:block">
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 md:space-y-2 overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'dashboard'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('dashboard')} />
        <NavItem icon={Search} label="DTC Database" active={activeTab === 'dtc'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('dtc')} />
        <NavItem icon={MessageSquare} label="AI Diagnostics" active={activeTab === 'chat'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('chat')} />
        <NavItem icon={Activity} label="Live Telemetry" active={activeTab === 'live'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('live')} />
        <NavItem icon={Zap} label="Fuses & Relays" active={activeTab === 'fuses'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('fuses')} />
        <NavItem icon={Map} label="Component Locator" active={activeTab === 'components'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('components')} />
        <NavItem icon={Star} label="Neural Library" active={activeTab === 'saved'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('saved')} />
        <NavItem icon={Shield} label="Admin Node" active={activeTab === 'admin'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('admin')} />
        <div className="border-t border-white/5 my-4 mx-4 pt-4" />
        <NavItem icon={User} label="Profile" active={activeTab === 'profile'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('profile')} />
        <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} collapsed={sidebarCollapsed && !mobileMenuOpen} onClick={() => navigateTo('settings')} />
      </nav>

      {showInstall && (
        <div className="px-4 py-2 border-t border-white/5 bg-orange/5">
          <button 
            onClick={onInstall} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange/10 border border-orange/20 text-orange hover:bg-orange/20 transition-all ${sidebarCollapsed && !mobileMenuOpen ? 'justify-center px-0' : ''}`}
            title="Install Application"
          >
            <Download size={18} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span className="text-[10px] font-bold uppercase tracking-widest">Install App</span>}
          </button>
        </div>
      )}

      <div className="p-4 border-t border-border-glass space-y-4">
        <div className={`flex items-center gap-3 transition-all ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : ''}`}>
          <UserAvatar user={user} size="md" />
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
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: sidebarCollapsed ? 80 : 280 }} 
        className="hidden lg:flex bg-[#0d1117] border-r border-border-glass flex-col z-20 shrink-0"
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
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0d1117] border-r border-border-glass flex flex-col z-[101] lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <header className="mb-8 md:mb-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-text-secondary hover:text-orange transition-colors">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl text-primary-orange mb-1 uppercase tracking-tighter font-display font-bold">AutoMotive Buddy</h1>
              <p className="text-text-secondary text-[10px] md:text-sm font-accent tracking-widest uppercase opacity-70">Your Smart Automotive Companion</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <button onClick={() => setGlobalSearchOpen(true)} className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-text-muted hover:text-primary-orange hover:border-primary-orange/30 transition-all group">
              <Search size={16} />
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100 italic">Neural Matrix Search</span>
              <kbd className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
            </button>
            <div className="badge badge-blue py-2 px-4 shadow-[0_0_15px_rgba(59,130,246,0.1)] uppercase text-[10px] tracking-widest font-bold">
              Stable Link
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <OverviewTab key="mbr-ov" user={user} store={store} />}
          {activeTab === 'dtc' && <DTCLookupTab key="mbr-dtc" store={store} user={user} toast={toast} />}
          {activeTab === 'chat' && <AIChatTab key="mbr-chat" user={user} store={store} />}
          {activeTab === 'live' && <LiveDataTab key="mbr-live" />}
          {activeTab === 'fuses' && <DynamicResourceTab key="mbr-fuses" type="fuses" title="Fuses & Relays" icon={Zap} store={store} user={user} toast={toast} />}
          {activeTab === 'components' && <DynamicResourceTab key="mbr-comps" type="components" title="Component Locations" icon={Map} store={store} user={user} toast={toast} />}
          {activeTab === 'saved' && <SavedItemsTab key="mbr-saved" user={user} store={store} />}
          {activeTab === 'admin' && <AdminNodeTab key="mbr-admin" />}
          {activeTab === 'profile' && <ProfileTab user={user} store={store} />}
          {activeTab === 'settings' && <div className="glass-panel text-center py-20 opacity-50 uppercase tracking-widest text-[10px]">User Preferences Interface Pending</div>}
        </AnimatePresence>
      </main>
      <GlobalSearchOverlay isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} store={store} user={user} />
    </div>
  );
}

const NavItem = ({ icon: Icon, label, active, collapsed, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`nav-item-styled ${active ? 'active' : ''} ${collapsed ? 'justify-center px-4' : ''} group relative`}
    title={collapsed ? label : ''}
  >
    <Icon size={18} className={`shrink-0 ${active ? 'text-orange' : 'text-text-secondary group-hover:text-text-primary'}`} />
    {!collapsed && <span className="font-sans font-medium whitespace-nowrap overflow-hidden transition-all duration-200">{label}</span>}
    
    {collapsed && (
      <div className="fixed left-[90px] bg-sidebar-bg border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] shadow-xl">
        {label}
      </div>
    )}
  </button>
);

// --- Sub-Tabs ---

function ProfileTab({ user, store }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div className="glass-panel p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <UserAvatar user={user} size="xl" className="w-32 h-32 md:w-48 md:h-48 border-4 border-primary-orange shadow-[0_0_30px_rgba(249,115,22,0.3)]" />
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight">{user.fullName}</h2>
            <span className="badge badge-orange font-accent mb-1">{user.role.toUpperCase()} LEVEL 01</span>
          </div>
          <p className="text-text-secondary uppercase text-xs tracking-widest mb-6">Neural Access Credential: <span className="text-primary-orange font-accent">{user.id}</span></p>
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
             <Shield size={16} className="text-primary-orange" /> Security Protocols
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
             <Activity size={16} className="text-primary-orange" /> Recent Telemetry
          </h3>
          <div className="space-y-3">
             {store.logs.filter((l: any) => l.username === user.username).slice(0, 3).map((l: any) => (
               <div key={l.id} className="flex gap-3 items-center text-[10px] border-b border-white/5 pb-2 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-orange" />
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
  const isAdmin = user.role === 'admin';
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="stats-grid">
        <StatItem label={isAdmin ? "Active Members" : "DTC Lookups"} value={isAdmin ? "1,284" : "1,248"} />
        <StatItem label={isAdmin ? "Pending Approval" : "Manuals Viewed"} value={isAdmin ? "18" : "342"} />
        <StatItem label={isAdmin ? "AI Bot Queries" : "AI Sessions"} value={isAdmin ? "42.5k" : "89"} />
        <StatItem label={isAdmin ? "Monthly Revenue" : "Fleet Units"} value={isAdmin ? "₱285k" : "12"} />
      </div>

      <div className="dashboard-body">
        <section className="glass-panel">
          <h2 className="text-xl mb-6">LATEST DIAGNOSTIC ACTIVITY</h2>
          <div className="space-y-1 divide-y divide-border-glass">
            {store.logs.slice(0, 5).map((l: any) => (
              <div key={l.id} className="py-4 flex justify-between items-center group">
                <div>
                  <div className="font-accent text-primary-orange text-sm mb-1">{l.action}</div>
                  <div className="text-xs text-text-secondary">{l.details}</div>
                </div>
                <span className={`badge ${(l.action || '').includes('Login') ? 'badge-blue' : 'badge-green'}`}>
                  {(l.action || '').includes('Login') ? 'Session' : 'Audit'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel border-primary-orange/20 bg-primary-orange/5">
          <h2 className="text-xl mb-4 text-primary-orange">AI ASSISTANT</h2>
          <div className="text-sm text-text-secondary leading-relaxed mb-6">
            Greeting set to: "Hello {user.fullName.split(' ')[0]}, how can I assist with your diagnostics today?"
          </div>
          <div className="p-4 bg-black/30 rounded-lg border-l-2 border-primary-orange mb-8">
            <div className="text-[11px] uppercase text-text-primary mb-2 tracking-widest">Recent Interaction</div>
            <p className="italic text-sm text-text-secondary">"Analyzed Ford PATS error for user. Immobilizer reset protocol generated..."</p>
          </div>
          <button onClick={() => {}} className="btn-primary w-full">CONFIGURE BOT</button>
        </section>
      </div>
    </motion.div>
  );
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
    <div className="glass-panel border-primary-orange/20 bg-primary-orange/5 p-6 md:p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Car size={24} className="text-primary-orange" />
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
            {selectedMod?.engines.map(eng => (
              <option key={eng} value={eng} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/5 border border-primary-orange/20 rounded-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-orange/20 flex items-center justify-center text-primary-orange shrink-0">
           <Shield size={24} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-text-primary mb-1 uppercase">
            {make || 'UNKNOWN'} {model} — {year || 'ANY'} SERIES
          </div>
          <div className="text-[10px] text-text-secondary uppercase tracking-widest">
            DEPLOYED POWERPLANT: <span className="text-primary-orange font-accent">{engine || 'ANY IDENTIFIED CONSTRUCT'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DTC Lookup Tool Component ---
function DTCLookupTab({ store, toast, user, ...props }: any) {
  const { make: selectedManufacturer, model: selectedModel, year: selectedYear, engine: selectedEngine } = useVehicleStore();
  const [dtcInput, setDtcInput] = useState('');
  const [searchResults, setSearchResults] = useState<DTC[]>([]);
  const [selectedDTC, setSelectedDTC] = useState<DTC | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = dtcInput.toUpperCase().trim();
    if (!query) return;

    setIsLoading(true);
    setSearchResults([]);
    setSelectedDTC(null);

    let dtcData;
    let localMatches: any[] = [];
    
    try {
      // 1. Try exact match
      const res = await api.get(`/dtc/${query}`);
      let dtcResult = res.data;

      // 2. Try keyword search for broader results
      let broadResults: any[] = [];
      try {
        const searchRes = await api.get(`/dtc/search/${query}`);
        if (Array.isArray(searchRes.data)) {
          broadResults = searchRes.data.map((d: any) => ({
            ...d,
            id: d.code,
            title: d.description
          }));
        }
      } catch (sErr) {
        console.warn("Keyword search failed:", sErr);
      }

      // If the backend says search is required/pending AI, trigger frontend deep search
      if (dtcResult.status === 'AI_PENDING' && query.match(/^[PBCO]\d{4}/i)) {
        try {
          const aiDeepData = await performDeepDTCSearch(query);
          dtcResult = { 
            ...aiDeepData, 
            status: 'AI_SEARCH_GENERATED',
            manufacturer: 'Verified Global Search'
          };
        } catch (aiErr) {
          console.error("Deep search failed, sticking with placeholder", aiErr);
        }
      }

      dtcData = {
        ...dtcResult,
        id: dtcResult.code,
        title: dtcResult.description,
      };
      
      // Save offline
      try {
        await saveDTCOffline(dtcResult);
      } catch (dbErr) {
        console.warn("IndexedDB save error:", dbErr);
      }
      
      if (dtcData && dtcData.status !== 'AI_PENDING') {
        localMatches.push(dtcData);
      }

      // Merge results
      broadResults.forEach(br => {
        if (!localMatches.find(lm => lm.code === br.code)) {
          localMatches.push(br);
        }
      });
      
    } catch (err) {
      console.warn("API query failed, falling back to local DB", err);
      
      let offlineData = null;
      try {
        offlineData = await getDTCOffline(query);
      } catch (dbErr) {
        console.warn("IndexedDB error:", dbErr);
      }
      
      if (offlineData) {
        dtcData = {
           ...offlineData,
           id: offlineData.code,
           title: offlineData.description,
           status: 'OFFLINE_CACHE'
        };
        localMatches.push(dtcData);
      } else {
        // Ultimate Local Fallback (Static Data)
        const allLocalDTCs = [
          ...(fordDTCDatabase as unknown as DTC[]), 
          ...(otherMfrDTCs as unknown as DTC[]), 
          ...(genericDTCs as unknown as DTC[]),
          ...(komatsuDTCs as unknown as DTC[]),
          ...store.dtcs
        ];
        
        const results = allLocalDTCs.filter(dtc => 
          String(dtc?.code || '').toUpperCase().includes(query) || 
          (dtc?.title && String(dtc.title).toUpperCase().includes(query)) ||
          (dtc?.description && String(dtc.description).toUpperCase().includes(query))
        );
        
        if (results.length > 0) {
          // Deduplicate
          const uniqueResults = results.reduce((acc: any[], current: any) => {
            if (!acc.find(item => item?.code === current?.code)) return acc.concat([current]);
            return acc;
          }, []);
          localMatches = uniqueResults.slice(0, 10);
        } else {
          // AI Extrapolated mock fallback for offline local mode
          localMatches.push({
            code: query,
            id: query,
            title: `AI Extrapolated Meaning for ${query} (Offline Local)`,
            description: `AI Extrapolated Meaning for ${query}. System likely implies a specialized module fault.`,
            system: "Unknown Module",
            severity: "Requires Attention",
            causes: "Manufacturer-specific fault or undocumented circuit anomaly.",
            solutions: ["Check live telemetry", "Consult OEM repair manual", "Trace circuits to associated sensor"],
            manufacturer: "AI_ESTIMATED",
            status: "AI_ESTIMATED",
            confidence: 0.75
          });
        }
      }
    }

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      
      store.addSearchHistory({
        userId: user.id,
        query: query,
        type: 'dtc',
        timestamp: new Date().toISOString()
      });
      store.addLog(user.id, user.username, `DTC Search`, `Searched for fault code ${query}`);
      
      // Store log for sync when offline
      if (!navigator.onLine) {
        try {
          await addOfflineLog({
            action: "DTC Search",
            code: query,
            timestamp: new Date().toISOString()
          });
        } catch (dbErr) {
           console.warn("Offline log error", dbErr);
        }
      }
    }

    setIsLoading(false);
  };

  const handleSave = (dtc: DTC) => {
    store.addSavedItem({
      userId: user.id,
      type: 'DTC',
      itemId: dtc.id || dtc.code,
      title: `${dtc.code} - ${dtc.title || dtc.description}`
    });
    if (toast) toast('DTC Protocol successfully saved to your neural library', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlobalVehicleSelector />

      {/* DTC Search Section */}
      <div className="glass-panel p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Search size={24} className="text-primary-orange" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">PHASE 2: NEURAL FAULT SCAN</h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="ENTER OBD-II FAULT CODE (E.G. P0101)..."
            value={dtcInput}
            onChange={(e) => setDtcInput(e.target.value)}
            className="input-field flex-1 h-[52px] font-accent uppercase tracking-widest"
          />
          <button 
            type="submit"
            className="btn-primary px-8 h-[52px] flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'SCAN'}
          </button>
        </form>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase text-text-secondary tracking-widest mb-4">
              {searchResults.length} SCAN RESULTS RETURNED
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map((dtc, idx) => (
                <button 
                  key={`${dtc.code}-${idx}`}
                  className={`w-full text-left p-6 glass-panel border transition-all hover:-translate-y-1 ${selectedDTC?.code === dtc.code ? 'border-primary-orange bg-primary-orange/5' : 'border-border-glass hover:border-primary-orange/50'}`}
                  onClick={() => setSelectedDTC(dtc)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-accent text-xl text-primary-orange font-bold">{dtc.code}</span>
                        <span className={`badge ${String(dtc.severity || 'low').toLowerCase() === 'critical' ? 'badge-red' : String(dtc.severity || 'low').toLowerCase() === 'high' ? 'badge-orange' : 'badge-yellow'}`}>
                          {String(dtc.severity || 'low').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary font-display font-medium uppercase tracking-tight">
                        {dtc.title || dtc.description}
                      </p>
                    </div>
                    <ChevronRight size={20} className={`text-text-secondary mt-1 transition-transform ${selectedDTC?.code === dtc.code ? 'rotate-90 text-primary-orange' : ''}`} />
                  </div>
                </button>
              ))}

              {searchResults.length === 0 && dtcInput && !isLoading && (
                <div className="py-20 text-center glass-panel opacity-50 border-dashed">
                  <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2">SCAN FAILURE: NO MATCHES</p>
                  <p className="text-[9px] text-text-secondary uppercase">Check fault code syntax and retry uplink</p>
                </div>
              )}

              {searchResults.length === 0 && !dtcInput && (
                <div className="py-20 text-center glass-panel opacity-30 border-dashed">
                  <Database size={48} className="mx-auto mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Scanner Input</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <AnimatePresence mode="wait">
              {selectedDTC ? (
                <motion.div 
                  key={`detail-${selectedDTC.code}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-panel border-t-4 border-t-primary-orange space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-accent text-4xl text-primary-orange font-bold tracking-tighter">{selectedDTC.code}</div>
                    <button onClick={() => handleSave(selectedDTC)} className="w-10 h-10 rounded-full bg-white/5 border border-border-glass flex items-center justify-center text-text-secondary hover:text-primary-orange transition-colors">
                      <Star size={18} />
                    </button>
                  </div>

                  <h2 className="text-xl font-display font-bold uppercase tracking-tight text-text-primary">
                    {selectedDTC.title || selectedDTC.description}
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 border border-border-glass rounded-lg">
                      <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={10} /> TIME BASE</div>
                      <div className="text-xs font-bold text-text-primary">{selectedDTC.timeEstimate || '30-45 MIN'}</div>
                    </div>
                    <div className="p-3 bg-white/5 border border-border-glass rounded-lg">
                      <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5"><CreditCard size={10} /> UNIT COST</div>
                      <div className="text-xs font-bold text-text-primary">{selectedDTC.estimatedCost || '₱1,500 - ₱4,000'}</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> POTENTIAL CAUSES</h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const causes = Array.isArray(selectedDTC?.causes) ? selectedDTC.causes : 
                                        (typeof (selectedDTC as any)?.causes === 'string' ? (selectedDTC as any).causes.split(',') : []);
                          return causes.length > 0 ? causes.map((c: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-white/5 border border-border-glass rounded text-[10px] text-text-secondary">
                              {c.trim()}
                            </span>
                          )) : (
                            <span className="text-[10px] text-text-secondary italic">Information synchronization in progress...</span>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-red-400" /> ALERT SYMPTOMS</h4>
                      <ul className="space-y-2">
                        {(() => {
                          const symps = Array.isArray(selectedDTC?.symptoms) ? selectedDTC.symptoms : [];
                          return symps.length > 0 ? symps.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-text-secondary flex gap-2">
                              <span className="text-primary-orange select-none">•</span> {s}
                            </li>
                          )) : (
                            <li className="text-[10px] text-text-secondary italic">Standard performance irregularities or warning indicator active.</li>
                          );
                        })()}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400" /> REPAIR PROTOCOL</h4>
                      <div className="space-y-3">
                        {(() => {
                          const steps = Array.isArray(selectedDTC?.remediation) ? selectedDTC.remediation : 
                                        Array.isArray(selectedDTC?.solutions) ? selectedDTC.solutions : 
                                        typeof selectedDTC?.solutions === 'string' ? [selectedDTC.solutions] : [];
                          
                          return steps.length > 0 ? (
                            <>
                              {steps.slice(0, 3).map((step: string, i: number) => (
                                <div key={i} className="p-3 bg-black/30 border-l-2 border-primary-orange rounded-r text-[11px] leading-relaxed text-text-primary italic">
                                  {step}
                                </div>
                              ))}
                              {steps.length > 3 && (
                                <button className="text-[9px] font-bold text-primary-orange uppercase tracking-widest hover:underline">View Full 12-Step Protocol</button>
                              )}
                            </>
                          ) : (
                            <div className="p-3 bg-black/30 border-l-2 border-gray-600 rounded-r text-[11px] leading-relaxed text-text-secondary italic">
                              Comprehensive repair guide pending cloud synchronization. Inspect associated wiring and sensors.
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button className="btn-primary flex-1 py-4 text-[10px] font-bold tracking-widest">COMMAND CENTER PRINT</button>
                      <button className="btn-secondary w-14 h-14 flex items-center justify-center p-0 rounded-lg"><Share2 size={18} /></button>
                    </div>

                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                       <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1">STRICT SAFETY PROTOCOL</div>
                       <p className="text-[10px] text-red-300 opacity-80 uppercase leading-tight">THREAT LEVEL: {selectedDTC.dangerLevel || 'HIGH'}. PROCEED WITH CAUTION OR ENGAGE PROFESSIONAL SUPPORT.</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[500px] glass-panel border-dashed border-2 flex flex-col items-center justify-center text-center opacity-30">
                  <Cpu size={64} className="mb-6" />
                  <p className="text-xs uppercase font-bold tracking-widest">Select an entry for<br />deep system analysis</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Dynamic Resource Tab Component ---
function DynamicResourceTab({ type, title, icon: Icon, store, user, toast }: any) {
  const { make, model, year, engine } = useVehicleStore();
  
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    store.addLog(user.id, user.username, `AI Data Generation`, `Generated ${type} for ${year} ${make} ${model}`);

    try {
      const data = await generateDynamicVehicleData(type, make, model, year, engine);
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
          <Icon size={24} className="text-primary-orange" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">VEHICLE SELECT: {title}</h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4 items-center">
            <button 
              type="submit"
              disabled={isLoading || !make || !model || !year || !engine} 
              className="btn-primary w-full max-w-sm h-[50px] gap-2"
            >
              <Search size={16} />
              {isLoading ? "Querying..." : "Search"}
            </button>
        </form>
      </div>

      {isLoading && (
        <div className="glass-panel p-12 text-center space-y-4">
           <div className="animate-spin text-primary-orange flex justify-center"><CloudDownload size={32} /></div>
           <p className="text-text-secondary uppercase tracking-[0.2em] text-xs">Querying neural matrix and compiling structural vehicle report</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="glass-panel p-6 md:p-10 space-y-6">
          <div className="border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
             <h3 className="text-lg text-primary-orange font-bold uppercase">{year} {make} {model} - {title}</h3>
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
           <div className="w-16 h-16 border-4 border-primary-orange/20 border-t-primary-orange rounded-full animate-spin" />
           <div className="flex flex-col items-center gap-2">
             <div className="text-[11px] font-accent font-bold text-primary-orange uppercase tracking-[.3em] animate-pulse">Establishing Satellite Link...</div>
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
             className="btn-primary px-8 py-4 flex items-center gap-3 text-[10px] shadow-[0_0_20px_rgba(249,115,22,0.3)]"
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
            className={`glass-panel flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 transition-all cursor-pointer ${filter.category === cat ? 'border-primary-orange bg-primary-orange/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'hover:bg-white/5'}`}
          >
            <div className={`p-2 rounded-lg ${filter.category === cat ? 'bg-primary-orange text-white' : 'bg-white/5 text-text-secondary'}`}>
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
                className="glass-panel group hover:border-primary-orange/50 transition-all cursor-pointer p-0 overflow-hidden"
                onClick={() => setSelectedUnit(u)}
              >
                <div className="p-5 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <div className="text-[9px] md:text-[10px] font-accent font-bold text-primary-orange uppercase mb-1 truncate">{u.yearRange} {u.make}</div>
                      <div className="text-lg md:text-xl font-display font-bold text-text-primary uppercase tracking-tight truncate">{u.model}</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg shrink-0"><ChevronRight size={16} className="text-text-secondary group-hover:text-primary-orange group-hover:translate-x-1" /></div>
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
                <div className="bg-white/5 px-6 py-2.5 border-t border-border-glass flex justify-between items-center group-hover:bg-primary-orange/10">
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-text-secondary group-hover:text-primary-orange">Access Catalog</span>
                  <BookOpen size={12} className="text-text-secondary group-hover:text-primary-orange" />
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
              <Filter size={14} className="text-primary-orange" /> 
              FILTER CATALOG
            </h4>
            <div className="space-y-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] uppercase font-bold text-text-secondary ml-1">MANUFACTURER</label>
                <div className="relative">
                   <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                   <input type="text" className="input-field pl-10 h-[48px] text-xs font-medium" placeholder="E.g. Honda, Toyota..." value={filter.make} onChange={e => setFilter({ ...filter, make: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] uppercase font-bold text-text-secondary ml-1">PRODUCTION YEAR</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select 
                    className="input-field pl-10 h-[48px] text-xs px-2 appearance-none font-medium w-full bg-[#1e293b]"
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel w-full max-w-5xl h-[90vh] flex flex-col p-0 relative overflow-y-auto md:overflow-hidden bg-[#0a0e1a] border-primary-orange/30">
              <div className="flex-none md:flex-1 flex flex-col md:flex-row min-h-full md:min-h-0">
                {/* Left Sidebar Info */}
                <div className="flex-none md:w-72 bg-black/40 border-b md:border-b-0 md:border-r border-border-glass p-6 md:p-8 flex flex-col">
                  <button onClick={() => setSelectedUnit(null)} className="md:hidden absolute top-4 right-4 text-text-secondary z-10"><X size={20} /></button>
                  
                  <div className="w-14 h-14 bg-primary-orange/20 rounded-xl flex items-center justify-center mb-6 border border-primary-orange/30">
                    <Wrench className="text-primary-orange" size={28} />
                  </div>
                  
                  <div className="mb-8">
                    <div className="text-[10px] font-accent font-bold text-primary-orange uppercase tracking-[0.2em] mb-1">{selectedUnit.category} UNIT</div>
                    <h3 className="text-2xl font-display font-bold text-white uppercase leading-tight">{selectedUnit.make} {selectedUnit.model}</h3>
                    <div className="text-xs font-bold text-text-secondary mt-1">{selectedUnit.yearRange} PRODUCTION</div>
                  </div>

                  <div className="flex-none md:flex-1 space-y-2 overflow-y-auto">
                    {[
                      { id: 'specs', label: 'Tech Specs', icon: <Cpu size={16} /> },
                      { id: 'service', label: 'Service Manual', icon: <ToolIcon size={16} /> },
                      { id: 'wiring', label: 'Wiring Diagrams', icon: <Activity size={16} /> },
                      { id: 'fuses', label: 'Fuse Mapping', icon: <Zap size={16} /> },
                      { id: 'fluids', label: 'Fluids & Caps', icon: <Globe size={16} /> },
                      { id: 'torque', label: 'Torque Specs', icon: <Settings size={16} /> },
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-orange text-white shadow-lg shadow-primary-orange/20' : 'text-text-secondary hover:bg-white/5'}`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                    <button 
                      onClick={() => handleSave(selectedUnit)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all text-text-secondary hover:bg-star/10 hover:text-orange border border-dashed border-white/10 mt-4"
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
                      {activeTab === 'specs' && <><Cpu size={16} className="text-primary-orange"/> UNIT SPECIFICATIONS</>}
                      {activeTab === 'service' && <><ToolIcon size={16} className="text-primary-orange"/> STEP-BY-STEP SERVICE GUIDE</>}
                      {activeTab === 'wiring' && <><Activity size={16} className="text-primary-orange"/> ELECTRICAL SCHEMATICS</>}
                      {activeTab === 'fuses' && <><Zap size={16} className="text-primary-orange"/> FUSE BOX MAPPING</>}
                      {activeTab === 'fluids' && <><Globe size={16} className="text-primary-orange"/> FLUID SPECIFICATIONS</>}
                      {activeTab === 'torque' && <><Settings size={16} className="text-primary-orange"/> TIGHTENING TORQUE DATA</>}
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
                              <h4 className="text-sm font-bold text-primary-orange uppercase tracking-widest flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary-orange/20 flex items-center justify-center text-[10px]">{idx + 1}</span>
                                {chap.title}
                              </h4>
                              <div className="space-y-3 pl-8">
                                {(Array.isArray(chap.steps) ? chap.steps : []).map((step: string, sIdx: number) => (
                                  <div key={sIdx} className="flex gap-3 text-xs text-text-secondary group">
                                    <span className="text-primary-orange font-bold font-accent">•</span>
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

                    {activeTab === 'fuses' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.fuseBoxes}>
                        <div className="space-y-8">
                          {Object.entries(selectedUnit.fuseBoxes || {}).length > 0 ? Object.entries(selectedUnit.fuseBoxes || {}).map(([boxName, fuses], boxIdx) => (
                            <motion.div 
                              key={boxName} 
                              className="space-y-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: boxIdx * 0.1 }}
                            >
                              <h5 className="text-xs font-bold text-primary-orange uppercase tracking-widest border-b border-primary-orange/20 pb-2">{boxName} FUSE BOX</h5>
                              <div className="overflow-x-auto glass-panel p-0 hover:border-primary-orange/50 transition-colors duration-300">
                                <table className="w-full text-left text-[10px]">
                                  <thead className="bg-white/5 text-text-secondary uppercase font-accent">
                                    <tr>
                                      <th className="p-3 font-semibold">#</th>
                                      <th className="p-3 font-semibold">Amp</th>
                                      <th className="p-3 font-semibold">Circuit</th>
                                      <th className="p-3 font-semibold">Function</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {(Array.isArray(fuses) ? fuses : []).map((f: any, idx: number) => (
                                      <motion.tr 
                                        key={f.id} 
                                        className="hover:bg-primary-orange/10 transition-colors"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: 0.1 + (idx * 0.05) }}
                                      >
                                        <td className="p-3 font-bold text-primary-orange">{f.number}</td>
                                        <td className="p-3 font-accent">
                                          <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold bg-white/10 text-white shadow-sm border border-white/5">{f.amperage}</span>
                                        </td>
                                        <td className="p-3 uppercase text-text-primary">{f.circuit}</td>
                                        <td className="p-3 text-text-secondary uppercase max-w-[200px] truncate" title={f.protects}>{f.protects}</td>
                                      </motion.tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          )) : <div className="text-center py-20 opacity-30 uppercase text-[10px] font-bold tracking-widest text-text-secondary">No fuse mapping data</div>}
                        </div>
                      </RetrievalPlaceholder>
                    )}

                    {activeTab === 'fluids' && (
                      <RetrievalPlaceholder unitId={selectedUnit.id} data={selectedUnit.fluids}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(Array.isArray(selectedUnit.fluids) ? selectedUnit.fluids : []).map((fluid: any, idx: number) => (
                            <motion.div 
                              key={idx} 
                              className="glass-panel p-6 bg-black/20 hover:bg-black/30 transition-all hover:border-primary-orange/30"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                            >
                              <h6 className="text-[10px] font-bold text-primary-orange uppercase mb-3 tracking-widest">{fluid.name}</h6>
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
                                  <td className="p-4 text-primary-orange font-bold">{t.nm} Nm</td>
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
            <Cpu size={48} className="text-primary-orange mb-6" />
            <h4 className="text-base md:text-lg font-display font-bold mb-2 text-text-primary uppercase tracking-tight">Neural Matrix Standby</h4>
            <p className="text-[9px] md:text-xs uppercase tracking-widest max-w-xs text-text-secondary">AI Assistant ready for mechanical diagnostics, code analysis, and maintenance guidance.</p>
          </div>
        )}
        {myMessages.map((m: any) => (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[80%] flex gap-3 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'user' ? (
                <UserAvatar user={user} size="sm" className="w-7 h-7 md:w-8 md:h-8 border-primary-orange" />
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 font-bold border border-blue-500/30 text-blue-400 bg-blue-500/20 text-[10px] md:text-xs font-accent">
                   AI
                </div>
              )}
              <div className={`p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary-orange/10 border border-primary-orange/20 text-white rounded-tr-none' : 'bg-white/5 border border-border-glass text-text-primary rounded-tl-none'}`}>
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
            <button type="submit" disabled={!input.trim() || loading} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary-orange text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersTab({ user, store, toast, ...props }: any) {
  return (
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
          {store.users.map((u: UserType) => (
            <tr key={u.id} className="hover:bg-white/2 transition-colors">
              <td className="p-6">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} size="sm" className="border-border-glass bg-slate-800" />
                  <div><div className="text-sm font-bold text-text-primary uppercase">{u.fullName}</div><div className="text-[9px] text-text-secondary uppercase">@{u.username}</div></div>
                </div>
              </td>
              <td className="p-6">
                <span className={`badge ${u.status === 'approved' ? 'badge-green' : 'animate-pulse'}`}>{u.status}</span>
              </td>
              <td className="p-6">
                {u.subscription && <div className="text-[10px]"><span className="text-primary-orange font-bold uppercase">{u.subscription.plan}</span><div className="text-[9px] text-text-secondary mt-1 uppercase font-accent">Exp: {new Date(u.subscription.expiryDate).toLocaleDateString()}</div></div>}
              </td>
              <td className="p-6 text-[10px] font-accent text-text-secondary uppercase">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="p-6">
                <div className="flex gap-2">
                  {u.status === 'pending' && (
                    <button 
                      onClick={() => {
                        store.updateUser(u.id, { status: 'approved' });
                        store.addLog(user.id, user.username, 'Approval', `Approved user ${u.fullName} (@${u.username})`);
                        toast(`Member ${u.username} has been approved. Access granted.`, 'success');
                      }} 
                      className="p-2 bg-green-500/20 text-green-500 rounded hover:scale-110 transition-all cursor-pointer"
                      title="Approve Member"
                    >
                      <ShieldCheck size={14} />
                    </button>
                  )}
                  <button className="p-2 bg-blue-500/20 text-blue-400 rounded hover:scale-110 transition-all cursor-pointer"><Edit size={14} /></button>
                  {u.role !== 'admin' && <button onClick={() => store.deleteUser(u.id)} className="p-2 bg-red-500/20 text-red-500 rounded hover:scale-110 transition-all cursor-pointer"><Trash2 size={14} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SavedItemsTab({ user, store }: any) {
  const myItems = store.savedItems.filter((i: any) => i.userId === user.id);

  return (
    <div className="space-y-6">
      <div className="glass-panel py-8 text-center border-b-2 border-primary-orange/20">
        <Star className="mx-auto mb-4 text-primary-orange animate-pulse" size={32} />
        <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Saved Neural Records</h2>
        <p className="text-[10px] text-text-secondary uppercase tracking-[0.3em] mt-2">Personal diagnostic archive for quick retrieval</p>
      </div>

      {myItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.map((item: any) => (
            <motion.div 
              layoutId={item.id}
              key={item.id} 
              className="glass-panel group hover:border-primary-orange/50 transition-all p-0 overflow-hidden"
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
                className="w-full bg-white/5 py-3 border-t border-border-glass text-[9px] font-bold uppercase tracking-widest text-text-secondary group-hover:text-primary-orange group-hover:bg-primary-orange/10 transition-all"
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
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary-orange">
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
                 className="text-text-muted hover:text-primary-orange p-2 transition-colors"
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
        className="w-full max-w-2xl glass-panel p-0 overflow-hidden border-primary-orange/40 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
      >
        <div className="p-6 border-b border-border-glass relative">
           <Search size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-primary-orange" />
           <input 
             autoFocus
             type="text" 
             className="w-full bg-transparent pl-16 pr-12 py-4 text-lg font-display uppercase tracking-widest focus:outline-none" 
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
                    className="w-full p-6 text-left hover:bg-primary-orange/5 flex items-center justify-between group transition-all"
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
                          <div className="text-[10px] font-accent font-bold text-text-secondary uppercase tracking-[.2em] mb-1">{r.gType === 'DTC' ? 'FAULT PROTOCOL' : 'TECHNICAL UNIT'}</div>
                          <div className="text-base font-display font-bold text-text-primary uppercase group-hover:text-primary-orange transition-colors">
                            {r.gType === 'DTC' ? `${r.code} - ${r.description}` : `${r.make} ${r.model}`}
                          </div>
                       </div>
                    </div>
                    <ArrowRight size={20} className="text-text-muted group-hover:translate-x-1 transition-all group-hover:text-primary-orange" />
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
  return (
    <div className="glass-panel max-h-[600px] overflow-y-auto p-0">
      <div className="p-4 border-b border-border-glass bg-white/5 uppercase text-[9px] font-bold tracking-widest text-text-secondary">Protocol Log Feed</div>
      <div className="p-6 space-y-4">
        {store.logs.map((l: any) => (
          <div key={l.id} className="flex gap-4 items-start border-b border-border-glass/50 pb-4 last:border-0 group">
             <div className="w-1 h-8 bg-primary-orange/50 group-hover:bg-primary-orange transition-colors" />
             <div>
               <div className="flex items-center gap-3 mb-1">
                 <span className="text-[10px] font-accent text-primary-orange font-bold uppercase tracking-widest">{l.action}</span>
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
