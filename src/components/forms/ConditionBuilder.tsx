import { Button, Card, Input, InputNumber, Radio, Select, Space, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import type { ConditionOperator, ConditionSourceType, VariableType, WorkflowCatalogs } from "../../types/workflow";
import { createId } from "../../utils/ids";

interface ConditionBuilderProps {
  control: any;
  name: string;
  catalogs: WorkflowCatalogs;
}

const operatorOptions: Record<VariableType, Array<{ label: string; value: ConditionOperator }>> = {
  string: [
    { label: "等于", value: "eq" },
    { label: "不等于", value: "neq" },
    { label: "包含", value: "contains" },
    { label: "不包含", value: "notContains" }
  ],
  number: [
    { label: "等于", value: "eq" },
    { label: "不等于", value: "neq" },
    { label: "大于", value: "gt" },
    { label: "大于等于", value: "gte" },
    { label: "小于", value: "lt" },
    { label: "小于等于", value: "lte" }
  ],
  boolean: [
    { label: "是", value: "eq" },
    { label: "否", value: "neq" }
  ]
};

const sourceTypeOptions: Array<{ label: string; value: ConditionSourceType }> = [
  { label: "变量", value: "variable" },
  { label: "意图", value: "intent" },
  { label: "实体", value: "entity" },
  { label: "无条件", value: "unconditional" },
  { label: "静音", value: "silence" }
];

export const ConditionBuilder = ({ control, name, catalogs }: ConditionBuilderProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    keyName: "fieldKey"
  });
  const values = useWatch({ control, name }) as Array<Record<string, unknown>> | undefined;

  return (
    <Space direction="vertical" className="full-width">
      {fields.map((field, index) => {
        const current = values?.[index];
        const sourceType = (current?.sourceType as ConditionSourceType | undefined) ?? "variable";
        const variable = catalogs.variables.find((item) => item.id === current?.sourceId);
        const variableType = variable?.type;
        const operators = variableType ? operatorOptions[variableType] : operatorOptions.string;

        return (
          <Card key={field.fieldKey} size="small" className="condition-card">
            <Space className="full-width align-start" wrap>
              <Controller
                control={control}
                name={`${name}.${index}.sourceType`}
                render={({ field: controllerField }) => (
                  <Select
                    className="condition-select"
                    value={controllerField.value}
                    onChange={controllerField.onChange}
                    options={sourceTypeOptions}
                  />
                )}
              />
              {sourceType === "variable" ? (
                <>
                  <Controller
                    control={control}
                    name={`${name}.${index}.sourceId`}
                    render={({ field: controllerField }) => (
                      <Select
                        className="condition-select"
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        placeholder="选择变量"
                        options={catalogs.variables.map((item) => ({
                          label: `${item.name} (${item.id})`,
                          value: item.id
                        }))}
                        showSearch
                        optionFilterProp="label"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`${name}.${index}.operator`}
                    render={({ field: controllerField }) => (
                      <Select
                        className="condition-select"
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        placeholder="判断条件"
                        options={operators}
                      />
                    )}
                  />
                  {variableType === "boolean" ? (
                    <Controller
                      control={control}
                      name={`${name}.${index}.value`}
                      render={({ field: controllerField }) => (
                        <Radio.Group
                          value={controllerField.value}
                          onChange={(event) => controllerField.onChange(event.target.value)}
                          options={[
                            { label: "是", value: true },
                            { label: "否", value: false }
                          ]}
                        />
                      )}
                    />
                  ) : variableType === "number" ? (
                    <Controller
                      control={control}
                      name={`${name}.${index}.value`}
                      render={({ field: controllerField }) => (
                        <InputNumber className="full-width" value={controllerField.value as number | null} onChange={controllerField.onChange} />
                      )}
                    />
                  ) : (
                    <Controller
                      control={control}
                      name={`${name}.${index}.value`}
                      render={({ field: controllerField }) => <Input {...controllerField} placeholder="条件值" />}
                    />
                  )}
                </>
              ) : null}
              {sourceType === "intent" ? (
                <Controller
                  control={control}
                  name={`${name}.${index}.sourceId`}
                  render={({ field: controllerField }) => (
                    <Select
                      className="condition-select wide"
                      value={controllerField.value}
                      onChange={controllerField.onChange}
                      placeholder="选择意图"
                      options={catalogs.intents.map((item) => ({
                        label: `${item.name} (${item.id})`,
                        value: item.id
                      }))}
                    />
                  )}
                />
              ) : null}
              {sourceType === "entity" ? (
                <Controller
                  control={control}
                  name={`${name}.${index}.sourceId`}
                  render={({ field: controllerField }) => (
                    <Select
                      className="condition-select wide"
                      value={controllerField.value}
                      onChange={controllerField.onChange}
                      placeholder="选择实体"
                      options={catalogs.entities.map((item) => ({
                        label: `${item.name} (${item.id})`,
                        value: item.id
                      }))}
                    />
                  )}
                />
              ) : null}
              {fields.length > 1 ? (
                <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(index)} />
              ) : null}
            </Space>
            {index < fields.length - 1 ? (
              <Typography.Text type="secondary" className="condition-and">
                且
              </Typography.Text>
            ) : null}
          </Card>
        );
      })}
      <Button
        icon={<PlusOutlined />}
        onClick={() =>
          append({
            id: createId("condition"),
            sourceType: "variable",
            sourceId: undefined,
            operator: undefined,
            value: undefined
          })
        }
      >
        添加条件
      </Button>
    </Space>
  );
};
