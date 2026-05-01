import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Cpu, Brain, Wrench, CheckCircle2, 
  Loader2, Zap, AlertTriangle, Info, Cable 
} from 'lucide-react';

export type StepStatus = "pending" | "streaming" | "done" | "error";

export interface DiagnosticStep {
  id: string;
  type: 'observation' | 'tool' | 'reasoning' | 'action' | 'conclusion';
  title: string;
  status: StepStatus;
  content: string;
  metadata?: any;
}

interface TimelineCardProps {
  step: DiagnosticStep;
  isLast: boolean;
}

const StepIcon = ({ type, status }: { type: DiagnosticStep['type'], status: StepStatus }) => {
  if (status === 'streaming') return <Loader2 className="animate-spin text-brand" size={18} />;
  
  switch (type) {
    case 'observation': return <Search className="text-blue-400" size={18} />;
    case 'tool': return <Zap className="text-yellow-400" size={18} />;
    case 'reasoning': return <Brain className="text-purple-400" size={18} />;
    case 'action': return <Wrench className="text-orange-400" size={18} />;
    case 'conclusion': return <CheckCircle2 className="text-green-400" size={18} />;
    default: return <Info className="text-gray-400" size={18} />;
  }
};

const TimelineCard = ({ step, isLast }: TimelineCardProps) => {
  const isActive = step.status === 'streaming';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0.7, 
        y: 0,
        scale: isActive ? 1.02 : 1
      }}
      className={`relative pl-8 pb-8 transition-all duration-300 ${isActive ? 'z-10' : 'z-0'}`}
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className={`absolute left-[13px] top-8 bottom-0 w-0.5 transition-colors duration-500 ${isActive ? 'bg-brand/30' : 'bg-white/5'}`} />
      )}
      
      {/* Icon Node */}
      <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-500 ${
        isActive 
          ? 'bg-brand/20 border-brand shadow-[0_0_15px_rgba(0,212,255,0.4)] animate-pulse' 
          : step.status === 'done' 
          ? 'bg-white/5 border-white/20' 
          : 'bg-transparent border-white/10'
      }`}>
        <StepIcon type={step.type} status={step.status} />
      </div>

      <div className={`glass-card p-4 transition-all duration-500 ${
        isActive 
          ? 'border-brand/40 bg-brand/5 shadow-[0_4px_20px_rgba(0,212,255,0.1)]' 
          : 'border-white/10 grayscale-[0.2]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              {step.title}
            </h4>
            {step.metadata?.skill && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted font-mono uppercase">
                {step.metadata.skill}
              </span>
            )}
          </div>
          {isActive && (
            <span className="text-[8px] font-accent text-brand animate-pulse">ANALYZING...</span>
          )}
        </div>
        
        <div className={`text-sm font-accent transition-colors duration-500 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
          {step.content}
        </div>

        {step.metadata?.actions && Array.isArray(step.metadata.actions) && (
          <div className="mt-4 space-y-3">
            {step.metadata.actions.map((action: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-brand/5 border border-brand/20">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-brand/20 flex items-center justify-center text-[10px] font-bold text-brand mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white/90">{action.instruction}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {action.toolRequired && (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-brand font-mono">
                          <Wrench size={10} /> {action.toolRequired.toUpperCase()}
                        </span>
                      )}
                      {action.expectedOutcome && (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-500 font-mono">
                          <CheckCircle2 size={10} /> {action.expectedOutcome}
                        </span>
                      )}
                    </div>

                    {step.status === 'done' && step.type === 'action' && !action.result && (
                      <div className="mt-4 flex items-center gap-2">
                        <button 
                          onClick={() => step.metadata.onResult?.(idx, 'normal')}
                          className="flex-1 px-2 py-1.5 rounded bg-green-500/10 border border-green-500/30 text-[9px] text-green-500 font-bold uppercase hover:bg-green-500/20 transition-colors"
                        >
                          Normal
                        </button>
                        <button 
                          onClick={() => step.metadata.onResult?.(idx, 'abnormal')}
                          className="flex-1 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-[9px] text-red-500 font-bold uppercase hover:bg-red-500/20 transition-colors"
                        >
                          Abnormal
                        </button>
                        <button 
                          onClick={() => step.metadata.onResult?.(idx, 'not_sure')}
                          className="flex-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-[9px] text-zinc-400 font-bold uppercase hover:bg-white/10 transition-colors"
                        >
                          Not Sure
                        </button>
                      </div>
                    )}

                    {action.result && (
                      <div className={`mt-3 px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-2 ${
                        action.result === 'normal' ? 'bg-green-500/10 text-green-500' : 
                        action.result === 'abnormal' ? 'bg-red-500/10 text-red-500' : 
                        'bg-white/5 text-zinc-400'
                      }`}>
                         <div className={`w-1 h-1 rounded-full ${
                           action.result === 'normal' ? 'bg-green-500' : 
                           action.result === 'abnormal' ? 'bg-red-500' : 
                           'bg-zinc-400'
                         }`} />
                         REPORTED: {action.result}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step.metadata && step.type === 'tool' && (
          <div className="mt-3 p-3 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-brand/80">
             <div className="flex items-center gap-2 mb-1">
                <Cable size={12} />
                <span className="opacity-60">RUNTIME_CONTEXT</span>
             </div>
             <div className="mt-1 text-text-muted break-all">
                {JSON.stringify(step.metadata.input)}
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const LiveDiagnosticTimeline = ({ steps }: { steps: DiagnosticStep[] }) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => (
          <TimelineCard 
            key={step.id} 
            step={step} 
            isLast={index === steps.length - 1} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
