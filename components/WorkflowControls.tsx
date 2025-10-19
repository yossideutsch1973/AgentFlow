
import React from 'react';
import { OpType } from '../types';

interface WorkflowControlsProps {
  onAddNode: (op: OpType) => void;
}

const nodeTypes: { op: OpType, label: string, color: string, icon: React.ReactNode }[] = [
    { op: OpType.INPUT, label: 'Input', color: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 ring-1 ring-sky-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" /></svg> },
    { op: OpType.CONST, label: 'Constant', color: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 ring-1 ring-purple-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M12 7.5V5.25m0 2.25l-2.25-1.313" /></svg> },
    { op: OpType.IMAGE, label: 'Image', color: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 ring-1 ring-orange-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
    { op: OpType.MAP, label: 'Map', color: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 ring-1 ring-amber-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
    { op: OpType.HTTP, label: 'HTTP', color: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 ring-1 ring-rose-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
    { op: OpType.SEARCH, label: 'Search', color: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 ring-1 ring-blue-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg> },
    { op: OpType.LLM, label: 'LLM', color: 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 ring-1 ring-teal-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5A2.25 2.25 0 0 0 6.75 18z" /></svg> },
    { op: OpType.OUTPUT, label: 'Output', color: 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 ring-1 ring-slate-500/30', icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg> },
];

const WorkflowControls: React.FC<WorkflowControlsProps> = ({ onAddNode }) => {
  return (
    <div className="absolute top-0 left-0 z-10 p-2">
      <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl">
        <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider text-center">Add Node</h2>
        <div className="grid grid-cols-2 gap-2">
          {nodeTypes.map(({ op, label, color, icon }) => (
            <button
              key={op}
              onClick={() => onAddNode(op)}
              title={`Add ${label} Node`}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-1.5 ${color}`}
            >
              <div className="w-5 h-5">{icon}</div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowControls;
