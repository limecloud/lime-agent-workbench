---
title: Lime 剖面
description: Lime current AgentRuntime 与 AgentUI 的产品剖面。
---

# Lime 剖面

Lime 剖面是本工作台的主产品剖面。它比通用协议更严格，因为 Lime 要治理真实产品代码库。

## 当前执行主链

```text
Objective
  -> Session
  -> Thread
  -> Turn
  -> Step / Item
  -> ToolCall / Action / Process / Subagent
  -> RuntimeEvent
  -> Snapshot / ThreadReadModel / TaskSnapshot
  -> EvidencePack / Replay / Review / UI 投影
```

## 当前实现边界

```text
App surface / Electron Desktop Host bridge
  -> App Server JSON-RPC
  -> RuntimeCore
  -> ExecutionBackend
  -> Tool / Skill / Workspace / Artifact / Evidence / Policy services
```

## 必需事实

Lime 剖面核心要求这些事件族：

- `session.*`、`thread.*`、`turn.*`
- `task.*`、`task.attempt.*`、`run.status`
- `model.*`、`reasoning.*`
- `tool.*`、`process.*`、`output.*`
- `action.*`、`permission.*`、`sandbox.*`、`hook.*`
- `context.*`、`history.*`
- `routing.*`、`cost.*`、`quota.*`、`limit.changed`
- `subagent.*`、`job.*`、`channel.*`
- `artifact.changed`、`evidence.changed`、`snapshot.updated`
- `runtime.warning`、`runtime.error`

## 所有权

| 对象 | 拥有方 |
| --- | --- |
| Runtime 事实 | RuntimeCore |
| Provider Key | App Server Provider store |
| Host lifecycle | Desktop Host |
| Projection | AgentUI |
| 产品上下文 | 产品应用 |
| Evidence verdict | Evidence/review service |

## 硬规则

- 缺失 correlation 是 degraded fact。
- 产品应用 不得 import 内部 runtime 实现。
- 产品应用 不得把 retired desktop command path 当 current API。
- UI-only state 不能修改 runtime truth。
- Evidence/replay/review 必须消费同一组 runtime facts。
