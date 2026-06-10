---
title: Selectors
description: ProjectionState 的读取约定与 selector 边界。
---

# Selectors

当前实现把 selector 结果直接放在 `AgentUiProjectionState` 字段上。产品应用可以读取这些字段，但不能绕回 runtime payload 重新解释状态。

## Standard Selectors

| Selector Concept | Current field | Description |
| --- | --- | --- |
| Runtime status | `state.runtime` | 当前 turn / run / task 状态。 |
| Message parts | `state.messages` | Conversation surface。 |
| Process timeline | `state.timeline` | 过程可观察时间线。 |
| Execution graph | `state.graph` | task / subagent / tool / action 结构。 |
| Tool group | `state.tools` | 工具调用列表。 |
| Action required | `state.actions` | 需要用户处理的 action。 |
| Artifact refs | `state.artifacts` | artifact lane。 |
| Evidence refs | `state.evidence` | evidence / review / replay lane。 |
| Team workbench | `state.teamWorkbench` | roster、work board、handoff / review lane。 |
| Diagnostics | `state.diagnostics` | failed、blocked、runtime error。 |

## Usage

```ts
function selectBlockingActions(state: AgentUiProjectionState) {
  return state.actions.filter((action) => action.status === "blocked");
}

function selectVisibleTimeline(state: AgentUiProjectionState) {
  return state.timeline.filter((entry) => entry.kind !== "diagnostic");
}
```

## Selector Rules

1. Selector 不修改 state。
2. Selector 不读取 App Server。
3. Selector 不从 assistant text 推断 tool/action/artifact。
4. Selector 不翻译 enum，只返回稳定 facts。
5. Selector 可以组合 projection state，但不能引入第二套 truth。

## Future API

当 selector 复杂度继续上升，可以在 package 中显式导出：

```ts
export function selectMessageParts(state: AgentUiProjectionState): UIMessageParts;
export function selectProcessTimeline(state: AgentUiProjectionState): ProcessTimeline;
export function selectExecutionGraph(state: AgentUiProjectionState): ExecutionGraph;
export function selectActionRequired(state: AgentUiProjectionState): AgentRuntimeEventProjection[];
export function selectTeamWorkbench(state: AgentUiProjectionState): AgentUiTeamWorkbenchModel;
```

这属于 API polish，不改变 current owner。
