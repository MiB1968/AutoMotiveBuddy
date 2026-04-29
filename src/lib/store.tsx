/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

// Types
export interface DTC {
  id: string;
  code: string;
  description?: string;
  category?: string; // e.g. Powertrain
  system?: string; // e.g. Engine
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  // Richer causes structure
  causes?: (string | { item: string; probability: number })[] | string;
  probableCauses?: string[];
  // Richer repair content
  diagnostic_steps?: string[];
  solutions?: string[]; // step-by-step
  remediation?: string[];
  // Vehicle specific notes
  vehicle_specific_notes?: { [make: string]: string };
  // Meta
  tools?: string[];
  costPrefix?: string;
  costRange?: string;
  manufacturer?: string;
  dtcPrefix?: string;
  affectedYears?: number[];
  timeEstimate?: string;
  estimatedCost?: string;
  dangerLevel?: string;
  title?: string;
  confidence?: number;
}

export interface FuseEntry {
  id: string;
  location: string;
  number: string;
  amperage: string;
  circuit: string;
  protects: string;
}

export interface WiringDiagram {
  id: string;
  system: string;
  description: string;
  content: string; // ASCII or textual representation
}

export interface ServiceChapter {
  title: string;
  steps: string[];
}

export interface VehicleUnit {
  id: string;
  category: 'Car' | 'Heavy Equipment' | 'Motorcycle' | 'Agriculture' | 'Electric';
  make: string;
  model: string;
  yearRange: string;
  manualUrl: string;
  specs: { [key: string]: string };
  commonIssues: string[];
  serviceManual: ServiceChapter[];
  wiringDiagrams: WiringDiagram[];
  fuseBoxes: { [name: string]: FuseEntry[] };
  fluids: { name: string; spec: string; capacity: string; interval: string; }[];
  torqueSpecs: { component: string; nm: string; ftlb: string; }[];
}

export interface User {
  id: string; // fallback
  uid: string; // backend primary
  username?: string;
  fullName?: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin' | 'guest';
  status: 'pending' | 'active' | 'blocked' | 'disabled';
  createdAt: string;
  subscription?: {
    plan: '1_month' | '3_month' | '6_month' | '1_year' | 'guest_24h' | 'none';
    startDate: string;
    endDate: string;
  } | null;
  // Legacy fields for UI compatibility
  trial_start_date?: string;
  trial_end_date?: string;
  account_start_date?: string;
  account_end_date?: string;
  avatarUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'critical';
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  type: 'DTC' | 'Vehicle' | 'Diagram';
  itemId: string;
  title: string;
  timestamp: string;
}

export interface SearchHistory {
  id: string;
  userId: string;
  type: 'DTC' | 'Vehicle' | 'Wiring' | 'Fuse';
  query: string;
  timestamp: string;
}

const getSafeAvatar = () => {
  try { return localStorage.getItem('ab_admin_avatar') || '/ruben_avatar.jpg'; }
  catch { return '/ruben_avatar.jpg'; }
};

// Initial Admin
const INITIAL_ADMIN: User = {
  id: 'admin-001',
  uid: 'admin-uid-001',
  username: 'rubenllego',
  fullName: 'Ruben Llego O.',
  email: 'rubenllego@autobuddy.pro',
  role: 'super_admin',
  status: 'active',
  createdAt: new Date().toISOString(),
  trial_start_date: new Date().toISOString(),
  trial_end_date: new Date(Date.now() + 3 * 3600000).toISOString(),
  avatarUrl: getSafeAvatar(),
};

