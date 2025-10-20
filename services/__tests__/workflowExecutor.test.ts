import { describe, it, expect, vi } from 'vitest';
import { executeWorkflow, OperationAdapters, WorkflowExecutionError } from '../workflowExecutor';
import { FlowNode, OpType } from '../../types';

const baseNode = (id: string, op: OpType, extra: Partial<FlowNode> = {}): FlowNode => ({
  id,
  op,
  position: { x: 0, y: 0 },
  ...extra,
});

const createAdapters = (overrides: Partial<OperationAdapters> = {}): OperationAdapters => ({
  llm: async (_payload) => '',
  search: async (_payload) => '',
  http: async (_payload) => '',
  ...overrides,
});

describe('executeWorkflow', () => {
  it('runs simple constant workflow', async () => {
    const nodes: FlowNode[] = [
      baseNode('const1', OpType.CONST, { params: { value: '"hello"' } }),
      baseNode('output1', OpType.OUTPUT, { inputs: { from_node: 'const1' } }),
    ];

    const result = await executeWorkflow(nodes, {}, createAdapters());
    expect(result.const1).toBe('hello');
  });

  it('executes map nodes with template replacement', async () => {
    const nodes: FlowNode[] = [
      baseNode('inputList', OpType.CONST, { params: { value: '["alpha","beta"]' } }),
      baseNode('mapNode', OpType.MAP, {
        inputs: { each: 'inputList' },
        params: { fn: 'Item: {{ item }}' },
      }),
    ];

    const result = await executeWorkflow(nodes, {}, createAdapters());
    expect(result.mapNode).toEqual(['Item: alpha', 'Item: beta']);
  });

  it('delegates to the LLM adapter and surfaces failures', async () => {
    const adapters = createAdapters({
      llm: vi.fn(async () => ({ message: 'hi' })),
    });

    const nodes: FlowNode[] = [
      baseNode('prompt', OpType.CONST, { params: { value: '"Tell me something"' } }),
      baseNode('llm', OpType.LLM, {
        inputs: { prompt: 'prompt' },
        params: { out: 'json', temperature: 0.2, model: 'gemini-2.5-flash' },
      }),
    ];

    const result = await executeWorkflow(nodes, {}, adapters);
    expect(adapters.llm).toHaveBeenCalledWith({
      provider: 'google',
      model: 'gemini-2.5-flash',
      prompt: 'Tell me something',
      system: null,
      image: null,
      temperature: 0.2,
      expectJson: true,
    });
    expect(result.llm).toEqual({ message: 'hi' });
  });

  it('wraps adapter errors in WorkflowExecutionError', async () => {
    const adapters = createAdapters({
      llm: async () => {
        throw new Error('upstream boom');
      },
    });

    const nodes: FlowNode[] = [
      baseNode('prompt', OpType.CONST, { params: { value: '"test"' } }),
      baseNode('llm', OpType.LLM, { inputs: { prompt: 'prompt' } }),
    ];

    await expect(executeWorkflow(nodes, {}, adapters)).rejects.toThrow(WorkflowExecutionError);
  });
});
