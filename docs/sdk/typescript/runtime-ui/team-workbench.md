---
title: Team Workbench
description: TeamWorkbenchView 的多执行体 React surface 合同。
---

# Team Workbench

`TeamWorkbenchView` 是 Lime AgentUI 对 subagent、worker、task、handoff 和 review 的标准 React surface。它只消费 `AgentUiProjectionState`，并从 `state.teamWorkbench` 读取已经由 projection 层构建好的标准模型；React 组件不订阅 runtime stream，也不重新解释 runtime truth。

实现锚点：`packages/agent-runtime-ui/src/teamWorkbench.tsx`。

## 导出

```ts
export {
  TeamWorkbenchView,
  TeamRosterView,
  WorkBoardView,
  HandoffLaneView
} from "@limecloud/agent-runtime-ui";
```

## TeamWorkbenchView

```ts
export interface TeamWorkbenchViewProps<TEvent = AgentRuntimeExecutionEvent> {
  state: AgentUiProjectionState<TEvent>;
  emptyRoster?: ReactNode;
  emptyWorkBoard?: ReactNode;
  emptyHandoffLane?: ReactNode;
  labels?: {
    teamWorkbenchAriaLabel?: string;
    teamRosterAriaLabel?: string;
    workBoardAriaLabel?: string;
    handoffLaneAriaLabel?: string;
    teamNodeTitle?: (node: ExecutionGraphNode) => ReactNode;
    teamNodeMeta?: (node: ExecutionGraphNode) => ReactNode;
    workItemTitle?: (node: ExecutionGraphNode) => ReactNode;
    workItemMeta?: (node: ExecutionGraphNode) => ReactNode;
    eventStatusLabel?: (event: AgentRuntimeEventProjection<TEvent>) => ReactNode;
  };
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `state` | `AgentUiProjectionState` | 唯一事实输入。 |
| `emptyRoster` | `ReactNode` | team roster 空态。 |
| `emptyWorkBoard` | `ReactNode` | work board 空态。 |
| `emptyHandoffLane` | `ReactNode` | handoff lane 空态。 |
| `labels` | callbacks | aria、标题、meta、状态文案注入。 |

## 子 surface

| Surface | Input | 来源 |
| --- | --- | --- |
| `TeamRosterView` | `ExecutionGraphNode[]` | `state.teamWorkbench.rosterNodes`。 |
| `WorkBoardView` | `ExecutionGraphNode[]` | `state.teamWorkbench.workItems`。 |
| `HandoffLaneView` | `AgentRuntimeEventProjection[]` | `state.teamWorkbench.laneEvents`。 |

`TeamWorkbenchView` 在没有 team / work item / handoff facts 时返回 `null`。这表示 solo run，不表示错误。即使返回 `null`，`state.teamWorkbench` 仍然必须存在，且包含空数组。

## State Contract

React surface 不从 `state.graph` 或 `state.readModel.visibleEvents` 重新构造团队模型；这些聚合必须由 projection 层提前完成。

```ts
type TeamWorkbenchInput<TEvent = AgentRuntimeExecutionEvent> =
  AgentUiProjectionState<TEvent>["teamWorkbench"];
```

| Required field | Consumed by |
| --- | --- |
| `hasTeamSurface` | `TeamWorkbenchView` 判断是否渲染。 |
| `rosterNodes` | `TeamRosterView`。 |
| `workItems` | `WorkBoardView`。 |
| `handoffEvents` | lane 分组和 handoff count。 |
| `reviewEvents` | review lane 与 Evidence lane correlation。 |
| `laneEvents` | `HandoffLaneView` 主输入。 |

## DOM Contract

```tsx
<section
  className="agent-team-workbench"
  data-team-count={state.teamWorkbench.rosterNodes.length}
  data-work-item-count={state.teamWorkbench.workItems.length}
  data-handoff-count={state.teamWorkbench.laneEvents.length}
/>
```

子项带稳定 data attributes：

| Attribute | Surface | Description |
| --- | --- | --- |
| `data-node-id` | roster / work board | graph node id。 |
| `data-node-type` | roster / work board | `subagent`、`task`、`job` 等。 |
| `data-node-status` | roster / work board | runtime status。 |
| `data-parent-id` | roster / work board | parent graph edge。 |
| `data-event-class` | handoff lane | `handoff.*` / `review.*`。 |

## Example

```tsx
import { TeamWorkbenchView } from "@limecloud/agent-runtime-ui";

<TeamWorkbenchView
  state={state}
  labels={{
    teamWorkbenchAriaLabel: "团队工作台",
    teamRosterAriaLabel: "团队成员",
    workBoardAriaLabel: "工作板",
    handoffLaneAriaLabel: "移交记录"
  }}
/>;
```

## Runtime Contract

Team Workbench 依赖 runtime facts，而不是 UI 本地状态。

| Runtime fact | Required id | UI result |
| --- | --- | --- |
| `task.created` / `task.updated` | `taskId` | Work board item。 |
| `subagent.started` / `subagent.completed` | `subagentId` + `taskId` | Team roster member + graph edge。 |
| `handoff.requested` / `handoff.completed` | `handoffId` | Handoff lane entry。 |
| `review.verdict` | `reviewId` + evidence ref | Review / evidence lane entry。 |

projection 必须先把这些 facts 聚合到 `AgentUiTeamWorkbenchModel`：

```ts
interface AgentUiTeamWorkbenchModel {
  hasTeamSurface: boolean;
  rosterNodes: ExecutionGraph;
  workItems: ExecutionGraph;
  handoffEvents: AgentRuntimeEventProjection[];
  reviewEvents: AgentRuntimeEventProjection[];
  laneEvents: AgentRuntimeEventProjection[];
}
```

## Boundary

- 不从 assistant 正文推断“有另一个 agent”。
- 不缺 facts 时伪造 teammate。
- 不在 React state 中保存 task completion。
- 不在 React 组件里重新过滤 `state.graph` 或 `state.readModel.visibleEvents`。
- 不把 handoff / review 当成普通 message text。
- 不绕过 `@limecloud/agent-runtime-client` 调 control plane。

## 验证

```bash
npm --prefix packages/agent-runtime-ui run test
```

必须覆盖：

1. `subagent-handoff` fixture 能渲染 team roster。
2. Work board 能展示 parent task。
3. Handoff lane 能展示 `handoff.requested` 与 `review.verdict`。
4. `AgentUiProjectionView` 组合视图包含 Team Workbench。
