
import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNode, NodeId, OpType } from '../types';
import { operationCatalog } from '../operations/catalog';
import { LLM_PROVIDERS } from '../config/llmProviders';

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
    const definition = operationCatalog[op];
    const Icon = definition?.icon ?? ((props: { className?: string }) => <span {...props}>?</span>);
    const inputs = definition?.inputHandles ?? [];
    const borderClass = definition?.nodeBorderClass ?? 'border-slate-500';
    const iconColorClass = borderClass.replace('border-', 'text-');
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
            case OpType.SEARCH: {
                const providerOptions = LLM_PROVIDERS;
                const selectedProvider = (params.provider as string) || providerOptions[0];
                return (
                    <div>
                        <FieldLabel>Provider</FieldLabel>
                        <SelectInput
                            value={selectedProvider}
                            onChange={(e) => handleParamChange('provider', e.target.value)}
                            options={providerOptions}
                        />
                    </div>
                );
            }
            case OpType.LLM: {
                const providerOptions = LLM_PROVIDERS;
                const [localProvider, setLocalProvider] = useState((params.provider as string) || providerOptions[0]);
                const [localModel, setLocalModel] = useState(params.model || '');
                const [localTemp, setLocalTemp] = useState(params.temperature ?? 0.5);
                useEffect(() => { setLocalProvider((params.provider as string) || providerOptions[0]); }, [params.provider]);
                useEffect(() => { setLocalModel(params.model || ''); }, [params.model]);
                useEffect(() => { setLocalTemp(params.temperature ?? 0.5); }, [params.temperature]);
                return (
                    <div className="space-y-4">
                        <div>
                            <FieldLabel>Provider</FieldLabel>
                            <SelectInput
                                value={localProvider}
                                onChange={(e) => {
                                    setLocalProvider(e.target.value);
                                    handleParamChange('provider', e.target.value);
                                }}
                                options={providerOptions}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                    </div>
                );
            }
            default: return null;
        }
    }

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
