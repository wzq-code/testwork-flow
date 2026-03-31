import { Alert, App as AntApp, Button, Layout, Space, Typography, message } from "antd";
import { useMemo } from "react";
import { Route, Routes } from "react-router-dom";
import { WorkflowCanvas } from "./components/canvas/WorkflowCanvas";
import { NodePalette } from "./components/sidebar/NodePalette";
import { PropertyPanel } from "./components/sidebar/PropertyPanel";
import { useWorkflowStore } from "./store/workflowStore";
import { workflowDocumentSchema } from "./utils/schema";

const EditorPage = () => {
  const { document, dirty, validationMessage, setValidationMessage } = useWorkflowStore((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const savePreview = useMemo(() => JSON.stringify(document, null, 2), [document]);

  const handleValidate = () => {
    const result = workflowDocumentSchema.safeParse(document);
    if (!result.success) {
      const content = result.error.issues[0]?.message ?? "校验失败";
      setValidationMessage(content);
      void messageApi.error(content);
      return;
    }

    setValidationMessage(undefined);
    void messageApi.success("当前画布结构校验通过");
  };

  const handleExport = () => {
    const blob = new Blob([savePreview], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.canvasMeta.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AntApp>
      {contextHolder}
      <Layout className="app-shell">
        <Layout.Header className="app-header">
          <div>
            <Typography.Title level={3} className="app-title">
              Workflow 配置台
            </Typography.Title>
            <Typography.Text className="app-subtitle">
              面向对话流程的节点编排、条件配置与话术管理
            </Typography.Text>
          </div>
          <Space>
            <Button onClick={handleValidate}>保存前校验</Button>
            <Button type="primary" onClick={handleExport}>
              导出 JSON
            </Button>
          </Space>
        </Layout.Header>
        <Layout className="app-content">
          <NodePalette />
          <Layout.Content className="canvas-column">
            {validationMessage ? (
              <Alert
                className="inline-alert"
                type="warning"
                showIcon
                closable
                message={validationMessage}
                onClose={() => setValidationMessage(undefined)}
              />
            ) : null}
            <WorkflowCanvas />
            <section className="json-preview">
              <div className="section-title-row">
                <Typography.Title level={5}>配置预览</Typography.Title>
                <Typography.Text type={dirty ? "warning" : "secondary"}>
                  {dirty ? "存在未保存变更" : "已同步"}
                </Typography.Text>
              </div>
              <pre>{savePreview}</pre>
            </section>
          </Layout.Content>
          <PropertyPanel />
        </Layout>
      </Layout>
    </AntApp>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<EditorPage />} />
    </Routes>
  );
}
