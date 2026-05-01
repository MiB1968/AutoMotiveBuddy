
import { firestore } from '../../../server';

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

export class SearchService {
    private static API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    private static CX = process.env.GOOGLE_SEARCH_CX;

    static async search(query: string, caseId?: string): Promise<SearchResult[]> {
        console.log(`[SearchService] Executing query: ${query}`);

        if (!this.API_KEY || !this.CX) {
            console.warn("[SearchService] Credentials missing, search grounding skipped.");
            return [];
        }

        try {
            const url = `https://www.googleapis.com/customsearch/v1?key=${this.API_KEY}&cx=${this.CX}&q=${encodeURIComponent(query)}&num=3`;
            const response = await fetch(url);
            const data = await response.json();

            const results: SearchResult[] = (data.items || []).map((item: any) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet
            }));

            // Log the search
            if (firestore) {
                const logId = `search_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                await firestore.collection('search_logs').doc(logId).set({
                    query,
                    timestamp: new Date().toISOString(),
                    results,
                    caseId: caseId || 'system'
                });
            }

            return results;
        } catch (error) {
            console.error("[SearchService] Search failed:", error);
            return [];
        }
    }
}
