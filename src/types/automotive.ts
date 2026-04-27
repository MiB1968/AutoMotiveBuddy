export interface Wiring {
  id: string;
  vehicle_id: string;
  system: string;
  component: string;
  wire_color: string;
  voltage: string;
  source: string;
  destination: string;
  location: string;
  confidence: number;
}

export interface Fuse {
  id: string;
  vehicle_id: string;
  fuse_number: string;
  rating_amp: number;
  component: string;
  location: string;
  confidence: number;
}

export interface Relay {
  id: string;
  vehicle_id: string;
  name: string;
  input: string;
  output: string;
  location: string;
  confidence: number;
}
