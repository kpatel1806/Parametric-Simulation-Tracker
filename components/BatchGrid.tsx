import React, { useMemo } from 'react';
import { SimulationBatch, SimulationStatus } from '../types';
import { LOCATIONS, HVAC_SYSTEMS } from '../constants';
import { CheckCircle, AlertCircle, PlayCircle, Circle, Clock } from 'lucide-react';

interface BatchGridProps {
  batches: SimulationBatch[];
  selectedLayout: string;
  onStatusChange: (batchId: string, newStatus: SimulationStatus) => void;
}

export const BatchGrid: React.FC<BatchGridProps> = ({ batches, selectedLayout, onStatusChange }) => {
  
  // Filter batches for the currently selected layout
  const filteredBatches = useMemo(() => 
    batches.filter(b => b.layoutId === selectedLayout), 
  [batches, selectedLayout]);

  const getBatch = (locId: string, hvacId: string) => {
    return filteredBatches.find(b => b.locationId === locId && b.hvacId === hvacId);
  };

  const getStatusIcon = (status: SimulationStatus) => {
    switch (status) {
      case SimulationStatus.COMPLETED: return <CheckCircle className="w-5 h-5 text-green-500" />;
      case SimulationStatus.FAILED: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case SimulationStatus.RUNNING: return <PlayCircle className="w-5 h-5 text-blue-500 animate-pulse" />;
      case SimulationStatus.QUEUED: return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const getStatusColor = (status: SimulationStatus) => {
    switch (status) {
      case SimulationStatus.COMPLETED: return 'bg-green-50 hover:bg-green-100 border-green-200';
      case SimulationStatus.FAILED: return 'bg-red-50 hover:bg-red-100 border-red-200';
      case SimulationStatus.RUNNING: return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
      case SimulationStatus.QUEUED: return 'bg-amber-50 hover:bg-amber-100 border-amber-200';
      default: return 'bg-white hover:bg-slate-50 border-slate-200';
    }
  };

  const handleNextStatus = (batch: SimulationBatch) => {
    const map: Record<SimulationStatus, SimulationStatus> = {
      [SimulationStatus.PENDING]: SimulationStatus.QUEUED,
      [SimulationStatus.QUEUED]: SimulationStatus.RUNNING,
      [SimulationStatus.RUNNING]: SimulationStatus.COMPLETED,
      [SimulationStatus.COMPLETED]: SimulationStatus.FAILED,
      [SimulationStatus.FAILED]: SimulationStatus.PENDING,
    };
    onStatusChange(batch.id, map[batch.status]);
  };

  return (
    <div className="overflow-x-auto pb-6">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 bg-slate-100 p-4 text-left text-xs font-semibold text-slate-500 border-b border-r border-slate-200 min-w-[200px]">
              Location <span className="text-slate-400 font-normal">vs</span> HVAC
            </th>
            {HVAC_SYSTEMS.map((hvac) => (
              <th key={hvac.id} className="p-4 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 min-w-[140px] bg-slate-50">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded w-fit">{hvac.id}</span>
                  <span className="font-medium text-[10px] leading-tight text-slate-600 line-clamp-3" title={hvac.name}>
                    {hvac.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LOCATIONS.map((loc) => (
            <tr key={loc.id} className="group">
              <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 p-3 border-r border-b border-slate-200">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{loc.city}</span>
                  <span className="text-xs text-slate-500">{loc.zone}</span>
                </div>
              </td>
              {HVAC_SYSTEMS.map((hvac) => {
                const batch = getBatch(loc.id, hvac.id);
                if (!batch) return <td key={`${loc.id}-${hvac.id}`} className="p-2 border-b border-slate-200 bg-slate-50/50"></td>;

                return (
                  <td key={batch.id} className="p-2 border-b border-slate-200">
                    <button
                      onClick={() => handleNextStatus(batch)}
                      className={`w-full h-full min-h-[60px] p-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${getStatusColor(batch.status)}`}
                    >
                      {getStatusIcon(batch.status)}
                      <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                        {batch.status}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};