
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { OpType, FlowNode, WorkflowIR, NodeId, StoredWorkflow } from '../types';
import { validateWorkflow } from '../services/workflowValidator';
import { executeWorkflow } from '../services/workflowExecutor';
import WorkflowControls from './WorkflowControls';
import WorkflowCanvas from './WorkflowCanvas';
import RunControlsAndOutput from './RunControlsAndOutput';
import { operationCatalog } from '../operations/catalog';

// FIX: Added missing WorkflowEditorProps interface definition.
interface WorkflowEditorProps {
  workflow: StoredWorkflow;
  onUpdate: (workflow: StoredWorkflow) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  isDirty: boolean;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflow, onUpdate, onDelete, onSave, isDirty }) => {
  const [error, setError] = useState<string | null>(null);
  const [jsonIr, setJsonIr] = useState<string>('');
  
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [runResult, setRunResult] = useState<Record<string, any> | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const nodes = workflow.nodes;
  
  const runValidation = useCallback((currentNodes: FlowNode[]) => {
    const validationError = validateWorkflow(currentNodes);
    setError(validationError);
  }, []);

  useEffect(() => {
    runValidation(nodes);
  }, [nodes, runValidation]);

  const updateWorkflow = (newWorkflowData: Partial<StoredWorkflow>) => {
    onUpdate({ ...workflow, ...newWorkflowData });
  };

  const handleNodesChange = (newNodes: FlowNode[]) => {
    updateWorkflow({ nodes: newNodes });
  };
  
  const updateName = (newName: string) => {
    updateWorkflow({ name: newName });
  };

  const handleAddNode = (op: OpType) => {
    const newId = `${op}_${Date.now()}`;
    const reactFlowWrapper = canvasContainerRef.current;
    let position = { x: 200, y: 100 };

    if (reactFlowWrapper) {
        const bounds = reactFlowWrapper.getBoundingClientRect();
        // Place node near center of viewport
        position = {
            x: bounds.width / 2 - 150,
            y: bounds.height / 2 - 100,
        };
    }

    const definition = operationCatalog[op];
    const defaultInputs = definition?.defaultInputs ? { ...definition.defaultInputs } : undefined;
    const defaultParams = definition?.defaultParams ? structuredClone(definition.defaultParams) : undefined;

    const newNode: FlowNode = {
      id: newId,
      op,
      position,
      ...(defaultInputs ? { inputs: defaultInputs } : {}),
      ...(defaultParams ? { params: defaultParams } : {}),
    };

    updateWorkflow({ nodes: [...nodes, newNode] });
  };

  const handleUpdateNode = (id: NodeId, updatedProps: Partial<FlowNode>) => {
    let currentNodes = nodes;
    // If the ID has changed, we need to update all connections pointing to the old ID
    if (updatedProps.id && updatedProps.id !== id) {
        const newId = updatedProps.id;
        currentNodes = currentNodes.map(n => {
            if (n.id === id) return n; // Skip the node being renamed
            const newInputs = { ...n.inputs };
            let changed = false;
            for (const key in newInputs) {
                if (newInputs[key] === id) {
                    newInputs[key] = newId;
                    changed = true;
                }
            }
            return changed ? { ...n, inputs: newInputs } : n;
        });
    }

    handleNodesChange(
      currentNodes.map(node => (node.id === id ? { ...node, ...updatedProps } : node))
    );
  };
  
  const generateIr = useCallback(() => {
    if (error) {
      setJsonIr(JSON.stringify({ error: "Cannot generate IR, please fix validation errors." }, null, 2));
      return;
    }

    const ir: WorkflowIR = {
      name: workflow.name,
      inputs: {},
      outputs: {},
      nodes: {},
    };

    for (const node of nodes) {
      if (node.op === OpType.INPUT) {
        ir.inputs[node.id] = { type: node.params?.type || 'string' };
      } else if (node.op === OpType.OUTPUT) {
        ir.outputs[node.id] = { from_node: node.inputs?.from_node || '' };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, op, position, ...rest } = node;
        ir.nodes[id] = { op, ...rest };
      }
    }
    setJsonIr(JSON.stringify(ir, null, 2));
  }, [nodes, error, workflow.name]);

  const handleRunFlow = async (inputValues: Record<NodeId, any>) => {
    if (error) {
      setRunStatus('error');
      setRunError('Cannot run flow with validation errors.');
      return;
    }
    setRunStatus('running');
    setRunResult(null);
    setRunError(null);

    try {
      const result = await executeWorkflow(nodes, inputValues);
      setRunResult(result);
      setRunStatus('success');
    } catch (e: any) {
      setRunError(e.message || 'An unknown error occurred during execution.');
      setRunStatus('error');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header Bar */}
      <div className="bg-slate-800/60 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-6 shadow-lg flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
              <div className="flex-grow w-full">
                  <label htmlFor="workflowName" className="block text-sm font-medium text-gray-300 mb-2">Workflow Name</label>
                  <input
                      id="workflowName"
                      type="text"
                      value={workflow.name}
                      onChange={(e) => updateName(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Enter workflow name"
                  />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <button 
                      onClick={() => onDelete(workflow.id)} 
                      className="w-full sm:w-auto px-4 py-2 bg-rose-800/80 text-white font-bold rounded-lg hover:bg-rose-700/80 transition duration-200 flex items-center justify-center space-x-2"
                      aria-label="Delete workflow"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                  <button 
                      onClick={onSave} 
                      disabled={!isDirty}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.5 2.5a.5.5 0 00-1 0v1a.5.5 0 001 0v-1zM6 3.5A1.5 1.5 0 017.5 2h5A1.5 1.5 0 0114 3.5v1.518a3.001 3.001 0 011.662 2.625v7.357A1.5 1.5 0 0114 16.5h-8A1.5 1.5 0 014.5 15V7.643A3.001 3.001 0 016 5.018V3.5zM13 5.018a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 007 5.018v.482A3.002 3.002 0 019.5 5h1a3.002 3.002 0 012.5.5v-.482z" /></svg>
                      <span>{isDirty ? 'Save' : 'Saved'}</span>
                  </button>
              </div>
          </div>
      </div>
      
      {error && (
          <div className="my-2 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg shadow-lg flex-shrink-0" role="alert">
              <p className="font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  Validation Error
              </p>
              <p className="mt-1 text-sm">{error}</p>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_320px]">

        {/* Left Column: Workflow Canvas */}
        <div
          className="relative rounded-lg min-w-0 min-h-[520px] lg:min-h-[600px] h-full overflow-hidden"
          ref={canvasContainerRef}
        >
            <WorkflowCanvas 
              nodes={nodes}
              onNodesChange={handleNodesChange}
              onUpdateNode={handleUpdateNode}
            />
            <WorkflowControls onAddNode={handleAddNode} />
        </div>

        {/* Right Column: Action Panel */}
        <div className="min-w-0 min-h-0 overflow-y-auto">
             <RunControlsAndOutput
                nodes={nodes}
                onRun={handleRunFlow}
                runStatus={runStatus}
                runResult={runResult}
                runError={runError}
                isDisabled={!!error}
                jsonIr={jsonIr}
                onGenerateIr={generateIr}
            />
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
