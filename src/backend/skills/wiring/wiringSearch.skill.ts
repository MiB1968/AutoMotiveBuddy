
import fs from 'fs';
import path from 'path';
import { Skill } from '../../runtime/types';

const DB_PATH = path.join(process.cwd(), 'data/wiring_db.json');

export const wiringSearchSkill: Skill<{ color?: string, query?: string }, any> = {
  name: "wiring_search",
  description: "Search for wiring information by color or component function",
  schema: {
    input: { color: "string (optional)", query: "string (optional)" },
    output: { count: "number", results: "array" }
  },
  async execute({ color, query }, ctx) {
    let db = { vehicles: [] };
    try {
      if (fs.existsSync(DB_PATH)) {
        db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      }
    } catch (e) {
      console.error("[SKILL:WIRING] DB Error", e);
    }

    const results: any[] = [];
    db.vehicles.forEach((v: any) => {
      v.systems.forEach((s: any) => {
        s.circuits.forEach((c: any) => {
          c.wires.forEach((w: any) => {
            const searchColor = (color || "").toLowerCase();
            const searchQuery = (query || "").toLowerCase();

            let match = false;
            if (color && (w.color || "").toLowerCase() === searchColor) match = true;
            if (query && (
              (w.function || "").toLowerCase().includes(searchQuery) ||
              (c.name || "").toLowerCase().includes(searchQuery) ||
              (s.system || "").toLowerCase().includes(searchQuery)
            )) match = true;

            if (match) {
              results.push({
                vehicle: v.name,
                system: s.system,
                circuit: c.name,
                ...w
              });
            }
          });
        });
      });
    });

    return {
      count: results.length,
      results
    };
  }
};
