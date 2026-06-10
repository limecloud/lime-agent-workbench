---
title: Process Timeline
description: ProcessTimelineView 的过程投影 surface。
---

# Process Timeline

`ProcessTimelineView` 渲染 `ProcessTimelineEntry[]`。这是 Lime 的标准过程表面，不是组件树协议，也不是本地日志列表。

实现锚点：`packages/agent-runtime-ui/src/processTimeline.tsx`。

## Props

```ts
export interface ProcessTimelineViewProps {
  entries?: readonly ProcessTimelineEntry[];
  empty?: ReactNode;
  ariaLabel?: string;
  entryTitle?: (entry: ProcessTimelineEntry) => ReactNode;
  entryMeta?: (entry: ProcessTimelineEntry) => ReactNode;
}
```

## Entry Shape

```ts
export interface ProcessTimelineEntry {
  entryId: string;
  sequence?: number;
  kind: ProcessTimelineEntryKind;
  phase?: AgentRuntimePhase;
  owner?: AgentRuntimeFactOwner;
  status: AgentRuntimeExecutionEventStatus;
  title: string;
  detail?: string;
  refs: string[];
  sourceEventId: string;
  createdAt: string;
  completedAt?: string;
}
```

## Kinds

| Kind | Source |
| --- | --- |
| `status` | lifecycle / context / snapshot。 |
| `reasoning` | reasoning events。 |
| `tool` | tool events。 |
| `action` | action / permission events。 |
| `artifact` | artifact events。 |
| `evidence` | evidence / review events。 |
| `task` | task / subagent scoped events。 |
| `diagnostic` | failed / blocked / runtime error。 |
| `message` | text / model events。 |

## Example

```tsx
<ProcessTimelineView
  entries={state.timeline}
  entryMeta={(entry) => `${entry.kind} · ${entry.status}`}
/>
```

## Boundary

- Timeline entry 必须有 `sourceEventId`。
- Timeline 不决定 action 是否完成。
- Timeline 不展示 raw Provider response。
- Timeline 不替代 Evidence Pack。

