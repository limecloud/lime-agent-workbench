---
title: UI 消费方
description: AgentUI 如何消费 runtime facts 并投影到共享表面。
---

# UI 消费方

UI 消费方 消费 `RuntimeEvent + ReadModel`，输出用户可见 投影。它不能拥有 runtime truth。

## 输入

```text
RuntimeEvent stream
ThreadReadModel
TaskSnapshot
Artifact summaries
Evidence summaries
Diagnostics
```

## 推荐依赖

| 用途 | 包 |
| --- | --- |
| Projection reducer / selectors | `@limecloud/agent-runtime-projection` |
| React surfaces / hooks | `@limecloud/agent-runtime-ui` |
| 共享类型 | `@limecloud/agent-ui-contracts` |

## 输出表面

| 表面 | 来源事实 |
| --- | --- |
| `UIMessageParts` | `text.delta`、`text.final`、`messages.snapshot`、`reasoning.summary`、artifact/evidence refs。 |
| `ProcessTimeline` | `run.status`、`reasoning.*`、`tool.*`、`action.*`、`artifact.changed`、`evidence.changed`。 |
| `ExecutionGraph` | `task.*`、`subagent.*`、`job.*`、`attempt.*`、dependency / handoff facts。 |
| `ToolGroup` | `tool.started`、`tool.args`、`tool.progress`、`tool.result`、`tool.failed`。 |
| `ActionRequired` | `action.required`、`permission.*`、`action.resolved`。 |
| `TaskCapsule` | `task.*`、`queue.changed`、`subagent.*`、`job.*`。 |
| `ArtifactRef` | `artifact.changed` 与 artifact service preview。 |
| `EvidenceRef` | `evidence.changed` 与 evidence/replay/review summary。 |
| `RuntimeStatus` | `turn.*`、`run.status`、`routing.*`、`limit.*`、`runtime.warning/error`。 |

## Reducer 规则

1. 按 `sequence` 保留 active run order。
2. text、reasoning、tool、action、artifact、evidence、diagnostics 分开存。
3. final event 负责 reconciliation，不能重复追加文本。
4. `owner=ui_投影` 只允许保存 collapse、focus、selected tab、draft。
5. 缺少 ids 时标记 degraded，不伪造 evidence 或 completion。

## React surface 分层

| Surface | 输入 | 写操作 |
| --- | --- | --- |
| Conversation | UIMessageParts | submit intent。 |
| ProcessTimeline | timeline entries | none；只触发 focus/filter。 |
| ExecutionGraph | graph nodes/edges | none；retry/cancel 走 runtime client。 |
| ToolGroup | ToolCallView | retry、open output ref。 |
| ActionRequired | ActionRequiredView | respondAction。 |
| Artifact/Evidence lane | refs | open/export/review owner API。 |
| Diagnostics | DiagnosticView | copy/export diagnostics。 |

React 组件只接收 projection state 和 command callbacks，不直接订阅 runtime stream。

## 过程投影的要求

专业过程组件不是把日志缩进展示，也不是让模型生成任意组件树。它至少需要：

- 稳定节点 id：`turnId`、`stepId`、`toolCallId`、`actionId`、`taskId`。
- 结构关系：parent/child、attempt、dependency、handoff。
- 状态分类：running、waiting、blocked、failed、completed、stale。
- 详情入口：tool output ref、artifact ref、evidence ref、diagnostics ref。
- active/archived 两种密度，而不是永远展开所有节点。

## 不合格 UI

- 用日志缩进生成过程表面。
- 从最终回答中解析工具状态。
- 本地保存 approval result，不调用 action owner。
- 把 collapse/focus 写进 RuntimeEvent。
- 在产品应用里 fork 一套 projection reducer。
