import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { FlowNode, NodeId, OpType } from '../types';
import CustomNode from './CustomNode';
import LoopNode from './LoopNode';

interface WorkflowCanvasProps {
  nodes: FlowNode[];
  onNodesChange: (nodes: FlowNode[]) => void;
  onUpdateNode: (id: NodeId, updatedProps: Partial<FlowNode>) => void;
}

const nodeTypes = {
  custom: CustomNode,
  loop: LoopNode,
};

const flowNodeToReactFlowNode = (node: FlowNode, onUpdateNode: any): Node => ({
  id: node.id,
  type: node.op === OpType.LOOP ? 'loop' : 'custom',
  position: node.position,
  data: { ...node, onUpdateNode },
});

const flowNodesToReactFlowEdges = (nodes: FlowNode[]): Edge[] => {
  const edges: Edge[] = [];
  for (const node of nodes) {
    if (node.inputs) {
      for (const [targetHandle, sourceId] of Object.entries(node.inputs)) {
        if (sourceId) {
          edges.push({
            id: `edge-${sourceId}-${node.id}-${targetHandle}`,
            source: sourceId,
            target: node.id,
            targetHandle: targetHandle,
            type: 'smoothstep',
          });
        }
      }
    }
  }
  return edges;
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ nodes: flowNodes, onNodesChange, onUpdateNode }) => {
  const reactFlowNodes = useMemo(() => flowNodes.map(n => flowNodeToReactFlowNode(n, onUpdateNode)), [flowNodes, onUpdateNode]);
  const reactFlowEdges = useMemo(() => flowNodesToReactFlowEdges(flowNodes), [flowNodes]);
  
  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState(reactFlowNodes);
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState(reactFlowEdges);

  React.useEffect(() => setRfNodes(reactFlowNodes), [reactFlowNodes, setRfNodes]);
  React.useEffect(() => setRfEdges(reactFlowEdges), [reactFlowEdges, setRfEdges]);

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const updatedRfNodes = applyNodeChanges(changes, rfNodes);
      const updatedFlowNodes = updatedRfNodes.map(rfNode => {
          const { onUpdateNode, ...flowNodeData } = rfNode.data;
          return { ...flowNodeData, position: rfNode.position };
      });
      onNodesChange(updatedFlowNodes);
    },
    [rfNodes, onNodesChange]
  );
  
  const handleEdgesChange: OnEdgesChange = useCallback(
      (changes) => {
          const updatedEdges = applyEdgeChanges(changes, rfEdges);
          let updatedFlowNodes = [...flowNodes];

          for (const change of changes) {
              if (change.type === 'remove') {
                  const edgeToRemove = rfEdges.find(e => e.id === change.id);
                  if (edgeToRemove) {
                      updatedFlowNodes = updatedFlowNodes.map(n => {
                          if (n.id === edgeToRemove.target) {
                              const newInputs = { ...n.inputs };
                              delete newInputs[edgeToRemove.targetHandle!];
                              return { ...n, inputs: newInputs };
                          }
                          return n;
                      });
                  }
              }
          }
          onNodesChange(updatedFlowNodes);
      },
      [rfEdges, flowNodes, onNodesChange]
  );
  
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.targetHandle) {
        onUpdateNode(connection.target, { 
            inputs: { 
                ...flowNodes.find(n => n.id === connection.target)?.inputs, 
                [connection.targetHandle]: connection.source 
            } 
        });
      }
    },
    [flowNodes, onUpdateNode]
  );

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-800"
        style={{ width: '100%', height: '100%' }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
