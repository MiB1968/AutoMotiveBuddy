
import { dbPromise } from '../../db/database';

export const fuseService = {
  async getVehicles() {
    const db = await dbPromise;
    return await db.getAll('vehicles');
  },
  
  async getVehicleFuseBoxes(vehicleId: number) {
    const db = await dbPromise;
    return await db.getAllFromIndex('fuse_boxes', 'vehicle_id', vehicleId);
  },

  async getFuseBoxDetails(boxId: number) {
    const db = await dbPromise;
    const fuses = await db.getAllFromIndex('fuses', 'fuse_box_id', boxId);
    const relays = await db.getAllFromIndex('relays', 'fuse_box_id', boxId);
    
    return {
      fuses,
      relays
    };
  },

  async addVehicleHierarchy(vehicle: any, fuseBoxes: any[]) {
    const db = await dbPromise;
    const tx = db.transaction(['vehicles', 'fuse_boxes', 'fuses', 'relays'], 'readwrite');
    
    const vehicleId = await tx.objectStore('vehicles').add(vehicle);
    
    for (const box of fuseBoxes) {
      const boxWithVehicle = { ...box, vehicle_id: vehicleId };
      const boxId = await tx.objectStore('fuse_boxes').add(boxWithVehicle);
      
      for (const fuse of (box.fuses || [])) {
        await tx.objectStore('fuses').add({ ...fuse, fuse_box_id: boxId });
      }
      
      for (const relay of (box.relays || [])) {
        await tx.objectStore('relays').add({ ...relay, fuse_box_id: boxId });
      }
    }
    
    await tx.done;
    return vehicleId;
  }
};