// PRE-LOADED DTC DATABASE
const INITIAL_DTCS: DTC[] = [
  {
    id: 'p0100', code: 'P0100', description: 'Mass Air Flow Sensor Circuit Malfunction', category: 'Powertrain', system: 'Air Induction', severity: 'medium',
    symptoms: ['Engine stalling', 'Rough idling', 'Poor acceleration', 'Check engine light'],
    causes: ['Dirty MAF sensor', 'Damaged intake boot', 'Faulty wiring', 'Failed ECM'],
    solutions: ['Clean MAF sensor with specialized spray', 'Inspect intake boot for cracks', 'Check MAF connector for corrosion', 'Test MAF sensor signal with OBD scanner'],
    tools: ['OBD Scanner', 'MAF Cleaner Spray', 'Screwdriver Set'], costPrefix: '₱', costRange: '1,500 – 12,000'
  },
  {
    id: 'p0300', code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', category: 'Powertrain', system: 'Engine/Ignition', severity: 'high',
    symptoms: ['Engine hesitation', 'Shaking at idle', 'Loss of power', 'Flashing Check Engine Light'],
    causes: ['Worn spark plugs', 'Faulty ignition coils', 'Low fuel pressure', 'Vacuum leaks'],
    solutions: ['Identify misfiring cylinder using scanner', 'Inspect spark plugs for carbon buildup', 'Test ignition coil resistance', 'Perform cylinder compression test'],
    tools: ['OBD Scanner', 'Spark Plug Socket', 'Multimeter', 'Compression Tester'], costPrefix: '₱', costRange: '800 – 8,500'
  },
  {
    id: 'p0420', code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', category: 'Powertrain', system: 'Exhaust', severity: 'medium',
    symptoms: ['Sulfur smell (rotten eggs)', 'Engine light on', 'Failed emissions test'],
    causes: ['Faulty catalytic converter', 'Exhaust leaks', 'Bad O2 sensor readings', 'Fuel system rich condition'],
    solutions: ['Inspect for exhaust manifold leaks', 'Check O2 sensor operation', 'Perform engine tune-up to stop soot', 'Replace catalytic converter if internal structure failed'],
    tools: ['Exhaust Leak Tester', 'OBD Scanner'], costPrefix: '₱', costRange: '5,000 – 45,000'
  },
  {
    id: 'p0171', code: 'P0171', description: 'System Too Lean Bank 1', category: 'Powertrain', system: 'Fuel/Air Management', severity: 'medium',
    symptoms: ['Rough idle', 'Engine hesitation', 'Hesitation during acceleration'],
    causes: ['Vacuum leak', 'Dirty MAF sensor', 'Clogged fuel filter', 'Faulty fuel pump'],
    solutions: ['Perform smoke test for vacuum leaks', 'Clean MAF sensor', 'Test fuel pressure', 'Inspect fuel injectors'],
    tools: ['Smoke Machine', 'OBD Scanner', 'Fuel Pressure Gauge'], costPrefix: '₱', costRange: '1,200 – 15,000'
  },
  {
    id: 'p0130', code: 'P0130', description: 'O2 Sensor Circuit Malfunction Bank 1 Sensor 1', category: 'Powertrain', system: 'Emissions', severity: 'medium',
    symptoms: ['High fuel consumption', 'Rough idle', 'Black smoke from exhaust'],
    causes: ['Faulty O2 sensor', 'Wiring harness damage', 'Exhaust leak before sensor'],
    solutions: ['Verify sensor heater resistance', 'Check signal voltage with scanner', 'Repair wiring if needed', 'Replace O2 sensor'],
    tools: ['O2 Sensor Socket', 'Scanner'], costPrefix: '₱', costRange: '2,500 – 8,000'
  },
  {
    id: 'p1000', code: 'P1000', description: 'On-Board Diagnostic (OBD) Systems Readiness Test Not Complete', category: 'Network', system: 'OBD-II', severity: 'low',
    symptoms: ['No drivability symptoms', 'Check Engine Light may be on (Ford specific)'],
    causes: ['Battery disconnected recently', 'DTCs cleared recently', 'Incomplete drive cycle'],
    solutions: ['Perform a complete drive cycle (Highway + City)', 'Ensure battery connections are tight', 'Wait for monitors to set to READY'],
    tools: ['OBD Scanner'], costPrefix: '₱', costRange: '0 – 500'
  },
  {
    id: 'p1260', code: 'P1260', description: 'Theft Detected - Engine Disabled (PATS)', category: 'Body/Security', system: 'Immobilizer', severity: 'critical',
    symptoms: ['Engine cranks but wont start', 'Security light flashing rapidly', 'Theft light active'],
    causes: ['Unprogrammed key used', 'Faulty PATS transceiver', 'PATS/ICM communication lost', 'Wiring fault in security column'],
    solutions: ['Try alternative programmed key', 'Check PATS fuse', 'Verify transceiver ring resistance', 'Reprogram keys using IDS/Forscan'],
    tools: ['Forscan', 'VCM II Scanner', 'New Transponder Key'], costPrefix: '₱', costRange: '2,500 – 15,000'
  },
  {
    id: 'p0299', code: 'P0299', description: 'Turbocharger/Supercharger Underboost', category: 'Powertrain', system: 'Forced Induction', severity: 'medium',
    symptoms: ['Reduced engine power', 'Whistling sound under load', 'Limp mode active'],
    causes: ['Loose turbo piping (Boost leak)', 'Faulty Wastegate solenoid', 'Internal turbo failure', 'Failed MAP sensor'],
    solutions: ['Inspect turbo hoses for cracks', 'Perform boost leak pressure test', 'Check wastegate actuator operation', 'Verify MAP sensor readings'],
    tools: ['Pressure Tester', 'Vacuum Pump', 'OBD Scanner'], costPrefix: '₱', costRange: '3,000 – 85,000'
  },
  {
    id: 'b1318', code: 'B1318', description: 'Battery Voltage Low', category: 'Body', system: 'Electrical', severity: 'medium',
    symptoms: ['Slow engine crank', 'Dimming dashboard lights', 'Random modules resetting'],
    causes: ['Weak battery', 'Alternator undercharging', 'Corroded battery terminals'],
    solutions: ['Charge and load test battery', 'Check alternator output voltage (13.5V-14.5V)', 'Clean battery terminals and grounds'],
    tools: ['Battery Load Tester', 'Multimeter'], costPrefix: '₱', costRange: '100 – 6,500'
  },
  {
    id: 'c0035', code: 'C0035', description: 'Left Front Wheel Speed Sensor Circuit', category: 'Chassis', system: 'ABS/Traction', severity: 'medium',
    symptoms: ['ABS light on', 'Traction Control disabled', 'Speedometer erratic'],
    causes: ['Foreign debris on sensor ring', 'Faulty wheel speed sensor', 'Wiring harness break in wheel well'],
    solutions: ['Clean sensor tip and tone ring', 'Verify sensor AC voltage while spinning wheel', 'Check continuity of wheel speed circuit'],
    tools: ['Multimeter', 'Scanner'], costPrefix: '₱', costRange: '1,500 – 8,000'
  },
  {
    id: 'p0113', code: 'P0113', description: 'Intake Air Temperature Sensor 1 Circuit High Input', category: 'Powertrain', system: 'Air Induction', severity: 'low',
    symptoms: ['Poor fuel economy', 'Hard starting when cold', 'Check engine light'],
    causes: ['Faulty IAT sensor', 'Broken wires in sensor harness', 'Poor electrical connection'],
    solutions: ['Inspect sensor connector', 'Test sensor resistance with ohmmeter', 'Check 5V reference from ECM', 'Replace IAT sensor'],
    tools: ['Multimeter'], costPrefix: '₱', costRange: '500 – 3,500'
  },
  {
    id: 'p0401', code: 'P0401', description: 'Exhaust Gas Recirculation (EGR) Flow Insufficient Detected', category: 'Powertrain', system: 'Emissions', severity: 'medium',
    symptoms: ['Engine knocking (pinging)', 'Rough idle', 'Increased emissions'],
    causes: ['Clogged EGR passages', 'Failed EGR valve', 'Faulty DPFE sensor', 'Vacuum line leak'],
    solutions: ['Clean EGR valve and intake ports', 'Check vacuum to EGR valve', 'Test EGR solenoid', 'Replace EGR valve if diaphragm failed'],
    tools: ['Vacuum Pump', 'Carbon Cleaning Brushes'], costPrefix: '₱', costRange: '2,500 – 18,000'
  },
  {
    id: 'p0442', code: 'P0442', description: 'Evaporative Emission System Leak Detected (Small Leak)', category: 'Powertrain', system: 'EVAP', severity: 'low',
    symptoms: ['Slight fuel odor', 'Check engine light'],
    causes: ['Loose or damaged fuel cap', 'Leaking vent or purge solenoid', 'Small hole in charcoal canister'],
    solutions: ['Tighten or replace fuel cap', 'Perform EVAP smoke test', 'Inspect purge valve operation', 'Check canister for cracks'],
    tools: ['Smoke Machine', 'Scanner'], costPrefix: '₱', costRange: '300 – 12,000'
  },
  {
    id: 'p0500', code: 'P0500', description: 'Vehicle Speed Sensor Malfunction', category: 'Powertrain', system: 'Transmission/VSS', severity: 'medium',
    symptoms: ['Speedometer not working', 'Erratic shifting', 'ABS/Traction light on'],
    causes: ['Faulty speed sensor', 'Broken drive gear', 'Wiring harness damage'],
    solutions: ['Inspect sensor gear for stripped teeth', 'Test sensor signal frequency', 'Check wiring for shorts to ground'],
    tools: ['Multimeter', 'Jack Stands'], costPrefix: '₱', costRange: '1,200 – 6,000'
  },
  {
    id: 'p0700', code: 'P0700', description: 'Transmission Control System (MIL Request)', category: 'Powertrain', system: 'Transmission', severity: 'high',
    symptoms: ['Transmission in Limp Mode', 'Harsh shifting', 'Slipping gears'],
    causes: ['Internal transmission fault', 'Faulty shift solenoid', 'TCM communication error'],
    solutions: ['Scan TCM for specific sub-codes', 'Check transmission fluid level and color', 'Inspect TCM connector for fluid intrusion'],
    tools: ['Advanced Scanner'], costPrefix: '₱', costRange: '5,000 – 150,000'
  },
  {
    id: 'p2135', code: 'P2135', description: 'Throttle/Pedal Position Sensor/Switch A/B Voltage Correlation', category: 'Powertrain', system: 'Drive-by-Wire', severity: 'high',
    symptoms: ['Forced idle/Limp mode', 'No throttle response', 'Surging'],
    causes: ['Faulty Throttle Body (TPS)', 'Accelerator Pedal Sensor fail', 'Wiring correlation error'],
    solutions: ['Clean throttle plate carbon', 'Relearn throttle position', 'Replace throttle body assembly'],
    tools: ['Scanner', 'Contact Cleaner'], costPrefix: '₱', costRange: '6,000 – 25,000'
  },
  {
    id: 'u0100', code: 'U0100', description: 'Lost Communication With ECM/PCM A', category: 'Network', system: 'CAN Bus', severity: 'critical',
    symptoms: ['No crank', 'Multiple warning lights', 'Gauges flat'],
    causes: ['Blown ECM fuse', 'Dead CAN bus network', 'Corroded ground point'],
    solutions: ['Check power to ECM', 'Measure resistance between CAN High and Low (60 ohms)', 'Inspect main engine harness grounds'],
    tools: ['Multimeter', 'Oscilloscope'], costPrefix: '₱', costRange: '2,000 – 65,000'
  },
  {
    id: 'p0135', code: 'P0135', description: 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)', category: 'Powertrain', system: 'Exhaust/Emissions', severity: 'medium',
    symptoms: ['Higher fuel consumption', 'Check engine light'],
    causes: ['Internal sensor heater fail', 'Blown 15A heater fuse', 'Ground circuit high resistance'],
    solutions: ['Verify fuse integrity', 'Measure heater resistance (typically 5-20 ohms)', 'Check for battery voltage at connector pin'],
    tools: ['Multimeter'], costPrefix: '₱', costRange: '1,500 – 6,500'
  },
  {
    id: 'p0507', code: 'P0507', description: 'Idle Control System RPM Higher Than Expected', category: 'Powertrain', system: 'Engine/Idle', severity: 'medium',
    symptoms: ['High idling', 'Surging', 'Difficulty stopping'],
    causes: ['Vacuum leak', 'Dirty throttle body', 'IAC valve failure', 'PCV leak'],
    solutions: ['Perform smoke test for leaks', 'Clean throttle plate', 'Reset idle air relearn via scanner'],
    tools: ['Smoke Machine', 'Scanner'], costPrefix: '₱', costRange: '500 – 12,000'
  },
  {
    id: 'p0456', code: 'P0456', description: 'Evaporative Emission System Leak Detected (Very Small Leak)', category: 'Powertrain', system: 'EVAP', severity: 'low',
    symptoms: ['None usually', 'Check engine light'],
    causes: ['Pin-hole leak in hose', 'Leaking gas cap seal', 'FTPS sensor drift'],
    solutions: ['Pressure test fuel tank', 'Check charcoal canister seals', 'Replace fuel cap'],
    tools: ['EVAP Pressure Tester'], costPrefix: '₱', costRange: '300 – 8,000'
  },
  {
    id: 'p0128', code: 'P0128', description: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)', category: 'Powertrain', system: 'Cooling', severity: 'medium',
    symptoms: ['Slow engine warm-up', 'Cabin heater blowing cold', 'Poor fuel economy'],
    causes: ['Stuck open thermostat', 'Faulty coolant temp sensor (ECT)', 'Low coolant level'],
    solutions: ['Verify actual engine temp with laser thermometer', 'Check ECT sensor resistance', 'Replace thermostat with OEM unit'],
    tools: ['Non-contact Thermometer', 'Coolant Refill Kit'], costPrefix: '₱', costRange: '800 – 4,500'
  },
  {
    id: 'p0101', code: 'P0101', description: 'Mass Air Flow (MAF) Circuit Range/Performance Problem', category: 'Powertrain', system: 'Air Induction', severity: 'medium',
    symptoms: ['Hesitation', 'Rich/Lean codes accompanying', 'Black exhaust smoke'],
    causes: ['Dirty MAF sensor', 'Air leak after MAF', 'Faulty wiring harness'],
    solutions: ['Clean MAF sensor with approved spray', 'Smoke test intake system', 'Measure MAF signal Hz or g/s at idle'],
    tools: ['Scanner', 'MAF Cleaner'], costPrefix: '₱', costRange: '1,500 – 15,000'
  }
];

