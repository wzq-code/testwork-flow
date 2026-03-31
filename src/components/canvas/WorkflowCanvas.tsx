import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type NodeTypes } from "@xyflow/react";
import { useEffect, useMemo, useRef } from "react";
import { useWorkflowStore } from "../../store/workflowStore";
import { WorkflowNodeCard } from "./WorkflowNodeCard";

const nodeTypes: NodeTypes = {
  start: WorkflowNodeCard,
  script: WorkflowNodeCard,
  digitCollect: WorkflowNodeCard,
  route: WorkflowNodeCard,
  return: WorkflowNodeCard,
  subflow: WorkflowNodeCard,
  function: WorkflowNodeCard,
  end: WorkflowNodeCard
};

const FlowContent = () => {
  const { document, onNodesChange, onEdgesChange, onConnect, selectNode } = useWorkflowStore((state) => state);
  const flowNodes = useMemo(() => document.nodes, [document.nodes]);
  const { fitView } = useReactFlow();
  const prevNodeCountRef = useRef(flowNodes.length);

  useEffect(() => {
    if (flowNodes.length !== prevNodeCountRef.current) {
      prevNodeCountRef.current = flowNodes.length;
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [flowNodes.length, fitView]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={document.edges}
      nodeTypes={nodeTypes}
      fitView
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => selectNode(String(node.id))}
      onPaneClick={() => selectNode(undefined)}
    >
      <MiniMap />
      <Controls />
      <Background gap={16} size={1} />
    </ReactFlow>
  );
};

export const WorkflowCanvas = () => {
  return (
    <section className="canvas-panel">
      <ReactFlowProvider>
        <FlowContent />
      </ReactFlowProvider>
    </section>
  );
};
