
import React, { useState, useEffect, useMemo } from 'react';
import { FlowNode, NodeId, OpType } from '../types';
import JsonOutput from './JsonOutput';

interface ActionPanelProps {
  nodes: FlowNode[];
  onRun: (inputValues: Record<NodeId, any>) => void;
  runStatus: 'idle' | 'running' | 'success' | 'error';
  runResult: Record<string, any> | null;
  runError: string | null;
  isDisabled: boolean;
  jsonIr: string;
  onGenerateIr: () => void;
}

type Tab = 'run' | 'ir';

const RunOutput: React.FC<Pick<ActionPanelProps, 'runStatus' | 'runResult' | 'runError'>> = ({ runStatus, runResult, runError }) => {
    if (runStatus === 'idle') return <div className="text-center py-8 text-sm text-gray-500">Run the flow to see execution outputs.</div>;
    
    return (
        <div className="mt-4 bg-gray-900/50 ring-1 ring-white/10 rounded-lg shadow-inner min-h-[100px]">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-300">Execution Output</h3>
                {runStatus === 'running' && (
                    <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-300">Running...</span>
                    </div>
                )}
                 {runStatus === 'success' && <span className="text-xs text-green-400 font-semibold">Completed Successfully</span>}
                 {runStatus === 'error' && <span className="text-xs text-red-400 font-semibold">Execution Failed</span>}
            </div>
            <div className="p-4 text-sm">
                {runStatus === 'success' && runResult && (
                    <div className="space-y-2">
                         <p className="text-xs text-gray-400 mb-3">Showing all resolved node outputs. Click to expand.</p>
                         {Object.entries(runResult).map(([nodeId, output]) => {
                            const isImage = typeof output === 'string' && output.startsWith('data:image');
                            return (
                                <details key={nodeId} className="bg-slate-800/50 rounded-lg border border-white/10 overflow-hidden">
                                    <summary className="px-3 py-2 cursor-pointer font-mono text-sm text-cyan-300 hover:bg-slate-700/50 transition flex items-center justify-between">
                                        {nodeId}
                                        <span className="text-gray-500 text-xs uppercase font-sans font-semibold">{isImage ? 'Image' : (typeof output === 'object' && output !== null ? 'Object' : typeof output)}</span>
                                    </summary>
                                    <div className="p-3 bg-gray-900 text-green-300 text-xs sm:text-sm overflow-x-auto">
                                        {isImage ? (
                                            <img src={output} alt={`Output from ${nodeId}`} className="max-w-full h-auto rounded" />
                                        ) : (
                                            <pre className="whitespace-pre-wrap break-all">
                                                <code>
                                                    {output === null ? 'null' :
                                                    output === undefined ? 'undefined' :
                                                    typeof output === 'object' ? JSON.stringify(output, null, 2) : 
                                                    String(output)}
                                                </code>
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                )}
                 {runStatus === 'error' && (
                    <pre className="text-sm text-red-300 overflow-x-auto whitespace-pre-wrap">
                        <code>{runError}</code>
                    </pre>
                )}
            </div>
        </div>
    );
}

const RunControlsAndOutput: React.FC<ActionPanelProps> = ({ nodes, onRun, runStatus, runResult, runError, isDisabled, jsonIr, onGenerateIr }) => {
  const [activeTab, setActiveTab] = useState<Tab>('run');
  const inputNodes = useMemo(() => nodes.filter(n => n.op === OpType.INPUT), [nodes]);
  const [inputValues, setInputValues] = useState<Record<NodeId, any>>({});

  useEffect(() => {
    const initialValues: Record<NodeId, any> = {};
    for (const node of inputNodes) {
        if (inputValues[node.id] === undefined) {
             initialValues[node.id] = "";
        }
    }
    setInputValues(prev => ({...initialValues, ...prev}));
  }, [inputNodes]);

  const handleInputChange = (id: NodeId, value: any) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
  };
  
  const TabButton: React.FC<{tab: Tab, label: string}> = ({ tab, label }) => (
      <button 
        onClick={() => setActiveTab(tab)} 
        className={`w-full py-2.5 text-sm font-bold transition-colors duration-200 rounded-md ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-300 bg-slate-700/50 hover:bg-slate-700'}`}>
        {label}
      </button>
  );

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col shadow-lg">
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 rounded-lg mb-4">
        <TabButton tab="run" label="Run" />
        <TabButton tab="ir" label="Generate IR" />
      </div>

      {activeTab === 'run' && (
        <>
            <div className="space-y-4">
                {inputNodes.length > 0 ? (
                inputNodes.map(node => (
                    <div key={node.id}>
                    <label htmlFor={`run-input-${node.id}`} className="block text-sm font-medium text-gray-300 mb-2">
                        Input: <span className="font-bold font-mono text-cyan-300">{node.id}</span> ({node.params?.type || 'string'})
                    </label>
                    <textarea
                        id={`run-input-${node.id}`}
                        value={inputValues[node.id] || ''}
                        onChange={(e) => handleInputChange(node.id, e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        rows={3}
                        placeholder={`Enter value for '${node.id}'...`}
                    />
                    </div>
                ))
                ) : (
                <p className="text-sm text-gray-500 text-center py-4">This workflow has no inputs.</p>
                )}
            </div>

            <button
                onClick={() => onRun(inputValues)}
                disabled={isDisabled || runStatus === 'running'}
                className="mt-4 w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-green-600/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                <span>{runStatus === 'running' ? 'Executing...' : 'Run Flow'}</span>
            </button>
            <div className="mt-4">
                <RunOutput runStatus={runStatus} runResult={runResult} runError={runError} />
            </div>
        </>
      )}

      {activeTab === 'ir' && (
        <div className="flex flex-col">
            <button
                  onClick={onGenerateIr}
                  disabled={isDisabled}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM5 15a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                  <span>{jsonIr ? 'Refresh IR' : 'Generate JSON IR'}</span>
              </button>
              <div className="mt-4">
                {jsonIr ? <JsonOutput json={jsonIr} /> : <div className="text-center py-8 text-sm text-gray-500">Click the button to generate the JSON IR.</div>}
              </div>
        </div>
      )}
    </div>
  );
};

export default RunControlsAndOutput;
