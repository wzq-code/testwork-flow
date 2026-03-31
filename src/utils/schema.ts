import { z } from "zod";

const baseNode = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.object({
    label: z.string().min(1).max(15),
    type: z.string()
  })
});

const conditionSchema = z.object({
  id: z.string(),
  sourceType: z.enum(["intent", "entity", "variable", "unconditional", "silence"]),
  sourceId: z.string().optional(),
  operator: z
    .enum(["eq", "neq", "contains", "notContains", "gt", "gte", "lt", "lte", "exists"])
    .optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional()
});

const speechSchema = z.object({
  id: z.string(),
  mode: z.enum(["fixed", "custom", "fallback"]),
  content: z.string().min(1, "请填写话术内容"),
  speechRefId: z.string().optional(),
  slotKeys: z.array(z.string()).optional(),
  useConditions: z.boolean(),
  conditions: z.array(conditionSchema)
});

const retrySchema = z
  .object({
    maxRetries: z.number().int().min(1).max(5).optional(),
    exceedNodeId: z.string().optional()
  })
  .refine(
    (value) =>
      (!value.maxRetries && !value.exceedNodeId) || (Boolean(value.maxRetries) && Boolean(value.exceedNodeId)),
    "最大询问次数和超过次数后跳转需要同时填写"
  );

export const nodeEditorSchema = z
  .object({
    id: z.string(),
    type: z.enum(["start", "script", "digitCollect", "route", "return", "subflow", "function", "end"]),
    label: z.string().min(1, "请填写节点名称").max(15, "节点名称最多 15 个字"),
    config: z.unknown()
  })
  .superRefine((value, ctx) => {
    const config = value.config as Record<string, unknown>;
    if (value.type === "start" || value.type === "script" || value.type === "digitCollect" || value.type === "function") {
      if (!config.nextNodeId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "请选择后续跳转", path: ["config", "nextNodeId"] });
      }
    }

    if (value.type === "script") {
      const result = z
        .object({
          speeches: z.array(speechSchema).min(1),
          retry: retrySchema.optional(),
          playbackMode: z.enum(["sequential", "random"]),
          llmFallbackEnabled: z.boolean(),
          fallbackSpeechId: z.string().optional(),
          slotIds: z.array(z.string())
        })
        .safeParse(config);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    }

    if (value.type === "digitCollect") {
      const result = z
        .object({
          speeches: z.array(speechSchema).min(1),
          retry: retrySchema.optional(),
          playbackMode: z.enum(["sequential", "random"]),
          focusIntentIds: z.array(z.string()).min(1, "请至少选择一个关注意图")
        })
        .safeParse(config);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    }

    if (value.type === "route") {
      const result = z
        .object({
          rules: z.array(
            z.object({
              id: z.string(),
              conditions: z.array(conditionSchema).min(1, "请至少添加一个条件"),
              targetNodeId: z.string().min(1, "请选择跳转节点"),
              globalRedirectEnabled: z.boolean()
            })
          )
        })
        .safeParse(config);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    }

    if (value.type === "subflow" && !config.subflowId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "请选择子流程", path: ["config", "subflowId"] });
    }

    if (value.type === "function") {
      const result = z
        .object({
          nextNodeId: z.string().min(1, "请选择后续跳转"),
          functionMode: z.enum(["none", "assign", "remote"]),
          functionId: z.string().optional(),
          assignments: z.array(
            z.object({
              id: z.string(),
              key: z.string().min(1, "请填写变量名").regex(/^[a-zA-Z]+$/, "变量名需为纯英文"),
              value: z.string().min(1, "请填写变量值")
            })
          )
        })
        .safeParse(config);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
      if (config.functionMode === "remote" && !config.functionId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "请选择函数", path: ["config", "functionId"] });
      }
    }

    if (value.type === "end") {
      const result = z
        .object({
          speeches: z.array(speechSchema).min(1),
          playbackMode: z.enum(["sequential", "random"]),
          endAction: z.enum(["handoff", "hangup"])
        })
        .safeParse(config);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    }
  });

export const workflowDocumentSchema = z
  .object({
    canvasMeta: z.object({
      id: z.string(),
      name: z.string().min(1)
    }),
    nodes: z.array(baseNode),
    edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string() }))
  })
  .superRefine((value, ctx) => {
    const startNodes = value.nodes.filter((node) => node.type === "start");
    if (startNodes.length > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "一个画布里仅可有一个开始节点" });
    }
  });
