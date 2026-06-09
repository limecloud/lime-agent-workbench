---
title: Runtime 事件
description: Lime RuntimeEvent 的最小合同。
---

# Runtime 事件契约

RuntimeEvent 是 Lime Agent 标准的事实原子。任何 runtime Provider、host adapter 或 产品应用 integration 要声明兼容，必须能输出或消费这个合同。

## 事件信封

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `schemaVersion` | yes | Runtime event schema version。 |
| `runtimeId` | yes | runtime instance 或服务实例。 |
| `sessionId` | yes | durable work container。 |
| `eventId` | yes | 全局或 stream 内唯一。 |
| `timestamp` | yes | producer timestamp。 |
| `sequence` | yes | 同一 stream 内单调递增。 |
| `type` | yes | event class。 |
| `payload` | yes | typed payload。 |
| `refs` | no | artifact/evidence/output/raw refs。 |

## 作用域 ID

| 作用域 | 必需 ID |
| --- | --- |
| Thread | `threadId` |
| Turn | `threadId`、`turnId` |
| Task | `taskId`，有执行尝试时 `runId` / `attemptId` |
| Tool | `threadId`、`turnId`、`stepId`、`toolCallId` |
| Action | `threadId`、`turnId`、`actionId` |
| Artifact | `artifactId` |
| Evidence | `evidenceId` and available runtime correlation ids |

## 最小示例

```json
{
  "schemaVersion": "0.1",
  "runtimeId": "lime_runtime_local",
  "sessionId": "sess_123",
  "threadId": "thread_123",
  "turnId": "turn_123",
  "eventId": "evt_123",
  "sequence": 12,
  "timestamp": "2026-06-09T10:00:00.000Z",
  "type": "tool.started",
  "stepId": "step_123",
  "toolCallId": "tool_123",
  "payload": {
    "toolName": "write_file",
    "title": "Update draft"
  }
}
```

## 校验失败

这些情况应被视为不合格或 degraded：

- 缺少 `sessionId` 或 `eventId`。
- tool/action/artifact/evidence event 缺少对应 id。
- 大输出直接塞进多个 events。
- raw Provider payload 含 secret 且进入 投影 state。
- 事件只提供 prose，没有 typed payload。
