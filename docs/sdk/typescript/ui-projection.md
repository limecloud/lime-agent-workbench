---
title: UI 投影
description: TypeScript UI 投影 helper 的边界。
---

# UI 投影

UI 投影 helper 由 `@limecloud/agent-ui-projection` 提供，把 RuntimeEvent / ReadModel 转为可渲染 ProjectionState。它必须能在 React 外运行，便于 fixture replay、CLI 调试和 reducer 单测。

```ts
const state = projector.apply(event, previousState);
```

它只能维护 投影状态 和 local UI state，不能写 runtime truth。

## Projector API

```ts
export interface AgentUiProjector {
  getState(): ProjectionState;
  hydrate(readModel: ThreadReadModel, options?: HydrateOptions): ProjectionState;
  apply(event: RuntimeEvent): ProjectionState;
  repair(input: ProjectionRepairInput): ProjectionState;
  reset(scope: ProjectionScope): ProjectionState;
}
```

## Selectors

| Selector | 用途 |
| --- | --- |
| `selectRuntimeStatus` | 顶部状态、provider readiness、blocked/stale。 |
| `selectMessageParts` | Conversation surface。 |
| `selectProcessTimeline` | active/archived timeline。 |
| `selectExecutionGraph` | task/subagent/job/attempt/dependency。 |
| `selectToolGroup` | 工具调用列表和详情。 |
| `selectActionRequired` | 当前需要用户处理的 action。 |
| `selectArtifactRefs` | artifact lane / workspace。 |
| `selectEvidenceRefs` | evidence/replay/review lane。 |
| `selectDiagnostics` | warning/error/repair 状态。 |

## Reducer invariant

1. 同一个 `eventId` 重放多次，ProjectionState 不变。
2. 同一 `messageId/partId` 的 final text 不重复追加。
3. 缺少 id 的事实进入 diagnostics/degraded，不升级为 completed。
4. ProjectionState 可由 read model + events 重建。
5. Local UI state 不出现在 RuntimeEvent payload。

## 文件拆分建议

```text
src/
  projector.ts
  reducers/
    messages.ts
    timeline.ts
    graph.ts
    tools.ts
    actions.ts
    artifacts.ts
    evidence.ts
    diagnostics.ts
  selectors/
  fixtures/
  __tests__/
```

复杂逻辑先落 reducer/selectors 单测，React component test 只测接线和关键渲染。
