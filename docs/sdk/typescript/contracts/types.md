---
title: Types
description: "@limecloud/agent-ui-contracts 的核心 TypeScript 类型。"
---

# Types

本页记录 `@limecloud/agent-ui-contracts` 当前应稳定暴露的核心类型。类型名以 Lime 现有 package 为准，不引入外部 SDK 的 runtime owner。

## AgentRuntimeExecutionEvent

`AgentRuntimeExecutionEvent` 是 UI 侧消费的标准 runtime fact。App Server、RuntimeCore 或 adapter 可以保留自己的内部事件，但进入 AgentUI SDK 前必须归一到该 envelope。

```ts
export interface AgentRuntimeExecutionEvent {
  id: string;
  kind: AgentRuntimeExecutionEventKind;
  status: AgentRuntimeExecutionEventStatus;
  eventClass?: AgentRuntimeEventClass;
  owner?: AgentRuntimeFactOwner;
  schemaVersion?: string;
  sequence?: number;
  runtimeId?: string;
  threadId?: string;
  turnId?: string;
  taskId?: string;
  subagentId?: string;
  runId?: string;
  stepId?: string;
  toolCallId?: string;
  actionId?: string;
  artifactId?: string;
  evidenceId?: string;
  title: string;
  detail?: string;
  refIds?: string[];
  artifactRefs?: string[];
  evidenceRefs?: string[];
  payload?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | 全局稳定 event id。projection 用它做幂等去重。 |
| `kind` | `AgentRuntimeExecutionEventKind` | 粗粒度事件类别，例如 `state`、`model`、`tool`、`action`、`evidence`。 |
| `status` | `AgentRuntimeExecutionEventStatus` | `pending`、`running`、`completed`、`blocked`、`failed` 等执行态。 |
| `eventClass` | `AgentRuntimeEventClass` | 细粒度事件族，例如 `turn.started`、`model.delta`、`tool.result`。 |
| `sequence` | `number` | 同一 stream 内的排序与 repair 依据。 |
| `threadId` / `turnId` | `string` | 会话与回合 scope。 |
| `taskId` / `subagentId` | `string` | task 与 subagent graph scope。 |
| `toolCallId` | `string` | tool event 必需 scope。 |
| `actionId` | `string` | `action.*` event 必需 scope。 |
| `artifactId` / `artifactRefs` | `string` / `string[]` | artifact 引用，不内联大内容。 |
| `evidenceId` / `evidenceRefs` | `string` / `string[]` | evidence 引用和 review correlation。 |
| `payload` | `Record<string, unknown>` | 小型归一化 payload；secret 和大输出禁止内联。 |

## AgentRuntimeReadModel

`AgentRuntimeReadModel` 是可水合的读模型，不替代 event stream。

```ts
export interface AgentRuntimeReadModel<TEvent = AgentRuntimeExecutionEvent> {
  events: AgentRuntimeEventProjection<TEvent>[];
  visibleEvents: AgentRuntimeEventProjection<TEvent>[];
  pendingActions: AgentRuntimeEventProjection<TEvent>[];
  inputSourceRecovery: boolean;
  sourceCount: number;
  artifactRefs: string[];
  evidenceRefs: string[];
  taskRefs: string[];
}
```

| Property | Type | Description |
| --- | --- | --- |
| `events` | `AgentRuntimeEventProjection[]` | 所有可投影 runtime facts。 |
| `visibleEvents` | `AgentRuntimeEventProjection[]` | UI 默认展示的 facts。 |
| `pendingActions` | `AgentRuntimeEventProjection[]` | 仍需要用户处理的 action。 |
| `artifactRefs` | `string[]` | artifact lane 引用。 |
| `evidenceRefs` | `string[]` | evidence / replay / review 引用。 |
| `taskRefs` | `string[]` | task / subagent graph scope。 |

## AgentUiProjectionState

`AgentUiProjectionState` 是 React surfaces 的唯一输入事实。它可以由 events 或 read model 重建。

```ts
export interface AgentUiProjectionState<TEvent = AgentRuntimeExecutionEvent> {
  runtime: AgentUiRuntimeStatusView;
  messages: UIMessageParts;
  timeline: ProcessTimeline;
  graph: ExecutionGraph;
  tools: AgentRuntimeEventProjection<TEvent>[];
  actions: AgentRuntimeEventProjection<TEvent>[];
  artifacts: AgentUiArtifactRefView[];
  evidence: AgentUiEvidenceRefView[];
  diagnostics: AgentUiDiagnosticView[];
  subagents: AgentUiSubagentsModel<TEvent>;
  readModel: AgentRuntimeReadModel<TEvent>;
  hydration: {
    status: AgentUiHydrationStatus;
    eventCount: number;
  };
  ephemeralUi: Record<string, unknown>;
}
```

`subagents` 是 subagent / worker / task / handoff / review 的标准聚合模型。它是必填字段；solo run 使用 `hasSubagents: false` 和空数组表达。React surface 只能消费这个模型，不能在组件内重新过滤 `graph` 或 `readModel.visibleEvents` 来解释团队事实。旧 `teamWorkbench` 命名只作为历史 seed / compat surface，不是 current owner。

```ts
export interface AgentUiSubagentsModel {
  hasSubagents: boolean;
  threads: AgentUiSubagentThreadView[];
  delegationCalls: AgentUiSubagentDelegationView[];
  activities: AgentUiSubagentActivityView[];
  activeThreadIds: string[];
  completedThreadIds: string[];
  failedThreadIds: string[];
}
```

## Message / Timeline / Graph / Team

| Type | 用途 |
| --- | --- |
| `UIMessagePart` | text、reasoning、tool preview、artifact card、evidence citation、diagnostic ref。 |
| `ProcessTimelineEntry` | 用户可见过程时间线，按 event sequence 呈现。 |
| `ExecutionGraphNode` | turn、run、task、subagent、tool、action 等结构化节点。 |
| `AgentUiSubagentsModel` | threads、delegation calls、activities 的标准 subagents 模型。 |

## Runtime Capability / Resume

v2.10 新增两个可执行合同类型。它们不是新的 runtime owner，而是把已有 App Server `capability/list` 与 `agentSession/thread/resume` 的边界固定成可校验结构。

```ts
export interface AgentRuntimeCapabilityManifest {
  schemaVersion: "lime-runtime-capability-manifest/v0.1" | string;
  runtimeId: string;
  providerId?: string;
  sessionId?: string;
  generatedAt: string;
  capabilities: AgentRuntimeCapabilityEntry[];
}

