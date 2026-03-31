import type { NodeKind, NodeConfig, WorkflowFlowNode } from "../types/workflow";
import { createId } from "./ids";

const createSpeech = () => ({
  id: createId("speech"),
  mode: "custom" as const,
  content: "",
  slotKeys: [],
  useConditions: false,
  conditions: []
});

export const createDefaultConfig = (type: NodeKind): NodeConfig => {
  switch (type) {
    case "start":
      return { nextNodeId: "" };
    case "script":
      return {
        nextNodeId: "",
        speeches: [createSpeech()],
        retry: {},
        playbackMode: "sequential",
        llmFallbackEnabled: false,
        fallbackSpeechId: undefined,
        slotIds: []
      };
    case "digitCollect":
      return {
        nextNodeId: "",
        speeches: [createSpeech()],
        retry: {},
        playbackMode: "sequential",
        focusIntentIds: []
      };
    case "route":
      return { rules: [] };
    case "return":
      return {};
    case "subflow":
      return { subflowId: "" };
    case "function":
      return {
        nextNodeId: "",
        functionMode: "none",
        functionId: undefined,
        assignments: []
      };
    case "end":
      return {
        speeches: [createSpeech()],
        playbackMode: "sequential",
        endAction: "hangup"
      };
    default:
      return { nextNodeId: "" } as NodeConfig;
  }
};

export const nodeTypeLabels: Record<NodeKind, string> = {
  start: "开始节点",
  script: "话术节点",
  digitCollect: "数字采集节点",
  route: "流转节点",
  return: "子流程返还节点",
  subflow: "子流程引用节点",
  function: "函数节点",
  end: "结束节点"
};

export const createNode = (type: NodeKind, x = 120, y = 120): WorkflowFlowNode => ({
  id: createId(type),
  type,
  position: { x, y },
  data: {
    label: nodeTypeLabels[type],
    type,
    config: createDefaultConfig(type)
  }
});
