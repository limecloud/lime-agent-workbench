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
| `teamWorkbench` | subagent / worker / task / handoff / review facts 聚合后的团队工作台模型。 |
| `readModel` | 可水合读模型。 |
| `hydration` | projection 当前水合状态与 event count。 |

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
| `apply(event)` | 通过 event id 幂等追加事件并重新投影。 |
| `reset()` | 清空 runtime facts 和 projection state。 |

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

## Team Workbench Projection

Projector 必须始终输出 `state.teamWorkbench`。没有 team facts 时输出空模型：

```ts
{
  hasTeamSurface: false,
  rosterNodes: [],
  workItems: [],
  handoffEvents: [],
  reviewEvents: [],
  laneEvents: []
}
```

有 `task.*`、`subagent.*`、`worker.*`、`handoff.*`、`review.*` facts 时，projection 负责把它们归入 `AgentUiTeamWorkbenchModel`：

| Runtime facts | Projection field |
| --- | --- |
| task / job / run / attempt facts | `workItems` |
| subagent / worker facts | `rosterNodes` |
| handoff facts | `handoffEvents` |
| review facts and evidence refs | `reviewEvents` |
| handoff + review ordered lane | `laneEvents` |

React surface 只读 `state.teamWorkbench`。如果 lineage 不完整，projector 应保留 diagnostic 或 degraded state，不能从正文猜 parent-child 关系。

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
