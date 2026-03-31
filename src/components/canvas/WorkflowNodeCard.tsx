import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Tag, Typography } from "antd";
import type { WorkflowNodeData } from "../../types/workflow";

const nodeTone: Record<WorkflowNodeData["type"], string> = {
  start: "green",
  script: "blue",
  digitCollect: "gold",
  route: "cyan",
  return: "purple",
  subflow: "magenta",
  function: "orange",
  end: "red"
};

export const WorkflowNodeCard = ({ data, selected }: NodeProps) => {
  const typedData = data as unknown as WorkflowNodeData;

  return (
    <div className={`workflow-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="workflow-node-head">
        <Tag color={nodeTone[typedData.type]}>{typedData.type}</Tag>
        <Typography.Text strong>{typedData.label}</Typography.Text>
      </div>
      <Typography.Paragraph className="workflow-node-desc" ellipsis={{ rows: 2 }}>
        {typedData.type === "route" ? "根据意图、实体、变量条件决定后续流转" : "点击右侧面板完成详细配置"}
      </Typography.Paragraph>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
