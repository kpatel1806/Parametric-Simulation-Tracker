import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { 
  LayoutDashboard, 
  Activity, 
  Settings, 
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Building,
  ArrowRight
} from 'lucide-react';

import { LOCATIONS, HVAC_SYSTEMS, LAYOUTS, ARCHETYPES, PERMUTATIONS_PER_BATCH } from './constants';
import { SimulationBatch, SimulationStatus, ParametricStats } from './types';
import { BatchGrid } from './components/BatchGrid';
import { StatsCard } from './components/StatsCard';
import { GeminiAssistant } from './components/GeminiAssistant';

// Generate initial batches based on the hierarchy
const generateInitialState = (): SimulationBatch[] => {
  const batches: SimulationBatch[] = [];
  let idCounter = 1;
  
  ARCHETYPES.forEach(archetype => {
    // Get layouts for this specific archetype
    const archetypeLayouts = LAYOUTS.filter(l => l.archetypeId === archetype.id);
    
    archetypeLayouts.forEach(layout => {
      LOCATIONS.forEach(loc => {
        HVAC_SYSTEMS.forEach(hvac => {
          batches.push({
            id: `BATCH-${idCounter++}`,
            archetypeId: archetype.id,
            layoutId: layout.id,
            locationId: loc.id,
            hvacId: hvac.id,
            status: SimulationStatus.PENDING,
            progress: 0,
            lastUpdated: new Date()
          });
        });
      });
    });
  });
  return batches;
};

