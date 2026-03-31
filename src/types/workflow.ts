import type { Edge, Node, XYPosition } from "@xyflow/react";

export type NodeKind =
  | "start"
  | "script"
  | "digitCollect"
  | "route"
  | "return"
  | "subflow"
  | "function"
  | "end";

export type VariableType = "string" | "number" | "boolean";
export type SpeechMode = "fixed" | "custom" | "fallback";
export type PlaybackMode = "sequential" | "random";
export type FunctionMode = "none" | "assign" | "remote";
export type ConditionSourceType =
  | "intent"
  | "entity"
  | "variable"
  | "unconditional"
  | "silence";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "contains"
  | "notContains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "exists";

export interface VariableOption {
  id: string;
  name: string;
  type: VariableType;
}

export interface IntentOption {
  id: string;
  name: string;
}

export interface EntityOption {
  id: string;
  name: string;
}

export interface SpeechOption {
  id: string;
  name: string;
  content: string;
  category: "fixed" | "fallback";
}

export interface FunctionOption {
  id: string;
  name: string;
  description: string;
}

export interface ConditionItem {
  id: string;
  sourceType: ConditionSourceType;
  sourceId?: string;
  operator?: ConditionOperator;
  value?: string | number | boolean;
}

export interface SpeechItem {
  id: string;
  mode: SpeechMode;
  content: string;
  speechRefId?: string;
  slotKeys?: string[];
  useConditions: boolean;
  conditions: ConditionItem[];
}

export interface RetryConfig {
  maxRetries?: number;
  exceedNodeId?: string;
}

export interface BaseNodeConfig {
  description?: string;
}

export interface StartNodeConfig extends BaseNodeConfig {
  nextNodeId: string;
}

export interface BasePlayableNodeConfig extends BaseNodeConfig {
  nextNodeId: string;
  speeches: SpeechItem[];
  retry?: RetryConfig;
  playbackMode: PlaybackMode;
}

export interface ScriptNodeConfig extends BasePlayableNodeConfig {
  llmFallbackEnabled: boolean;
  fallbackSpeechId?: string;
  slotIds: string[];
}

export interface DigitCollectNodeConfig extends BasePlayableNodeConfig {
  focusIntentIds: string[];
}

export interface RouteRule {
  id: string;
  conditions: ConditionItem[];
  targetNodeId: string;
  globalRedirectEnabled: boolean;
}

export interface RouteNodeConfig extends BaseNodeConfig {
  rules: RouteRule[];
}

export interface ReturnNodeConfig extends BaseNodeConfig {}

export interface SubflowRefNodeConfig extends BaseNodeConfig {
  subflowId: string;
}

export interface FunctionAssignment {
  id: string;
  key: string;
  value: string;
}

export interface FunctionNodeConfig extends BaseNodeConfig {
  nextNodeId: string;
  functionMode: FunctionMode;
  functionId?: string;
  assignments: FunctionAssignment[];
}

export interface EndNodeConfig extends BaseNodeConfig {
  speeches: SpeechItem[];
  playbackMode: PlaybackMode;
  endAction: "handoff" | "hangup";
}

export type NodeConfig =
  | StartNodeConfig
  | ScriptNodeConfig
  | DigitCollectNodeConfig
  | RouteNodeConfig
  | ReturnNodeConfig
  | SubflowRefNodeConfig
  | FunctionNodeConfig
  | EndNodeConfig;

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  type: NodeKind;
  config: NodeConfig;
}

export type WorkflowFlowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface CanvasMeta {
  id: string;
  name: string;
}

export interface WorkflowDocument {
  canvasMeta: CanvasMeta;
  nodes: WorkflowFlowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowCatalogs {
  variables: VariableOption[];
  intents: IntentOption[];
  entities: EntityOption[];
  speeches: SpeechOption[];
  functions: FunctionOption[];
  subflows: Array<{ id: string; name: string }>;
}

export interface NewNodePayload {
  type: NodeKind;
  position: XYPosition;
}
