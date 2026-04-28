import React, { useState } from 'react';

export const DTCSearch = ({ onSearch }: { onSearch: (code: string) => void }) => {
  const [code, setCode] = useState('');

  const handleSearch = () => {
    if (code) onSearch(code);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter DTC Code (e.g., P0300)"
        className="border p-2 rounded"
      />
      <button onClick={handleSearch} className="bg-blue-500 text-white p-2 rounded">
        Search
      </button>
    </div>
  );
};

export default DTCSearch;
