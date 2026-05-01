import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Wrench, 
  Cpu, 
  Zap, 
  Eye, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Equipment, getAllEquipment, saveEquipment, deleteEquipment } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

export const EquipmentRegistry: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState<Partial<Equipment>>({
    name: '',
    type: 'scan_tool',
    capabilityLevel: 'basic'
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    const data = await getAllEquipment();
    setEquipment(data);
  };

  const handleAdd = async () => {
    if (!newTool.name) return;
    const tool: Equipment = {
      id: uuidv4(),
      name: newTool.name || 'Unknown Tool',
      type: (newTool.type as any) || 'other',
      capabilityLevel: (newTool.capabilityLevel as any) || 'basic',
      isVerified: true
    };
    await saveEquipment(tool);
    await loadEquipment();
    setIsAdding(false);
    setNewTool({ name: '', type: 'scan_tool', capabilityLevel: 'basic' });
  };

  const handleDelete = async (id: string) => {
    await deleteEquipment(id);
    await loadEquipment();
  };

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'scan_tool': return <Cpu size={16} className="text-blue-400" />;
      case 'multimeter': return <Zap size={16} className="text-yellow-400" />;
      case 'adas_rig': return <Eye size={16} className="text-purple-400" />;
      default: return <Wrench size={16} className="text-zinc-400" />;
    }
  };

  return (
    <div className="diag-card p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Settings className="text-zinc-500" size={20} />
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Equipment Registry</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-white transition-all"
        >
          <Plus size={14} /> Add Tool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {equipment.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/40 rounded-lg border border-zinc-700">
                  {getToolIcon(item.type)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest flex items-center gap-2">
                    {item.type.replace('_', ' ')} 
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    {item.capabilityLevel}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove tool"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {equipment.length === 0 && !isAdding && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl">
             <AlertCircle size={40} strokeWidth={1} className="mb-2" />
             <p className="text-sm">No tools registered in local inventory.</p>
             <p className="text-[10px] uppercase tracking-widest mt-1">AI feasibility checks will be limited.</p>
          </div>
        )}
      </div>

      {/* Add Modal/Overlay */}
      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl"
            >
               <h3 className="text-lg font-bold text-white mb-4">Register New Equipment</h3>
               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tool Name</label>
                    <input 
                      type="text" 
                      value={newTool.name}
                      onChange={(e) => setNewTool({...newTool, name: e.target.value})}
                      className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g., Autel Maxisys Ultra"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Category</label>
                    <select 
                      value={newTool.type}
                      onChange={(e) => setNewTool({...newTool, type: e.target.value as any})}
                      className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="scan_tool">Diagnostic Scan Tool</option>
                      <option value="multimeter">Digital Multimeter</option>
                      <option value="oscilloscope">Digital Oscilloscope</option>
                      <option value="adas_rig">ADAS Calibration Rig</option>
                      <option value="hand_tool">Physical Hand Tools</option>
                      <option value="other">Other/Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Capability</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['basic', 'intermediate', 'advanced', 'oem'].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setNewTool({...newTool, capabilityLevel: lvl as any})}
                            className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                               newTool.capabilityLevel === lvl 
                               ? 'bg-amber-500 border-amber-600 text-black' 
                               : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                          >
                             {lvl}
                          </button>
                       ))}
                    </div>
                  </div>
               </div>
               <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 text-sm font-bold text-zinc-400 bg-transparent hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdd}
                    className="flex-1 py-3 text-sm font-bold bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                  >
                    Save Equipment
                  </button>
               </div>
            </motion.div>
         </div>
      )}
    </div>
  );
};
