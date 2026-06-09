---
title: Runtime 事件
description: Lime RuntimeEvent 的最小合同。
---

# Runtime 事件契约

RuntimeEvent 是 Lime Agent 标准的事实原子。任何 runtime Provider、host adapter 或 产品应用 integration 要声明兼容，必须能输出或消费这个合同。

它参考 AG-UI 的事件流思想，但 Lime 事件不是“前端通信格式”本身，而是 App Server / RuntimeCore 写入事实、ReadModel 水合、AgentUI 投影和 evidence/replay/review join 的共同 spine。

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

## 事件家族

| 家族 | 必需场景 | 示例类型 | 主要消费者 |
| --- | --- | --- | --- |
| Lifecycle | 每个 turn/run/task | `turn.submitted`、`turn.started`、`turn.completed`、`turn.failed`、`run.status` | RuntimeStatus、ProcessTimeline、read model。 |
| Message | 模型文本和最终回答 | `model.requested`、`model.delta`、`model.completed`、`model.failed`、`messages.snapshot` | UIMessageParts、transcript。 |
| Reasoning / Plan | 可解释过程和计划 | `reasoning.delta`、`reasoning.summary`、`plan.delta`、`plan.final` | ProcessTimeline、折叠 reasoning part。 |
| Tool / Process | 工具、命令、浏览器、文件、工作流步骤 | `tool.started`、`tool.args`、`tool.progress`、`tool.result`、`tool.failed`、`output.spilled` | ToolGroup、ProcessTimeline、ExecutionGraph。 |
| Human / Policy | 审批、输入、权限、沙箱 | `action.required`、`action.resolved`、`permission.denied`、`sandbox.blocked` | ActionRequired、RuntimeStatus。 |
| Artifact | 用户可见产物 | `artifact.changed`、`artifact.versioned`、`artifact.exported` | ArtifactRef、artifact workspace。 |
| Evidence | 回放、审查、导出证据 | `evidence.changed`、`evidence.exported`、`review.verdict` | EvidenceRef、review/replay lane。 |
| Task / Agent | 子代理、后台 job、handoff | `task.created`、`task.updated`、`subagent.started`、`job.queued`、`channel.message` | ExecutionGraph、Team Workbench。 |
| Context / Hydration | 历史、压缩、快照修复 | `context.attached`、`history.compacted`、`snapshot.updated`、`stream.repaired` | hydration、diagnostics。 |
| Diagnostics | 警告、错误、指标 | `runtime.warning`、`runtime.error`、`metrics.changed` | Diagnostics surface、conformance。 |

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

## 事件顺序规则

| 规则 | 要求 |
| --- | --- |
| 单调 `sequence` | 同一 stream 内必须单调递增；断流后 read model repair 必须能补齐缺口或标记 stale。 |
| 幂等 `eventId` | projection reducer 应按 `eventId` 去重；Runtime 不应复用不同 payload 的同一 `eventId`。 |
| Start/End 配对 | `tool.started` 必须以 `tool.result`、`tool.failed` 或 turn 级终止事件收口；`action.required` 必须以 resolved/cancelled/expired 收口。 |
| Final reconciliation | `model.completed` 不等于追加一段新文本，而是确认、修正或替换同一 `messageId/partId`。 |
| Scope 完整性 | tool/action/artifact/evidence/task 事件不能只给 `threadId`；必须带对应领域 id。 |
| 大输出引用 | 大 payload 只进入 output/artifact/evidence/raw ref，不在 stream 中重复发送。 |

## 兼容外部运行时

| 外部来源 | 适配规则 |
| --- | --- |
| OpenAI Agents JS | tracing、handoff、tool lifecycle 可以映射为 RuntimeEvent；SDK 对象不能越过 App Server 成为 UI 事实源。 |
| AI SDK stream | `UIMessage.parts` 可作为消息分片参考；tool/reasoning/artifact/evidence 仍要转成 Lime facts。 |
| LangGraph / CrewAI / LlamaIndex | graph/node/run 信息映射到 ExecutionGraph；原生状态保留为 raw diagnostics ref。 |
| AG-UI event stream | lifecycle/text/tool/state 分类可参考；进入 Lime 后必须补齐 session/thread/turn/task/evidence correlation。 |
| 本地 Rust 执行型 runtime | turn item、tool call、approval、sandbox、context compaction 可作为底层执行参考；进入 Lime 后必须映射为 RuntimeEvent、ReadModel、ActionRequired、EvidenceRef。 |

## 校验失败

这些情况应被视为不合格或 degraded：

- 缺少 `sessionId` 或 `eventId`。
- tool/action/artifact/evidence event 缺少对应 id。
- 大输出直接塞进多个 events。
- raw Provider payload 含 secret 且进入 投影 state。
- 事件只提供 prose，没有 typed payload。

## Fixture 要求

每个 runtime provider 至少提供以下 fixture，用于 projection replay 和 conformance：

1. 纯文本 turn：streaming delta + final reconciliation。
2. 工具成功：tool args/progress/result + output ref。
3. 工具失败：failure category + recovery action。
4. 人类审批：action required/resolved + waiting state。
5. Artifact/evidence：artifact changed + evidence exported。
6. 断流恢复：stream interrupted + read model repair + stale 清除。
