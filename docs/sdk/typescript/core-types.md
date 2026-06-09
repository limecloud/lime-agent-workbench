---
title: Core types
description: TypeScript core types 的最小集合。
---

# Core types

核心类型由 `@limecloud/agent-ui-contracts` 提供，应与 RuntimeEvent、ThreadReadModel、TaskSnapshot、ProjectionState 对齐。它只描述合同，不包含业务执行逻辑、React 组件或 App Server transport。

```ts
export interface RuntimeEvent {
  schemaVersion: string;
  runtimeId: string;
  sessionId: string;
  threadId?: string;
  turnId?: string;
  taskId?: string;
  runId?: string;
  attemptId?: string;
  stepId?: string;
  toolCallId?: string;
  actionId?: string;
  artifactId?: string;
  evidenceId?: string;
  eventId: string;
  sequence: number;
  timestamp: string;
  type: string;
  payload: unknown;
  refs?: RuntimeRef[];
}
```

## Runtime refs

```ts
export interface RuntimeRef {
  kind: "output" | "artifact" | "evidence" | "diagnostic" | "trace" | "raw";
  id: string;
  owner?: string;
  uri?: string;
  summary?: string;
}
```

## Read models

```ts
export interface ThreadReadModel {
  schemaVersion: string;
  runtimeId: string;
  sessionId: string;
  threadId: string;
  status: "idle" | "queued" | "running" | "waiting" | "completed" | "failed" | "stale";
  activeTurnId?: string;
  pendingActions: ActionRequiredView[];
  toolCalls: ToolCallView[];
  incidents: DiagnosticView[];
  historyCursor?: string;
  eventCursor?: string;
}

export interface TaskSnapshot {
  taskId: string;
  objective: string;
  status: "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled";
  parentTaskId?: string;
  dependencies?: string[];
  currentRunId?: string;
  attemptIds?: string[];
  artifactRefs?: RuntimeRef[];
  evidenceRefs?: RuntimeRef[];
}
```

## Projection types

```ts
export interface ProjectionState {
  runtime: RuntimeStatusView;
  messages: UIMessagePart[];
  timeline: ProcessTimelineEntry[];
  graph: ExecutionGraphNode[];
  tools: ToolCallView[];
  actions: ActionRequiredView[];
  artifacts: ArtifactRefView[];
  evidence: EvidenceRefView[];
  diagnostics: DiagnosticView[];
  hydration: HydrationState;
}
```

## 命名规则

- 类型名保留领域语义，不用具体组件名替代协议名。
- `View` 后缀表示 projection view model，不表示 runtime truth。
- `Ref` 表示 owner service 的稳定引用，不表示完整内容。
- `Snapshot` 表示可水合读模型，不表示 event stream 的替代品。
