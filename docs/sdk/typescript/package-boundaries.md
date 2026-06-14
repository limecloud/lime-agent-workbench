---
title: Package boundaries
description: Lime TypeScript SDK 当前四包边界与依赖方向。
---

# Package boundaries

Lime 统一的是 AgentUI / AgentRuntime 标准，不是把所有能力塞进一个物理包。当前主仓真实四包分别承担 contracts、runtime transport、projection、React surfaces。

```text
@limecloud/agent-runtime-ui
  -> @limecloud/agent-runtime-projection
  -> @limecloud/agent-ui-contracts

@limecloud/agent-runtime-client
  -> app-server-client
  -> @limecloud/agent-ui-contracts
```

未来可以提供 `@limecloud/agent-ui` 作为 facade，但它只能 re-export UI 侧包，不能 re-export runtime client，避免产品应用无意中把 UI 包变成 transport owner。

## 包职责

| 包 | current owner | 不负责 |
| --- | --- | --- |
| `@limecloud/agent-ui-contracts` | TypeScript types、fixtures、validation、message/timeline/graph/projection contracts。 | React、transport、Provider、产品业务逻辑。 |
| `@limecloud/agent-runtime-client` | App Server JSON-RPC facade、session gateway、event subscription、read APIs、action response、evidence export。 | ProjectionState、React component、工具状态机。 |
| `@limecloud/agent-runtime-projection` | projector、fixture replay、App Server facts adapter、read model projection、message/timeline/graph derivation。 | DOM、React hooks、App Server JSON-RPC、Provider Store。 |
| `@limecloud/agent-runtime-ui` | React projection view、message parts、process timeline、execution graph、action required、SubagentsView。 | runtime truth、stream subscription、Provider key、DB 读取。 |

## 标准 surface

SDK 文档和包导出统一使用以下 surface 名称：

| Surface | Contract owner | Projection owner | React owner |
| --- | --- | --- | --- |
| `UIMessageParts` | `@limecloud/agent-ui-contracts` | `@limecloud/agent-runtime-projection` | `UIMessagePartsView` |
| `ProcessTimeline` | `@limecloud/agent-ui-contracts` | `@limecloud/agent-runtime-projection` | `ProcessTimelineView` |
| `ExecutionGraph` | `@limecloud/agent-ui-contracts` | `@limecloud/agent-runtime-projection` | `ExecutionGraphView` |
| `ActionRequired` | `@limecloud/agent-ui-contracts` | `state.actions` | `ActionRequiredList` |
| `ArtifactRef` | `@limecloud/agent-ui-contracts` | `state.artifacts` | Artifact lane / product callback |
| `EvidenceRef` | `@limecloud/agent-ui-contracts` | `state.evidence` | Evidence lane / product callback |
| `Subagents` | `AgentUiSubagentsModel` | `state.subagents` | `SubagentsView` |

产品应用可以组合这些 surface，但不能新增第二套标准事实源。Runtime client 只提供 runtime facts；projection 才生成 surface state；React 只渲染 projection state。旧 `TeamWorkbenchView` / `teamWorkbench` 只是历史命名，不再作为 current owner 或可用导出。

## 代码组织要求

```text
packages/
  agent-ui-contracts/
    src/
      runtime.ts
      projection.ts
      messages.ts
      timeline.ts
      graph.ts
      fixtures.ts
      validation.ts
  agent-runtime-client/
    src/
      index.ts
      sessionGateway.ts
  agent-runtime-projection/
    src/
      uiState.ts
      readModel.ts
      fixtureReplay.ts
      appServerFacts.ts
      normalization.ts
  agent-runtime-ui/
    src/
      projectionView.tsx
      messages.tsx
      processTimeline.tsx
      executionGraph.tsx
      runtimeFacts.tsx
      subagents.tsx
```

每个包内部继续按领域拆分，避免把 reducer、component、transport 写在一个文件里。`src/index.ts` 只做 barrel exports。

## 依赖禁止表

