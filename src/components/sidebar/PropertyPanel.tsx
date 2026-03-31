import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Radio, Select, Space, Switch, Typography, message } from "antd";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useWorkflowStore } from "../../store/workflowStore";
import type { WorkflowFlowNode } from "../../types/workflow";
import { createId } from "../../utils/ids";
import { nodeEditorSchema } from "../../utils/schema";
import { RouteRulesEditor } from "../forms/RouteRulesEditor";
import { SpeechListEditor } from "../forms/SpeechListEditor";

interface NodeEditorForm {
  id: string;
  type: WorkflowFlowNode["type"];
  label: string;
  config: any;
}

const playbackOptions = [
  { label: "顺序播放", value: "sequential" },
  { label: "随机播放", value: "random" }
];

export const PropertyPanel = () => {
  const { document, catalogs, selectedNodeId, updateNode, setValidationMessage } = useWorkflowStore((state) => state);
  const selectedNode = useMemo(() => document.nodes.find((node) => node.id === selectedNodeId), [document.nodes, selectedNodeId]);
  const [messageApi, contextHolder] = message.useMessage();

  const form = useForm<NodeEditorForm>({
    resolver: zodResolver(nodeEditorSchema),
    defaultValues: selectedNode
      ? { id: selectedNode.id, type: selectedNode.type, label: selectedNode.data.label, config: selectedNode.data.config }
      : undefined,
    mode: "onChange"
  });

  const assignments = useFieldArray({
    control: form.control,
    name: "config.assignments",
    keyName: "fieldKey"
  });

  useEffect(() => {
    if (!selectedNode) return;
    form.reset({
      id: selectedNode.id,
      type: selectedNode.type,
      label: selectedNode.data.label,
      config: selectedNode.data.config
    });
  }, [selectedNode]);

  const submit = useCallback(() => {
    form.handleSubmit(
      (values) => {
        updateNode(values.id, (node) => ({
          ...node,
          data: { ...node.data, label: values.label, config: values.config }
        }));
        setValidationMessage(undefined);
        void messageApi.success("修改已应用");
      },
      (errors) => {
        console.error("表单校验失败:", errors);
        const firstError = Object.values(errors)[0];
        const errorMessage = firstError?.message || "表单填写有误，请检查";
        void messageApi.error(errorMessage);
      }
    )();
  }, [form, updateNode, setValidationMessage, messageApi]);

  const functionMode = form.watch("config.functionMode");
  const functionDescription =
    catalogs.functions.find((item) => item.id === form.watch("config.functionId"))?.description ?? "选择函数后展示函数说明";

  if (!selectedNode) {
    return (
      <aside className="property-panel">
        <Empty description="请选择一个节点开始配置" />
      </aside>
    );
  }

  const nodeOptions = document.nodes.filter((node) => node.id !== selectedNode.id).map((node) => ({
    label: `${node.data.label} (${node.id})`,
    value: node.id
  }));

  const type = selectedNode.type;

  return (
    <aside className="property-panel">
      {contextHolder}
      <div className="section-title-row">
        <Typography.Title level={5}>节点属性</Typography.Title>
        <Button type="primary" onClick={submit}>
          应用修改
        </Button>
      </div>
      {form.formState.errors.root?.message ? <Alert type="error" message={form.formState.errors.root.message} /> : null}
      <Form layout="vertical">
        <Card size="small" title="基础信息">
          <Form.Item label="节点 ID">
            <Input value={selectedNode.id} disabled />
          </Form.Item>
          <Form.Item label="节点名称" validateStatus={form.formState.errors.label ? "error" : ""} help={form.formState.errors.label?.message?.toString()}>
            <Controller control={form.control} name="label" render={({ field }) => <Input {...field} maxLength={15} />} />
          </Form.Item>
          {type !== "route" && type !== "return" && type !== "subflow" && type !== "end" ? (
            <Form.Item label="后续跳转">
              <Controller
                control={form.control}
                name="config.nextNodeId"
                render={({ field }) => <Select {...field} options={nodeOptions} placeholder="请选择后续跳转" />}
              />
            </Form.Item>
          ) : null}
        </Card>

        {(type === "script" || type === "digitCollect" || type === "end") ? (
          <Card size="small" title="话术信息">
            <Form.Item label="对话话术">
              <SpeechListEditor control={form.control} name="config.speeches" catalogs={catalogs} />
            </Form.Item>
            <Form.Item label="轮播方式">
              <Controller control={form.control} name="config.playbackMode" render={({ field }) => <Radio.Group {...field} options={playbackOptions} />} />
            </Form.Item>
            {type !== "end" ? (
              <>
                <Space className="full-width split-row">
                  <Typography.Text>最大询问次数</Typography.Text>
                  <Controller control={form.control} name="config.retry.maxRetries" render={({ field }) => <InputNumber min={1} max={5} value={field.value} onChange={field.onChange} />} />
                </Space>
                <Form.Item label="超过次数后跳转">
                  <Controller control={form.control} name="config.retry.exceedNodeId" render={({ field }) => <Select {...field} allowClear options={nodeOptions} placeholder="请选择节点" />} />
                </Form.Item>
              </>
            ) : null}
            {type === "script" ? (
              <>
                <Space className="full-width split-row">
                  <Typography.Text>是否大模型兜底</Typography.Text>
                  <Controller control={form.control} name="config.llmFallbackEnabled" render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
                </Space>
                <Form.Item label="兜底话术">
                  <Controller
                    control={form.control}
                    name="config.fallbackSpeechId"
                    render={({ field }) => (
                      <Select
                        {...field}
                        allowClear
                        placeholder="选择已有兜底话术"
                        options={catalogs.speeches.filter((item) => item.category === "fallback").map((item) => ({
                          label: `${item.name} (${item.id})`,
                          value: item.id
                        }))}
                      />
                    )}
                  />
                </Form.Item>
                <Form.Item label="槽位选择">
                  <Controller
                    control={form.control}
                    name="config.slotIds"
                    render={({ field }) => (
                      <Select
                        {...field}
                        mode="multiple"
                        placeholder="选择要采集的槽位"
                        options={catalogs.entities.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id }))}
                      />
                    )}
                  />
                </Form.Item>
              </>
            ) : null}
            {type === "digitCollect" ? (
              <Form.Item label="关注意图">
                <Controller
                  control={form.control}
                  name="config.focusIntentIds"
                  render={({ field }) => (
                    <Select
                      {...field}
                      mode="multiple"
                      placeholder="选择要关注的意图"
                      options={catalogs.intents.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id }))}
                    />
                  )}
                />
              </Form.Item>
            ) : null}
            {type === "end" ? (
              <Form.Item label="结束操作">
                <Controller
                  control={form.control}
                  name="config.endAction"
                  render={({ field }) => <Radio.Group {...field} options={[{ label: "转人工", value: "handoff" }, { label: "挂机", value: "hangup" }]} />}
                />
              </Form.Item>
            ) : null}
          </Card>
        ) : null}

        {type === "route" ? (
          <Card size="small" title="流转条件">
            <RouteRulesEditor control={form.control} name="config.rules" catalogs={catalogs} nodes={document.nodes} />
          </Card>
        ) : null}

        {type === "subflow" ? (
          <Card size="small" title="子流程引用">
            <Form.Item label="目标画布">
              <Controller
                control={form.control}
                name="config.subflowId"
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="请选择子流程"
                    options={catalogs.subflows.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id }))}
                  />
                )}
              />
            </Form.Item>
          </Card>
        ) : null}

        {type === "return" ? (
          <Card size="small" title="子流程返还信息">
            <Typography.Paragraph type="secondary">
              当前版本返还节点仅作为语义节点使用，不需要额外配置。
            </Typography.Paragraph>
          </Card>
        ) : null}

        {type === "function" ? (
          <Card size="small" title="函数信息">
            <Form.Item label="选择函数">
              <Controller
                control={form.control}
                name="config.functionMode"
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { label: "空", value: "none" },
                      { label: "赋值函数", value: "assign" },
                      { label: "函数列表", value: "remote" }
                    ]}
                  />
                )}
              />
            </Form.Item>
            {functionMode === "assign" ? (
              <Space direction="vertical" className="full-width">
                {assignments.fields.map((field, index) => (
                  <Card key={field.fieldKey} size="small" extra={<Button danger onClick={() => assignments.remove(index)}>删除</Button>}>
                    <Form.Item label="变量名">
                      <Controller control={form.control} name={`config.assignments.${index}.key`} render={({ field: controllerField }) => <Input {...controllerField} />} />
                    </Form.Item>
                    <Form.Item label="值">
                      <Controller control={form.control} name={`config.assignments.${index}.value`} render={({ field: controllerField }) => <Input {...controllerField} />} />
                    </Form.Item>
                  </Card>
                ))}
                <Button onClick={() => assignments.append({ id: createId("assign"), key: "", value: "" })}>添加赋值选项</Button>
              </Space>
            ) : null}
            {functionMode === "remote" ? (
              <>
                <Form.Item label="函数列表">
                  <Controller
                    control={form.control}
                    name="config.functionId"
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="请选择函数"
                        options={catalogs.functions.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id }))}
                      />
                    )}
                  />
                </Form.Item>
                <Alert type="info" showIcon message={functionDescription} />
              </>
            ) : null}
          </Card>
        ) : null}
      </Form>
    </aside>
  );
};
