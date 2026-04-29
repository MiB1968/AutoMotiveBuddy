import { fuseService } from "../backend/services/fuseService";

export type FuseSearchIndexItem = {
  vehicleId: string;
  vehicleName: string;
  fuseBoxId: string;
  fuseBoxName: string;
  fuseId: string;
  fuseNumber: string;
  amperage: number;
  function: string;
  keywords: string[];
};

let fuseSearchIndex: FuseSearchIndexItem[] = [];
let isReady = false;

function generateKeywords(vehicle: any, box: any, fuse: any) {
  return [
    vehicle.brand,
    vehicle.model,
    vehicle.year?.toString(),
    fuse.fuse_number,
    fuse.function,
    fuse.amperage + "A",
    box.name,
    fuse.function?.toLowerCase(),
    fuse.fuse_number?.toLowerCase()
  ].filter(Boolean);
}

export async function buildFuseSearchIndex() {
  const vehicles = await fuseService.getVehicles();
  const index: FuseSearchIndexItem[] = [];

  for (const vehicle of vehicles) {
    const fuseBoxes = await fuseService.getVehicleFuseBoxes(vehicle.id);

    for (const box of fuseBoxes) {
      const details = await fuseService.getFuseBoxDetails(box.id);
      const fuses = details.fuses || [];

      for (const fuse of fuses) {
        index.push({
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
          fuseBoxId: box.id,
          fuseBoxName: box.name,
          fuseId: fuse.id,
          fuseNumber: fuse.fuse_number,
          amperage: fuse.amperage,
          function: fuse.function,
          keywords: generateKeywords(vehicle, box, fuse)
        });
      }
    }
  }

  fuseSearchIndex = index;
  console.log("Fuse Search Index Ready:", fuseSearchIndex.length);
  return index;
}

export function searchFuses(query: string) {
  if (!isReady) return [];
  
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return fuseSearchIndex.filter(item => {
    return (
      item.fuseNumber.toLowerCase().includes(q) ||
      item.function.toLowerCase().includes(q) ||
      item.vehicleName.toLowerCase().includes(q) ||
      item.fuseBoxName.toLowerCase().includes(q) ||
      item.keywords.some(k => k.toLowerCase().includes(q))
    );
  });
}

export async function initFuseSearchEngine() {
  await buildFuseSearchIndex();
  isReady = true;
}