| 禁止依赖 | 原因 |
| --- | --- |
| `agent-ui-contracts -> react` | 合同层必须能被 App Server client、fixtures、Node test 使用。 |
| `agent-ui-contracts -> agent-runtime-client` | contract 不能依赖 transport。 |
| `agent-runtime-projection -> react-dom` | projection 必须可在 CLI、test、server side replay 运行。 |
| `agent-runtime-projection -> provider SDK` | projection 只消费 normalized facts。 |
| `agent-runtime-ui -> App Server DB` | React 组件不能绕过 runtime client 和 read models。 |
| `agent-runtime-client -> agent-runtime-projection` | client 不生成 UI 状态，避免 transport 绑定特定 UI。 |
| `agent-runtime-client -> mock fallback` | production transport 失败必须 fail closed。 |

## 从 Lime 现有包迁移

| Lime 现有路径 | 标准包 | 分类 | 退出条件 |
| --- | --- | --- | --- |
| `packages/agent-ui-contracts` | `@limecloud/agent-ui-contracts` | `current` | 继续补 schema、fixture、validation 和 version contract。 |
| `packages/agent-runtime-client` | `@limecloud/agent-runtime-client` | `current` | 完整覆盖 App Server runtime client facade，不生成 UI state。 |
| `packages/agent-runtime-projection` | `@limecloud/agent-runtime-projection` | `current` | App Server facts、fixture replay、projection selectors 都进入该包。 |
| `packages/agent-runtime-ui` | `@limecloud/agent-runtime-ui` | `current` | Message、Timeline、ExecutionGraph、ActionRequired、SubagentsView 都从该包复用。 |
| `packages/app-server-client` | runtime client dependency | `current dependency` | 不直接作为 AgentUI package 暴露给产品应用。 |
| 产品应用 local process component | `@limecloud/agent-runtime-ui` shared surfaces | `deprecated` | Shared ProcessTimeline / ExecutionGraph / SubagentsView 接入后删除。 |

## 版本策略

| 变更 | SemVer | 必须同步 |
| --- | --- | --- |
| RuntimeEvent 字段删除或语义改变 | major | fixtures、validation、projection tests、runtime-client tests、文档。 |
| 新增可选 event family | minor | fixture、validation docs、projection mapping。 |
| React surface props 改名 | major | component tests、product adoption docs。 |
| Runtime client error code 改名 | major | transport tests、UI blocked state mapping。 |
| Fixture 增补 | minor | conformance docs。 |

## 最小导出面

```ts
// @limecloud/agent-ui-contracts
export type {
  AgentRuntimeExecutionEvent,
  AgentRuntimeReadModel,
  AgentUiProjectionState,
  UIMessagePart,
  ProcessTimelineEntry,
  ExecutionGraphNode,
  AgentUiSubagentsModel
};
export {
  getAgentUiFixture,
  validateRuntimeEvent,
  validateAgentUiFixture
};

// @limecloud/agent-runtime-client
export { createAgentRuntimeClient };
export { createAgentRuntimeClientFromSessionGateway };
export type { AgentRuntimeClient, AgentRuntimeSessionGateway };

// @limecloud/agent-runtime-projection
export { createAgentUiProjector, projectAgentUiState };
export { replayAgentUiFixture, replayAppServerFacts };

// @limecloud/agent-runtime-ui
export { AgentUiProjectionView };
export {
  UIMessagePartsView,
  ProcessTimelineView,
  ExecutionGraphView,
  ActionRequiredList,
  SubagentsView
};
```

## Future facade 规则

如果将来新增 `@limecloud/agent-ui`，只能提供：

```ts
export * from "@limecloud/agent-ui-contracts";
export * from "@limecloud/agent-runtime-projection";
export * from "@limecloud/agent-runtime-ui";
```

它不能导出：

- `createAgentRuntimeClient`
- Host bridge transport
- Provider setup APIs
- App Server JSON-RPC methods

如果产品应用需要 runtime client，必须显式依赖 `@limecloud/agent-runtime-client`，让 transport owner 清晰可见。
