
import React from 'react';

interface JsonOutputProps {
  json: string;
}

const JsonOutput: React.FC<JsonOutputProps> = ({ json }) => {
  return (
    <div className="mt-4 bg-gray-900/70 border border-gray-700 rounded-lg shadow-inner">
      <div className="p-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400">Generated IR</h3>
      </div>
      <pre className="p-4 text-sm text-green-300 overflow-x-auto">
        <code>{json}</code>
      </pre>
    </div>
  );
};

export default JsonOutput;
