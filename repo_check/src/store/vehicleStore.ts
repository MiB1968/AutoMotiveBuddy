import { create } from "zustand";

interface VehicleState {
  make: string;
  model: string;
  year: string;
  engine: string;
  setVehicle: (data: Partial<VehicleState>) => void;
  resetVehicle: () => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  make: "ford",
  model: "f150",
  year: "2023",
  engine: "3.5L EcoBoost",

  setVehicle: (data) => set((state) => ({ ...state, ...data })),
  resetVehicle: () => set({ make: "", model: "", year: "", engine: "" })
}));
