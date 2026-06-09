---
title: Content Studio 剖面
description: Content Studio AI agents 工作台的接入剖面。
---

# Content Studio 剖面

Content Studio 是 Lime Agent Workbench 的第一个重点产品应用剖面。它已经有内容工厂链路和 `AI agents` 工作台，因此标准化目标不是重做页面，而是把 Agent runtime/UI 收敛到 Lime 主链。

## 目标路径

```text
AI agents 工作台
  -> agentPromptSessions:start / continue
  -> AppServerPromptAgentService
  -> LIME_RUNTIME_BRIDGE / capability lime.agent
  -> Host Bridge / Capability Gateway
  -> App Server --backend runtime
  -> agentSession/turn/start
  -> RuntimeBackend -> Provider store -> LLM API
  -> RuntimeEvent / ThreadReadModel / TaskSnapshot
  -> Shared AgentUI 投影
```

## 产品职责

Content Studio 可以拥有：

- 选题、素材、商品、账号、渠道等业务上下文。
- prompt draft/refine 的业务 intent。
- 图片、视频、文案、素材入库的业务产物入口。
- agents 工作台的页面编排与品牌样式。

Content Studio 不拥有：

- Provider Key。
- RuntimeEvent、ThreadReadModel、TaskSnapshot。
- ProcessTree、ToolGroup、ActionRequired 的协议模型。
- evidence/replay/review verdict。
- App Server DB。

## 现有路径

| 路径 | 分类 | 规则 |
| --- | --- | --- |
| `AgentPromptSessionStore` session shell | `compat` | 可以保存业务 session shell，runtime truth 来自 App Server。 |
| local `messages` | `compat` | 只做 transcript/cache，不能推断 tool/action/evidence。 |
| local `executionEvents` | `compat` | 迁到 AgentUI 投影 inputs。 |
| old `ModelConfigStore` key | `compat` standalone, `deprecated` hosted | hosted 下迁移到 Provider store 后清除。 |
| platform-hosted direct Provider calls | `dead` | 必须 blocked 或走 Lime runtime capability。 |

## 验收

1. 平台宿主下没有 key/token/secret 进入 Content Studio runtime payload。
2. Provider 未配置时 `AI agents` 显示 needs-setup/blocked。
3. 工具、审批、产物、证据使用共享 AgentUI surfaces。
4. 缺失 runtime facts 时显示 unknown/unavailable，而不是解析助手正文。
5. standalone/dev 过渡路径不改变目标架构。
