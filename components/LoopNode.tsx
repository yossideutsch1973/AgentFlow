
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNode, NodeId } from '../types';
import { operationCatalog } from '../operations/catalog';

const LoopNode = ({ id, data, selected }: NodeProps<FlowNode & { onUpdateNode: (id: NodeId, updatedProps: Partial<FlowNode>) => void }>) => {
    const { op } = data;
    const definition = operationCatalog[op];
    const Icon = definition?.icon ?? ((props: { className?: string }) => <span {...props}>?</span>);
    const inputs = definition?.inputHandles ?? [];
    const borderClass = definition?.nodeBorderClass ?? 'border-slate-500';
    const iconColorClass = borderClass.replace('border-', 'text-');

    return (
        <div className={`w-80 bg-slate-800/80 backdrop-blur-sm border-l-4 ${borderClass} rounded-lg shadow-lg ring-1 ${selected ? 'ring-indigo-400' : 'ring-white/10'}`}>
            {inputs.map((input, i) => (
                <Handle key={input.id} type="target" id={input.id} position={Position.Left} style={{ top: 60 + i * 40 }} />
            ))}

            <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 flex-shrink-0 ${iconColorClass}`} />
                    <div className="flex-grow min-w-0">
                        <span className="text-xs uppercase font-bold tracking-wider text-gray-400">{op}</span>
                        <div className="text-gray-200 font-mono">{id}</div>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-slate-900/40 rounded-b-lg space-y-3 text-sm">
                {inputs.map(input => (
                    <div key={input.id}>
                        <div className="text-gray-400 font-mono text-xs">{input.label} <span className="text-gray-500 font-sans"> &larr; {data.inputs?.[input.id] || 'N/A'}</span></div>
                    </div>
                ))}
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default LoopNode;
