---
title: Runtime 提供方
description: Runtime 提供方 如何向 Lime current 主链写入事实。
---

# Runtime 提供方

Runtime 提供方 是 App Server / RuntimeCore 的执行来源，不是 UI adapter。它可以连接模型、工具、浏览器、命令、远程 agent 或工作流引擎，但输出必须归一化为 Lime runtime facts。

## Runtime 提供方必须输出

| 输出 | 要求 |
| --- | --- |
| `RuntimeEvent` | 有 `eventId`、`sequence`、`schemaVersion`、correlation ids、typed `payload`。 |
| `ThreadReadModel` | 当前状态、active turn、pending actions、tool calls、diagnostics、last outcome。 |
| `TaskSnapshot` | objective、status、attempts、dependencies、progress、outputs、evidence refs。 |
| `ArtifactRef` | 只引用 artifact owner，不把大 payload 塞进 message。 |
| `EvidenceRef` | 指向 evidence/replay/review owner，并保留 runtime correlation。 |

## 最小事件顺序

```text
turn.submitted
turn.started
run.status
model.requested
model.delta
tool.started?
tool.progress?
action.required?
action.resolved?
artifact.changed?
evidence.changed?
model.completed
turn.completed | turn.failed
snapshot.updated
```

## Runtime 适配器规则

- 提供方原生 payload 可以保留为 raw ref，但不能泄漏 secret。
- 大输出用 `output.spilled` 或 ref，不复制到每个 event。
- Permission、sandbox、routing、quota、cost、retry 必须成为 runtime facts。
- 失败要有可分类的 `runtime.error`、`tool.failed`、`model.failed` 或 `turn.failed`。
- 没有事实时不要让 UI 猜；显式输出 unavailable 或 validation failure。

## 不接受的实现

```text
LLM stream
  -> assistant text
  -> UI parses text into process/tool/artifact status
```

这条路径只能做 legacy demo，不能声明 Lime conformant。
