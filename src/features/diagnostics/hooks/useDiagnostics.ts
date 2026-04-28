import { useQuery } from '@tanstack/react-query';
import { diagnoseDTC } from '../services/diagnosticService';
import { getFromCache, saveToCache } from '../../../services/cacheService';

export const useDiagnostics = (code: string) => {
  return useQuery({
    queryKey: ['diagnostic', code],
    queryFn: async () => {
      // 1. Try local cache
      const cached = await getFromCache(code);
      if (cached) return cached.results;
      
      // 2. API Call - passing empty symptoms for now
      const result = await diagnoseDTC(code, []);
      
      // 3. Save to cache
      await saveToCache(code, result.data);
      
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    enabled: !!code,
  });
};
