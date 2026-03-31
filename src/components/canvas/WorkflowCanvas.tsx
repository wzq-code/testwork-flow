import { Background, Controls, MiniMap, ReactFlow, type NodeTypes } from "@xyflow/react";
import { useMemo } from "react";
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

export const WorkflowCanvas = () => {
  const { document, onNodesChange, onEdgesChange, onConnect, selectNode } = useWorkflowStore((state) => state);
  const flowNodes = useMemo(() => document.nodes, [document.nodes]);

  return (
    <section className="canvas-panel">
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
    </section>
  );
};