const COLORS = {
  [SimulationStatus.COMPLETED]: '#22c55e',
  [SimulationStatus.RUNNING]: '#3b82f6',
  [SimulationStatus.PENDING]: '#e2e8f0',
  [SimulationStatus.FAILED]: '#ef4444',
  [SimulationStatus.QUEUED]: '#f59e0b',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'ai'>('dashboard');
  const [batches, setBatches] = useState<SimulationBatch[]>([]);
  
  // Selection State
  const [selectedArchetype, setSelectedArchetype] = useState<string>(ARCHETYPES[0].id);
  const [selectedLayout, setSelectedLayout] = useState<string>(LAYOUTS.filter(l => l.archetypeId === ARCHETYPES[0].id)[0].id);

  // Update selected layout when archetype changes to prevent invalid state
  useEffect(() => {
    const firstLayout = LAYOUTS.find(l => l.archetypeId === selectedArchetype);
    if (firstLayout) setSelectedLayout(firstLayout.id);
  }, [selectedArchetype]);

  // Initialize data (mock loading)
  useEffect(() => {
    const data = generateInitialState();
    // Simulate some random progress for demo purposes
    const updatedData = data.map(b => {
      const rand = Math.random();
      // Simulate that "Standard" layouts are further ahead
      if (b.layoutId === 'L1' && rand > 0.8) return { ...b, status: SimulationStatus.COMPLETED, progress: 100 };
      if (b.layoutId === 'L1' && rand > 0.75) return { ...b, status: SimulationStatus.RUNNING, progress: 45 };
      if (rand > 0.95) return { ...b, status: SimulationStatus.FAILED, progress: 10 };
      return b;
    });
    setBatches(updatedData);
  }, []);

  const handleStatusChange = (batchId: string, newStatus: SimulationStatus) => {
    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, status: newStatus, lastUpdated: new Date() } : b
    ));
  };

  // Derived Statistics
  const stats: ParametricStats = useMemo(() => {
    const total = batches.length;
    const completed = batches.filter(b => b.status === SimulationStatus.COMPLETED).length;
    const failed = batches.filter(b => b.status === SimulationStatus.FAILED).length;
    const running = batches.filter(b => b.status === SimulationStatus.RUNNING).length;
    const queued = batches.filter(b => b.status === SimulationStatus.QUEUED).length;
    const pending = total - completed - failed - running - queued;
    
    return {
      totalBatches: total,
      completed,
      failed,
      running,
      pending,
      progressPercentage: total > 0 ? (completed / total) * 100 : 0,
      totalPermutations: total * PERMUTATIONS_PER_BATCH
    };
  }, [batches]);

  const chartData = [
    { name: 'Completed', value: stats.completed, color: COLORS.COMPLETED },
    { name: 'Running', value: stats.running, color: COLORS.RUNNING },
    { name: 'Queued', value: stats.totalBatches - stats.completed - stats.failed - stats.running - stats.pending, color: COLORS.QUEUED },
    { name: 'Failed', value: stats.failed, color: COLORS.FAILED },
    { name: 'Pending', value: stats.pending, color: COLORS.PENDING },
  ];

  // Helper to get stats per archetype
  const getArchetypeStats = (archId: string) => {
    const archBatches = batches.filter(b => b.archetypeId === archId);
    const total = archBatches.length;
    if (total === 0) return { completed: 0, total: 0, percent: 0, running: 0, failed: 0 };
    
    const completed = archBatches.filter(b => b.status === SimulationStatus.COMPLETED).length;
    const running = archBatches.filter(b => b.status === SimulationStatus.RUNNING).length;
    const failed = archBatches.filter(b => b.status === SimulationStatus.FAILED).length;
    
    return {
      completed,
      total,
      running,
      failed,
      percent: (completed / total) * 100
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">ParametricPlan.ai</h1>
                <p className="text-xs text-slate-500">IESVE Simulation Tracker</p>
              </div>
            </div>

            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'matrix' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Matrix
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'ai' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Advisor
                </div>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title="Global Progress" 
            value={`${stats.progressPercentage.toFixed(1)}%`} 
            icon={CheckCircle2} 
            color="bg-green-500 text-green-500" 
            subtext={`${stats.completed} / ${stats.totalBatches} batches`}
          />
          <StatsCard 
            title="Active Sims" 
            value={stats.running} 
            icon={Play} 
            color="bg-blue-500 text-blue-500" 
            subtext="Across all archetypes"
          />
          <StatsCard 
            title="Total Permutations" 
            value={stats.totalPermutations.toLocaleString()} 
            icon={Layers} 
            color="bg-indigo-500 text-indigo-500" 
            subtext={`${PERMUTATIONS_PER_BATCH} micro-cases per batch`}
          />
          <StatsCard 
            title="Critical Errors" 
            value={stats.failed} 
            icon={AlertTriangle} 
            color="bg-red-500 text-red-500" 
            subtext="Requires intervention"
          />
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Top Row: Global Charts & Context */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Distribution Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Simulation Status Distribution
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="h-64 w-64 flex-shrink-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-700">{stats.progressPercentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    {chartData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-sm text-slate-500">{entry.value} batches</span>
                           <span className="text-xs font-mono text-slate-400 w-12 text-right">
                             {((entry.value / stats.totalBatches) * 100).toFixed(1)}%
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Context Panel */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-500" />
                  Project Structure
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex-1 overflow-y-auto leading-relaxed">
                  <h4 className="font-bold text-indigo-700 mb-1">Macro-Level Hierarchy</h4>
                  <p className="mb-4 text-xs">Archetypes (e.g., MURB) containing multiple geometric Layouts.</p>
                  
                  <h4 className="font-bold text-indigo-700 mb-1">Micro-Level Parametrics</h4>
                  <p className="mb-2 text-xs">Each batch contains {PERMUTATIONS_PER_BATCH} unique permutations:</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs font-mono text-slate-500">
                    <li>12 Locations</li>
                    <li>3 Wall Types</li>
                    <li>3 Roof Types</li>
                    <li>3 Window Types</li>
                    <li>3 Infiltration Rates</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Archetype Breakdown Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Archetype Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ARCHETYPES.map(arch => {
                  const s = getArchetypeStats(arch.id);
                  return (
                    <div key={arch.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-indigo-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Building className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{arch.name}</h4>
                            <p className="text-xs text-slate-500">{s.total} Simulation Batches</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-slate-800">{s.percent.toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" 
                          style={{ width: `${s.percent}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex gap-4">
                           <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500"/> {s.completed} Done</span>
                           <span className="flex items-center gap-1"><Play className="w-3 h-3 text-blue-500"/> {s.running} Active</span>
                        </div>
                        <span className="flex items-center gap-1 text-red-500 font-medium"><AlertTriangle className="w-3 h-3"/> {s.failed} Errors</span>
                      </div>
                      
                      <button 
                         onClick={() => {
                           setSelectedArchetype(arch.id);
                           setActiveTab('matrix');
                         }}
                         className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-full"
                         title="View Matrix"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-300px)]">
            
            {/* Matrix Filters */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center bg-slate-50 rounded-t-xl">
              
              {/* Archetype Selector */}
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Archetype:</span>
                <select 
                  value={selectedArchetype}
                  onChange={(e) => setSelectedArchetype(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ARCHETYPES.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Layout Selector */}
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Layout:</span>
                <select 
                  value={selectedLayout}
                  onChange={(e) => setSelectedLayout(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LAYOUTS.filter(l => l.archetypeId === selectedArchetype).map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 text-right text-xs text-slate-500 italic hidden md:block">
                 Viewing 1 of {LAYOUTS.filter(l => l.archetypeId === selectedArchetype).length} Layouts for {ARCHETYPES.find(a => a.id === selectedArchetype)?.name}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <BatchGrid 
                batches={batches.filter(b => b.archetypeId === selectedArchetype)} 
                selectedLayout={selectedLayout}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
           <div className="max-w-3xl mx-auto">
             <div className="mb-6">
               <h2 className="text-2xl font-bold text-slate-900">AI Quality Control Advisor</h2>
               <p className="text-slate-500 mt-2">
                 Leverage Gemini to analyze your progress against the CSV constraints and identify potential data quality issues.
               </p>
             </div>
             <GeminiAssistant stats={stats} />
           </div>
        )}

      </main>
    </div>
  );
};

export default App;