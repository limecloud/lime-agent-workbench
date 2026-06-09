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

## 输出表面

| 表面 | 来源事实 |
| --- | --- |
| `MessageParts` | `text.delta`、`text.final`、`messages.snapshot`。 |
| `ProcessTree` | `run.status`、`reasoning.*`、`tool.*`、`action.*`、`task.*`。 |
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

## ViewTree / ProcessTree 的要求

专业过程组件不是把日志缩进展示。它至少需要：

- 稳定节点 id：`turnId`、`stepId`、`toolCallId`、`actionId`、`taskId`。
- 结构关系：parent/child、attempt、dependency、handoff。
- 状态分类：running、waiting、blocked、failed、completed、stale。
- 详情入口：tool output ref、artifact ref、evidence ref、diagnostics ref。
- active/archived 两种密度，而不是永远展开所有节点。
