---
title: Team Workbench
description: TeamWorkbench 历史命名的退场说明和 SubagentsView 迁移边界。
---

# Team Workbench Historical Name

`TeamWorkbenchView` 是早期多执行体 React seed 的历史命名。current owner 已经收敛到 [`AgentUiProjectionState.subagents`](/subagents) 和 `SubagentsView`：React 组件只消费 projection state，不订阅 runtime stream，也不重新解释 runtime truth。

实现锚点：`packages/agent-runtime-ui/src/subagents.tsx`。

主仓 current `@limecloud/agent-runtime-ui` 不导出 `TeamWorkbenchView`、`TeamRosterView`、`WorkBoardView` 或 `HandoffLaneView`。新文档、新产品接入和新 fixture 断言必须使用 `SubagentsView` / `state.subagents`。

## 导出

```ts
export {
  SubagentsView,
  SubagentThreadList,
  SubagentDelegationList,
  SubagentActivityList
} from "@limecloud/agent-runtime-ui";
```

## SubagentsView

```ts
export interface SubagentsViewProps<TEvent = AgentRuntimeExecutionEvent> {
  state?: AgentUiProjectionState<TEvent>;
  model?: AgentUiProjectionState<TEvent>["subagents"];
  emptyThreads?: ReactNode;
  emptyDelegations?: ReactNode;
  emptyActivities?: ReactNode;
  labels?: {
    subagentsAriaLabel?: string;
    subagentThreadsAriaLabel?: string;
    subagentDelegationsAriaLabel?: string;
    subagentActivitiesAriaLabel?: string;
    subagentThreadTitle?: (thread: AgentUiSubagentThreadView) => ReactNode;
    subagentThreadMeta?: (thread: AgentUiSubagentThreadView) => ReactNode;
    subagentThreadSummary?: (thread: AgentUiSubagentThreadView) => ReactNode;
    subagentDelegationTitle?: (delegation: AgentUiSubagentDelegationView) => ReactNode;
    subagentActivityTitle?: (activity: AgentUiSubagentActivityView) => ReactNode;
    subagentActivityMeta?: (activity: AgentUiSubagentActivityView) => ReactNode;
  };
  onOpenThread?: (thread: AgentUiSubagentThreadView) => void;
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `state` | `AgentUiProjectionState` | 组合视图可直接传完整 projection state。 |
| `model` | `AgentUiProjectionState["subagents"]` | 独立 surface 可直接传已投影模型。 |
| `emptyThreads` | `ReactNode` | subagent threads 空态。 |
| `emptyDelegations` | `ReactNode` | delegation calls 空态。 |
| `emptyActivities` | `ReactNode` | activities 空态。 |
| `labels` | callbacks | aria、标题、meta、状态文案注入。 |
| `onOpenThread` | callback | 宿主处理打开子代理线程。 |

## 子 surface

| Surface | Input | 来源 |
| --- | --- | --- |
| `SubagentThreadList` | `AgentUiSubagentThreadView[]` | `state.subagents.threads`。 |
| `SubagentDelegationList` | `AgentUiSubagentDelegationView[]` | `state.subagents.delegationCalls`。 |
| `SubagentActivityList` | `AgentUiSubagentActivityView[]` | `state.subagents.activities`。 |

`SubagentsView` 在没有 subagent / work item / handoff facts 时返回 `null`。这表示 solo run，不表示错误。即使返回 `null`，`state.subagents` 仍然必须存在，且包含空数组。

## State Contract

React surface 不从 `state.graph` 或 `state.readModel.visibleEvents` 重新构造团队模型；这些聚合必须由 projection 层提前完成。

```ts
type SubagentsInput<TEvent = AgentRuntimeExecutionEvent> =
  AgentUiProjectionState<TEvent>["subagents"];
```

| Required field | Consumed by |
| --- | --- |
| `hasSubagents` | `SubagentsView` 判断是否渲染。 |
| `threads` | 子代理线程列表。 |
| `delegationCalls` | spawn / handoff / send input / wait / interrupt / close 调用记录。 |
| `activities` | started / interacted / handoff / review / completed 活动轨迹。 |
| `activeThreadIds` | 活跃线程集合。 |
| `completedThreadIds` | 已完成线程集合。 |
| `failedThreadIds` | 失败线程集合。 |

## DOM Contract

```tsx
<section
  className="agent-subagents"
  data-subagent-count={state.subagents.threads.length}
  data-delegation-count={state.subagents.delegationCalls.length}
  data-activity-count={state.subagents.activities.length}
/>
```

子项带稳定 data attributes：

| Attribute | Surface | Description |
| --- | --- | --- |
| `data-thread-id` | threads | subagent thread id。 |
| `data-subagent-id` | threads | subagent id。 |
| `data-subagent-status` | threads | runtime status。 |
| `data-delegation-action` | delegation calls | `spawn`、`handoff`、`send_input` 等。 |
| `data-activity-kind` | activities | `started`、`interacted`、`handoff`、`review`、`completed`。 |

## Example

```tsx
import { SubagentsView } from "@limecloud/agent-runtime-ui";

<SubagentsView
  model={state.subagents}
  labels={{
    subagentsAriaLabel: "子代理",
    subagentThreadsAriaLabel: "子代理线程",
    subagentDelegationsAriaLabel: "委派记录",
    subagentActivitiesAriaLabel: "活动记录"
  }}
/>;
```

## Runtime Contract

Subagents surface 依赖 runtime facts，而不是 UI 本地状态。

| Runtime fact | Required id | UI result |
| --- | --- | --- |
| `task.created` / `task.updated` | `taskId` | Work board item。 |
| `subagent.started` / `subagent.completed` | `subagentId` + `taskId` | Subagent thread + graph edge。 |
| `handoff.requested` / `handoff.completed` | `handoffId` | Handoff lane entry。 |
| `review.verdict` | `reviewId` + evidence ref | Review / evidence lane entry。 |

projection 必须先把这些 facts 聚合到 `AgentUiSubagentsModel`：

```ts
interface AgentUiSubagentsModel {
  hasSubagents: boolean;
  threads: AgentUiSubagentThreadView[];
  delegationCalls: AgentUiSubagentDelegationView[];
  activities: AgentUiSubagentActivityView[];
  activeThreadIds: string[];
  completedThreadIds: string[];
  failedThreadIds: string[];
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

1. `subagent-handoff` fixture 能渲染 subagent thread。
2. Delegation calls 能展示 spawn / handoff。
3. Activities 能展示 handoff 与 completed。
4. `AgentUiProjectionView` 组合视图包含 Subagents surface。
