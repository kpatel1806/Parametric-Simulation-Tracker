import { ClimateLocation, HVACSystem, BuildingLayout, Archetype } from './types';

export const LOCATIONS: ClimateLocation[] = [
  { id: '1A', city: 'Miami, FL', zone: 'ASHRAE 1A', description: 'Very Hot / Humid' },
  { id: '1B', city: 'Phoenix, AZ', zone: 'ASHRAE 1B', description: 'Very Hot / Dry' },
  { id: '2A', city: 'Houston, TX', zone: 'ASHRAE 2A', description: 'Hot / Humid' },
  { id: '3C', city: 'Los Angeles, CA', zone: 'ASHRAE 3C', description: 'Warm / Marine' },
  { id: '4B', city: 'Denver, CO', zone: 'ASHRAE 4B', description: 'Mixed / Dry' },
  { id: '4C', city: 'Seattle, WA', zone: 'ASHRAE 4C', description: 'Mixed / Marine' },
  { id: '5A', city: 'Chicago, IL', zone: 'ASHRAE 5A', description: 'Cool / Humid' },
  { id: '5B', city: 'Calgary, AB', zone: 'ASHRAE 5B', description: 'Cool / Dry' },
  { id: '6A', city: 'Minneapolis, MN', zone: 'ASHRAE 6A', description: 'Cold / Humid' },
  { id: '7A', city: 'Winnipeg, MB', zone: 'ASHRAE 7A', description: 'Very Cold' },
  { id: '7B', city: 'Whitehorse, YT', zone: 'ASHRAE 7B', description: 'Very Cold / Dry' },
  { id: '8', city: 'Resolute, NU', zone: 'ASHRAE 8', description: 'Arctic' },
];

export const ARCHETYPES: Archetype[] = [
  { id: 'OFFICE', name: 'Office Building' },
  { id: 'MURB', name: 'Multi-Unit Residential (MURB)' },
  { id: 'RETAIL', name: 'Retail Store' },
  { id: 'SCHOOL', name: 'School' },
  { id: 'HOSPITAL', name: 'Hospital' },
];

export const LAYOUTS: BuildingLayout[] = [
  // Office Layouts
  { id: 'L1', archetypeId: 'OFFICE', name: 'Layout 1 (Standard Archetype)' },
  { id: 'L2', archetypeId: 'OFFICE', name: 'Layout 2 (Tall + Narrow)' },
  { id: 'L3', archetypeId: 'OFFICE', name: 'Layout 3 (Short + Wide)' },
  // MURB Layouts
  { id: 'L1', archetypeId: 'MURB', name: 'Layout 1 (Standard Archetype)' },
  { id: 'L2', archetypeId: 'MURB', name: 'Layout 2 (Tall + Narrow)' },
  { id: 'L3', archetypeId: 'MURB', name: 'Layout 3 (Short + Wide)' },
  // Retail Layouts
  { id: 'L1', archetypeId: 'RETAIL', name: 'Layout 1 (Standard Archetype)' },
  { id: 'L2', archetypeId: 'RETAIL', name: 'Layout 2 (Tall + Narrow)' },
  { id: 'L3', archetypeId: 'RETAIL', name: 'Layout 3 (Short + Wide)' },
  // School Layouts
  { id: 'L1', archetypeId: 'SCHOOL', name: 'Layout 1 (Standard Archetype)' },
  { id: 'L2', archetypeId: 'SCHOOL', name: 'Layout 2 (Tall + Narrow)' },
  { id: 'L3', archetypeId: 'SCHOOL', name: 'Layout 3 (Short + Wide)' },
  // Hospital Layouts
  { id: 'L1', archetypeId: 'HOSPITAL', name: 'Layout 1 (Standard Archetype)' },
  { id: 'L2', archetypeId: 'HOSPITAL', name: 'Layout 2 (Tall + Narrow)' },
  { id: 'L3', archetypeId: 'HOSPITAL', name: 'Layout 3 (Short + Wide)' },
];

export const HVAC_SYSTEMS: HVACSystem[] = [
  { id: 'S1', name: '1 Boiler + PTAC', description: 'Heat: Central HW Boiler, Cool: DX, Vent: Single zone PTU' },
  { id: 'S2', name: '2 Furnace + AC', description: 'Heat: Furnace, Cool: DX, Vent: CV' },
  { id: 'S3', name: '3 Furnace', description: 'Heat: Furnace, Cool: None, Vent: CV' },
  { id: 'S4', name: '4 Electric AHU', description: 'Heat: Electric, Cool: None, Vent: CV' },
  { id: 'S12', name: '12 PTHP + Electric', description: 'Heat: ASHP + Electric Backup, Cool: ASHP, Vent: CV' },
  { id: 'S13', name: '13 PTHP + Boiler', description: 'Heat: ASHP + Boiler, Cool: ASHP, Vent: CV' },
  { id: 'S14', name: '14 SZHP + Electric', description: 'Heat: ASHP + Electric Backup, Cool: ASHP + Outdoor Unit, Vent: CV' },
  { id: 'S19', name: '19 WSHP + Boiler + CT', description: 'Heat: WSHPs + Boiler Backup, Cool: WSHPs + Cooling Tower, Vent: DOAS' },
  { id: 'S21', name: '21 VRF + Boiler + DOAS', description: 'Heat: ASHP VRF + Boiler Backup, Cool: ASHP VRF, Vent: DOAS' },
];

// Parametric Permutations Logic:
// 12 Locations
// x 3 Wall Types
// x 3 Roof Types
// x 3 Window Types
// x 3 Infiltration Rates
// = 81 permutations per Batch (Location+HVAC+Layout)
export const PERMUTATIONS_PER_BATCH = 3 * 3 * 3 * 3; // 81

export const CSV_NOTES_CONTEXT = `
Parametric Simulation Plan Structure:

MACRO-LEVEL HIERARCHY (Archetypes & Layouts):
- Archetypes: MURB, Office, Retail, School, Hospital
- Layouts per Archetype: 
  1. Standard Archetype
  2. Tall + Narrow
  3. Short + Wide

MICRO-LEVEL PARAMETRICS (The Simulation Engine):
- Runs for every HVAC System (9 Systems)
- Runs for every Location (12 Locations)
- Inside each run (Batch), the following variables are permuted:
  - 3 Wall Types
  - 3 Roof Types
  - 3 Window Types
  - 3 Infiltration Rates
  - Total Permutations per Batch = 81

QC & Constraints:
1. "System Effect": Ensure HVAC types are internally consistent across climates.
2. Geometry/Envelope grids must use identical sampling seeds.
3. Due to IES errors, HVAC systems are simulated individually.
4. Total Scope: (Archetypes * Layouts * HVAC * Locations) * 81 permutations.
`;