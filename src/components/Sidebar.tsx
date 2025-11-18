import React from 'react';
import { StoredWorkflow } from '../types';

interface SidebarProps {
  workflows: Record<string, StoredWorkflow>;
  activeWorkflowId: string | null;
  onSelectWorkflow: (id: string) => void;
  onCreateWorkflow: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ workflows, activeWorkflowId, onSelectWorkflow, onCreateWorkflow, isCollapsed, onToggle }) => {
  return (
    <aside className={`relative bg-gray-900/70 backdrop-blur-sm border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      <button 
        onClick={onToggle} 
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-indigo-600 hover:text-white transition-all duration-200 ring-2 ring-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onCreateWorkflow}
          className={`w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-all duration-200 flex items-center transform hover:scale-105 shadow-lg shadow-indigo-600/20 ${isCollapsed ? 'justify-center' : 'justify-center px-4 space-x-2'}`}
          aria-label="New Flow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          <span className={isCollapsed ? 'hidden' : ''}>New Flow</span>
        </button>
      </div>
      <nav className={`flex-grow overflow-y-auto overflow-x-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider px-4 mt-4 mb-2">Workflows</p>
        <ul className="p-2 space-y-1">
          {/* FIX: Add explicit type to 'flow' to resolve type inference error. */}
          {Object.values(workflows).map((flow: StoredWorkflow) => (
            <li key={flow.id}>
              <button
                onClick={() => onSelectWorkflow(flow.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition duration-150 truncate ${
                  activeWorkflowId === flow.id
                    ? 'bg-indigo-600/50 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_10px_rgba(99,102,241,0.5)]'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
                title={flow.name}
              >
                {flow.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
