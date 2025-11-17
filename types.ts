
export enum OpType {
  INPUT = 'input',
  CONST = 'const',
  MAP = 'map',
  HTTP = 'http',
  LLM = 'llm',
  LOOP = 'loop',
  ITERATION_VAR = 'iteration_var',
  SEARCH = 'search',
  OUTPUT = 'output',
  IMAGE = 'image',
  EXPERT_PROMPT_ENGINEER = 'expert_prompt_engineer',
  EXPERT_CODE_OPTIMIZER = 'expert_code_optimizer',
  EXPERT_CLARITY_CONCISENESS = 'expert_clarity_conciseness',
}

export type NodeId = string;

export interface FlowNode {
  id: NodeId;
  op: OpType;
  inputs?: Record<string, NodeId | undefined>;
  params?: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowIR {
  name: string;
  inputs: Record<string, { type: string }>;
  outputs: Record<string, { from_node: string }>;
  nodes: Record<NodeId, {
    op: OpType;
    inputs?: Record<string, NodeId>;
    params?: Record<string, any>;
  }>;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  nodes: FlowNode[];
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  given_name: string;
}
