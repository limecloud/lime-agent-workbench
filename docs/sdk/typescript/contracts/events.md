---
title: Events
description: "@limecloud/agent-ui-contracts 的 RuntimeEvent Reference。"
---

# Events

`@limecloud/agent-ui-contracts` 使用 streaming event architecture。事件是 RuntimeCore / App Server 与 AgentUI 之间的标准事实单位；projection、React surfaces、Evidence Pack 都应消费这些 facts，而不是解析 assistant 文本。

实现锚点：`packages/agent-ui-contracts/src/runtime.ts`。

## AgentRuntimeEventClass

`AgentRuntimeEventClass` 是事件细分类。当前包允许 `string` 扩展，但以下事件族是 Lime current 标准面。

```ts
export type AgentRuntimeEventClass =
  | "session.created"
  | "turn.submitted"
  | "turn.started"
  | "turn.completed"
  | "turn.failed"
  | "run.status"
  | "context.resolved"
  | "tool.started"
  | "tool.result"
  | "tool.failed"
  | "tool.catalog.resolved"
  | "permission.evaluated"
  | "permission.requested"
  | "permission.resolved"
  | "sandbox.applied"
  | "sandbox.violation"
  | "model.requested"
  | "model.delta"
  | "model.completed"
  | "model.failed"
  | "artifact.changed"
  | "action.required"
  | "action.resolved"
  | "runtime.error"
  | "evidence.changed"
  | "snapshot.updated"
  | string;
```

| Family | Events | Projection |
| --- | --- | --- |
| Session / turn | `session.created`、`turn.submitted`、`turn.started`、`turn.completed`、`turn.failed` | `runtime.status`、timeline、read model hydration。 |
| Model output | `model.requested`、`model.delta`、`model.completed`、`model.failed` | `UIMessageParts` text / reasoning、runtime status。 |
| Tool | `tool.started`、`tool.result`、`tool.failed`、`tool.catalog.resolved` | ToolGroup、ProcessTimeline、ExecutionGraph。 |
| Permission / sandbox | `permission.*`、`sandbox.*` | ActionRequired、Diagnostics、runtime blocked state。 |
| Artifact / evidence | `artifact.changed`、`evidence.changed` | Artifact lane、Evidence lane、message cards。 |
| Human action | `action.required`、`action.resolved` | `ActionRequiredList`、waiting / completed reconciliation。 |
| Snapshot / repair | `snapshot.updated` | hydration repair、stale recovery、final reconciliation。 |

Subagent / team events such as `task.created`、`subagent.started`、`handoff.requested`、`review.verdict` are supported through the open string extension and standard scope ids. They must still carry `taskId`、`subagentId`、`handoffId`、`reviewId` or evidence refs where applicable.

## Base Event

所有事件共享 `AgentRuntimeExecutionEvent` envelope。

