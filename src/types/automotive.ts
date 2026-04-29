export interface Vehicle {
  id: string | number;
  brand: string;
  model: string;
  year: number;
  engine: string;
}

export interface FuseBox {
  id: string | number;
  vehicle_id: string | number;
  name: string;
  location_description: string;
  image_url?: string;
}

export interface Fuse {
  id: string | number;
  fuse_box_id: string | number;
  fuse_number: string;
  amperage: number;
  function: string;
  status: string;
}

export interface Relay {
  id: string | number;
  fuse_box_id: string | number;
  relay_name: string;
  function: string;
}

export interface FuseSystemV3 {
  vehicles: Vehicle[];
  fuse_boxes: FuseBox[];
  fuses: Fuse[];
  relays: Relay[];
}
