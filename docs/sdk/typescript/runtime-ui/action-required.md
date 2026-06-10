---
title: Action Required
description: ActionRequiredList 的受控交互合同。
---

# Action Required

`ActionRequiredList` 渲染 projection 中仍需要用户处理的 action。它是受控组件：点击按钮只调用 callback，不能本地把 action 标记为 resolved。

实现锚点：`packages/agent-runtime-ui/src/runtimeFacts.tsx`。

## Props

```ts
export interface ActionRequiredListProps<TEvent = AgentRuntimeExecutionEvent> {
  actions?: readonly AgentRuntimeEventProjection<TEvent>[];
  empty?: ReactNode;
  onResolveAction?: AgentRuntimeActionResolver<TEvent>;
  ariaLabel?: string;
  actionButtonLabel?: (action: AgentRuntimeActionProjection) => ReactNode;
  eventStatusLabel?: (event: AgentRuntimeEventProjection<TEvent>) => ReactNode;
}
```

## Action Resolver

```ts
export type AgentRuntimeActionResolver<TEvent = AgentRuntimeExecutionEvent> = (
  event: TEvent,
  action: AgentRuntimeActionProjection
) => void;
```

## Example

```tsx
<ActionRequiredList
  actions={state.actions}
  onResolveAction={(event, action) => {
    runtime.respondAction({
      actionId: event.actionId,
      decision: action.decision
    });
  }}
/>
```

## Runtime Flow

1. Runtime emits `action.required`.
2. Projection adds blocked action to `state.actions`.
3. React renders action button.
4. User clicks button; React calls `onResolveAction`.
5. Product app calls `runtime.respondAction`.
6. Runtime emits `action.resolved`.
7. Projection removes or completes action.

## 禁止事项

- 不在 click handler 内直接 mutate projection state。
- 不把 pending UI 当 resolved fact。
- 不把 action label 写死在 package 内；产品 shell 注入 labels。
- 不从 assistant text 识别“我同意/拒绝”来完成 action。

