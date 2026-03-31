import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Card, Input, Modal, Select, Space, Switch, Typography } from "antd";
import { DeleteOutlined, HolderOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import type { SpeechItem, WorkflowCatalogs } from "../../types/workflow";
import { createId } from "../../utils/ids";
import { ConditionBuilder } from "./ConditionBuilder";

interface SpeechListEditorProps {
  control: any;
  name: string;
  catalogs: WorkflowCatalogs;
}

const buildSpeech = (): SpeechItem => ({
  id: createId("speech"),
  mode: "custom",
  content: "",
  slotKeys: [],
  useConditions: false,
  conditions: []
});

const SortableSpeechCard = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="sortable-card">
      <div className="sortable-handle" {...attributes} {...listeners}>
        <HolderOutlined />
      </div>
      <div className="sortable-body">{children}</div>
    </div>
  );
};

export const SpeechListEditor = ({ control, name, catalogs }: SpeechListEditorProps) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
    keyName: "fieldKey"
  });
  const speeches = useWatch({ control, name }) as SpeechItem[] | undefined;
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorKeyword, setSelectorKeyword] = useState("");
  const [selectorCategory, setSelectorCategory] = useState<"fixed" | "fallback">("fixed");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = catalogs.speeches.filter((item) => {
    if (item.category !== selectorCategory) {
      return false;
    }
    if (!selectorKeyword) {
      return true;
    }
    const keyword = selectorKeyword.toLowerCase();
    return item.id.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword);
  });

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = speeches?.findIndex((item) => item.id === active.id) ?? -1;
    const newIndex = speeches?.findIndex((item) => item.id === over.id) ?? -1;
    if (oldIndex >= 0 && newIndex >= 0) {
      move(oldIndex, newIndex);
    }
  };

  return (
    <>
      <Space wrap>
        <Button icon={<PlusOutlined />} onClick={() => append(buildSpeech())}>
          新增话术
        </Button>
        <Button onClick={() => {
          setSelectorCategory("fixed");
          setSelectorOpen(true);
        }}>
          选择固定话术
        </Button>
        <Button onClick={() => {
          setSelectorCategory("fallback");
          setSelectorOpen(true);
        }}>
          选择兜底话术
        </Button>
      </Space>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={(speeches ?? []).map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <Space direction="vertical" className="full-width">
            {fields.map((field, index) => (
              <SortableSpeechCard key={field.fieldKey} id={speeches?.[index]?.id ?? field.fieldKey}>
                <Card
                  size="small"
                  title={`话术 ${index + 1}`}
                  extra={<Button danger icon={<DeleteOutlined />} onClick={() => remove(index)} />}
                >
                  <Space direction="vertical" className="full-width">
                    <Controller
                      control={control}
                      name={`${name}.${index}.mode`}
                      render={({ field: controllerField }) => (
                        <Select
                          value={controllerField.value}
                          onChange={controllerField.onChange}
                          options={[
                            { label: "普通话术", value: "custom" },
                            { label: "固定话术", value: "fixed" },
                            { label: "兜底话术", value: "fallback" }
                          ]}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name={`${name}.${index}.content`}
                      render={({ field: controllerField }) => (
                        <Input.TextArea
                          {...controllerField}
                          rows={3}
                          placeholder="请输入话术内容，可包含 ${billCode} 这类槽位模板"
                          disabled={speeches?.[index]?.mode !== "custom"}
                        />
                      )}
                    />
                    <Space className="full-width split-row">
                      <Typography.Text>条件话术</Typography.Text>
                      <Controller
                        control={control}
                        name={`${name}.${index}.useConditions`}
                        render={({ field: controllerField }) => (
                          <Switch checked={controllerField.value} onChange={controllerField.onChange} />
                        )}
                      />
                    </Space>
                    {speeches?.[index]?.useConditions ? (
                      <ConditionBuilder control={control} name={`${name}.${index}.conditions`} catalogs={catalogs} />
                    ) : null}
                  </Space>
                </Card>
              </SortableSpeechCard>
            ))}
          </Space>
        </SortableContext>
      </DndContext>
      <Modal title={selectorCategory === "fixed" ? "选择固定话术" : "选择兜底话术"} open={selectorOpen} onCancel={() => setSelectorOpen(false)} footer={null}>
        <Space direction="vertical" className="full-width">
          <Input.Search placeholder="搜索话术 ID 或名称" value={selectorKeyword} onChange={(event) => setSelectorKeyword(event.target.value)} />
          {filtered.map((item) => (
            <Card
              key={item.id}
              size="small"
              title={`${item.name} (${item.id})`}
              extra={
                <Button
                  type="link"
                  onClick={() => {
                    append({
                      id: createId("speech"),
                      mode: selectorCategory,
                      content: item.content,
                      speechRefId: item.id,
                      slotKeys: [],
                      useConditions: false,
                      conditions: []
                    });
                    setSelectorOpen(false);
                  }}
                >
                  选中
                </Button>
              }
            >
              <Typography.Paragraph>{item.content}</Typography.Paragraph>
            </Card>
          ))}
          <Button onClick={() => setSelectorKeyword(selectorKeyword)}>刷新列表</Button>
        </Space>
      </Modal>
    </>
  );
};
