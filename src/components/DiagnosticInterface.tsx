import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Truck, 
  Tractor, 
  Settings, 
  ChevronRight, 
  Brain, 
  Database, 
  Activity, 
  Search, 
  LayoutDashboard, 
  Zap, 
  ShieldAlert,
  Save,
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Wrench,
  WifiOff,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from 'lucide-react';
import { searchFuses } from '../services/fuseSearch';
import { diagnoseDTC } from '../services/api';
import api from '../services/apiClient';
import { performDeepDTCSearch } from '../services/ai';
import { User as UserType } from '../lib/store';
import { 
  DTCRecord, 
  getDTCOffline, 
  saveDTCOffline, 
  addOfflineLog, 
  updateCacheConfidence,
  DiagnosticSession, 
  DiagnosticStep as DBStep,
  Equipment,
  getAllEquipment
} from '../services/db';
import { SessionService } from '../services/sessionService';
import { EquipmentRegistry } from './EquipmentRegistry';
import { BASE_API } from '../lib/config';
import { LiveDiagnosticTimeline, DiagnosticStep } from './DiagnosticTimeline';
import { Card, Badge, Button } from './ui';

interface AIResult {
  code?: string;
  description?: string;
  severity?: "low" | "high" | "medium" | "critical" | string;
  system?: string;
  causes?: any[];
  fixes?: string[];
  findings?: string;
  hypothesis?: string;
  conclusion?: string;
  confidence?: number;
  time_est?: string;
  timeEstimate?: string;
  provider?: string;
  sourceType?: string;
  feasibility?: 'proceed' | 'limited' | 'specialist_required' | string;
  operationalAction?: string;
  actions?: any[];
  workflow?: any[];
  cost?: string;
}

