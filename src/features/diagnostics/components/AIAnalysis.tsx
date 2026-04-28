import React from 'react';
import { useDiagnostics } from '../hooks/useDiagnostics';

export const AIAnalysis = ({ code }: { code: string }) => {
  const { data, isLoading, error } = useDiagnostics(code);

  if (!code) return null;
  if (isLoading) return <div>Analyzing...</div>;
  if (error) return <div>Error fetching analysis.</div>;

  return (
    <div className="mt-4 p-4 border rounded">
      <h3>AI Analysis</h3>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};

export default AIAnalysis;
