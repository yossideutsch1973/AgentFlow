import React from 'react';
import { OpType } from '../types';

export interface OperationInputDefinition {
  id: string;
  label: string;
}

export interface OperationDefinition {
  type: OpType;
  label: string;
  paletteClasses: string;
  nodeBorderClass: string;
  icon: React.FC<{ className?: string }>;
  inputHandles: OperationInputDefinition[];
  defaultParams?: Record<string, unknown>;
  defaultInputs?: Record<string, undefined>;
}

const makeIcon = (paths: React.ReactNode): React.FC<{ className?: string }> => {
  return ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      {paths}
    </svg>
  );
};

export const operationCatalog: Record<OpType, OperationDefinition> = {
  [OpType.INPUT]: {
    type: OpType.INPUT,
    label: 'Input',
    paletteClasses: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 ring-1 ring-sky-500/30',
    nodeBorderClass: 'border-sky-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />),
    inputHandles: [],
    defaultParams: { type: 'string' },
  },
  [OpType.CONST]: {
    type: OpType.CONST,
    label: 'Constant',
    paletteClasses: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 ring-1 ring-purple-500/30',
    nodeBorderClass: 'border-purple-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M12 7.5V5.25m0 2.25l-2.25-1.313" />),
    inputHandles: [],
    defaultParams: { value: '""' },
  },
  [OpType.IMAGE]: {
    type: OpType.IMAGE,
    label: 'Image',
    paletteClasses: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 ring-1 ring-orange-500/30',
    nodeBorderClass: 'border-orange-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />),
    inputHandles: [],
    defaultParams: { value: null },
  },
  [OpType.MAP]: {
    type: OpType.MAP,
    label: 'Map',
    paletteClasses: 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 ring-1 ring-amber-500/30',
    nodeBorderClass: 'border-amber-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />),
    inputHandles: [{ id: 'each', label: 'Each' }],
    defaultParams: { fn: '' },
    defaultInputs: { each: undefined },
  },
  [OpType.HTTP]: {
    type: OpType.HTTP,
    label: 'HTTP',
    paletteClasses: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 ring-1 ring-rose-500/30',
    nodeBorderClass: 'border-rose-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />),
    inputHandles: [{ id: 'url', label: 'URL' }],
    defaultInputs: { url: undefined },
    defaultParams: { method: 'GET' },
  },
  [OpType.SEARCH]: {
    type: OpType.SEARCH,
    label: 'Search',
    paletteClasses: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 ring-1 ring-blue-500/30',
    nodeBorderClass: 'border-blue-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />),
    inputHandles: [{ id: 'query', label: 'Query' }],
    defaultParams: { provider: 'google' },
  },
  [OpType.LLM]: {
    type: OpType.LLM,
    label: 'LLM',
    paletteClasses: 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 ring-1 ring-teal-500/30',
    nodeBorderClass: 'border-teal-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5A2.25 2.25 0 0 0 6.75 18z" />),
    inputHandles: [
      { id: 'prompt', label: 'Prompt' },
      { id: 'system', label: 'System' },
      { id: 'image', label: 'Image' },
    ],
    defaultInputs: { prompt: undefined, system: undefined, image: undefined },
    defaultParams: { model: 'gemini-2.5-flash', out: 'text', temperature: 0.5, provider: 'google' },
  },
  [OpType.LOOP]: {
    type: OpType.LOOP,
    label: 'Loop',
    paletteClasses: 'bg-green-500/20 text-green-300 hover:bg-green-500/30 ring-1 ring-green-500/30',
    nodeBorderClass: 'border-green-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v-4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0l-3.181 3.183" />),
    inputHandles: [
        { id: 'count', label: 'Count' },
        { id: 'body', label: 'Body' },
    ],
    defaultInputs: { count: undefined, body: undefined },
    defaultParams: {},
  },
  [OpType.ITERATION_VAR]: {
    type: OpType.ITERATION_VAR,
    label: 'Iteration Variable',
    paletteClasses: 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 ring-1 ring-gray-500/30',
    nodeBorderClass: 'border-gray-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />),
    inputHandles: [],
    defaultParams: { loopId: '' },
  },
  [OpType.OUTPUT]: {
    type: OpType.OUTPUT,
    label: 'Output',
    paletteClasses: 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 ring-1 ring-slate-500/30',
    nodeBorderClass: 'border-slate-500',
    icon: makeIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />),
    inputHandles: [{ id: 'from_node', label: 'From Node' }],
    defaultInputs: { from_node: undefined },
  },
};

export const operationList = Object.values(operationCatalog);
