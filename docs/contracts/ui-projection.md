---
title: UI 投影
description: Runtime facts 到 AgentUI 投影 state 的合同。
---

# UI 投影契约

AgentUI 投影 是 Runtime facts 与 UI components 之间的唯一 adapter layer。

## 输入

```text
RuntimeEvent
  + ThreadReadModel
  + TaskSnapshot
  + ArtifactSummary
  + EvidenceSummary
  + Diagnostics
  -> AgentUI Projection State
```

## 投影映射

| Runtime 事实 | 投影 |
| --- | --- |
| `turn.*`、`run.status` | RuntimeStatus、ProcessTree root。 |
| `model.delta`、`model.completed` | MessageParts。 |
| `reasoning.*` | ProcessTree reasoning nodes。 |
| `tool.*`、`process.*` | ToolGroup、ProcessTree、Timeline。 |
| `action.*`、`permission.*` | ActionRequired、TaskCapsule attention。 |
| `task.*`、`queue.changed` | TaskCapsule、work board。 |
| `subagent.*`、`job.*`、`channel.*` | Team Workbench surfaces。 |
| `artifact.changed` | ArtifactRef、artifact workspace。 |
| `evidence.changed` | EvidenceRef、review/replay/timeline lane。 |
| `snapshot.updated` | Hydration/reconciliation。 |

## 投影状态禁止事项

- 保存 secret-bearing raw payload。
- 把 diagnostics 放进 conversation text。
- 把 local collapse/focus state 写回 runtime。
- 从 prose 推断 tool/action/artifact/evidence 状态。
- 在 产品应用 内 fork 一套相同 投影 model。

## 未知事实

Projection 缺事实时使用这些状态：

| 状态 | 含义 |
| --- | --- |
| `unknown` | 事件存在但字段不足。 |
| `unavailable` | 剖面 不提供该能力。 |
| `blocked` | host/Provider/policy 阻断。 |
| `stale` | hydration 或 stream 需要 repair。 |
| `not_applicable` | 当前 scope 不适用。 |
