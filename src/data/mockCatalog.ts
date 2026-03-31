import type { WorkflowCatalogs } from "../types/workflow";

export const mockCatalogs: WorkflowCatalogs = {
  variables: [
    { id: "askCity", name: "咨询城市", type: "string" },
    { id: "retryCount", name: "重试次数", type: "number" },
    { id: "peakManualSwitch", name: "高峰转人工开关", type: "boolean" }
  ],
  intents: [
    { id: "track_package", name: "查件" },
    { id: "handoff", name: "转人工" },
    { id: "done", name: "没有了" },
    { id: "ship_package", name: "寄快递" }
  ],
  entities: [
    { id: "billCode", name: "运单号" },
    { id: "mobileTail", name: "手机号后四位" },
    { id: "receiverAddress", name: "寄件地址-详细地址" }
  ],
  speeches: [
    {
      id: "fx_1001",
      name: "开场欢迎语",
      content: "您好，这里是智能客服，请问需要查询快件还是寄件？",
      category: "fixed"
    },
    {
      id: "fx_1002",
      name: "超次兜底",
      content: "抱歉还是没有听清，我先帮您转人工处理。",
      category: "fallback"
    },
    {
      id: "fx_1003",
      name: "查件追问",
      content: "请问您咨询的运单号是 ${billCode}，对吗？",
      category: "fixed"
    }
  ],
  functions: [
    {
      id: "queryLogistics",
      name: "物流轨迹查询",
      description: "根据运单号查询最新物流轨迹，并返回轨迹摘要、签收状态和末端网点。"
    },
    {
      id: "checkPeakPolicy",
      name: "高峰策略查询",
      description: "查询当前时间是否属于高峰转人工时段，返回布尔值开关。"
    }
  ],
  subflows: [
    { id: "subflow-track", name: "查件子流程" },
    { id: "subflow-ship", name: "寄件子流程" }
  ]
};