interface DiagnosticInterfaceProps {
  onRunDiagnostics?: (data: { vehicleType: string, brand: string, model: string, year: string, codes: string }) => void;
  user?: UserType | null;
  toast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function DiagnosticInterface({ onRunDiagnostics, user, toast }: DiagnosticInterfaceProps) {
  const [vehicleType, setVehicleType] = useState('light');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [codes, setCodes] = useState('');
  const [activeTab, setActiveTab] = useState('diagnose');
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [fuseSearchResults, setFuseSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'fuses' && (brand || model || year)) {
      const results = searchFuses(`${brand} ${model} ${year}`.trim());
      setFuseSearchResults(results);
    }
  }, [brand, model, year, activeTab]);
  
  // Session State
  const [currentSession, setCurrentSession] = useState<DiagnosticSession | null>(null);
  const [missingTools, setMissingTools] = useState<string[]>([]);
  const [feasibilityStatus, setFeasibilityStatus] = useState<'proceed' | 'limited' | 'specialist_required'>('proceed');
  
  // Categorized Suggestions
  const suggestions = {
    light: {
      brands: ['Toyota', 'Ford', 'Honda', 'Mitsubishi', 'Nissan', 'Hyundai', 'Kia', 'BMW', 'Chevrolet', 'Mazda', 'Suzuki', 'Subaru'],
      models: ['Hilux', 'Fortuner', 'Vios', 'Ranger', 'Everest', 'Civic', 'CR-V', 'Montero Sport', 'Navara', 'Tucson', 'Sportage', '3 Series', '5 Series'],
      codes: ['P0300', 'P0420', 'P0171', 'P0101', 'U0100', 'B1000', 'C1201', 'P0301', 'P0302', 'P0303', 'P0304', 'P0505', 'P0700']
    },
    heavy_truck: {
      brands: ['Isuzu', 'Hino', 'Fuso', 'Scania', 'Volvo', 'MAN', 'Kenworth', 'Peterbilt', 'Freightliner', 'Mack', 'UD Trucks'],
      models: ['Giga', 'Elf', 'Forward', 'Canter', 'Fighter', 'Super Great', 'Profia', '700 Series', 'R500', 'FH16', 'FM', 'TGX'],
      codes: ['P0087', 'P0108', 'P0299', 'P0401', 'P2463', 'U1101', 'J1939-111', 'SPN 102', 'SPN 110', 'SPN 190', 'SPN 639']
    },
    heavy_equipment: {
      brands: ['Caterpillar', 'Komatsu', 'JCB', 'John Deere', 'Bobcat', 'Hitachi', 'Sany', 'Kobelco', 'Volvo CE', 'Doosan', 'Liebherr', 'Case'],
      models: ['320D', '320GC', 'PC200', 'PC210', '3CX', '4CX', 'D6R', 'D8T', '75G', 'EX200', 'SY215C', 'SY365H', 'SK200', 'EC210'],
      codes: ['E001', 'E035', 'E100', 'E360', 'E500', 'E870', 'HYD-001', 'ENG-101', 'TRN-202', 'ERR-999']
    }
  };

  const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];

  const currentSuggestions = suggestions[vehicleType as keyof typeof suggestions] || suggestions.light;
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [fixConfirmed, setFixConfirmed] = useState(false);
  const [fixDescription, setFixDescription] = useState('');

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check for active sessions on load
    const resumeSession = async () => {
      const activeSessions = await SessionService.getActiveSessions();
      if (activeSessions.length > 0) {
        const lastSession = activeSessions[activeSessions.length - 1];
        setCurrentSession(lastSession);
        setCodes(lastSession.dtcCode);
        setActiveTab('results');
        
        // Populate steps from session if possible (or regenerate they might be different)
        // For simplicity, we just set the tab and session, the user can see progress
      }
    };
    resumeSession();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRun = async () => {
    if (!codes.trim()) {
      if (toast) toast("Enter a DTC code first", "warning");
      return;
    }

    setActiveTab('results');
    setIsScanning(true);
    setError(null);
    setResults(null);
    
    const caseId = `case-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setCurrentCaseId(caseId);

    const firstCode = codes.split(',')[0].trim().toUpperCase();
    const initialSteps: DiagnosticStep[] = [
      { id: '1', type: 'observation', title: 'Reading Inputs', status: 'streaming', content: `Detected DTC sequence: ${codes}. Vehicle: ${year} ${brand} ${model}` }
    ];
    setSteps(initialSteps);

    const updateStep = (id: string, updates: Partial<DiagnosticStep>) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const addStep = (step: Omit<DiagnosticStep, 'status'>) => {
      const newStep = { ...step, status: 'streaming' as const };
      setSteps(prev => {
        const last = prev[prev.length - 1];
        if (last) last.status = 'done';
        return [...prev, newStep];
      });
      return newStep.id;
    };

    const handleTestResult = async (stepId: string, actionIndex: number, result: string) => {
      setSteps(prev => prev.map(s => {
        if (s.id === stepId) {
          const newActions = [...s.metadata.actions];
          newActions[actionIndex] = { ...newActions[actionIndex], result };
          return { ...s, metadata: { ...s.metadata, actions: newActions } };
        }
        return s;
      }));

      const targetStep = steps.find(s => s.id === stepId);
      const action = targetStep?.metadata?.actions?.[actionIndex];
      if (!action) return;

      const loopStepId = addStep({
        id: `loop-${Date.now()}`,
        type: 'reasoning',
        title: 'Evaluating Result',
        content: `Refining diagnostic model based on ${result.toUpperCase()} result for: "${action.instruction}"`
      });

      try {
        const response = await api.post("/api/ai/process-result", { 
          testAction: action.instruction, 
          result,
          previousContext: results?.hypothesis || results?.description || "" ,
          vehicle: { brand, model, year }
        });
        const data = response.data;
        
        updateStep(loopStepId, { 
          status: 'done', 
          content: data.hypothesis || "Updating strategy...",
          metadata: { actions: data.actions } 
        });

        if (data.actions && data.actions.length > 0) {
          const nextActionId = `loop-action-${Date.now()}`;
          addStep({
            id: nextActionId,
            type: 'action',
            title: 'Refined Procedures',
            content: 'Follow these adjusted points to pinpoint the failure.',
            metadata: { 
              actions: data.actions,
              onResult: (idx: number, res: string) => handleTestResult(nextActionId, idx, res)
            }
          });
        }

        if (data.conclusion) {
          addStep({
            id: `conclusion-${Date.now()}`,
            type: 'conclusion',
            title: 'Refined Verdict',
            content: data.conclusion
          });
        }
      } catch (err) {
        console.error("Loop Fail", err);
        updateStep(loopStepId, { status: 'error', content: 'Connection timed out during session update.' });
      }
    };

    try {
      addOfflineLog({ level: 'info', message: `Started diagnostic scan for ${firstCode}`, context: { brand, model, year } });
      
      // Step 1 Finish
      await new Promise(r => setTimeout(r, 800));
      updateStep('1', { status: 'done', content: `Uplink established. Target vehicle profile loaded: ${year} ${brand} ${model}.` });

      // Step 2: OpenClaw Neural Processing
      const openClawId = addStep({ 
        id: 'openclaw-run', 
        type: 'reasoning', 
        title: 'OpenClaw Brain v2', 
        content: `Initializing Multi-Agent Diagnostic Stack...` 
      });

      let data: AIResult | null = null;
      
      if (isOffline) {
        const offlineCache = await getDTCOffline(firstCode);
        await new Promise(r => setTimeout(r, 600));
        if (offlineCache && offlineCache.description) {
          data = {
            code: offlineCache.code,
            description: offlineCache.description,
            severity: (offlineCache.severity || 'medium') as any,
            system: offlineCache.system || 'Vehicle System',
            causes: offlineCache.possibleCauses?.map(c => ({ item: c, probability: null })) || [],
            fixes: offlineCache.recommendedActions || [],
            confidence: 0.95,
            time_est: 'Saved Locally'
          };
          updateStep(openClawId, { status: 'done', content: `Found matching protocol in local device cache.` });
        } else {
          updateStep(openClawId, { status: 'error', content: `Code not found in local cache. Neural uplink required.` });
          throw new Error("Offline Mode Active: This code is not in your local database.");
        }
      } else {
        try {
          const runOpenClawDiagnosis = async (symptom: string, vehicle: any) => {
            const res = await fetch(`${BASE_API}/api/ai/openclaw-diagnose`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
              },
              body: JSON.stringify({ message: symptom, vehicle })
            });
            if (!res.ok) throw new Error("OpenClaw Neural Brain communication failure.");
            return res.json();
          };

          const openClawRes = await runOpenClawDiagnosis(codes, { make: brand, model, year: parseInt(year) || 0 });
          const { diagnosis, likely_causes, confidence, recommended_fix, estimated_cost, agent_logs, subsystem } = openClawRes;

          if (agent_logs) {
            for (const log of agent_logs) {
              updateStep(openClawId, { content: log.message || `Agent executing ${log.step}...` });
              await new Promise(r => setTimeout(r, 800)); 
            }
          }

          updateStep(openClawId, { 
            status: 'done', 
            content: `Neural Analysis Complete. Subsystem Identified: ${subsystem || 'Internal Reasoning Matrix'}` 
          });

          data = {
            code: firstCode,
            description: diagnosis,
            hypothesis: diagnosis,
            severity: (confidence > 0.8 ? 'critical' : 'medium') as any,
            confidence: confidence,
            fixes: [recommended_fix],
            causes: likely_causes.map((c: string) => ({ item: c, probability: null })),
            cost: estimated_cost,
            system: subsystem || 'Neural Engine v2',
            feasibility: 'proceed'
          };
        } catch (err: any) {
          updateStep(openClawId, { status: 'error', content: `OpenClaw Error: ${err.message}` });
          setError(err.message);
          setIsScanning(false);
          return;
        }
      }
      if (data) {
        // Final Conclusion
        addStep({ 
          id: '5', 
          type: 'conclusion', 
          title: 'Final Verdict', 
          content: `${data.hypothesis || data.description || 'Scan complete.'} Recommended Fix: ${data.conclusion || data.fixes?.[0] || 'Refer to service manual.'}` 
        });
        await new Promise(r => setTimeout(r, 500));
        setSteps(prev => prev.map(s => ({...s, status: 'done'})));
        
        setResults(data);

        // Start a diagnostic session automatically if we have actions
        if (data && (data.actions || data.workflow)) {
           const session = await SessionService.startSession(data as any, currentCaseId || crypto.randomUUID());
           setCurrentSession(session);
           
           // Check equipment feasibility
           const equipCheck = await SessionService.checkEquipmentFeasibility(session);
           setMissingTools(equipCheck.missingTools);
           setFeasibilityStatus(data.feasibility as any || (equipCheck.hasRequiredTools ? 'proceed' : 'limited'));
        }

        // Log to backend for learning
        if (!isOffline) {
          fetch(`${BASE_API}/api/ai/log-case`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
            },
            body: JSON.stringify({
              caseId,
              vehicle: { make: brand, model, year: parseInt(year) || 0 },
              initialInput: { dtcCodes: [firstCode], symptoms: codes },
              steps: steps.map(s => ({
                stepId: s.id,
                action: s.title,
                result: s.metadata?.actions?.[0]?.result || 'not_sure'
              })),
              finalDiagnosis: {
                hypothesis: data.hypothesis || data.description,
                confidence: data.confidence || 0.9
              }
            })
          }).catch(console.error);
        }

        if (data && data.description) {
          await saveDTCOffline({
            code: firstCode,
            description: data.description,
            severity: (data.severity as any) || 'medium',
            system: data.system || 'Powertrain',
            manufacturer: brand,
            possibleCauses: data.causes?.map((c: any) => {
              if (typeof c === 'string') return c;
              return c?.item || '';
            }) || [],
            recommendedActions: data.fixes || []
          });
        }
      }

      if (onRunDiagnostics) {
        onRunDiagnostics({ vehicleType, brand, model, year, codes });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during the scan.");
      setSteps(prev => prev.map(s => s.status === 'streaming' ? { ...s, status: 'error', content: err.message } : s));
      addOfflineLog({ level: 'error', message: err.message, context: { firstCode } });
      if (toast) toast(err.message, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (sev: string = 'medium') => {
    switch ((sev || 'medium').toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen flex flex-col font-sans text-white pb-24 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-full h-[40%] bg-amber-600/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-5%] right-[-10%] w-full h-[30%] bg-amber-900/5 blur-[100px] rounded-full -z-10" />

      {/* Header */}
      <header className="p-6 pb-2 md:pb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="hidden md:flex w-10 h-10 border border-zinc-800 rounded-lg items-center justify-center text-zinc-600 bg-zinc-900/50 shrink-0">
           <Database size={16} />
        </div>

        {/* Center Toggle Dropdown / Switch */}
        <div className="flex-1 flex justify-center w-full md:w-auto">
          <div className="flex items-center bg-[#0a0e1a] border border-zinc-700/50 rounded-2xl p-2 relative overflow-hidden shadow-2xl min-w-[300px] max-w-[400px] w-full">

             {/* Background Slider */}
             <div 
                className="absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-xl transition-all duration-300 ease-out z-0 shadow-lg"
                style={{ 
                  left: isOffline ? 'calc(50% + 4px)' : '4px',
                  backgroundColor: isOffline ? '#ef4444' : '#10b981' // red-500 | emerald-500
                }}
             />
             
             {/* Online Button */}
             <button 
                onClick={() => setIsOffline(false)}
                className={`flex-1 relative z-10 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-colors ${!isOffline ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                <div className={`w-2 h-2 rounded-full ${!isOffline ? 'bg-zinc-900 animate-pulse' : 'bg-green-500 opacity-50'}`} />
                ONLINE MODE
             </button>

             {/* Offline Button */}
             <button 
                onClick={() => setIsOffline(true)}
                className={`flex-1 relative z-10 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-colors ${isOffline ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                <WifiOff size={16} className={isOffline ? 'text-white' : 'text-red-500/50'} />
                OFFLINE MODE
             </button>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end w-10">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} className="w-10 h-10 rounded-full border-2 border-zinc-800" alt="Avatar" />
          ) : (
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-600">
              <Brain size={18} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-2 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Global Datalists for Autocomplete */}
        <datalist id="brand-suggestions">
          {currentSuggestions.brands.map(b => <option key={b} value={b} />)}
        </datalist>
        <datalist id="model-suggestions">
          {currentSuggestions.models.map(m => <option key={m} value={m} />)}
        </datalist>
        <datalist id="year-suggestions">
          {years.map(y => <option key={y} value={y} />)}
        </datalist>
        <datalist id="dtc-suggestions">
          {currentSuggestions.codes.map(c => <option key={c} value={c} />)}
        </datalist>

        <AnimatePresence mode="wait">
          {activeTab === 'diagnose' && (
            <motion.div 
              key="diagnose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start"
            >
              <div className="md:col-span-3 space-y-6">
                {/* Main Card */}
                <div className="diag-card group">
                  {/* Accent Top Line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] overflow-hidden">
                    <div className="w-1/3 h-full bg-amber-500 animate-[shimmer_infinite_3s] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-6">
                    {/* Vehicle Type Selector */}
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setVehicleType('light')}
                        className={vehicleType === 'light' ? 'diag-btn-active' : 'diag-btn-inactive'}
                      >
                        <Car size={24} />
                        <span className="text-[9px] mt-2 font-bold uppercase tracking-widest">Light</span>
                      </button>
                      <button 
                        onClick={() => setVehicleType('heavy_truck')}
                        className={vehicleType === 'heavy_truck' ? 'diag-btn-active' : 'diag-btn-inactive'}
                      >
                        <Truck size={24} />
                        <span className="text-[9px] mt-2 font-bold uppercase tracking-widest">Heavy</span>
                      </button>
                      <button 
                        onClick={() => setVehicleType('heavy_equipment')}
                        className={vehicleType === 'heavy_equipment' ? 'diag-btn-active' : 'diag-btn-inactive'}
                      >
                        <Tractor size={24} />
                        <span className="text-[9px] mt-2 font-bold uppercase tracking-widest">Equip.</span>
                      </button>
                    </div>

                    {/* Brand / Model / Year Inputs */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand</label>
                          <input 
                            type="text" 
                            list="brand-suggestions"
                            placeholder="Toyota"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="diag-input"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Model</label>
                          <input 
                            type="text" 
                            list="model-suggestions"
                            placeholder={vehicleType === 'heavy_equipment' ? '320D' : 'Hilux'}
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="diag-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Year</label>
                        <input 
                          type="text" 
                          list="year-suggestions"
                          placeholder="2024"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="diag-input"
                        />
                      </div>
                    </div>

                    {/* DTC Code Area */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                        DTC Codes
                        <span className="text-zinc-700 italic lowercase">Comma separated</span>
                      </label>
                      <div className="relative">
                        <input 
                          list="dtc-suggestions"
                          placeholder="Enter P0101, P0300..."
                          value={codes}
                          onChange={(e) => setCodes(e.target.value)}
                          className="diag-input pt-10 font-mono"
                        />
                        <div className="absolute top-3 left-4 flex items-center gap-2 opacity-40">
                           <Brain size={14} className="text-amber-500" />
                           <span className="text-[10px] uppercase font-bold tracking-widest">Neural Link Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={handleRun}
                      className="diag-primary-btn group"
                    >
                      RUN DIAGNOSTICS
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                {/* Status Footer */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-[20px] flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Database size={16} className="text-green-500" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase text-zinc-500 font-bold tracking-widest">Database</div>
                      <div className="text-[10px] font-bold">STABLE V.24</div>
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-[20px] flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Activity size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase text-zinc-500 font-bold tracking-widest">Network</div>
                      <div className="text-[10px] font-bold">54ms LATENCY</div>
                    </div>
                  </div>
                </div>

                {/* Instructions Guide */}
                <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-[20px] space-y-5">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-zinc-500" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Database Network Modes</h4>
                  </div>
                  <div className="space-y-4 text-[10px] leading-relaxed">
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
                      <div>
                        <strong className="text-white block mb-1 text-xs">Online Mode (Network Synced)</strong>
                        <span className="text-zinc-500">Connects directly to the live Neural DB matrix. Fetches latest DTC solutions, falls back to real-time AI generation, and automatically caches results to your local device.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/80 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-zinc-300 block mb-1 text-xs">Offline Mode (Local Engine)</strong>
                        <span className="text-zinc-500">Operates 100% locally from your device's cache. Requires zero internet connectivity—ideal for remote diagnostic sites and deep basement workshops.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setActiveTab('diagnose')} className="p-2 bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <h2 className="font-display font-medium text-lg">Scan Results</h2>
              </div>

              {/* Sticky Vehicle Info Bar */}
              <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
                    <Car size={20} className="text-brand" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                      {year || 'Universal'} {brand || 'Auto'} {model || 'Buddy'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                      <span className="text-[10px] text-zinc-500 font-accent uppercase tracking-widest">
                        {isOffline ? 'Offline Cache' : 'Cloud Synchronized'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pr-2">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">DTC_TARGET</div>
                    <div className="text-xs font-mono text-brand font-bold">{codes || 'NONE'}</div>
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block" />
                  <div className="text-right">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">OBD_STATUS</div>
                    <div className="text-xs font-bold text-green-500">CONNECTED</div>
                  </div>
                </div>
              </div>

              {isScanning ? (
                <div className="diag-card py-6 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                        <Activity size={18} className="text-brand" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Diagnostic Matrix</h3>
                        <p className="text-[8px] text-zinc-500 font-accent uppercase tracking-tighter">Live Neural Synthesis In Progress</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <Loader2 size={12} className="animate-spin text-brand" />
                      <span className="text-[10px] font-mono text-brand uppercase">Step {steps.filter(s => s.status === 'done').length + 1}/4</span>
                    </div>
                  </div>
                  
                  <LiveDiagnosticTimeline steps={steps} />
                </div>
              ) : results ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                  {/* Results Overview */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="diag-card">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <div className="text-3xl font-display font-bold text-amber-500 flex items-center gap-2">
                             {String(results.code)}
                             {results.feasibility && (
                                <div className={`text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter ${
                                   results.feasibility.toLowerCase() === 'proceed' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                                   results.feasibility.toLowerCase() === 'limited' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                                   'bg-red-500/20 text-red-500 border border-red-500/30'
                                }`}>
                                   {results.feasibility.replace('_', ' ')}
                                </div>
                             )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                             <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${getSeverityColor(results.severity)} inline-block`}>
                               {results.severity || 'Medium'} Severity
                             </div>
                             {results.provider && (
                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border inline-flex items-center gap-1.5 ${
                                    results.provider === 'gemini' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                    results.provider === 'freellm' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}>
                                   <div className={`w-1 h-1 rounded-full ${results.provider === 'gemini' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                                   AI: {results.provider.toUpperCase()}
                                </div>
                             )}
                             {results.sourceType && (
                                <div className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-zinc-700 bg-zinc-800 text-zinc-400 inline-block">
                                   Source: {results.sourceType.toString().replace('_', ' ')}
                                </div>
                             )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"><Save size={16}/></button>
                          <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"><Share2 size={16}/></button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1.5">Primary Diagnostic</h4>
                          <p className="text-sm font-medium leading-relaxed">
                            {typeof results.description === 'string' ? results.description : JSON.stringify(results.description)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                               <Clock size={12} className="text-zinc-500" />
                               <span className="text-[8px] uppercase font-bold text-zinc-500 tracking-widest">Time Est.</span>
                            </div>
                            <div className="text-xs font-bold">{results.time_est || results.timeEstimate || '30 - 60 Min'}</div>
                          </div>
                          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between">
                            <div>
                               <div className="flex items-center gap-1.5 mb-1">
                                  <ShieldAlert size={12} className="text-zinc-500" />
                                  <span className="text-[8px] uppercase font-bold text-zinc-500 tracking-widest">Conf. Score</span>
                               </div>
                               <div className="text-xs font-bold">{results.confidence ? `${(results.confidence * 100).toFixed(0)}%` : '92%'}</div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                               <button 
                                  onClick={async() => {
                                      const vStr = `${year || ''} ${brand || ''} ${model || ''}`.trim() || 'Generic Vehicle';
                                      const key = `ai_dtc_${vStr}_${results.code || ''}`;
                                      try {
                                          const ok = await updateCacheConfidence(key, true);
                                          if (ok) {
                                             if (toast) toast('Feedback recorded. Neural matrix updated!', 'success');
                                             setResults((p:any) => ({...p, confidence: Math.min(1.0, (p.confidence || 0.92) + 0.05)}));
                                          }
                                      } catch(e){}
                                  }}
                                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-green-500 transition-colors" title="Accurate"><ThumbsUp size={12}/></button>
                               <button 
                                  onClick={async() => {
                                      const vStr = `${year || ''} ${brand || ''} ${model || ''}`.trim() || 'Generic Vehicle';
                                      const key = `ai_dtc_${vStr}_${results.code || ''}`;
                                      try {
                                          const ok = await updateCacheConfidence(key, false);
                                          if (ok) {
                                             if (toast) toast('Feedback recorded. Confidence lowered.', 'success');
                                             setResults((p:any) => ({...p, confidence: Math.max(0.1, (p.confidence || 0.92) - 0.20)}));
                                          }
                                      } catch(e){}
                                  }}
                                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500 transition-colors" title="Inaccurate"><ThumbsDown size={12}/></button>
                            </div>
                          </div>
                        </div>

                        {results.operationalAction && (
                          <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                            typeof results.operationalAction === 'string' && results.operationalAction.includes('🛑') 
                              ? 'bg-red-500/10 border-red-500/30' 
                              : 'bg-white/5 border-white/10'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                               <ShieldAlert size={14} className={typeof results.operationalAction === 'string' && results.operationalAction.includes('🛑') ? 'text-red-500' : 'text-zinc-500'} />
                               <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                 Operational Protocol
                               </div>
                            </div>
                            <div className={`text-sm font-bold ${
                              typeof results.operationalAction === 'string' && results.operationalAction.includes('🛑') ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              {String(results.operationalAction)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-6">
                    {/* Causes & Fixes */}
                    {results.causes && results.causes.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Probable Causes</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {results.causes.map((cause: any, idx: number) => (
                            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex gap-4">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                 <span className="text-amber-500 font-bold text-xs">{idx + 1}</span>
                              </div>
                              <div className="space-y-1 flex-1">
                                 <div className="text-xs font-bold">
                                   {typeof cause === 'string' ? cause : (cause?.item || cause?.cause || cause?.description || JSON.stringify(cause))}
                                 </div>
                                 {cause?.probability && (
                                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                       <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(cause?.probability || 0) * 100}%` }} />
                                    </div>
                                 )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.fixes && results.fixes.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Recommended Fixes</h3>
                        <div className="space-y-3">
                          {results.fixes.map((fix: string, idx: number) => (
                            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex gap-4 items-start">
                              <CheckCircle2 className="text-green-500 w-5 h-5 shrink-0 mt-0.5" />
                              <div className="text-xs leading-relaxed text-zinc-300">
                                {typeof fix === 'string' ? fix : ((fix as any)?.instruction || (fix as any)?.title || JSON.stringify(fix))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learning Section: Confirm Fix */}
                    {!isOffline && results && (
                      <div className="p-6 bg-brand/5 border border-brand/20 rounded-[24px] space-y-4">
                        <div className="flex items-center gap-3">
                          <Brain size={20} className="text-brand" />
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-tight">Diagnostic Decision Learning</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Help improve the accuracy for this {brand} {model}</p>
                          </div>
                        </div>

                        {!fixConfirmed ? (
                          <div className="space-y-4">
                            <p className="text-xs text-zinc-400">Did one of these fixes solve the issue? Confirming high-value cases helps train the next diagnostic session.</p>
                            <div className="flex flex-col gap-3">
                              <textarea 
                                placeholder="What was the actual fix? (e.g., Replaced O2 sensor Bank 1)"
                                value={fixDescription}
                                onChange={(e) => setFixDescription(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs min-h-[80px] focus:border-brand/40 outline-none transition-colors"
                              />
                              <button 
                                onClick={async () => {
                                  if (!fixDescription.trim()) {
                                    if (toast) toast("Please describe the fix", "warning");
                                    return;
                                  }
                                  try {
                                    const res = await fetch(`${BASE_API}/api/ai/confirm-fix`, {
                                      method: 'POST',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${sessionStorage.getItem('jwt')}`
                                      },
                                      body: JSON.stringify({ 
                                        caseId: currentCaseId, 
                                        fixDescription 
                                      })
                                    });
                                    if (res.ok) {
                                      setFixConfirmed(true);
                                      if (toast) toast("Case logged! The DDE engine has learned from this repair.", "success");
                                    }
                                  } catch (e) {
                                    if (toast) toast("Failed to sync fix data.", "error");
                                  }
                                }}
                                className="w-full py-3 bg-brand text-black font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand/80 transition-colors flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 size={14} />
                                CONFIRM & TRAIN ENGINE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-4 text-green-500">
                             <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                               <CheckCircle2 size={16} />
                             </div>
                             <span className="text-xs font-bold uppercase tracking-widest">Repair Data Synchronized</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : error ? (
                <div className="diag-card text-center py-16 space-y-6">
                   <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle size={32} className="text-red-500" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-lg font-display font-medium">Uplink Failure</h3>
                      <p className="text-xs text-zinc-500 px-8">{error}</p>
                   </div>
                   <button onClick={() => setActiveTab('diagnose')} className="diag-primary-btn w-auto px-8 mx-auto">Try Again</button>
                </div>
              ) : (
                <div className="diag-card py-20 text-center text-zinc-600 italic text-sm">
                  Run diagnostics to see results.
                </div>
              )}
            </motion.div>
          )}          {activeTab === 'repair' && (
            <motion.div 
              key="repair"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-20"
            >
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                      <Wrench size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold uppercase tracking-tight leading-none">Diagnostic Workflow</h3>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Guided Execution Engine</p>
                    </div>
                  </div>
                  {currentSession && (
                    <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full font-mono text-[10px] text-amber-500 font-bold">
                       STEP {currentSession.currentStepIndex + 1}/{currentSession.steps.length}
                    </div>
                  )}
               </div>

               {currentSession ? (
                 <div className="space-y-6">
                    {/* Feasibility Alert */}
                    {(feasibilityStatus !== 'proceed' || missingTools.length > 0) && (
                      <div className={`p-4 rounded-2xl border ${feasibilityStatus === 'specialist_required' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                         <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert size={14} className={feasibilityStatus === 'specialist_required' ? 'text-red-500' : 'text-amber-500'} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${feasibilityStatus === 'specialist_required' ? 'text-red-500' : 'text-amber-500'}`}>
                                {feasibilityStatus === 'specialist_required' ? 'Mission Critical Refusal' : 'Limited Operational Capability'}
                            </span>
                         </div>
                         <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                            {feasibilityStatus === 'specialist_required' 
                               ? 'This procedure involves high-risk systems (HV/ADAS/SGW) that require specialized certification and OEM-level equipment. Proceeding without these may cause permanent system damage or physical injury.'
                               : 'User equipment registry indicates missing specialized tools required for this precise diagnostic path.'}
                         </p>
                         {missingTools.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                               {missingTools.map(t => (
                                  <div key={t} className="px-2 py-1 bg-black/40 rounded text-[9px] font-mono text-zinc-500 border border-white/5">
                                     MISSING: {t}
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                    )}

                    {/* Step-by-Step UI */}
                    <div className="space-y-4">
                       {currentSession.steps.map((step, idx) => (
                          <div 
                             key={step.id} 
                             className={`p-5 rounded-2xl border transition-all ${
                                idx === currentSession.currentStepIndex 
                                ? 'bg-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/5 scale-[1.02]' 
                                : idx < currentSession.currentStepIndex 
                                ? 'bg-zinc-950 border-emerald-500/20 opacity-60'
                                : 'bg-zinc-950 border-zinc-800 opacity-40 grayscale'
                             }`}
                          >
                             <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border ${
                                      idx === currentSession.currentStepIndex ? 'bg-amber-500 text-black border-amber-600' : 
                                      idx < currentSession.currentStepIndex ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                                      'bg-zinc-800 text-zinc-500 border-zinc-700'
                                   }`}>
                                      {idx + 1}
                                   </div>
                                   <h4 className="text-xs font-bold text-zinc-200">{step.title}</h4>
                                </div>
                                {idx < currentSession.currentStepIndex && <CheckCircle2 size={16} className="text-emerald-500" />}
                                {idx === currentSession.currentStepIndex && <Loader2 size={16} className="text-amber-500 animate-spin" />}
                             </div>

                             <p className="text-xs text-zinc-400 leading-relaxed mb-4">{step.instruction}</p>

                             {step.toolRequired && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 inline-flex">
                                   <Wrench size={10} className="text-zinc-500" />
                                   <span className="text-[9px] font-mono text-zinc-500 uppercase">{step.toolRequired}</span>
                                </div>
                             )}

                             {idx === currentSession.currentStepIndex && (
                                <div className="flex gap-2">
                                   <button 
                                      onClick={() => SessionService.updateStep(currentSession.id, step.id, { status: 'completed' }).then(s => s && setCurrentSession({...s}))}
                                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase rounded-xl transition-all"
                                   >
                                      Check: Pass / Solid
                                   </button>
                                   <button 
                                      onClick={() => SessionService.updateStep(currentSession.id, step.id, { status: 'failed' }).then(s => s && setCurrentSession({...s}))}
                                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded-xl transition-all"
                                   >
                                      Fail / Out-of-Spec
                                   </button>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>

                    {currentSession.status === 'completed' && (
                       <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3"
                       >
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                             <CheckCircle2 className="text-emerald-500" size={24} />
                          </div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Workflow Concluded</h3>
                          <p className="text-[10px] text-zinc-400">Diagnostic path exhausted. Please review results and log fix if successful.</p>
                          <button 
                             onClick={() => setActiveTab('results')}
                             className="px-6 py-2 bg-emerald-500 text-black text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-400"
                          >
                             Review Summary
                          </button>
                       </motion.div>
                    )}
                 </div>
               ) : (
                  <div className="diag-card py-20 text-center border-dashed border-zinc-800">
                     <p className="text-xs text-zinc-600 italic">No active diagnostic session. Run a scan to begin guided workflow.</p>
                  </div>
               )}
            </motion.div>
          )}

          {activeTab === 'toolbox' && (
            <motion.div 
              key="toolbox"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-20"
            >
               <EquipmentRegistry />
            </motion.div>
          )}

          {activeTab === 'fuses' && (
            <motion.div 
              key="fuses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-20"
            >
              <div className="fuses-relays-section flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h1 className="fuses-relays-title">
                  <Zap size={22} className="text-amber-500" />
                  Fuses & Relays
                </h1>

                {/* Search Inputs */}
                <div className="space-y-3">
                  <div className="search-inputs-row">
                    <input 
                      type="text" 
                      list="brand-suggestions"
                      placeholder="Make (e.g., Ford)" 
                      value={brand} 
                      onChange={(e) => setBrand(e.target.value)}
                      className="fuses-input" 
                    />
                    <input 
                      type="text" 
                      list="model-suggestions"
                      placeholder="Model (e.g., F150)" 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="fuses-input" 
                    />
                  </div>
                  <div className="search-inputs-row">
                    <input 
                      type="text" 
                      list="year-suggestions"
                      placeholder="Year (e.g., 2023)" 
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="fuses-input" 
                    />
                    <input 
                      type="text" 
                      placeholder="Engine (e.g., 3.5L)" 
                      className="fuses-input" 
                    />
                  </div>
                </div>

                <div className="h-px bg-zinc-800/50 w-full my-6" />

                {/* Circuit Buttons Grid */}
                {fuseSearchResults.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Identified Circuits</h3>
                    <div className="grid grid-cols-1 gap-2">
                       {fuseSearchResults.slice(0, 5).map((res, i) => (
                         <div key={i} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-300">
                                  {res.fuseNumber}
                               </div>
                               <div>
                                  <div className="text-[10px] font-bold text-zinc-200">{res.function}</div>
                                  <div className="text-[8px] text-zinc-500 uppercase">{res.fuseBoxName} • {res.amperage}A</div>
                               </div>
                            </div>
                            <Badge variant={res.amperage > 20 ? 'error' : 'warning'}>{res.amperage}A</Badge>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="circuit-buttons-grid">
                  {[
                    { id: 'engine', label: 'Engine Bay', icon: <Settings size={18} /> },
                    { id: 'interior', label: 'Interior Cabin', icon: <Car size={18} /> },
                    { id: 'lighting', label: 'Lighting', icon: <Zap size={18} /> },
                    { id: 'pd', label: 'Power Dist.', icon: <Activity size={18} /> },
                    { id: 'ign', label: 'Ignition/Start', icon: <Brain size={18} /> },
                    { id: 'other', label: 'Auxiliary', icon: <Database size={18} /> }
                  ].map((circuit) => (
                    <button 
                      key={circuit.id}
                      onClick={() => setSelectedCircuit(circuit.id)}
                      className={`circuit-btn ${selectedCircuit === circuit.id ? 'active' : ''}`}
                    >
                      <div className="mb-2 opacity-60 group-hover:opacity-100">{circuit.icon}</div>
                      {circuit.label}
                    </button>
                  ))}
                </div>

                {/* Prompt Message */}
                <AnimatePresence mode="wait">
                  {selectedCircuit ? (
                    <motion.div 
                      key={selectedCircuit}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="diag-card p-6 border-amber-500/20 bg-amber-500/5"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Zap size={16} className="text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest">{selectedCircuit.replace('-', ' ')} DIAGRAM</h3>
                          <p className="text-[10px] text-zinc-500">Live schematics for {brand || 'Vehicle'}</p>
                        </div>
                      </div>
                      <div className="aspect-video bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                         <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-[0.2em] relative z-10">Schematic Loading...</p>
                         <motion.div 
                          animate={{ 
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-amber-500/5"
                         />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-[9px] font-bold text-zinc-500 text-center">PIN-OUTS</div>
                        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-[9px] font-bold text-zinc-500 text-center">LOAD RATINGS</div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="select-circuit-prompt">
                      <p className="prompt-main">Select a Circuit Area</p>
                      <p className="prompt-sub">Tap one of the buttons above to load fuse and relay diagrams for the selected vehicle system.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>      {/* Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
        <nav className="bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-zinc-800/50 px-2 py-4 grid grid-cols-5 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setActiveTab('diagnose')}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === 'diagnose' ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <LayoutDashboard size={18} strokeWidth={activeTab === 'diagnose' ? 2.5 : 1.5} />
            <span className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-opacity ${activeTab === 'diagnose' ? 'opacity-100' : 'opacity-60'}`}>Diagnose</span>
            {activeTab === 'diagnose' && (
              <motion.div 
                layoutId="nav-glow" 
                className="absolute -bottom-4 w-8 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] rounded-t-full" 
              />
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === 'results' ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Search size={18} strokeWidth={activeTab === 'results' ? 2.5 : 1.5} />
            <span className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-opacity ${activeTab === 'results' ? 'opacity-100' : 'opacity-60'}`}>Results</span>
            {activeTab === 'results' && (
              <motion.div 
                layoutId="nav-glow" 
                className="absolute -bottom-4 w-8 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] rounded-t-full" 
              />
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('repair')}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === 'repair' ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Wrench size={18} strokeWidth={activeTab === 'repair' ? 2.5 : 1.5} />
            <span className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-opacity ${activeTab === 'repair' ? 'opacity-100' : 'opacity-60'}`}>Workflow</span>
            {activeTab === 'repair' && (
              <motion.div 
                layoutId="nav-glow" 
                className="absolute -bottom-4 w-8 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] rounded-t-full" 
              />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('fuses')}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === 'fuses' ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Zap size={18} strokeWidth={activeTab === 'fuses' ? 2.5 : 1.5} />
            <span className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-opacity ${activeTab === 'fuses' ? 'opacity-100' : 'opacity-60'}`}>Fuses</span>
            {activeTab === 'fuses' && (
              <motion.div 
                layoutId="nav-glow" 
                className="absolute -bottom-4 w-8 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] rounded-t-full" 
              />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('toolbox')}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === 'toolbox' ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Settings size={18} strokeWidth={activeTab === 'toolbox' ? 2.5 : 1.5} />
            <span className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-opacity ${activeTab === 'toolbox' ? 'opacity-100' : 'opacity-60'}`}>Toolbox</span>
            {activeTab === 'toolbox' && (
              <motion.div 
                layoutId="nav-glow" 
                className="absolute -bottom-4 w-8 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] rounded-t-full" 
              />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