```ts
export interface AgentRuntimeExecutionEvent {
  id: string;
  kind: AgentRuntimeExecutionEventKind;
  status: AgentRuntimeExecutionEventStatus;
  eventClass?: AgentRuntimeEventClass;
  schemaVersion?: string;
  sequence?: number;
  runtimeId?: string;
  threadId?: string;
  turnId?: string;
  taskId?: string;
  subagentId?: string;
  toolCallId?: string;
  actionId?: string;
  artifactId?: string;
  evidenceId?: string;
  title: string;
  detail?: string;
  payload?: Record<string, unknown>;
  refIds?: string[];
  artifactRefs?: string[];
  evidenceRefs?: string[];
  createdAt: string;
  completedAt?: string;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | 事件幂等键。重复事件不得重复追加 UI。 |
| `kind` | `AgentRuntimeExecutionEventKind` | 粗粒度事实类别。 |
| `status` | `AgentRuntimeExecutionEventStatus` | 投影到 `running`、`waiting`、`completed`、`failed` 等 UI 状态。 |
| `eventClass` | `AgentRuntimeEventClass` | 事件判别字段。 |
| `sequence` | `number` | stream 排序与 gap 检测依据。 |
| `createdAt` | `string` | ISO timestamp。 |
| `payload` | `Record<string, unknown>` | 小型结构化字段；大输出和原始响应走 refs。 |

## Lifecycle Events

### turn.submitted

用户或产品应用提交一个 turn 后产生。

```ts
const event: AgentRuntimeExecutionEvent = {
  id: "evt_turn_submitted",
  schemaVersion: "lime-runtime-event/v0.1",
  runtimeId: "app-server",
  threadId: "thread_1",
  turnId: "turn_1",
  eventClass: "turn.submitted",
  kind: "state",
  status: "pending",
  sequence: 1,
  title: "Turn submitted",
  createdAt: "2026-06-10T00:00:00.000Z"
};
```

| Property | Required | Description |
| --- | --- | --- |
| `threadId` | yes | 归属 thread。 |
| `turnId` | yes | 当前 turn scope。 |
| `status` | yes | 通常为 `pending`。 |

### turn.started

Runtime 接受并开始执行 turn。

| Property | Required | Description |
| --- | --- | --- |
| `turnId` | yes | 当前 turn scope。 |
| `runId` | recommended | 运行实例 id。 |
| `status` | yes | 通常为 `running`。 |

### turn.completed

turn 进入终态。UI 必须将 active stream 收回完成态。

| Property | Required | Description |
| --- | --- | --- |
| `turnId` | yes | 完成的 turn。 |
| `completedAt` | recommended | 终态时间。 |
| `evidenceRefs` | optional | 可关联 Evidence Pack。 |

### turn.failed

turn 失败。失败原因进入 `payload.failureCategory` 或 diagnostics ref。

| Property | Required | Description |
| --- | --- | --- |
| `turnId` | yes | 失败的 turn。 |
| `status` | yes | `failed`。 |
| `payload.failureCategory` | recommended | 稳定错误分类。 |

## Text / Model Events

### model.delta

模型增量输出。Projection 会合并同一 message scope 下的 text part。

```ts
{
  id: "evt_model_delta_1",
  eventClass: "model.delta",
  kind: "model",
  status: "running",
  sequence: 3,
  payload: {
    messageId: "msg_1",
    delta: "你好，Lime。"
  },
  title: "Assistant text",
  createdAt: "2026-06-10T00:00:00.000Z"
}
```

| Property | Required | Description |
| --- | --- | --- |
| `payload.messageId` | recommended | 合并 streaming parts 的稳定 key。 |
| `payload.delta` | recommended | 增量文本。 |
| `status` | yes | `running`。 |

### model.completed

模型文本完成。Projection 会将对应 message part 标记为 `final`。

| Property | Required | Description |
| --- | --- | --- |
| `payload.messageId` | recommended | 与 delta 同 scope。 |
| `payload.text` | recommended | 最终文本。 |
| `status` | yes | `completed`。 |

## Tool Events

Tool events 必须携带 `toolCallId`，否则 validation 返回 `missing_scope_id`。

### tool.started

```ts
{
  id: "evt_tool_started",
  eventClass: "tool.started",
  kind: "tool",
  status: "running",
  taskId: "task_1",
  toolCallId: "tool_search_1",
  title: "Search started",
  payload: { toolName: "search" },
  createdAt: "2026-06-10T00:00:00.000Z"
}
```

### tool.result

工具成功完成。大结果必须进入 `refIds`，不要内联到 payload。

| Property | Required | Description |
| --- | --- | --- |
| `toolCallId` | yes | 工具调用 scope。 |
| `refIds` | recommended | output refs。 |
| `status` | yes | `completed`。 |

### tool.failed

工具失败。UI 展示为 diagnostics 和 tool preview failure。

| Property | Required | Description |
| --- | --- | --- |
| `toolCallId` | yes | 工具调用 scope。 |
| `payload.failureCategory` | recommended | 稳定失败分类，例如 `permission_denied`。 |
| `status` | yes | `failed`。 |

## Human Action Events

Action events 必须携带 `actionId`。

### action.required

```ts
{
  id: "evt_action_required",
  eventClass: "action.required",
  kind: "action",
  status: "blocked",
  taskId: "task_1",
  actionId: "action_approval_1",
  title: "Approval required",
  createdAt: "2026-06-10T00:00:00.000Z"
}
```

UI 可以显示 pending 状态，但不能本地把 action 标记为完成。完成态必须来自 `action.resolved` 或 read model repair。

### action.resolved

| Property | Required | Description |
| --- | --- | --- |
| `actionId` | yes | 被处理的 action。 |
| `payload.decision` | recommended | `approved`、`rejected`、`answered` 等稳定决策。 |
| `status` | yes | `completed`。 |

## Artifact / Evidence Events

Artifact 与 Evidence events 必须携带稳定 id 或 refs。

```ts
{
  id: "evt_artifact_changed",
  eventClass: "artifact.changed",
  kind: "draft",
  owner: "artifact",
  status: "completed",
  taskId: "task_1",
  artifactId: "artifact_1",
  artifactRefs: ["artifact_1"],
  title: "Artifact changed",
  createdAt: "2026-06-10T00:00:00.000Z"
}
```

| Event | Required scope | UI surface |
| --- | --- | --- |
| `artifact.changed` | `artifactId` or `artifactRefs` | Artifact card / lane。 |
| `evidence.changed` | `evidenceId` or `evidenceRefs` | Evidence citation / review lane。 |
| `review.verdict` | `reviewId` plus evidence ref | Evidence / Review surface。 |

## Team Workbench Events

Team Workbench 事件仍使用同一个 `AgentRuntimeExecutionEvent` envelope。事件族可以通过 `eventClass: string` 扩展，但进入 contracts 后必须保留稳定 scope，projection 才能生成 `state.teamWorkbench`。

| Event class | Required scope | Projection result |
| --- | --- | --- |
| `task.created` / `task.updated` | `taskId`，推荐 `parentTaskId` 或 `runId` 放在 `payload`。 | `teamWorkbench.workItems` 与 `ExecutionGraph` task node。 |
| `subagent.started` / `subagent.completed` | `subagentId` + `taskId`。 | `teamWorkbench.rosterNodes` 与 parent-child graph edge。 |
| `worker.started` / `worker.completed` | `subagentId` 或稳定 worker id，推荐关联 `taskId`。 | roster member；缺 lineage 时降级为 `unavailable` diagnostic。 |
| `handoff.requested` / `handoff.completed` | `payload.handoffId`，推荐 `taskId` / `subagentId`。 | `teamWorkbench.handoffEvents` 和 `laneEvents`。 |
| `review.requested` / `review.verdict` | `payload.reviewId` 或 `evidenceRefs`。 | `teamWorkbench.reviewEvents`、`laneEvents` 与 Evidence lane。 |

这些事件不能只作为普通 message text 输出。缺少 lineage 时，runtime provider 应输出 `unknown`、`unavailable`、`stale` 或 diagnostic event；projection 不从标题、正文或组件状态猜父子关系。

## Snapshot / Repair Events

### snapshot.updated

`snapshot.updated` 用于 read model repair 和 final reconciliation。它可以修复 stream gap，但不能伪造真实 tool/action 完成态。

| Property | Required | Description |
| --- | --- | --- |
| `sequence` | recommended | repair 前后的 stream cursor。 |
| `payload` | optional | 小型 snapshot 摘要。 |
| `refIds` | recommended | 大 snapshot 或 evidence ref。 |

## Validation

```ts
import { validateRuntimeEvent } from "@limecloud/agent-ui-contracts";

validateRuntimeEvent(event);
```

Validation 会检查：

| Code | Meaning |
| --- | --- |
| `schema_mismatch` | 必填字段缺失或类型错误。 |
| `missing_scope_id` | `tool.*` / `action.*` / `artifact.*` / `evidence.*` 缺少稳定 scope id。 |
| `sequence_gap` | fixture event sequence 不连续，且未声明 repair diagnostics。 |
| `secret_leak_risk` | payload key 疑似包含 token、secret、password、authorization。 |
| `large_payload_inline` | payload 过大，应改用 refs。 |

## Boundary

- 事件不是组件树协议；不要恢复组件树协议作为标准。
- 事件不是产品本地日志；必须能被 projection replay。
- 事件不保存 Provider secret。
- 事件不由 React component 生成，React 只能发 callback。