// Re-populating units with more complex structure
const INITIAL_UNITS: VehicleUnit[] = [
  {
    id: 'toyota-fortuner',
    category: 'Car',
    make: 'Toyota',
    model: 'Fortuner',
    yearRange: '2016-2025',
    manualUrl: '#',
    specs: {
      'Engine Type': '2.8L 1GD-FTV Diesel',
      'Displacement': '2,755 cc',
      'Power Output': '201 hp @ 3,400 rpm',
      'Torque': '500 Nm @ 1,600-2,800 rpm',
      'Transmission': '6-Speed Automatic',
      'Drivetrain': '4x4 / 4x2 Part-time',
      'Tire Size': '265/60 R18',
      'Braking System': 'Ventilated Discs Front/Rear',
      'Fuel Capacity': '80 Liters'
    },
    commonIssues: [
      'DPF Clogging in short city drives',
      'Turbo actuator sensitive to dust',
      'Brake pad wear on heavy towing'
    ],
    serviceManual: [
      { title: 'Engine Oil Service', steps: ['Warm up engine', 'Remove drain plug (14mm)', 'Drain oil into container', 'Replace filter (04152-YZZA1)', 'Install plug with new gasket', 'Refill 7.5L 5W-30 Synthetic'] },
      { title: 'Brake Pad Replacement', steps: ['Jack up vehicle', 'Remove wheels', 'Undo 14mm caliper bolts', 'Retract piston with C-clamp', 'Insert new pads', 'Reassemble and pump pedal'] }
    ],
    wiringDiagrams: [
      { id: 'wd1', system: 'Starting System', description: 'Battery to Starter Circuit', content: '[BATTERY+] --(RED)--> [MAIN FUSE 100A] --(RED)--> [IGNITION SWITCH] --(GREEN)--> [STARTER RELAY] --(BLUE)--> [STARTER SOLENOID]' }
    ],
    fuseBoxes: {
      'Engine Bay': [
        { id: 'tf-f1', location: 'Engine Compartment', number: '1', amperage: '30A', circuit: 'ABS PUMP', protects: 'Anti-lock Brake System Motor' },
        { id: 'tf-f2', location: 'Engine Compartment', number: '2', amperage: '10A', circuit: 'ECU-B', protects: 'Engine Control Unit Backup' }
      ]
    },
    fluids: [
      { name: 'Engine Oil', spec: 'SAE 5W-30 ACEA C2', capacity: '7.5L', interval: '10,000 KM' },
      { name: 'Transmission Fluid', spec: 'Toyota Genuine ATF WS', capacity: '9.0L', interval: '80,000 KM' }
    ],
    torqueSpecs: [
      { component: 'Wheel Lug Nuts', nm: '103', ftlb: '76' },
      { component: 'Oil Drain Plug', nm: '38', ftlb: '28' }
    ]
  },
  {
    id: 'ford-f150',
    category: 'Car',
    make: 'Ford',
    model: 'F-150',
    yearRange: '2015-2023',
    manualUrl: '#',
    specs: {
      'Engine': '3.5L EcoBoost V6',
      'Horsepower': '400 hp',
      'Payload': '3,325 lbs',
      'Towing': '14,000 lbs',
      'Drive': '4WD with Electronic Locker'
    },
    commonIssues: ['Cam Phaser Rattle', 'IWE Vacuum Leaks', 'Panoramic Sunroof track failure'],
    serviceManual: [
      { title: 'EcoBoost Oil Change', steps: ['Access plastic drain plug', 'Drain oil (6 Quarts)', 'Replace FL-500S filter', 'Refill 5W-30 Full Synthetic'] }
    ],
    wiringDiagrams: [{ id: 'f150-wd1', system: 'Fuel Delivery', description: 'Fuel Pump Control Module', content: '[FPCM] --(BN/WH)--> [FUEL PUMP] <-- (BK) -- [GROUND G103]' }],
    fuseBoxes: { 'Battery Junction Box': [{ id: 'f10', location: 'Underhood', number: '10', amperage: '20A', circuit: 'FUEL PUMP', protects: 'FPCM' }] },
    fluids: [{ name: 'Engine Oil', spec: 'Motorcraft 5W-30', capacity: '5.7L', interval: '5,000 Miles' }],
    torqueSpecs: [{ component: 'Lug Nuts', nm: '204', ftlb: '150' }]
  },
  {
    id: 'cat-320-legacy',
    category: 'Heavy Equipment',
    make: 'Caterpillar',
    model: '320 Excavator',
    yearRange: '2018-2024',
    manualUrl: '#',
    specs: {
      'Engine': 'Cat C4.4 ACERT',
      'Operating Weight': '22,500 kg',
      'Max Dig Depth': '6.7m',
      'Swing Speed': '11.5 rpm'
    },
    commonIssues: ['Hydraulic pilot valve sticking', 'DEF injector crystallization', 'Undercarriage track tension loss'],
    serviceManual: [
      { title: 'Hydraulic Filter Service', steps: ['Relieve tank pressure', 'Remove spin-on filter', 'Inspect for metal shavings', 'Install new CAT filter', 'Check fluid level at sight glass'] }
    ],
    wiringDiagrams: [{ id: 'cat320-wd1', system: 'Hydraulic Logic', description: 'Pump Solenoid Control', content: '[ECM] --(CH622)--> [PUMP REGULATOR] --(GND)--> [FRAME]' }],
    fuseBoxes: { 'Cab Panel': [{ id: 'f5', location: 'Behind Seat', number: '5', amperage: '10A', circuit: 'MONITOR', protects: 'Display Unit' }] },
    fluids: [{ name: 'Hydraulic Oil', spec: 'CAT HYDO Advanced 10', capacity: '143L', interval: '3,000 Hours' }],
    torqueSpecs: [{ component: 'Track Bolt', nm: '400', ftlb: '295' }]
  },
  {
    id: 'jd-8r',
    category: 'Agriculture',
    make: 'John Deere',
    model: '8R 370',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: {
      'Engine': 'PowerTech 9.0L',
      'Rated Power': '370 hp',
      'Rear Hitch': '9,072 kg',
      'Fuel Tank': '719 Liters'
    },
    commonIssues: ['IVT Sensitivity', 'SCV Valve Leaks', 'StarFire GPS Signal drops'],
    serviceManual: [
      { title: 'Engine Air Filter', steps: ['Unlock primary filter housing', 'Pull out primary element', 'NEVER blow with compressed air', 'Install new element', 'Reset air restricted sensor'] }
    ],
    wiringDiagrams: [{ id: 'j_wd1', system: 'CAN BUS', description: 'ISO Bus Implementation', content: '[Terminator] -- [J1939 HIGH] -- [Implement Node] -- [J1939 LOW]' }],
    fuseBoxes: { 'Primary Load': [{ id: 'jd8r-f1', location: 'Battery Box', number: '1', amperage: '150A', circuit: 'MAIN', protects: 'Alternator' }] },
    fluids: [{ name: 'Engine Oil', spec: 'Plus-50 II 15W-40', capacity: '25.5L', interval: '500 Hours' }],
    torqueSpecs: [{ component: 'Wheel Wedge Bolts', nm: '600', ftlb: '445' }]
  },
  {
    id: 'audi-a4',
    category: 'Car',
    make: 'Audi',
    model: 'A4 (B9)',
    yearRange: '2016-2024',
    manualUrl: '#',
    specs: { 'Engine': '2.0L TFSI', 'Power': '252 hp', 'Drive': 'Quattro AWD', 'Transmission': '7-Speed S-tronic' },
    commonIssues: ['Water pump leaks', 'Timing chain tensioner', 'Carbon buildup on intake valves'],
    serviceManual: [
      { title: 'Oil Change', steps: ['Remove belly pan', 'Extract oil via dipstick tube or drain (6mm allen)', 'Replace filter (06L115562B)', 'Refill 5.2L 5W-40 VW 502.00'] }
    ],
    wiringDiagrams: [{ id: 'a4-wd1', system: 'Lighting', description: 'Matrix LED Control', content: '[J519 BCM] --(CAN)--> [LED MODULE] --(PWM)--> [HIGH BEAM LED]' }],
    fuseBoxes: { 'Plenum Chamber': [{ id: 'a4-f1', location: 'Engine Bay', number: '1', amperage: '40A', circuit: 'Cooling Fan', protects: 'Main Radiator Fan' }] },
    fluids: [{ name: 'Coolant', spec: 'G13 / G12++', capacity: '8.4L', interval: 'Lifetime' }],
    torqueSpecs: [{ component: 'Wheel Bolts', nm: '120', ftlb: '89' }]
  },
  {
    id: 'ford-ranger',
    category: 'Car',
    make: 'Ford',
    model: 'Ranger Raptor',
    yearRange: '2019-2024',
    manualUrl: '#',
    specs: { 
      'Engine': '2.0L Bi-Turbo Diesel', 
      'Suspension': 'Fox Racing Shox 2.5',
      'Transmission': '10-Speed Automatic',
      'Power': '210 hp',
      'Torque': '500 Nm'
    },
    commonIssues: ['Transmission software lag', 'Auxiliary battery failure', 'EGR valve soot buildup'],
    serviceManual: [
      { title: 'Air Filter Replacement', steps: ['Undo 4 clips on housing', 'Remove old element', 'Clean housing base', 'Install FA-1927 filter'] },
      { title: 'Oil Service', steps: ['Drain 7.0L of 0W-30', 'Replace filter (FL-2051)', 'Reset oil life monitor via steering pad'] }
    ],
    wiringDiagrams: [
      { id: 'ranger-wd1', system: 'Lighting Control', description: 'Headlight and DRL circuit', content: '[BCM Connector C2280C] --(BLUE/WH)-- [HEADLAMP LH PIN 1]' },
      { id: 'ranger-wd2', system: 'Starting/Charging', description: 'Battery to Starter Motor', content: '[BATTERY +] ==(RED 0GA)== [STARTER SOLENOID] --(VIOLET)-- [PCM RELAY]' }
    ],
    fuseBoxes: { 
      'Engine Bay': [
        { id: 'ranger-f1', location: 'Power Dist Box', number: 'F01', amperage: '50A', circuit: 'Cooling Fan', protects: 'Main Radiator Fan' },
        { id: 'ranger-f2', location: 'Power Dist Box', number: 'F05', amperage: '20A', circuit: 'Fuel Pump', protects: 'Fuel Delivery Module' }
      ],
      'Interior (Left)': [
        { id: 'ranger-f3', location: 'SCCM', number: 'F12', amperage: '10A', circuit: 'SYNC 4', protects: 'Infotainment System' }
      ]
    },
    fluids: [
      { name: 'Engine Oil', spec: 'WSS-M2C950-A', capacity: '7.0L', interval: '10,000 km' },
      { name: 'Coolant', spec: 'Motorcraft Orange', capacity: '12.5L', interval: '150,000 km' }
    ],
    torqueSpecs: [
      { component: 'Wheel Nuts', nm: '135', ftlb: '100' },
      { component: 'Oil Drain Plug', nm: '25', ftlb: '18' }
    ]
  },
  {
    id: 'chevy-silverado',
    category: 'Car',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    yearRange: '2019-2025',
    manualUrl: '#',
    specs: { 'Engine': '6.2L EcoTec3 V8', 'Torque': '460 lb-ft', 'Towing': '13,300 lbs' },
    commonIssues: ['Lifter failure', 'Transmission shudder', 'Trailer brake module fault'],
    serviceManual: [{ title: 'Brake Pad Service', steps: ['Remove 19mm caliper bolts', 'Compress pistons', 'Install ceramic pads'] }],
    wiringDiagrams: [{ id: 's_wd1', system: 'Trailer Module', description: 'TCCM to 7-Pin Plug', content: '[TCCM] --(GRN/YEL)--> [BRAKE CONTROLLER] --(SLATE)--> [REAR PLUG]' }],
    fuseBoxes: { 'Underhood': [{ id: 's1', location: 'Main Junction', number: 'F42', amperage: '30A', circuit: 'ABS', protects: 'Antilock Brake System' }] },
    fluids: [{ name: 'Engine Oil', spec: 'dexosD 0W-20', capacity: '8.0L', interval: '12,000 km' }],
    torqueSpecs: [{ component: 'Wheel Nuts', nm: '190', ftlb: '140' }]
  },
  {
    id: 'toyota-hilux',
    category: 'Car',
    make: 'Toyota',
    model: 'Hilux Conquest',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.8L 1GD-FTV Diesel', 'Power': '201 hp', 'Torque': '500 Nm' },
    commonIssues: ['DPF pressure sensor', 'Fuel injector noise'],
    serviceManual: [{ title: 'Timing Belt (2.8)', steps: ['Remove fan shroud', 'Align TDC marks', 'Replace belt and tensioner'] }],
    wiringDiagrams: [{ id: 'th_wd1', system: 'ECU Power', description: 'Main Relay Circuit', content: '[MAIN RELAY] --(RED)--> [ECU PIN 1-3]' }],
    fuseBoxes: { 'Engine Room': [{ id: 'th1', location: 'Junction Block 1', number: 'EFI', amperage: '25A', circuit: 'Engine Control', protects: 'Main ECU' }] },
    fluids: [{ name: 'Transmission', spec: 'Toyota ATF WS', capacity: '9.5L', interval: '80,000 km' }],
    torqueSpecs: [{ component: 'Cylinder Head', nm: '49+90+90', ftlb: '36+90+90' }]
  },
  {
    id: 'mitsubishi-montero',
    category: 'Car',
    make: 'Mitsubishi',
    model: 'Montero Sport',
    yearRange: '2016-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.4L MIVEC Diesel', 'Power': '181 hp', 'Transmission': '8-Speed AT' },
    commonIssues: ['SCV valve clogging', 'Intercooler hose cracks'],
    serviceManual: [{ title: 'SCV Cleaning', steps: ['Access rear of fuel pump', 'Remove 2 allen bolts', 'Clean or replace valve'] }],
    wiringDiagrams: [{ id: 'm_wd1', system: '4WD Control', description: 'Super Select II Logic', content: '[SS4II SW] --(CAN)--> [4WD ECU] --(PWM)--> [ACTUATOR]' }],
    fuseBoxes: { 'Dash Board': [{ id: 'm1', location: 'Driver Knee Bolster', number: 'F8', amperage: '15A', circuit: 'Accessories', protects: 'Power Outlets' }] },
    fluids: [{ name: 'Transfer Case', spec: '75W-80 GL-4', capacity: '1.4L', interval: '40,000 km' }],
    torqueSpecs: [{ component: 'Crank Pulley', nm: '210', ftlb: '155' }]
  },
  {
    id: 'mazda-cx5',
    category: 'Car',
    make: 'Mazda',
    model: 'CX-5',
    yearRange: '2017-2024',
    manualUrl: '#',
    specs: { 'Engine': '2.5L SkyActiv-G', 'Compression': '13.0:1', 'Power': '187 hp' },
    commonIssues: ['Infotainment ghost touch', 'Carbon buildup on valves', 'Power liftgate failure'],
    serviceManual: [
      { title: 'Brake Service', steps: ['Put EPB in maintenance mode', 'Remove 14mm bolts', 'Swap pads', 'Exit maintenance mode'] }
    ],
    wiringDiagrams: [{ id: 'cx5-wd1', system: 'i-Activsense', description: 'FSC Camera Power', content: '[FUSE 15] --(VIOLET)--> [CAMERA RETAINER]' }],
    fuseBoxes: { 'Interior': [{ id: 'cx5-f1', location: 'Driver Side Kick', number: '10', amperage: '15A', circuit: 'OUTLET', protects: '12V Accessory' }] },
    fluids: [{ name: 'Transmission', spec: 'FZ Blue', capacity: '7.8L', interval: '100,000 km' }],
    torqueSpecs: [{ component: 'Oil Plug', nm: '35', ftlb: '26' }]
  },
  {
    id: 'subaru-outback',
    category: 'Car',
    make: 'Subaru',
    model: 'Outback',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.4L Turbo Boxer', 'Drive': 'Symmetrical AWD', 'Transmission': 'Lineartronic CVT' },
    commonIssues: ['Windshield cracking', 'Battery drain', 'Eyesight system calibration'],
    serviceManual: [
      { title: 'CVT Fluid Check', steps: ['Level vehicle', 'Temp between 35C-45C', 'Remove check plug', 'Stream should be thin'] }
    ],
    wiringDiagrams: [{ id: 'ob-wd1', system: 'Eyesight', description: 'Stereo Camera Comm', content: '[EYESIGHT] --(CAN-H/L)--> [VDC CONTROLLER]' }],
    fuseBoxes: { 'Cabin': [{ id: 'ob-f1', location: 'Left Panel', number: '4', amperage: '10A', circuit: 'MIRROR', protects: 'Heated Mirrors' }] },
    fluids: [{ name: 'Differential (Rear)', spec: 'GL-5 75W-90', capacity: '0.8L', interval: '48,000 km' }],
    torqueSpecs: [{ component: 'Lug Nuts', nm: '120', ftlb: '89' }]
  },
  {
    id: 'kia-stinger',
    category: 'Car',
    make: 'Kia',
    model: 'Stinger GT',
    yearRange: '2018-2023',
    manualUrl: '#',
    specs: { 'Engine': '3.3L Twin Turbo V6', 'Power': '368 hp', 'Torque': '376 lb-ft', '0-60': '4.7s' },
    commonIssues: ['Brake fade (US models)', 'Sunroof rattles', 'Paint chipping'],
    serviceManual: [{ title: 'Spark Plug Change', steps: ['Remove intake manifold upper', 'Disconnect coil packs', 'Gap plugs to 0.028"', 'Torque to 18 ft-lb'] }],
    wiringDiagrams: [{ id: 'st-wd1', system: 'Electronic Suspension', description: 'ECS Logic', content: '[ECS ECU] --(PWM)--> [SOLENOID VALVES (x4)]' }],
    fuseBoxes: { 'Trunk': [{ id: 'st-f1', location: 'Battery Side', number: 'F2', amperage: '20A', circuit: 'AMP', protects: 'Harman Kardon Audio' }] },
    fluids: [{ name: 'Engine Oil', spec: '5W-30 Full Synthetic', capacity: '6.9L', interval: '10,000 km' }],
    torqueSpecs: [{ component: 'Axle Nut', nm: '280', ftlb: '206' }]
  },
  {
    id: 'landrover-defender',
    category: 'Car',
    make: 'Land Rover',
    model: 'Defender 110',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '3.0L P400 MHEV', 'Suspension': 'Electronic Air', 'Wading Depth': '900mm' },
    commonIssues: ['Pivi Pro software glitches', 'Air suspension compressor leaks', 'Rear door rattles'],
    serviceManual: [{ title: 'Air Suspension Drain', steps: ['Connect Pathfinder tool', 'Select Service Mode', 'Deflate bellows via tool command'] }],
    wiringDiagrams: [{ id: 'def-wd1', system: 'MHEV', description: '48V Battery Charging', content: '[DC/DC CONV] --(ORANGE)--> [48V LITHIUM BATT]' }],
    fuseBoxes: { 'C-pillar': [{ id: 'def-f1', location: 'Right Rear', number: '12', amperage: '30A', circuit: 'COMPRESSOR', protects: 'Air Suspension' }] },
    fluids: [{ name: 'Transfer Case', spec: 'Shell TF 0753', capacity: '1.5L', interval: 'Lifetime' }],
    torqueSpecs: [{ component: 'Spare Tire Bolt', nm: '133', ftlb: '98' }]
  },
  {
    id: 'hitachi-zx200',
    category: 'Heavy Equipment',
    make: 'Hitachi',
    model: 'ZX200-5G',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': 'Isuzu CC-6BG1T', 'Power': '147 hp', 'Boom Length': '5.68m' },
    commonIssues: ['Main pump noise under load', 'Bucket pin wear', 'Hydraulic line vibrations'],
    serviceManual: [{ title: 'Track Tension', steps: ['Lift one side', 'Measure gap between track and frame', 'Adjust using grease gun (Normal 340mm)'] }],
    wiringDiagrams: [{ id: 'zx-wd1', system: 'Pump Control', description: 'DP Sensor Logic', content: '[PUMP 1] --(SENSE)--> [CONTROL VALVE] --(FB)--> [ECM]' }],
    fuseBoxes: { 'Seat Back': [{ id: 'zx-f1', location: 'Cabin Rear', number: 'F5', amperage: '10A', circuit: 'Controller', protects: 'Engine Control Unit' }] },
    fluids: [{ name: 'Engine Oil', spec: '15W-40 CD/CF', capacity: '25L', interval: '500 hrs' }],
    torqueSpecs: [{ component: 'Shoe Bolts', nm: '450', ftlb: '330' }]
  },
  {
    id: 'liebherr-r924',
    category: 'Heavy Equipment',
    make: 'Liebherr',
    model: 'R 924',
    yearRange: '2018-2024',
    manualUrl: '#',
    specs: { 'Engine': 'Liebherr D934', 'Weight': '24,300 kg' },
    commonIssues: ['Slew ring lubrication', 'Final drive oil leaks'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'kawasaki-h2',
    category: 'Motorcycle',
    make: 'Kawasaki',
    model: 'Ninja H2',
    yearRange: '2015-2025',
    manualUrl: '#',
    specs: { 'Engine': '998cc Supercharged', 'Power': '228 hp' },
    commonIssues: ['Quickshifter alignment', 'Heat shield rattle'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'suzuki-hayabusa',
    category: 'Motorcycle',
    make: 'Suzuki',
    model: 'Hayabusa GSX1300R',
    yearRange: '2021-2025',
    manualUrl: '#',
    specs: { 'Engine': '1340cc I4', 'Torque': '150 Nm' },
    commonIssues: ['Front brake soft feel'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'nh-t7',
    category: 'Agriculture',
    make: 'New Holland',
    model: 'T7.270',
    yearRange: '2016-2024',
    manualUrl: '#',
    specs: { 'Engine': '6.7L FPT', 'Power': '270 hp', 'Flow Rate': '170 L/min' },
    commonIssues: ['AdBlue sensor failure', 'Joystick response lag', 'Transmission range sensor'],
    serviceManual: [{ title: 'AdBlue System Flush', steps: ['Drain DEF tank', 'Remove injector', 'Clean with warm water', 'Recalibrate via HEST test'] }],
    wiringDiagrams: [{ id: 'nht7-wd1', system: 'ISOBUS', description: 'Rear Socket Pinout', content: '[SOCKET B] --(PIN 3)--> [CAN-HI] --(PIN 1)--> [BATTERY+]' }],
    fuseBoxes: { 'Main Panel': [{ id: 'nht-f1', location: 'Fender Front', number: '10', amperage: '25A', circuit: 'HYD', protects: 'SCV Valves' }] },
    fluids: [{ name: 'Transmission', spec: 'Ambra Multi-G', capacity: '85L', interval: '1,000 hrs' }],
    torqueSpecs: [{ component: 'Wheel Nuts', nm: '650', ftlb: '480' }]
  },
  {
    id: 'ferguson-7700',
    category: 'Agriculture',
    make: 'Massey Ferguson',
    model: 'MF 7726 S',
    yearRange: '2018-2024',
    manualUrl: '#',
    specs: { 'Engine': 'AGCO Power 7.4L', 'Transmission': 'Dyna-VT' },
    commonIssues: ['Hydraulic valve lag', 'Cab suspension air leaks'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'honda-click',
    category: 'Motorcycle',
    make: 'Honda',
    model: 'Click 160',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Engine': '157cc eSP+', 'Brakes': 'ABS/CBS Options', 'Tech': 'Smart Key' },
    commonIssues: ['Belt slip', 'Front fork bottoming'],
    serviceManual: [{ title: 'Drive Belt Clean', steps: ['Remove CVT cover', 'Clean pulley faces', 'Check belt width (>18mm)'] }],
    wiringDiagrams: [{ id: 'hc_wd1', system: 'Ignition', description: 'Smart Key Logic', content: '[KEY UNLOCK] --(CAN)--> [ECU] --(12V)--> [COIL]' }],
    fuseBoxes: { 'Main Box': [{ id: 'hc1', location: 'Battery Side', number: '1', amperage: '15A', circuit: 'Main', protects: 'Battery Charge Circuit' }] },
    fluids: [{ name: 'Final Gear Oil', spec: 'SAE 90', capacity: '120ml', interval: '8,000 km' }],
    torqueSpecs: [{ component: 'Spark Plug', nm: '16', ftlb: '12' }]
  },
  {
    id: 'john-deere-6r',
    category: 'Agriculture',
    make: 'John Deere',
    model: '6155R',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': '6.8L PowerTech', 'Power': '155 hp', 'Cab': 'CommandView III' },
    commonIssues: ['AutoPowr transmission noise', 'SCV leaks'],
    serviceManual: [{ title: 'Calibration', steps: ['Access Service Menu', 'Select IVT Cal', 'Run static sequence'] }],
    wiringDiagrams: [{ id: 'jd_wd1', system: 'JDLink', description: 'Telematic Power', content: '[MTG] --(RED)--> [SWITCHED 12V]' }],
    fuseBoxes: { 'Cab Panel': [{ id: 'jd1', location: 'Fender Block', number: 'F10', amperage: '30A', circuit: 'Work Lights', protects: 'LED Array' }] },
    fluids: [{ name: 'Hydraulic', spec: 'Hy-Gard', capacity: '52L', interval: '1,500 hrs' }],
    torqueSpecs: [{ component: 'Rear Axle Nuts', nm: '600', ftlb: '440' }]
  },
  {
    id: 'honda-crv',
    category: 'Car',
    make: 'Honda',
    model: 'CR-V',
    yearRange: '2017-2024',
    manualUrl: '#',
    specs: { 
      'Engine': '1.5L Turbo', 
      'Horsepower': '190 hp', 
      'Drivetrain': 'AWD',
      'Safety': 'Honda Sensing v3'
    },
    commonIssues: ['Oil dilution', 'Infotainment lag', 'VSA modulator noise'],
    serviceManual: [
      { title: 'Air Filter', steps: ['Unclip pins', 'Replace element', 'Secure box'] },
      { title: 'Rear Diff Fluid', steps: ['Lift', 'Drain 1.2L', 'Refill Dual Pump II'] }
    ],
    wiringDiagrams: [],
    fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'toyota-corolla',
    category: 'Car',
    make: 'Toyota',
    model: 'Corolla',
    yearRange: '2019-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.0L M20A-FKS', 'Power': '169 hp', 'Torque': '205 Nm' },
    commonIssues: ['CVT jitter', 'Fuel pump recall'],
    serviceManual: [
      { title: 'Oil Change', steps: ['Remove shield', 'Replace 0W-16 oil (4.2L)', 'New crush washer'] }
    ], 
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'nissan-navara',
    category: 'Car',
    make: 'Nissan',
    model: 'Navara (NP300)',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': '2.3L Twin Turbo Diesel', 'Torque': '450 Nm' },
    commonIssues: ['EGR carbon buildup'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'bmw-3series',
    category: 'Car',
    make: 'BMW',
    model: '3 Series (G20)',
    yearRange: '2019-2024',
    manualUrl: '#',
    specs: { 'Engine': '2.0L B48 Turbo', 'Chassis': 'Sports Sedan' },
    commonIssues: ['Coolant flange leaks'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'mercedes-cclass',
    category: 'Car',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.0L M254', 'System': '48V Mild Hybrid' },
    commonIssues: ['MBUX software glitches'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'tesla-model3',
    category: 'Electric',
    make: 'Tesla',
    model: 'Model 3',
    yearRange: '2017-2024',
    manualUrl: '#',
    specs: { 
      'Drive': 'Dual Motor AWD', 
      'Battery': '82 kWh Lithium', 
      'Range': '576 km',
      'System': 'Hardware 4.0'
    },
    commonIssues: ['Upper control arm squeak', 'Heat pump sensor', 'Window trim alignment'],
    serviceManual: [
      { title: 'Cabin Filters', steps: ['Remove passenger side footwell screw', 'Pull panel', 'Replace twin filters'] },
      { title: '12V Battery', steps: ['Power down LV', 'Disconnect high voltage loop', 'Swap battery'] }
    ],
    wiringDiagrams: [{ id: 't_wd1', system: 'High Voltage', description: 'Battery to Rear Drive Unit', content: '[HV BATTERY] ===(ORANGE 400V)=== [PYRO FUSE] === [REAR INVERTER]' }],
    fuseBoxes: { 'Virtual Fuses': [{ id: 'v1', location: 'Software Defined', number: 'E-Fuse', amperage: 'Varies', circuit: 'HVAC', protects: 'Heat Pump' }] },
    fluids: [{ name: 'Coolant', spec: 'G-48 Tesla Specific', capacity: '12L', interval: 'Check only' }],
    torqueSpecs: [{ component: 'Wheel Nuts', nm: '175', ftlb: '129' }]
  },
  {
    id: 'rivian-r1t',
    category: 'Electric',
    make: 'Rivian',
    model: 'R1T',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Motors': 'Quad-Motor', '0-60': '3.0s', 'Wading Depth': '3+ feet' },
    commonIssues: ['Tonneau cover jamming', 'Compressor noise'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'hyundai-ioniq5',
    category: 'Electric',
    make: 'Hyundai',
    model: 'Ioniq 5',
    yearRange: '2021-2025',
    manualUrl: '#',
    specs: { 'Arch': 'E-GMP 800V', 'Battery': '77.4 kWh' },
    commonIssues: ['12V battery drain', 'Charging port logic'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'byd-seal',
    category: 'Electric',
    make: 'BYD',
    model: 'Seal',
    yearRange: '2023-2025',
    manualUrl: '#',
    specs: { 'Battery': 'Blade Battery 82.5 kWh', 'Tech': 'Cell-to-Body' },
    commonIssues: ['Infotainment translations'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'porsche-taycan',
    category: 'Electric',
    make: 'Porsche',
    model: 'Taycan',
    yearRange: '2020-2024',
    manualUrl: '#',
    specs: { 'Voltage': '800V', 'Transmission': '2-Speed (Rear)' },
    commonIssues: ['Brake squeal', 'Range estimation pessimism'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'komatsu-pc210',
    category: 'Heavy Equipment',
    make: 'Komatsu',
    model: 'PC210-11',
    yearRange: '2016-2024',
    manualUrl: '#',
    specs: { 
      'Engine': 'SAA6D107E-3', 
      'Max Speed': '5.5 km/h',
      'Bucket Cap': '1.2 m3'
    },
    commonIssues: ['KDPF clogging', 'Swing motor seal leaks', 'Hydraulic sensor drift'],
    serviceManual: [
      { title: 'Air Cleaner', steps: ['Access side compartment', 'Unclip housing', 'Clean pre-filter', 'Replace main element'] },
      { title: 'Track Tension', steps: ['Clean track frame', 'Pump grease into adjuster valve', 'Verify 300mm sag'] }
    ],
    wiringDiagrams: [{ id: 'k_wd1', system: 'Pump Control', description: 'EPC Solenoid circuit', content: '[PUMP CONTROLLER] --(YEL/GRN)--> [TVC SOLENOID]' }],
    fuseBoxes: { 'Main Console': [{ id: 'k1', location: 'Rear Panel', number: 'F1', amperage: '20A', circuit: 'Controller', protects: 'Main Engine Controller' }] },
    fluids: [{ name: 'Hydraulic Oil', spec: 'ISO VG 46', capacity: '240L', interval: '2,000 hrs' }],
    torqueSpecs: [{ component: 'Track Bolts', nm: '1100', ftlb: '810' }]
  },
  {
    id: 'cat-320-ng',
    category: 'Heavy Equipment',
    make: 'Caterpillar',
    model: '320 Next Gen',
    yearRange: '2018-2025',
    manualUrl: '#',
    specs: { 'Engine': 'Cat C4.4', 'Power': '172 hp', 'Swing Speed': '11.5 rpm' },
    commonIssues: ['DEF pump freezing', 'Touchscreen unresponsive'],
    serviceManual: [{ title: 'Oil Change', steps: ['Open side door', 'Use vacuum extractor', 'Fill 15.0L CAT DEO 15W-40'] }],
    wiringDiagrams: [{ id: 'cat320ng-wd1', system: 'ADEM 6', description: 'S-Terminal Start Relay', content: '[ADEM] --(ORANGE)--> [START RELAY] --(BLACK)--> [STARTER]' }],
    fuseBoxes: { 'Cab Box': [{ id: 'c1', location: 'Right Side Panel', number: 'F5', amperage: '10A', circuit: 'Aux Hydraulic', protects: 'Hammer Logic' }] },
    fluids: [{ name: 'Final Drive', spec: 'CAT TDTO', capacity: '5.0L', interval: '1,000 hrs' }],
    torqueSpecs: [{ component: 'Boom Pin Bolts', nm: '450', ftlb: '330' }]
  },
  {
    id: 'volvo-ec300',
    category: 'Heavy Equipment',
    make: 'Volvo',
    model: 'EC300E',
    yearRange: '2015-2023',
    manualUrl: '#',
    specs: { 'Engine': 'Volvo D8J', 'Power': '241 hp', 'Torque': '1,240 Nm' },
    commonIssues: ['Turbo actuator electrical fault', 'Hydraulic cooler fan noise'],
    serviceManual: [
      { title: 'Daily Check', steps: ['Verify fluid levels', 'Drain water separator', 'Inspect track bolts'] }
    ], 
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'jcb-3cx',
    category: 'Heavy Equipment',
    make: 'JCB',
    model: '3CX Backhoe',
    yearRange: '2010-2024',
    manualUrl: '#',
    specs: { 'Engine': 'JCB EcoMAX', 'Drive': '4WD' },
    commonIssues: ['Stabilizer leg leaks'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'yamaha-r1',
    category: 'Motorcycle',
    make: 'Yamaha',
    model: 'YZF-R1',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': '998cc CP4 Inline-4', 'Power': '197 hp', 'Dry Weight': '179 kg', 'Compression': '13.0:1' },
    commonIssues: ['Transmission recalls (2015)', 'Chain tensioner rattle', 'EXUP valve sticking'],
    serviceManual: [
      { title: 'Oil Service', steps: ['Remove belly pan', 'Drain 17mm plug', 'Refill 4.1L 10W-40 Full Synthetic Yamalube RS4GP'] }
    ], 
    wiringDiagrams: [{ id: 'r1-wd1', system: 'Quickshifter', description: 'QS Sensor Circuit', content: '[QS SENSOR] --(GRN/WH)--> [ECU PIN 22]' }],
    fuseBoxes: { 'Fairing Left': [{ id: 'r1-f1', location: 'Upper Inner', number: '1', amperage: '15A', circuit: 'Heads', protects: 'LED Components' }] },
    fluids: [{ name: 'Coolant', spec: 'Ethylene Glycol', capacity: '2.5L', interval: '2 years' }],
    torqueSpecs: [{ component: 'Brake Caliper Bolts', nm: '35', ftlb: '26' }]
  },
  {
    id: 'ducati-v4',
    category: 'Motorcycle',
    make: 'Ducati',
    model: 'Panigale V4',
    yearRange: '2018-2025',
    manualUrl: '#',
    specs: { 'Engine': '1,103cc Stradale', 'Electronics': '6-Axis IMU Evo 3', 'Horsepower': '214 hp', 'Torque': '91.5 lb-ft' },
    commonIssues: ['Exhaust heat discomfort', 'Side stand bolt loosening', 'Battery drainage'],
    serviceManual: [
      { title: 'Brake Fluid', steps: ['Clear Brembo reservoir', 'Bleed from calipers', 'Fill Motul 660'] },
      { title: 'Chain Tension', steps: ['Loosen eccentric hub bolts', 'Use C-spanner to rotate hub', 'Check 25mm slack', 'Torque hub bolts 35Nm'] }
    ], 
    wiringDiagrams: [{ id: 'dv4-wd1', system: 'Ohlins Suspension', description: 'Smart EC 2.0 Interface', content: '[SCU] --(LIN)--> [FORK CAP] ; [SCU] --(LIN)--> [SHOCK]' }],
    fuseBoxes: { 'Seat Under': [{ id: 'dv4-f1', location: 'Battery Tray', number: '1', amperage: '30A', circuit: 'Alternator', protects: 'Charging System' }] },
    fluids: [{ name: 'Engine Oil', spec: 'Shell Advance Ultra 4T 15W-50', capacity: '3.4L', interval: '12,000 km' }],
    torqueSpecs: [{ component: 'Front Axle', nm: '63', ftlb: '46' }]
  },
  {
    id: 'harley-fatboy',
    category: 'Motorcycle',
    make: 'Harley-Davidson',
    model: 'Fat Boy 114',
    yearRange: '2018-2024',
    manualUrl: '#',
    specs: { 'Engine': 'Milwaukee-Eight 114', 'Torque': '155 Nm' },
    commonIssues: ['Chrome oxidation'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'kubota-m7',
    category: 'Agriculture',
    make: 'Kubota',
    model: 'M7172',
    yearRange: '2018-2024',
    manualUrl: '#',
    specs: { 'Engine': 'V6108 4-cyl', 'Power': '170 hp', 'Lift Capacity': '9,400 kg' },
    commonIssues: ['Shuttle shift sensor error', 'DEF pump pressure low', 'Hitch calibration'],
    serviceManual: [{ title: 'Hydraulic Setup', steps: ['Navigate to K-Monitor', 'Select Flow Control', 'Adjust Liter/Min for SCV 1-3'] }],
    wiringDiagrams: [{ id: 'm7-wd1', system: 'DYNAMO', description: 'Charging circuit', content: '[ALTERNATOR] --(RED)--> [100A FUSE] --(WHT)--> [STARTER]' }],
    fuseBoxes: { 'Fender': [{ id: 'km7-f1', location: 'Right Cab Support', number: 'F20', amperage: '15A', circuit: 'Monitor', protects: 'Touchscreen Display' }] },
    fluids: [{ name: 'Final Drive Oil', spec: 'SAE 90', capacity: '4.5L', interval: '1000 hrs' }],
    torqueSpecs: [{ component: 'Drawbar Bolts', nm: '300', ftlb: '220' }]
  },
  {
    id: 'case-magnum',
    category: 'Agriculture',
    make: 'Case IH',
    model: 'Magnum 340',
    yearRange: '2014-2024',
    manualUrl: '#',
    specs: { 'Engine': '8.7L FPT', 'Transmission': 'CVT' },
    commonIssues: ['Hydraulic coupler seal wear'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'honda-cbr600',
    category: 'Motorcycle',
    make: 'Honda',
    model: 'CBR600RR',
    yearRange: '2007-2023',
    manualUrl: '#',
    specs: {
      'Engine': '599cc Inline-4',
      'Compression': '12.2:1',
      'Compression Power': '113 hp',
      'Weight': '186 kg (Wet)'
    },
    commonIssues: ['Rectifier overheating', 'Cam Chain Tensioner rattling', 'Stator failure'],
    serviceManual: [
      { title: 'Chain Adjustment', steps: ['Loosen 32mm axial nut', 'Rotate adjusters equally', 'Check slack (25mm-35mm)', 'Tighten nut', 'Check wheel alignment'] }
    ],
    wiringDiagrams: [{ id: 'h_wd1', system: 'Ignition', description: 'Coil-on-Plug Circuit', content: '[ECU] --(Yel/Blu)--> [Coil 1] --(Blk/Wht)--> [12V RAIL]' }],
    fuseBoxes: { 'Fuse Box': [{ id: 'cbr-f2', location: 'Under Seat', number: '2', amperage: '10A', circuit: 'FIGI', protects: 'PGM-FI Engine' }] },
    fluids: [{ name: 'Engine Oil', spec: 'GN4 10W-30', capacity: '2.8L', interval: '12,000 KM' }],
    torqueSpecs: [{ component: 'Rear Axle Nut', nm: '113', ftlb: '83' }]
  },
  {
    id: 'isuzu-dmax',
    category: 'Car',
    make: 'Isuzu',
    model: 'D-Max (3.0)',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '3.0L 4JJ3-TCX', 'Power': '190 hp', 'Torque': '450 Nm' },
    commonIssues: ['Turbo lag', 'Infotainment rebooting'],
    serviceManual: [{ title: 'Oil Change', steps: ['Drain 7.5L', 'Replace filter (8-98165071-0)'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'yamaha-nmax',
    category: 'Motorcycle',
    make: 'Yamaha',
    model: 'NMAX 155',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '155cc eSP+', 'Brakes': 'Dual Channel ABS' },
    commonIssues: ['Battery drain', 'Rear shock stiffness'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'doosan-dx225',
    category: 'Heavy Equipment',
    make: 'Doosan',
    model: 'DX225LCA',
    yearRange: '2016-2024',
    manualUrl: '#',
    specs: { 'Engine': 'Doosan DB58TIS', 'Power': '155 hp' },
    commonIssues: ['Hydraulic valve wear'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'kubota-l5018',
    category: 'Agriculture',
    make: 'Kubota',
    model: 'L5018',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': 'V2403-M-DI', 'Power': '50 hp', 'Weight': '1,490 kg' },
    commonIssues: ['Clutch wear on heavy loading', 'Front axle oil leakage', 'Radiator clogging'],
    serviceManual: [{ title: 'Clutch Adjustment', steps: ['Loosen lock nut', 'Adjust turnbuckle', 'Set freeplay to 20mm-30mm', 'Tighten nut'] }],
    wiringDiagrams: [{ id: 'l50-wd1', system: 'Starting', description: 'Glow Plug Circuit', content: '[GLOW PLUG RELAY] --(BK/W)--> [GLOW PLUGS x4]' }],
    fuseBoxes: { 'Under Dash': [{ id: 'l50-f1', location: 'Steering Column', number: '1', amperage: '10A', circuit: 'LIGHTS', protects: 'Headlights' }] },
    fluids: [{ name: 'Engine Oil', spec: '15W-40 API CF', capacity: '7.1L', interval: '200 hrs' }],
    torqueSpecs: [{ component: 'Front Axle Bolt', nm: '250', ftlb: '185' }]
  },
  {
    id: 'isuzu-mux',
    category: 'Car',
    make: 'Isuzu',
    model: 'mu-X (3.0)',
    yearRange: '2021-2025',
    manualUrl: '#',
    specs: { 'Engine': '3.0L 4JJ3-TCX', 'Power': '190 hp', 'Torque': '450 Nm', 'Drive': '4WD/2WD' },
    commonIssues: ['AdBlue fluid sensor errors', 'Infotainment lagging'],
    serviceManual: [{ title: 'Fuel Filter', steps: ['Locate under chassis driver side', 'Unscrew housing', 'Drain water', 'Insert filter Part #8-98159693-0'] }],
    wiringDiagrams: [{ id: 'mux-wd1', system: 'ADAS', description: 'Stereo Camera Power', content: '[ACC RELAY] --(GRN)--> [CAMERA UNIT]' }],
    fuseBoxes: { 'Interior': [{ id: 'mux-f1', location: 'Passenger Kick', number: 'F12', amperage: '15A', circuit: 'Socket', protects: 'Console Power' }] },
    fluids: [{ name: 'Brake Fluid', spec: 'DOT 4', capacity: '1.2L', interval: '40,000 km' }],
    torqueSpecs: [{ component: 'Crank Bolt', nm: '420', ftlb: '310' }]
  },
  {
    id: 'bmw-x5',
    category: 'Car',
    make: 'BMW',
    model: 'X5 (G05)',
    yearRange: '2019-2025',
    manualUrl: '#',
    specs: { 'Engine': '3.0L B58 I6 Turbo', 'Power': '335 hp', 'Suspension': '2-Axle Air' },
    commonIssues: ['Coolant hose leakage', 'Sunroof motor failure', 'Software update loops'],
    serviceManual: [{ title: 'Air Suspension Drain', steps: ['Enter Service Menu on iDrive', 'Select Chassis', 'Enable Workshop Mode'] }],
    wiringDiagrams: [{ id: 'x5-wd1', system: 'Infotainment', description: 'RAM Module Power', content: '[BATT+] --(F122)--> [RAM AUDIO MODULE] --(CAN2)--> [HEADUNIT]' }],
    fuseBoxes: { 'Rear Cargo': [{ id: 'x5-f1', location: 'Right Cover', number: 'F202', amperage: '30A', circuit: 'Tow Pack', protects: 'Trailer Lighting' }] },
    fluids: [{ name: 'Engine Oil', spec: 'BMW LL-01 0W-30', capacity: '6.5L', interval: '12,000 km' }],
    torqueSpecs: [{ component: 'Wheel Bolt', nm: '140', ftlb: '103' }]
  },
  {
    id: 'toyota-lc300',
    category: 'Car',
    make: 'Toyota',
    model: 'Land Cruiser 300',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Engine': '3.3L Twin-Turbo Diesel V6', 'Power': '304 hp', 'Torque': '700 Nm' },
    commonIssues: ['Turbo lag in low gear', 'Touchscreen latency'],
    serviceManual: [{ title: 'Diff Lock Service', steps: ['Engage high/low range', 'Clean solenoid connectors', 'Verify actuator stroke'] }],
    wiringDiagrams: [{ id: 'lc3-wd1', system: 'Multi-Terrain', description: 'Camera Feed Logic', content: '[AVM MODULE] --(LVDS)--> [HEADUNIT]' }],
    fuseBoxes: { 'Cabin Left': [{ id: 'lc3-f1', location: 'Glovebox Underside', number: 'F1', amperage: '15A', circuit: 'OBD', protects: 'Diagnostics' }] },
    fluids: [{ name: 'Engine Oil', spec: '0W-30 ACEA C2', capacity: '7.8L', interval: '10,000 km' }],
    torqueSpecs: [{ component: 'U-Bolts', nm: '120', ftlb: '89' }]
  },
  {
    id: 'ford-everest-ng',
    category: 'Car',
    make: 'Ford',
    model: 'Everest (Next Gen)',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Engine': '3.0L V6 Turbo Diesel', 'Torque': '600 Nm', 'Transmission': '10-Speed e-Shifter' },
    commonIssues: ['Software sync issues', 'Auxiliary battery drain'],
    serviceManual: [{ title: 'Oil Reset', steps: ['Ignition ON', 'Menu > Information > Oil Life', 'Hold OK to reset'] }],
    wiringDiagrams: [{ id: 'ev-wd1', system: 'Matrix LED', description: 'Glare-free High Beam', content: '[BCM] --(CAN)--> [LED UNIT]' }],
    fuseBoxes: { 'Interior': [{ id: 'ev-f1', location: 'Passenger Kick', number: 'F15', amperage: '20A', circuit: 'USB', protects: 'Charging Ports' }] },
    fluids: [{ name: 'Engine Oil', spec: 'WSS-M2C950-A', capacity: '9.5L', interval: '10,000 km' }],
    torqueSpecs: [{ component: 'Wheel Nuts', nm: '135', ftlb: '100' }]
  },
  {
    id: 'honda-civic-fe',
    category: 'Car',
    make: 'Honda',
    model: 'Civic (RS)',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Engine': '1.5L VTEC Turbo', 'Power': '178 hp', 'Torque': '240 Nm' },
    commonIssues: ['Steering sticky (EPS rack)', 'Door window rattle'],
    serviceManual: [{ title: 'Air Filter', steps: ['Unclip 4 tabs', 'Remove filter', 'Clean box', 'Install Part #17220-64A-A00'] }],
    wiringDiagrams: [{ id: 'fe-wd1', system: 'Bose Audio', description: 'Center Point Logic', content: '[HEADUNIT] --(SPDIF)--> [BOSE AMP] --(SPK)--> [12 SPEAKERS]' }],
    fuseBoxes: { 'Engine Bay': [{ id: 'fe-f1', location: 'Near Battery', number: 'F5', amperage: '30A', circuit: 'EPS', protects: 'Electronic Power Steering' }] },
    fluids: [{ name: 'CVT Fluid', spec: 'Honda HCF-2', capacity: '3.7L', interval: '40,000 km' }],
    torqueSpecs: [{ component: 'Oil Plug', nm: '40', ftlb: '30' }]
  },
  {
    id: 'suzuki-jimny',
    category: 'Car',
    make: 'Suzuki',
    model: 'Jimny (JB74)',
    yearRange: '2019-2025',
    manualUrl: '#',
    specs: { 'Engine': '1.5L K15B', 'Drive': 'AllGrip Pro 4WD', 'Weight': '1,100 kg' },
    commonIssues: ['Death wobble at 80km/h', 'Rust on door hinges'],
    serviceManual: [{ title: 'Diff Oil Change', steps: ['Remove fill plug first', 'Remove drain plug', 'Fill 1.3L 75W-90 GL-5'] }],
    wiringDiagrams: [{ id: 'jim-wd1', system: '4WD Indicator', description: 'Switch to Cluster', content: '[TRANSFER CASE SW] --(PNK)--> [4WD LIGHT]' }],
    fuseBoxes: { 'Dash': [{ id: 'jim-f1', location: 'Below Column', number: 'F3', amperage: '10A', circuit: 'IGN', protects: 'Meter/Cluster' }] },
    fluids: [{ name: 'Transfer Case', spec: '75W-90', capacity: '1.2L', interval: '40,000 km' }],
    torqueSpecs: [{ component: 'Axle Housing Bolts', nm: '85', ftlb: '63' }]
  },
  {
    id: 'cat-950m',
    category: 'Heavy Equipment',
    make: 'Caterpillar',
    model: '950M Wheel Loader',
    yearRange: '2014-2024',
    manualUrl: '#',
    specs: { 'Engine': 'Cat C7.1 ACERT', 'Power': '230 hp', 'Bucket Cap': '3.3 m3' },
    commonIssues: ['AC fan motor failure', 'Transmission calibration drift'],
    serviceManual: [{ title: 'Brake Bleed', steps: ['Connect pressure bleeder', 'Cycle service brake pedal 20 times', 'Open bleeder on rear axle'] }],
    wiringDiagrams: [{ id: '950-wd1', system: 'Work Lights', description: 'Main Relay Logic', content: '[SWITCH] --(WH18)--> [RELAY 1] --(BK12)--> [HALOGEN HALO]' }],
    fuseBoxes: { 'Cab Area': [{ id: '950-f1', location: 'Under Armrest', number: 'F12', amperage: '15A', circuit: 'Radio', protects: 'Communication Unit' }] },
    fluids: [{ name: 'Hydraulic Oil', spec: 'HYDO Advanced 10', capacity: '125L', interval: '3,000 hrs' }],
    torqueSpecs: [{ component: 'Wheel Nuts', nm: '600', ftlb: '442' }]
  },
  {
    id: 'honda-adv160',
    category: 'Motorcycle',
    make: 'Honda',
    model: 'ADV 160',
    yearRange: '2022-2025',
    manualUrl: '#',
    specs: { 'Engine': '157cc eSP+', 'Torque': '14.7 Nm', 'Tires': 'Semi-Block Tubeless' },
    commonIssues: ['Windshield vibration', 'Rear grab rail rattling'],
    serviceManual: [{ title: 'CVT Cleaning', steps: ['Remove 8mm bolts', 'Check sliders', 'Apply high-temp grease to boss'] }],
    wiringDiagrams: [{ id: 'adv-wd1', system: 'Charging', description: 'USB Port Power', content: '[FUSE 3] --(RED/BLK)--> [USB MOD]' }],
    fuseBoxes: { 'Battery Box': [{ id: 'adv-f1', location: 'Floorboard', number: '2', amperage: '10A', circuit: 'IGN', protects: 'Main ECU' }] },
    fluids: [{ name: 'Engine Oil', spec: '10W-30 MB', capacity: '0.8L', interval: '4,000 km' }],
    torqueSpecs: [{ component: 'Rear Nut', nm: '108', ftlb: '80' }]
  },
  {
    id: 'yamaha-xmax',
    category: 'Motorcycle',
    make: 'Yamaha',
    model: 'XMAX 300',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '292cc Blue Core', 'Tech': 'Traction Control System (TCS)', 'Storage': '2 Full-Face Helmets' },
    commonIssues: ['Battery discharge', 'Front suspension bottoming out'],
    serviceManual: [{ title: 'V-Belt Service', steps: ['Remove side covers', 'Unscrew CVT filter shroud', 'Replace belt and sliders every 20k km'] }],
    wiringDiagrams: [{ id: 'xm-wd1', system: 'Electronic', description: 'Smart Key Unit Power', content: '[MAIN SW] --(RED)--> [SMART KEY ECU] --(BLU)--> [STEERING LOCK]' }],
    fuseBoxes: { 'Front Inner': [{ id: 'xm-f1', location: 'Battery Side', number: '4', amperage: '15A', circuit: 'DC OUT', protects: 'Phone Charging Port' }] },
    fluids: [{ name: 'Final Gear Oil', spec: 'SAE 10W-40 Type SG', capacity: '200ml', interval: '10,000 km' }],
    torqueSpecs: [{ component: 'Oil Drain Bolt', nm: '20', ftlb: '15' }]
  },
  {
    id: 'isuzu-fvr',
    category: 'Heavy Equipment',
    make: 'Isuzu',
    model: 'FVR (Forward)',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': '6HK1-TCN', 'Payload': '10-14 Tons', 'Transmission': '6-Speed Manual' },
    commonIssues: ['Clutch booster leak', 'Brake air pressure loss'],
    serviceManual: [{ title: 'Air Tank Drain', steps: ['Access rear air reservoirs', 'Pull drain cables', 'Expel water/oil buildup'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'hino-500',
    category: 'Heavy Equipment',
    make: 'Hino',
    model: '500 Series',
    yearRange: '2016-2025',
    manualUrl: '#',
    specs: { 'Engine': 'J08E-WA', 'Power': '280 hp', 'Torque': '824 Nm' },
    commonIssues: ['Cooling fan clutch', 'ABS sensor cables'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'mitsubishi-fuso',
    category: 'Heavy Equipment',
    make: 'Mitsubishi Fuso',
    model: 'Canter (FE)',
    yearRange: '2012-2024',
    manualUrl: '#',
    specs: { 'Engine': '4P10-T1', 'GVW': '4.5-8.5 Tons' },
    commonIssues: ['DPF pressure sensor', 'BlueTec pump failure'],
    serviceManual: [{ title: 'AdBlue Refill', steps: ['Open side blue cap', 'Refill 12L DEF', 'Reset counter via dash dashboard'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'honda-civic-fc',
    category: 'Car',
    make: 'Honda',
    model: 'Civic (FC)',
    yearRange: '2016-2021',
    manualUrl: '#',
    specs: { 'Engine': '1.5L VTEC Turbo', 'Power': '173 hp', 'Torque': '220 Nm' },
    commonIssues: ['AC Evaporator leak', 'Steering rack noise', 'Battery life'],
    serviceManual: [{ title: 'CVT Fluid', steps: ['Remove drain plug', 'Refill 3.7L HCF-2', 'Check via overflow plug at 45C'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'toyota-vios',
    category: 'Car',
    make: 'Toyota',
    model: 'Vios (Gen 3)',
    yearRange: '2013-2022',
    manualUrl: '#',
    specs: { 'Engine': '1.3L/1.5L Dual VVT-i', 'Transmission': 'CVT/5MT' },
    commonIssues: ['Fan motor failure', 'Suspension bushing wear'],
    serviceManual: [{ title: 'Oil Service', steps: ['Drain 3.5L', 'Replace filter (04152-YZZA6)'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'ford-territory',
    category: 'Car',
    make: 'Ford',
    model: 'Territory',
    yearRange: '2020-2024',
    manualUrl: '#',
    specs: { 'Engine': '1.5L Turbo', 'Horsepower': '143 hp' },
    commonIssues: ['Battery sensor failure', 'Infotainment freezing'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'toyota-innova',
    category: 'Car',
    make: 'Toyota',
    model: 'Innova (Zenix)',
    yearRange: '2023-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.0L M20A-FXS Hybrid', 'System': '5th Gen Toyota Hybrid System', 'Transmission': 'e-CVT' },
    commonIssues: ['Hybrid battery cooling fan dust', 'Infotainment lag'],
    serviceManual: [{ title: 'Inverter Coolant', steps: ['Access inverter reservoir', 'Drain at bottom of transaxle', 'Refill SLLC (Pink)'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'mitsubishi-xpander',
    category: 'Car',
    make: 'Mitsubishi',
    model: 'Xpander Cross',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': '1.5L 4A91', 'Power': '103 hp', 'Ground Clearance': '225mm' },
    commonIssues: ['Rear shock oil leak', 'Front brake squeal'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'volvo-fh16',
    category: 'Heavy Equipment',
    make: 'Volvo Trucks',
    model: 'FH16 750',
    yearRange: '2020-2025',
    manualUrl: '#',
    specs: { 'Engine': 'D16K', 'Power': '750 hp', 'Torque': '3550 Nm', 'GVW': '44-100 Tons' },
    commonIssues: ['I-Shift clutch wear', 'AdBlue injector crystallization'],
    serviceManual: [{ title: 'Engine Oil (D16)', steps: ['Drain 42L', 'Replace 3 oil filters', 'Inspect centrifugal filter', 'Refill VDS-4.5 10W-30'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'case-axial',
    category: 'Agriculture',
    make: 'Case IH',
    model: 'Axial-Flow 9250',
    yearRange: '2019-2025',
    manualUrl: '#',
    specs: { 'Engine': '15.9L Cursor 16', 'Power': '625 hp', 'Grain Tank': '14,400L' },
    commonIssues: ['Rotor belt slipping under heavy crop', 'GPS antenna vibration'],
    serviceManual: [{ title: 'Rotor Gap Calibration', steps: ['Lower header', 'Cycle rotor adjustment', 'Check clearance at front grate'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'ducati-multistrada',
    category: 'Motorcycle',
    make: 'Ducati',
    model: 'Multistrada V4 S',
    yearRange: '2021-2025',
    manualUrl: '#',
    specs: { 'Engine': '1158cc V4 Granturismo', 'Valve Interval': '60,000 km', 'Power': '170 hp' },
    commonIssues: ['Radar sensor occlusion', 'Software bugs in dash'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'isuzu-traviz',
    category: 'Car',
    make: 'Isuzu',
    model: 'Traviz',
    yearRange: '2019-2025',
    manualUrl: '#',
    specs: { 'Engine': '2.5L 4JA1-L Direct Injection', 'Max Torque': '176 Nm', 'Payload': '1.6 Tons' },
    commonIssues: ['Glow plug failure', 'Rear leaf spring squeaking'],
    serviceManual: [{ title: 'Fuel Filter', steps: ['Access under driver seat', 'Drain water from separator', 'Prime manually after replacement'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'mitsubishi-l300',
    category: 'Car',
    make: 'Mitsubishi',
    model: 'L300 (Euro 4)',
    yearRange: '2019-2024',
    manualUrl: '#',
    specs: { 'Engine': '2.2L 4N14 Diesel', 'Turbo': 'Variable Geometry Turbo (VGT)' },
    commonIssues: ['Turbo actuator sticking', 'Belt slippage noise'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'volvo-a40g',
    category: 'Heavy Equipment',
    make: 'Volvo',
    model: 'A40G Articulated Hauler',
    yearRange: '2014-2024',
    manualUrl: '#',
    specs: { 'Engine': 'Volvo D13J', 'Payload': '39,000 kg', 'Body Volume': '24 m3' },
    commonIssues: ['Articulation joint wear', 'Retarder overheating'],
    serviceManual: [{ title: 'Daily Maintenance', steps: ['Check engine oil', 'Drain fuel pre-filter', 'Inspect hydraulic hoses on joint'] }],
    wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  },
  {
    id: 'kawasaki-versys',
    category: 'Motorcycle',
    make: 'Kawasaki',
    model: 'Versys 650',
    yearRange: '2015-2024',
    manualUrl: '#',
    specs: { 'Engine': '649cc Parallel Twin', 'Suspension': 'Long Travel Adjustable' },
    commonIssues: ['Fairing vibrations'],
    serviceManual: [], wiringDiagrams: [], fuseBoxes: {}, fluids: [], torqueSpecs: []
  }
];

export function useStore() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ab_users');
    return saved ? JSON.parse(saved) : [INITIAL_ADMIN];
  });

  const [dtcs, setDtcs] = useState<DTC[]>(() => {
    const saved = localStorage.getItem('ab_dtcs');
    // Forcing an update of the DB if its old or small to ensure prompt requirements are met
    if (saved && JSON.parse(saved).length > 10) return JSON.parse(saved);
    return INITIAL_DTCS; 
  });

  const [units, setUnits] = useState<VehicleUnit[]>(() => {
    const saved = localStorage.getItem('ab_units_v6');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length < INITIAL_UNITS.length) return INITIAL_UNITS;
      return parsed;
    }
    return INITIAL_UNITS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('ab_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ab_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatLogs, setChatLogs] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ab_chats');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ab_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const saved = localStorage.getItem('ab_saved_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(() => {
    const saved = localStorage.getItem('ab_search_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => localStorage.setItem('ab_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('ab_dtcs', JSON.stringify(dtcs)), [dtcs]);
  useEffect(() => localStorage.setItem('ab_units_v6', JSON.stringify(units)), [units]);
  useEffect(() => localStorage.setItem('ab_announcements', JSON.stringify(announcements)), [announcements]);
  useEffect(() => localStorage.setItem('ab_logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('ab_chats', JSON.stringify(chatLogs)), [chatLogs]);
  useEffect(() => localStorage.setItem('ab_favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('ab_saved_items', JSON.stringify(savedItems)), [savedItems]);
  useEffect(() => localStorage.setItem('ab_search_history', JSON.stringify(searchHistory)), [searchHistory]);

  // Actions
  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const addDtc = (dtc: DTC) => setDtcs(prev => [...prev, dtc]);
  const updateDtc = (id: string, updates: Partial<DTC>) => {
    setDtcs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };
  const deleteDtc = (id: string) => setDtcs(prev => prev.filter(d => d.id !== id));

  const addAnnouncement = (a: Announcement) => setAnnouncements(prev => [a, ...prev]);
  
  const addLog = (userId: string, username: string, action: string, details: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      username,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 500));
  };

  const addChatMessage = (userId: string, role: 'user' | 'ai', content: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setChatLogs(prev => [...prev, newMessage]);
  };

  const toggleFavorite = (dtcId: string) => {
    setFavorites(prev => 
      prev.includes(dtcId) ? prev.filter(id => id !== dtcId) : [...prev, dtcId]
    );
  };

  const addSavedItem = (item: Omit<SavedItem, 'id' | 'timestamp'>) => {
    const newItem: SavedItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setSavedItems([newItem, ...savedItems]);
  };

  const removeSavedItem = (id: string) => {
    setSavedItems(savedItems.filter(s => s.id !== id));
  };

  const addSearchHistory = (history: Omit<SearchHistory, 'id' | 'timestamp'>) => {
    const newHistory: SearchHistory = {
      ...history,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setSearchHistory([newHistory, ...searchHistory].slice(0, 50));
  };

  const clearSearchHistory = (userId: string) => {
    setSearchHistory(searchHistory.filter(h => h.userId !== userId));
  };

  return {
    users, addUser, updateUser, deleteUser,
    dtcs, addDtc, updateDtc, deleteDtc,
    units,
    announcements, addAnnouncement,
    logs, addLog,
    chatLogs, addChatMessage,
    favorites, toggleFavorite,
    savedItems, addSavedItem, removeSavedItem,
    searchHistory, addSearchHistory, clearSearchHistory
  };
}

