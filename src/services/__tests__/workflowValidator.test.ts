import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../workflowValidator';
import { FlowNode, OpType } from '../../types';

const createNode = (id: string, op: OpType, extra: Partial<FlowNode> = {}): FlowNode => ({
  id,
  op,
  position: { x: 0, y: 0 },
  ...extra,
});

describe('validateWorkflow', () => {
  it('passes a simple acyclic workflow', () => {
    const nodes: FlowNode[] = [
      createNode('input1', OpType.INPUT),
      createNode('const1', OpType.CONST),
      createNode('llm1', OpType.LLM, {
        inputs: { prompt: 'const1' },
      }),
      createNode('output', OpType.OUTPUT, {
        inputs: { from_node: 'llm1' },
      }),
    ];

    expect(validateWorkflow(nodes)).toBeNull();
  });

  it('detects duplicate identifiers', () => {
    const nodes: FlowNode[] = [
      createNode('dup', OpType.INPUT),
      createNode('dup', OpType.CONST),
    ];

    expect(validateWorkflow(nodes)).toContain('Duplicate node ID');
  });

  it('detects references to missing nodes', () => {
    const nodes: FlowNode[] = [
      createNode('output', OpType.OUTPUT, {
        inputs: { from_node: 'ghost' },
      }),
    ];

    expect(validateWorkflow(nodes)).toContain("non-existent node 'ghost'");
  });

  it('detects cycles', () => {
    const nodes: FlowNode[] = [
      createNode('a', OpType.CONST, { inputs: { from: 'c' } }),
      createNode('b', OpType.CONST, { inputs: { from: 'a' } }),
      createNode('c', OpType.CONST, { inputs: { from: 'b' } }),
    ];

    expect(validateWorkflow(nodes)).toContain('Cycle detected');
  });
});
