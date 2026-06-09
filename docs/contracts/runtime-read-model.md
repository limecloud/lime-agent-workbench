---
title: Runtime 读模型
description: SessionSnapshot、ThreadReadModel、TaskSnapshot 的最小合同。
---

# Runtime 读模型契约

Read model 是 UI hydration、sidebars、tabs、timeline 和 evidence review 的性能边界。

## ThreadReadModel

```json
{
  "schemaVersion": "0.1",
  "runtimeId": "lime_runtime_local",
  "sessionId": "sess_123",
  "threadId": "thread_123",
  "status": "running",
  "activeTurnId": "turn_123",
  "pendingActions": [],
  "toolCalls": [],
  "queuedTurns": [],
  "incidents": [],
  "diagnostics": [],
  "lastOutcome": null,
  "historyCursor": "cursor_123"
}
```

## 要求

| 要求 | 原因 |
| --- | --- |
| 有 schema version 和 correlation ids | 让 UI、evidence、review 可 join。 |
| 有 current status 和 active turn | 支持恢复 active run。 |
| pending actions 独立列出 | 不靠遍历历史找审批卡片。 |
| tool calls 有 summary/ref | 不阻塞首屏。 |
| history cursor 明确 | 支持 timeline pagination。 |
| incidents/diagnostics 分离 | 不污染用户正文。 |

## SessionSnapshot

应包含 session shell、threads、recent messages/process refs、task summary、artifact/evidence summary 和 recovery cursor。

## TaskSnapshot

应包含 objective、status、current run、attempts、parent/dependency edges、progress、outputs、artifacts、evidence refs 与 delivery state。

## 降级状态

Read model 可以标记 `stale`、`repairing`、`unavailable`，但不能返回看似完整的假数据。
