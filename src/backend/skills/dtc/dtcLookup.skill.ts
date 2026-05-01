
import fs from 'fs';
import path from 'path';
import { Skill } from '../../runtime/types';

const DTC_PATH = path.join(process.cwd(), 'src/lib/dtc_master.json');

export const dtcLookupSkill: Skill<{ keyword: string }, any> = {
  name: "dtc_lookup",
  description: "Search for automotive diagnostic trouble codes and their definitions",
  schema: {
    input: { keyword: "string (DTC code or keyword)" },
    output: { count: "number", results: "array" }
  },
  async execute({ keyword }, ctx) {
    let data = [];
    try {
      if (fs.existsSync(DTC_PATH)) {
        data = JSON.parse(fs.readFileSync(DTC_PATH, 'utf-8'));
      }
    } catch (e) {
      console.error("[SKILL:DTC] Load Error", e);
    }

    const searchKey = (keyword || "").toLowerCase();
    const results = data.filter((item: any) => 
      (item.code || "").toLowerCase().includes(searchKey) || 
      (item.description || "").toLowerCase().includes(searchKey) ||
      (item.system || "").toLowerCase().includes(searchKey)
    ).slice(0, 50);

    return {
      count: results.length,
      results
    };
  }
};
