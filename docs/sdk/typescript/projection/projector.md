---
title: Projector
description: createAgentUiProjector 与 projectAgentUiState API。
---

# Projector

Projector 是 `@limecloud/agent-runtime-projection` 的核心 API。它把 `AgentRuntimeExecutionEvent[]` 投影为 `AgentUiProjectionState`。

## projectAgentUiState

```ts
export function projectAgentUiState<TEvent extends AgentRuntimeExecutionEvent>(
  input?: AgentRuntimeProjectionInput<TEvent>
): AgentUiProjectionState<TEvent>;
```

| Input | Description |
| --- | --- |
| `executionEvents` | 标准 runtime facts。 |
| `sourceCount` | 输入源数量，用于 runtime summary。 |

输出包含：

| State field | Source |
| --- | --- |
| `runtime` | 最新事件倒序解析出的运行态。 |
| `messages` | model / reasoning / tool / artifact / evidence / diagnostic message parts。 |
| `timeline` | 每个 runtime event 的过程条目。 |
| `graph` | turn / run / task / subagent / tool / action node。 |
| `tools` | read model 中 `surface === "tool"` 的投影。 |
| `actions` | read model 中 `surface === "human-action"` 的投影。 |
| `artifacts` | artifact refs。 |
| `evidence` | evidence refs。 |
| `diagnostics` | failed / blocked / runtime error facts。 |
| `subagents` | subagent / worker / task / handoff / review facts 聚合后的 Subagents 模型。 |
| `readModel` | 可水合读模型。 |
| `hydration` | projection 当前水合状态与 event count。 |

如果输入包含 `state.delta`，projector 会在普通 runtime facts 投影后按顺序应用 patch。`target: "projection"` 可修复 UI state 子树，`target: "readModel"` 可修复 read model cache；batch `projectAgentUiState()` 与 incremental `createAgentUiProjector.apply()` 使用同一归并逻辑。

## createAgentUiProjector

```ts
export function createAgentUiProjector<TEvent extends AgentRuntimeExecutionEvent>(
  initialInput?: AgentRuntimeProjectionInput<TEvent>
): AgentUiProjector<TEvent>;
```

```ts
const projector = createAgentUiProjector();
projector.apply(event);
const state = projector.getState();
projector.reset();
```

| Method | Behavior |
| --- | --- |
| `getState()` | 返回当前 projection state。 |
| `hydrate(input)` | 用新的 events / sourceCount 替换当前状态。 |
| `apply(event)` | 通过 event id 幂等追加事件，并用增量 accumulator 更新 messages / timeline / graph / readModel / subagents；`state.delta` 会在 snapshot 后持久归并；重复 event 直接返回当前 state。 |
| `reset()` | 清空 runtime facts 和 projection state。 |

## State Delta Apply

`state.delta` 使用 RFC 6902 JSON Patch 子集：`add`、`replace`、`remove`、`test`、`copy`、`move`。

```ts
projector.apply({
  id: "evt-delta",
  kind: "state",
  status: "completed",
  eventClass: "state.delta",
  title: "Repair subagent projection",
  runtimeId: "runtime_1",
  sequence: 42,
  payload: {
    target: "projection.subagents",
    patch: [
      { op: "replace", path: "/threads/0/status", value: "completed" },
      { op: "add", path: "/threads/0/summary", value: "已完成资料整理" }
    ]
  },
  createdAt: "2026-06-12T00:00:00.000Z"
});
```

边界：

- patch 只能作用在 schema 已知 projection / readModel 子树。
- patch 不能修改 `readModel.events`、`readModel.visibleEvents` 或 `readModel.pendingActions` 来伪造 runtime fact。
- patch 失败不会污染目标 state；projector 会把 `hydration.status` 标为 `stale`，并写入 `diagnostics`。
- `projection.subagents` patch 后会同步重算 `activeThreadIds`、`completedThreadIds`、`failedThreadIds`。
- 后续同子树 runtime facts 优先于较早的 `state.delta`，避免修复事件覆盖更新的事实。

## Streaming Merge

`model.delta` 会按 runtime/thread/run/turn/task/messageId 聚合，避免同一 stream 生成多个重复 message part。

```ts
{
  eventClass: "model.delta",
  payload: {
    messageId: "msg_1",
    delta: "第一段"
  }
}
```

当 `model.completed` 或 completed status 到达时，message part 状态转为 `final`。

## Subagents Projection

Projector 必须始终输出 `state.subagents`。没有 subagent facts 时输出空模型：

```ts
{
  hasSubagents: false,
  threads: [],
  delegationCalls: [],
  activities: [],
  activeThreadIds: [],
  completedThreadIds: [],
  failedThreadIds: []
}
```

有 `task.*`、`subagent.*`、`worker.*`、`handoff.*`、`review.*` facts 时，projection 负责把它们归入 `AgentUiSubagentsModel`：

| Runtime facts | Projection field |
| --- | --- |
| subagent / worker lifecycle | `threads` |
| spawn / handoff / send input / wait / interrupt / close facts | `delegationCalls` |
| started / interacted / handoff / review / completed facts | `activities` |
| pending / running / blocked thread status | `activeThreadIds` |
| completed thread status | `completedThreadIds` |
| failed thread status | `failedThreadIds` |

React surface 只读 `state.subagents`。如果 lineage 不完整，projector 应保留 diagnostic 或 degraded state，不能从正文猜 parent-child 关系。

## Runtime Status

投影按最新事件倒序解析状态：

| Event / Status | Runtime status |
| --- | --- |
| `runtime.error` / `turn.failed` / `failed` | `failed` |
| unresolved `action.required` | `waiting` |
| `blocked` | `blocked` |
| `turn.completed` / `model.completed` | `completed` |
| `turn.started` / `model.delta` / `running` | `running` |

## 禁止事项

- 不在 projector 内创建 App Server client。
- 不在 projector 内读取 DB。
- 不在 projector 内渲染 JSX。
- 不因为缺 event id 就伪造 completed。
