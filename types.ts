export enum SimulationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ClimateLocation {
  id: string;
  city: string;
  zone: string; // e.g., "ASHRAE 1A"
  description: string; // e.g., "Very Hot / Humid"
}

export interface HVACSystem {
  id: string;
  name: string;
  description: string;
}

export interface Archetype {
  id: string;
  name: string;
}

export interface BuildingLayout {
  id: string;
  archetypeId: string; // Link layout to archetype
  name: string;
  description?: string;
}

// A "Batch" represents a unique combination of Archetype + Layout + Location + HVAC
// The "Inner Circle" happens inside here: 2 Walls * 2 Roofs * 2 Windows * 2 Infiltration = 16 Permutations
export interface SimulationBatch {
  id: string;
  archetypeId: string;
  layoutId: string;
  locationId: string;
  hvacId: string;
  status: SimulationStatus;
  progress: number; // 0 to 100
  notes?: string;
  lastUpdated?: Date;
}

export interface ParametricStats {
  totalBatches: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  progressPercentage: number;
  totalPermutations: number; // Total individual simulation files (Batches * 16)
}