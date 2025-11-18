
import { FlowNode, NodeId } from '../types';

const validateNodeIds = (nodes: FlowNode[]): string | null => {
  const ids = new Set<NodeId>();
  for (const node of nodes) {
    if (!node.id || node.id.trim() === '') {
      return `Node with op '${node.op}' has an empty ID.`;
    }
    if (ids.has(node.id)) {
      return `Duplicate node ID detected: '${node.id}'. IDs must be unique.`;
    }
    if (/\s/.test(node.id)) {
      return `Node ID '${node.id}' contains whitespace. IDs must not contain spaces.`;
    }
    ids.add(node.id);
  }
  return null;
};

const detectCycles = (nodes: FlowNode[]): string | null => {
  const adj: Record<NodeId, NodeId[]> = {};
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    adj[node.id] = [];
    if (node.inputs) {
      for (const inputNodeId of Object.values(node.inputs)) {
        if (inputNodeId && nodeIds.has(inputNodeId)) {
          adj[node.id].push(inputNodeId);
        }
      }
    }
  }

  const visiting = new Set<NodeId>(); // Gray set
  const visited = new Set<NodeId>();  // Black set

  const hasCycle = (nodeId: NodeId, path: NodeId[]): string | null => {
    visiting.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adj[nodeId] || []) {
      if (visiting.has(neighbor)) {
        const cyclePath = [...path, neighbor];
        return `Cycle detected: ${cyclePath.join(" -> ")}`;
      }
      if (!visited.has(neighbor)) {
        const result = hasCycle(neighbor, path);
        if (result) return result;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    path.pop();
    return null;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const result = hasCycle(node.id, []);
      if (result) return result;
    }
  }

  return null;
};

const validateConnections = (nodes: FlowNode[]): string | null => {
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const node of nodes) {
        if(node.inputs) {
            for(const [inputName, targetNodeId] of Object.entries(node.inputs)) {
                if(targetNodeId && !nodeIds.has(targetNodeId)) {
                    return `Node '${node.id}' has an invalid input '${inputName}' pointing to a non-existent node '${targetNodeId}'.`;
                }
            }
        }
    }
    return null;
}

export const validateWorkflow = (nodes: FlowNode[]): string | null => {
  let error = validateNodeIds(nodes);
  if (error) return error;

  error = validateConnections(nodes);
  if (error) return error;

  error = detectCycles(nodes);
  if (error) return error;

  return null;
};
