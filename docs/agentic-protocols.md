---
title: Agentic protocols
description: Lime 如何看待 AG-UI、MCP、A2A 与内部 Runtime/UI 标准。
---

# Agentic protocols

Lime 接受外部协议的启发，但不能把外部协议当成内部治理答案。外部标准解决通用互操作，Lime 标准解决巨大既有代码库里的事实源、组件复用和迁移边界。

| Layer | External reference | Lime standard |
| --- | --- | --- |
| Agent ↔ User Interaction | AG-UI、assistant-ui | Lime AgentUI 投影 契约。 |
| Agent ↔ Runtime facts | OpenAI Agents SDK、LangGraph runtime、AI SDK streams | Lime AgentRuntime 剖面、RuntimeEvent、ThreadReadModel、TaskSnapshot。 |
| Agent ↔ Tools/Data | MCP、tool calling schemas | App Server capability gateway、Tool inventory、Policy/Permission/Sandbox facts。 |
| Agent ↔ Agent | A2A、multi-agent runtimes | RuntimeCore task/subagent/job/channel facts 与 Team Workbench 投影。 |
| Evidence/Replay/Review | tracing、eval、observability tools | Lime evidence/replay/review refs joined by runtime correlation ids。 |

## 采用原则

1. 外部协议可参考事件分类、客户端体验和抽象命名。
2. Lime current 写入边界仍是 App Server / RuntimeCore。
3. 产品应用 只能通过版本化 client、JSON-RPC、投影 model 或 host capability 接入。
4. 如果外部模型缺少 Lime 必需事实，Lime 剖面 应显式补充，而不是降低标准。

## AG-UI 对 Lime 的启发

AG-UI 的价值在于把 agent/frontend 连接建模为事件流，并把 lifecycle、text、tools、state、interrupts 等分开。Lime 采用这类信息架构，但必须进一步处理：

- App Server Provider store 和 产品应用 不持有 key。
- RuntimeCore 是 durable truth，不是 UI client 本地 reducer。
- Evidence、replay、review、benchmark 必须能通过 correlation ids join。
- 旧 `messages`、`executionEvents` 只能作为兼容缓存，不是标准输出。

## 内部标准优先级

当外部协议与 Lime 当前事实源冲突时，按以下顺序处理：

1. 保护 Lime ownership：谁写入事实、谁只能投影。
2. 保留可迁移性：compat 只能向 current 委托。
3. 保持可验证：schema、fixture、契约 test 优先于散文约定。
4. 保持产品复用：Content Studio、Zhongcao、Agent Apps 共享 Runtime/UI，不复制。
