---
title: Execution Graph
description: ExecutionGraphView 的节点合同和 subagent 表达。
---

# Execution Graph

`ExecutionGraphView` 渲染 `ExecutionGraphNode[]`，用于表达 turn、run、task、subagent、tool、action 等结构关系。

实现锚点：`packages/agent-runtime-ui/src/executionGraph.tsx`。

## Props

```ts
export interface ExecutionGraphViewProps {
  nodes?: readonly ExecutionGraphNode[];
  empty?: ReactNode;
  ariaLabel?: string;
  nodeTitle?: (node: ExecutionGraphNode) => ReactNode;
  nodeMeta?: (node: ExecutionGraphNode) => ReactNode;
}
```

## Node Shape

```ts
export interface ExecutionGraphNode {
  nodeId: string;
  parentId?: string;
  nodeType: ExecutionGraphNodeType;
  status: AgentRuntimeExecutionEventStatus;
  title: string;
  refs: string[];
  sourceEventIds: string[];
  createdAt?: string;
  completedAt?: string;
}
```

## Node Types

| Type | Scope |
| --- | --- |
| `turn` | `turnId` |
| `run` | `runId` |
| `task` | `taskId` |
| `subagent` | `subagentId` |
| `job` | external job id |
| `attempt` | `attemptId` |
| `step` | `stepId` |
| `tool` | `toolCallId` |
| `action` | `actionId` |

## Example

```tsx
<ExecutionGraphView
  nodes={state.graph}
  nodeMeta={(node) => `${node.nodeType} · ${node.status}`}
/>
```

## Subagent Rules

- Subagent node 必须来自 runtime fact 的 `subagentId`。
- Parent edge 应来自 `taskId`、`runId` 或 explicit parent payload。
- 缺少 lineage 时显示 degraded diagnostics，不伪造 teammate。
- Review / handoff 通过 evidence refs 或 action refs 关联，不写在 React local state。

