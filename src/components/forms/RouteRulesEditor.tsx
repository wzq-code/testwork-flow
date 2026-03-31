import { Button, Checkbox, Modal, Select, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import type { RouteRule, WorkflowCatalogs, WorkflowFlowNode } from "../../types/workflow";
import { createId } from "../../utils/ids";
import { ConditionBuilder } from "./ConditionBuilder";

interface RouteRulesEditorProps {
  control: any;
  name: string;
  catalogs: WorkflowCatalogs;
  nodes: WorkflowFlowNode[];
}

interface RuleModalForm {
  conditions: RouteRule["conditions"];
  targetNodeId: string;
  globalRedirectEnabled: boolean;
}

const buildRuleForm = (): RuleModalForm => ({
  conditions: [{ id: createId("condition"), sourceType: "unconditional" }],
  targetNodeId: "",
  globalRedirectEnabled: false
});

const summarizeCondition = (rule: RouteRule, catalogs: WorkflowCatalogs) =>
  rule.conditions
    .map((item) => {
      if (item.sourceType === "unconditional") return "无条件";
      if (item.sourceType === "silence") return "静音";
      if (item.sourceType === "intent") {
        const matched = catalogs.intents.find((intent) => intent.id === item.sourceId);
        return `意图：${matched?.name ?? item.sourceId}`;
      }
      if (item.sourceType === "entity") {
        const matched = catalogs.entities.find((entity) => entity.id === item.sourceId);
        return `实体：${matched?.name ?? item.sourceId}`;
      }
      const variable = catalogs.variables.find((variableItem) => variableItem.id === item.sourceId);
      return `变量：${variable?.id ?? item.sourceId} ${item.operator ?? ""} ${String(item.value ?? "")}`.trim();
    })
    .join(" 且 ");

export const RouteRulesEditor = ({ control, name, catalogs, nodes }: RouteRulesEditorProps) => {
  const { fields, append, remove, update, move, replace } = useFieldArray({
    control,
    name,
    keyName: "fieldKey"
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [selectedRouteSource, setSelectedRouteSource] = useState<string>();
  const modalForm = useForm<RuleModalForm>({
    defaultValues: buildRuleForm()
  });

  const routeNodes = useMemo(() => nodes.filter((node) => node.type === "route"), [nodes]);
  const openCreate = () => {
    setEditingIndex(null);
    modalForm.reset(buildRuleForm());
    setRuleModalOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    modalForm.reset(fields[index] as unknown as RuleModalForm);
    setRuleModalOpen(true);
  };

  const submitRule = modalForm.handleSubmit((values) => {
    const nextRule: RouteRule = {
      id: editingIndex === null ? createId("rule") : ((fields[editingIndex] as unknown as RouteRule).id ?? createId("rule")),
      conditions: values.conditions,
      targetNodeId: values.targetNodeId,
      globalRedirectEnabled: values.globalRedirectEnabled
    };
    if (editingIndex === null) {
      append(nextRule);
    } else {
      update(editingIndex, nextRule);
    }
    setEditingIndex(null);
    setRuleModalOpen(false);
    modalForm.reset(buildRuleForm());
  });

  return (
    <Space direction="vertical" className="full-width">
      <Space wrap>
        <Button icon={<PlusOutlined />} onClick={openCreate}>
          添加跳转
        </Button>
        <Button onClick={() => setCopyOpen(true)}>按节点复制条件</Button>
      </Space>
      <Table<RouteRule>
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={fields as unknown as RouteRule[]}
        columns={[
          { title: "顺序", render: (_, __, index) => index + 1 },
          { title: "条件", render: (_, record) => summarizeCondition(record, catalogs) },
          {
            title: "跳转",
            render: (_, record) => nodes.find((node) => node.id === record.targetNodeId)?.data.label ?? record.targetNodeId
          },
          {
            title: "操作",
            render: (_, __, index) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(index)} />
                <Button size="small" onClick={() => index > 0 && move(index, index - 1)}>
                  上移
                </Button>
                <Button size="small" onClick={() => index < fields.length - 1 && move(index, index + 1)}>
                  下移
                </Button>
                <Button danger size="small" icon={<DeleteOutlined />} onClick={() => remove(index)} />
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editingIndex === null ? "新增流转条件" : "编辑流转条件"}
        open={ruleModalOpen}
        onCancel={() => {
          setEditingIndex(null);
          setRuleModalOpen(false);
          modalForm.reset(buildRuleForm());
        }}
        onOk={() => void submitRule()}
      >
        <Space direction="vertical" className="full-width">
          <ConditionBuilder control={modalForm.control} name="conditions" catalogs={catalogs} />
          <Controller
            control={modalForm.control}
            name="targetNodeId"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                placeholder="选择跳转节点"
                options={nodes.map((node) => ({
                  label: `${node.data.label} (${node.id})`,
                  value: node.id
                }))}
              />
            )}
          />
          <Controller
            control={modalForm.control}
            name="globalRedirectEnabled"
            render={({ field }) => (
              <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)}>
                是否可全局跳转
              </Checkbox>
            )}
          />
        </Space>
      </Modal>

      <Modal
        title="按节点复制条件"
        open={copyOpen}
        onCancel={() => setCopyOpen(false)}
        onOk={() => {
          const sourceNode = routeNodes.find((node) => node.id === selectedRouteSource);
          const rules = (sourceNode?.data.config as { rules?: RouteRule[] } | undefined)?.rules ?? [];
          replace(rules.map((item) => ({ ...item, id: createId("rule") })));
          setCopyOpen(false);
        }}
      >
        <Space direction="vertical" className="full-width">
          <Select
            value={selectedRouteSource}
            onChange={setSelectedRouteSource}
            placeholder="选择流转节点"
            options={routeNodes.map((node) => ({
              label: `${node.data.label} (${node.id})`,
              value: node.id
            }))}
          />
          <Typography.Text type="secondary">
            确认复制后，当前节点已填写的条件会被清空。
          </Typography.Text>
        </Space>
      </Modal>
    </Space>
  );
};
