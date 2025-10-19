
import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNode, NodeId, OpType } from '../types';

const opDetails: Record<OpType, { color: string; icon: React.FC<{className: string}>; inputs: {id: string, label: string}[] }> = {
    [OpType.INPUT]: { color: 'border-sky-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" /></svg>, inputs: [] },
    [OpType.CONST]: { color: 'border-purple-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M12 7.5V5.25m0 2.25l-2.25-1.313" /></svg>, inputs: [] },
    [OpType.IMAGE]: { color: 'border-orange-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>, inputs: [] },
    [OpType.MAP]: { color: 'border-amber-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>, inputs: [{id: 'each', label: 'Each'}] },
    [OpType.HTTP]: { color: 'border-rose-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>, inputs: [{id: 'url', label: 'URL'}] },
    [OpType.SEARCH]: { color: 'border-blue-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>, inputs: [{id: 'query', label: 'Query'}] },
    [OpType.LLM]: { color: 'border-teal-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5A2.25 2.25 0 0 0 6.75 18z" /></svg>, inputs: [{id: 'prompt', label: 'Prompt'}, {id: 'system', label: 'System'}, {id: 'image', label: 'Image'}] },
    [OpType.OUTPUT]: { color: 'border-slate-500', icon: (props) => <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>, inputs: [{id: 'from_node', label: 'From Node'}] },
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">{children}</label>
);

const TextInput: React.FC<{ value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void, placeholder?: string, mono?: boolean }> = ({ value, onChange, onBlur, placeholder, mono }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${mono ? 'font-mono' : ''}`}
    />
);

const SelectInput: React.FC<{ value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }> = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={onChange}
        className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
    >
        {options.map(id => <option key={id} value={id}>{id}</option>)}
    </select>
);

const ParamUpdater = (id: NodeId, onUpdate: (id: NodeId, updatedProps: Partial<FlowNode>) => void, params: Record<string, any>) => (key: string, value: any) => {
    onUpdate(id, { params: { ...params, [key]: value } });
};

const CustomNode = ({ id, data, selected }: NodeProps<FlowNode & { onUpdateNode: (id: NodeId, updatedProps: Partial<FlowNode>) => void }>) => {
    const { op, params = {} } = data;
    const { color, icon: Icon, inputs } = opDetails[op];
    const [localId, setLocalId] = useState(id);

    useEffect(() => { setLocalId(id); }, [id]);

    const handleIdBlur = () => { if (localId !== id && localId.trim() !== '') data.onUpdateNode(id, { id: localId }); };
    const handleParamChange = ParamUpdater(id, data.onUpdateNode, params);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleParamChange('value', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderNodeConfig = () => {
        switch(op) {
            case OpType.INPUT:
                return <div>
                    <FieldLabel>Type</FieldLabel>
                    <SelectInput value={params.type || 'string'} onChange={e => handleParamChange('type', e.target.value)} options={['string', 'number', 'object']} />
                </div>;
            case OpType.CONST:
                const [localValue, setLocalValue] = useState(params.value || '');
                useEffect(() => { setLocalValue(params.value || ''); }, [params.value]);
                return <div>
                    <FieldLabel>Value (JSON)</FieldLabel>
                    <textarea
                        value={localValue} onChange={e => setLocalValue(e.target.value)}
                        onBlur={() => { if (localValue !== params.value) handleParamChange('value', localValue) }}
                        placeholder='e.g., "hello" or ["item1", "item2"]'
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono h-24"
                    />
                </div>;
            case OpType.IMAGE:
                return <div className="space-y-2">
                    <FieldLabel>Source Image</FieldLabel>
                    {params.value && <img src={params.value} alt="preview" className="rounded-md max-h-40 w-auto mx-auto" />}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/50 file:text-indigo-200 hover:file:bg-indigo-600/80 transition" />
                </div>
            case OpType.MAP:
                const [localFn, setLocalFn] = useState(params.fn || '');
                useEffect(() => { setLocalFn(params.fn || ''); }, [params.fn]);
                return <div>
                    <FieldLabel>Function</FieldLabel>
                    <TextInput value={localFn} onChange={e => setLocalFn(e.target.value)}
                        onBlur={() => { if (localFn !== params.fn) handleParamChange('fn', localFn) }}
                        placeholder="e.g., https://api.com?q={{item}}" mono
                    />
                </div>;
            case OpType.HTTP:
                return <div>
                    <FieldLabel>Method</FieldLabel>
                    <SelectInput value={params.method || 'GET'} onChange={e => handleParamChange('method', e.target.value)} options={['GET', 'POST']} />
                </div>;
            case OpType.LLM:
                const [localModel, setLocalModel] = useState(params.model || '');
                const [localTemp, setLocalTemp] = useState(params.temperature ?? 0.5);
                useEffect(() => { setLocalModel(params.model || ''); }, [params.model]);
                useEffect(() => { setLocalTemp(params.temperature ?? 0.5); }, [params.temperature]);
                return <div className="grid grid-cols-2 gap-4">
                    <div>
                        <FieldLabel>Model</FieldLabel>
                        <TextInput value={localModel} onChange={e => setLocalModel(e.target.value)}
                            onBlur={() => { if (localModel !== params.model) handleParamChange('model', localModel) }}
                        />
                    </div>
                    <div>
                        <FieldLabel>Temp</FieldLabel>
                        <input type="number" step="0.1" min="0" max="1" value={localTemp}
                            onChange={e => setLocalTemp(parseFloat(e.target.value) || 0)}
                            onBlur={() => { if (localTemp !== params.temperature) handleParamChange('temperature', localTemp) }}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm"
                        />
                    </div>
                </div>;
            default: return null;
        }
    }

    return (
        <div className={`w-80 bg-slate-800/80 backdrop-blur-sm border-l-4 ${color} rounded-lg shadow-lg ring-1 ${selected ? 'ring-indigo-400' : 'ring-white/10'}`}>
            {inputs.map((input, i) => (
                <Handle key={input.id} type="target" id={input.id} position={Position.Left} style={{ top: 60 + i * 40 }} />
            ))}
            
            <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 flex-shrink-0 ${color.replace('border-', 'text-')}`} />
                    <div className="flex-grow min-w-0">
                        <span className="text-xs uppercase font-bold tracking-wider text-gray-400">{op}</span>
                        <TextInput value={localId} mono onChange={(e) => setLocalId(e.target.value.replace(/\s/g, ''))} onBlur={handleIdBlur} />
                    </div>
                </div>
            </div>
            
            {(renderNodeConfig() || inputs.length > 0) && (
                <div className="p-3 bg-slate-900/40 rounded-b-lg space-y-3 text-sm">
                    {inputs.map(input => (
                        <div key={input.id}>
                            <div className="text-gray-400 font-mono text-xs">{input.label} <span className="text-gray-500 font-sans"> &larr; {data.inputs?.[input.id] || 'N/A'}</span></div>
                        </div>
                    ))}
                    {renderNodeConfig()}
                </div>
            )}
            
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default memo(CustomNode);
