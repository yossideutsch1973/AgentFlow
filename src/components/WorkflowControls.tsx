
import React from 'react';
import { OpType } from '../types';
import { operationList } from '../operations/catalog';

interface WorkflowControlsProps {
  onAddNode: (op: OpType) => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({ onAddNode }) => {
  return (
    <div className="absolute top-0 left-0 z-10 p-2">
      <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl">
        <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider text-center">Add Node</h2>
        <div className="grid grid-cols-2 gap-2">
          {operationList.map(({ type, label, paletteClasses, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onAddNode(type)}
              title={`Add ${label} Node`}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center gap-1.5 ${paletteClasses}`}
            >
              <div className="w-5 h-5">
                <Icon className="h-5 w-5" />
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowControls;
