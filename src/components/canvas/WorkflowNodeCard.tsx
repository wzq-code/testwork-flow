import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Tag, Typography, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { WorkflowNodeData } from "../../types/workflow";
import { useWorkflowStore } from "../../store/workflowStore";

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

export const WorkflowNodeCard = ({ data, selected, id }: NodeProps) => {
  const typedData = data as unknown as WorkflowNodeData;
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(String(id));
  };

  return (
    <div className={`workflow-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="workflow-node-head">
        <Tag color={nodeTone[typedData.type]}>{typedData.type}</Tag>
        <Typography.Text strong>{typedData.label}</Typography.Text>
        {typedData.type !== "start" && (
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            className="node-delete-btn"
          />
        )}
      </div>
      <Typography.Paragraph className="workflow-node-desc" ellipsis={{ rows: 2 }}>
        {typedData.type === "route" ? "根据意图、实体、变量条件决定后续流转" : "点击右侧面板完成详细配置"}
      </Typography.Paragraph>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
