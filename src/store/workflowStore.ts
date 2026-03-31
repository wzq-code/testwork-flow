import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection } from "@xyflow/react";
import { create } from "zustand";
import { mockCatalogs } from "../data/mockCatalog";
import type {
  NodeKind,
  WorkflowCatalogs,
  WorkflowDocument,
  WorkflowEdge,
  WorkflowFlowNode
} from "../types/workflow";
import { createNode } from "../utils/nodeFactory";

interface WorkflowState {
  document: WorkflowDocument;
  catalogs: WorkflowCatalogs;
  selectedNodeId?: string;
  dirty: boolean;
  validationMessage?: string;
  addNode: (type: NodeKind) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updater: (node: WorkflowFlowNode) => WorkflowFlowNode) => void;
  selectNode: (nodeId?: string) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: Connection) => void;
  setValidationMessage: (message?: string) => void;
}

const initialNodes: WorkflowFlowNode[] = [
  createNode("start", 60, 100),
  createNode("script", 340, 100),
  createNode("route", 650, 100),
  createNode("end", 960, 100)
].map((node, index) => {
  if (index === 0) {
    node.data.label = "开始";
    node.data.config = { nextNodeId: "" };
  }
  if (index === 1) {
    node.data.label = "欢迎话术";
  }
  if (index === 2) {
    node.data.label = "意图流转";
  }
  if (index === 3) {
    node.data.label = "结束";
  }
  return node;
});

const initialEdges: WorkflowEdge[] = [
  { id: "e-start-script", source: initialNodes[0].id, target: initialNodes[1].id },
  { id: "e-script-route", source: initialNodes[1].id, target: initialNodes[2].id },
  { id: "e-route-end", source: initialNodes[2].id, target: initialNodes[3].id }
];

initialNodes[0].data.config = { nextNodeId: initialNodes[1].id };
initialNodes[1].data.config = {
  ...(initialNodes[1].data.config as object),
  nextNodeId: initialNodes[2].id
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  document: {
    canvasMeta: { id: "canvas_main", name: "客服主流程" },
    nodes: initialNodes,
    edges: initialEdges
  },
  catalogs: mockCatalogs,
  selectedNodeId: initialNodes[0].id,
  dirty: false,
  validationMessage: undefined,
  addNode: (type) =>
    set((state) => {
      if (type === "start" && state.document.nodes.some((node) => node.type === "start")) {
        return {
          validationMessage: "一个画布里仅可有一个开始节点"
        };
      }

      const count = state.document.nodes.length;
      const newNode = createNode(type, 120 + count * 280, 120 + count * 120);
      return {
        document: {
          ...state.document,
          nodes: [...state.document.nodes, newNode]
        },
        selectedNodeId: newNode.id,
        dirty: true,
        validationMessage: undefined
      };
    }),
  deleteNode: (nodeId) =>
    set((state) => {
      const nodeToDelete = state.document.nodes.find((node) => node.id === nodeId);
      if (nodeToDelete?.type === "start") {
        return {
          validationMessage: "开始节点不能删除"
        };
      }

      return {
        document: {
          ...state.document,
          nodes: state.document.nodes.filter((node) => node.id !== nodeId),
          edges: state.document.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          )
        },
        selectedNodeId: state.selectedNodeId === nodeId ? undefined : state.selectedNodeId,
        dirty: true,
        validationMessage: undefined
      };
    }),
  updateNode: (nodeId, updater) =>
    set((state) => ({
      document: {
        ...state.document,
        nodes: state.document.nodes.map((node) => (node.id === nodeId ? updater(node) : node))
      },
      dirty: true
    })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  onNodesChange: (changes) =>
    set((state) => ({
      document: {
        ...state.document,
        nodes: applyNodeChanges(changes, state.document.nodes as any) as WorkflowFlowNode[]
      },
      dirty: true
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      document: {
        ...state.document,
        edges: applyEdgeChanges(changes, state.document.edges as any) as WorkflowEdge[]
      },
      dirty: true
    })),
  onConnect: (connection) =>
    set((state) => ({
      document: {
        ...state.document,
        edges: addEdge(
          {
            ...connection,
            id: `edge_${connection.source}_${connection.target}`
          },
          state.document.edges
        )
      },
      dirty: true
    })),
  setValidationMessage: (message) => set({ validationMessage: message })
}));
