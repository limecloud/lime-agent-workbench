---
title: AgentUiProjectionView
description: 标准 React 组合视图。
---

# AgentUiProjectionView

`AgentUiProjectionView` 是当前 React seed 的组合 surface。它把 projection state 拆给 message、timeline、action、tool、runtime facts、artifact refs、evidence refs、Team Workbench 和 graph 子 surface。

实现锚点：`packages/agent-runtime-ui/src/projectionView.tsx`。

## Props

```ts
export interface AgentUiProjectionViewProps<TEvent = AgentRuntimeExecutionEvent> {
  state: AgentUiProjectionState<TEvent>;
  artifact?: ReactNode;
  emptyMessages?: ReactNode;
  labels?: AgentUiProjectionViewLabels<TEvent>;
  onResolveAction?: AgentRuntimeActionResolver<TEvent>;
  onSelectArtifactRef?: (ref: AgentUiArtifactRefView) => void;
  onSelectEvidenceRef?: (ref: AgentUiEvidenceRefView) => void;
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `state` | `AgentUiProjectionState` | 必需，唯一事实输入。 |
| `artifact` | `ReactNode` | 可选产品 artifact 区域。 |
| `emptyMessages` | `ReactNode` | 空消息 presentation。 |
| `labels` | `AgentUiProjectionViewLabels` | aria、标题、状态、按钮等 label callbacks。 |
| `onResolveAction` | `AgentRuntimeActionResolver` | 用户处理 action 的 callback。 |
| `onSelectArtifactRef` | callback | 用户选择 artifact ref 的 callback。 |
| `onSelectEvidenceRef` | callback | 用户选择 evidence ref 的 callback。 |

## DOM Contract

根元素带稳定状态属性：

```tsx
<section
  className="agent-ui-projection"
  data-runtime-status={state.runtime.status}
  data-hydration-status={state.hydration.status}
>
```

产品应用可以用这些属性接 design token，但不能据此修改 runtime truth。

## Example

```tsx
<AgentUiProjectionView
  state={projectionState}
  onResolveAction={(event, action) => {
    runtime.respondAction({
      actionId: event.actionId,
      decision: action.decision
    });
  }}
/>
```

## Layout

| Region | Contents |
| --- | --- |
| `.agent-ui-main` | `UIMessagePartsView`、`ProcessTimelineView` |
| `.agent-ui-sidecar` | summary、actions、tools、events、artifact/evidence refs、Team Workbench、artifact slot、execution graph |

## 禁止事项

- 不在组件里创建 runtime client。
- 不在点击后直接删除 action。
- 不从 `state.readModel.visibleEvents` 外的 payload 重算 status。
- 不把 `artifact` 子树作为 runtime facts owner。
- 不在组件里读取 artifact body 或 evidence pack；只通过 callback 交还宿主。
