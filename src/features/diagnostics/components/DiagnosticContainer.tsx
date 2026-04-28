import React, { useState } from 'react';
import DTCSearch from './DTCSearch';
import AIAnalysis from './AIAnalysis';

export const DiagnosticContainer = () => {
  const [selectedCode, setSelectedCode] = useState('');

  return (
    <div className="diagnostic-container">
      <h1 className="text-2xl font-bold mb-4">Diagnostics</h1>
      <DTCSearch onSearch={setSelectedCode} />
      <AIAnalysis code={selectedCode} />
    </div>
  );
};

