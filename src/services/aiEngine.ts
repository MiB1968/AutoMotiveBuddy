import { searchLocalDB } from './searchEngine';
import { saveToCache, getFromCache } from './cacheService';

export const smartSearch = async (query: string, fetchAI: Function) => {
  // 1. SEARCH LOCAL DATABASE FIRST
  let localResults = await searchLocalDB(query);
  if (localResults.length > 0) {
    return localResults;
  }

  // 2. CHECK CACHE
  const cached = await getFromCache(query);
  if (cached) {
    return cached.results;
  }

  // 3. CALL AI (ONLINE)
  const aiResults = await fetchAI(query);

  // 4. VALIDATE STRUCTURE
  if (!Array.isArray(aiResults)) return [];

  // 5. SAVE TO CACHE
  await saveToCache(query, aiResults);

  return aiResults;
};
