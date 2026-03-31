import { Card, Divider, Typography, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useWorkflowStore } from "../../store/workflowStore";
import { nodeTypeLabels } from "../../utils/nodeFactory";
import type { NodeKind } from "../../types/workflow";

const nodeKinds: NodeKind[] = ["start", "script", "digitCollect", "route", "subflow", "return", "function", "end"];

export const NodePalette = () => {
  const addNode = useWorkflowStore((state) => state.addNode);

  return (
    <aside className="palette-panel">
      <Typography.Title level={5}>节点库</Typography.Title>
      <Typography.Paragraph type="secondary">
        从这里添加业务节点，拖拽到画布后在右侧配置节点属性。
      </Typography.Paragraph>
      <Divider />
      <div className="palette-grid">
        {nodeKinds.map((kind) => (
          <Card key={kind} className="palette-card" size="small">
            <Typography.Text strong>{nodeTypeLabels[kind]}</Typography.Text>
            <Button icon={<PlusOutlined />} size="small" onClick={() => addNode(kind)}>
              新增
            </Button>
          </Card>
        ))}
      </div>
    </aside>
  );
};
