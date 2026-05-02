import fs from 'fs';
import path from 'path';

export interface DTCKnowledge {
  code: string;
  description: string;
  causes: string[];
  symptoms: string[];
  solutions: string[];
  severity: string;
  technician_notes?: string;
  possible_causes_ranked?: string[];
}

export class RAGEngine {
  private knowledgeBase: DTCKnowledge[] = [];

  constructor() {
    this.loadKnowledge();
  }

  private loadKnowledge() {
    try {
      const dataPath = path.join(process.cwd(), 'src/lib/dtc_master.json');
      if (fs.existsSync(dataPath)) {
        this.knowledgeBase = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      }
    } catch (e) {
      console.error("OpenClaw RAG: Failed to load master knowledge base", e);
    }
  }

  async retrieve(query: string, limit: number = 3): Promise<DTCKnowledge[]> {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Simple relevance scoring for MVP
    const scored = this.knowledgeBase.map(item => {
      let score = 0;
      const text = `${item.code} ${item.description} ${item.causes.join(' ')} ${item.symptoms.join(' ')}`.toLowerCase();
      
      // Match DTC code perfectly -> high score
      if (query.toUpperCase().includes(item.code.toUpperCase())) score += 100;
      
      // Keyword matching
      searchTerms.forEach(term => {
        if (term.length < 3) return;
        if (text.includes(term)) score += 10;
      });

      return { item, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.item);
  }
}