export interface AgentRuntimeCapabilityEntry {
  id: AgentRuntimeCapabilityId;
  status: AgentRuntimeCapabilityStatus;
  scope: AgentRuntimeCapabilityScope;
  title: string;
  detail?: string;
  version?: string;
  metadata?: Record<string, unknown>;
}
```

```ts
export interface AgentRuntimeResumeContract {
  schemaVersion: "lime-runtime-resume-contract/v0.1" | string;
  runtimeId: string;
  sessionId: string;
  turnId: string;
  resumeMode: "all-open-actions" | "selected-actions" | "cancel-open-actions" | string;
  openActionIds: string[];
  decisions: AgentRuntimeResumeActionDecision[];
  expiresAt?: string;
  createdAt: string;
}
```

`resumeMode=all-open-actions` 或 `selected-actions` 时，`decisions[].actionId` 必须覆盖 `openActionIds`。Lime RuntimeCore 在 resume queued turn 前执行同一规则；UI 不能本地跳过 open action。

## 使用示例

```ts
import type {
  AgentRuntimeExecutionEvent,
  AgentUiProjectionState
} from "@limecloud/agent-ui-contracts";

function hasBlockingAction(state: AgentUiProjectionState): boolean {
  return state.actions.some((action) => action.status === "blocked");
}

function eventScope(event: AgentRuntimeExecutionEvent): string {
  return event.toolCallId ?? event.actionId ?? event.taskId ?? event.turnId ?? event.id;
}
```

## 禁止事项

- 不用组件名替代协议名，例如不要把 `ExecutionGraph` 写成某个具体树组件合同。
- 不从 `payload.text` 解析 tool/action/artifact 状态。
- 不把 secret、Provider response、完整文件内容塞进 `payload`。
- 不把 `readModel` 当成唯一事实源；最终仍以 runtime facts 和可 replay evidence 为准。
