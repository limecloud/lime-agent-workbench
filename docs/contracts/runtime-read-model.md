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

```json
{
  "schemaVersion": "0.1",
  "runtimeId": "lime_runtime_local",
  "sessionId": "sess_123",
  "taskId": "task_123",
  "objective": "生成内容包",
  "status": "running",
  "parentTaskId": null,
  "currentRunId": "run_123",
  "attemptIds": ["attempt_1"],
  "dependencies": [],
  "subagents": [],
  "progress": {
    "completedSteps": 2,
    "totalSteps": 5
  },
  "artifactRefs": [],
  "evidenceRefs": [],
  "eventCursor": "evt_124"
}
```

## SubagentSnapshot

多执行实体必须进入 TaskSnapshot 或相关 read model，不能只靠临时事件流恢复。

| 字段 | 要求 |
| --- | --- |
| `subagentId` | 子代理稳定 identity。 |
| `taskId` | 所属任务。 |
| `parentTaskId` / `parentRunId` | lineage，缺失时必须标 degraded。 |
| `role` | planner、researcher、writer、reviewer、executor 或 custom。 |
| `status` | queued、running、waiting、completed、failed、cancelled。 |
| `channelIds` | 协作通道引用。 |
| `artifactRefs` / `evidenceRefs` | 子代理交付与证据引用。 |

完整语义见 [Subagents 标准](/subagents)。

## Hydration 流程

```text
readThread/readTask
  -> hydrate ProjectionState
  -> subscribe RuntimeEvent
  -> apply events by sequence
  -> detect gap
  -> mark stale
  -> read model repair
  -> reconcile projection
```

Projection 可以从 read model 恢复可见状态，但 read model 不是 event stream 的替代品。恢复完成后，后续事实仍应继续从 RuntimeEvent 进入。

## Snapshot reconciliation

| 情况 | 必需行为 |
| --- | --- |
| event stream 完整 | 按 event apply，read model 只作首屏和分页辅助。 |
| sequence gap | Projection 标记 stale，client 读取 read model repair。 |
| final text 与 delta 不一致 | 以 `model.completed` 或 read model final part 修正，不重复追加。 |
| pending action 已解决 | 必须看到 `action.resolved` 或 read model pending list 移除。 |
| artifact/evidence ref 缺失 | 标记 degraded，不从正文猜测 ref。 |

## 降级状态

Read model 可以标记 `stale`、`repairing`、`unavailable`，但不能返回看似完整的假数据。
