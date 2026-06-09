---
title: 产品应用
description: 产品应用 如何接入共享 Runtime 和 AgentUI。
---

# 产品应用

产品应用 的职责是提供业务上下文和用户工作流，不是重写 AgentRuntime 或 AgentUI。

## 接入步骤

1. 通过 Host Snapshot 或 App Server client 确认 runtime readiness。
2. 提交 turn 时只传业务上下文、workspace refs、Provider/model preference。
3. 订阅 `agentSession/event` 或等价 event stream。
4. 用 `agentSession/read` 恢复 `ThreadReadModel` 和 `TaskSnapshot`。
5. 把 facts 交给共享 AgentUI 投影。
6. 只在业务壳层组合 surfaces，不 fork 投影 契约。

## Payload 边界

产品应用可以传：

- 用户输入和业务上下文。
- workspace、asset、document、campaign、product refs。
- 非敏感 Provider/model preference。
- 用户可见 intent，例如 create article、generate prompt、analyze material。

产品应用 不得传：

- API Key、token、secret、env key。
- Provider store 的内部记录。
- App Server DB path。
- UI-only completion state。
- mock-only runtime facts。

## Content Studio 的目标路径

```text
AI agents 工作台
  -> agentPromptSessions:start / continue
  -> AppServerPromptAgentService
  -> Host capability lime.agent
  -> App Server agentSession/turn/start
  -> RuntimeBackend -> Provider store -> LLM
  -> RuntimeEvent / ThreadReadModel / ArtifactRef / EvidenceRef
  -> Shared AgentUI 投影
```

旧 `messages` 和 `executionEvents` 可以短期保留为 compat cache，但不能继续驱动完成状态、工具成功、审批结果或 evidence verdict。
