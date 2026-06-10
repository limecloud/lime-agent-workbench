---
title: Package boundaries
description: Lime TypeScript SDK 四包边界与依赖方向。
---

# Package boundaries

Lime 统一的是 AgentUI / AgentRuntime 标准，不是把所有能力塞进一个物理包。四个 current 包分别承担 contracts、projection、React surfaces、runtime transport。

```text
@limecloud/agent-ui-react
  -> @limecloud/agent-ui-projection
  -> @limecloud/agent-ui-contracts

@limecloud/agent-runtime-client
  -> @limecloud/agent-ui-contracts

@limecloud/agent-ui
  -> @limecloud/agent-ui-react
  -> @limecloud/agent-ui-projection
  -> @limecloud/agent-ui-contracts
```

`@limecloud/agent-ui` 只是可选 facade。它不能 re-export runtime client，避免产品应用无意中把 UI 包变成 transport owner。

## 包职责

| 包 | current owner | 不负责 |
| --- | --- | --- |
| `@limecloud/agent-ui-contracts` | TypeScript types、JSON schemas、fixtures、version constants。 | React、transport、Provider、产品业务逻辑。 |
| `@limecloud/agent-ui-projection` | reducer、selectors、hydration、reconciliation、fixture replay。 | DOM、React hooks、App Server JSON-RPC、Provider Store。 |
| `@limecloud/agent-ui-react` | hooks、shared surfaces、callbacks contract、i18n keys、design tokens。 | runtime truth、stream subscription、Provider key、DB 读取。 |
| `@limecloud/agent-runtime-client` | Host bridge、JSON-RPC、event subscription、read APIs、action response、evidence export。 | ProjectionState、React component、工具状态机。 |

## 代码组织建议

```text
packages/
  agent-ui-contracts/
    src/
      events/
      read-models/
      projection/
      schemas/
      fixtures/
  agent-ui-projection/
    src/
      reducers/
      selectors/
      hydration/
      replay/
  agent-ui-react/
    src/
      hooks/
      surfaces/
      callbacks/
      i18n/
  agent-runtime-client/
    src/
      transports/
      json-rpc/
      subscriptions/
      errors/
```

每个包内部继续按领域拆分，避免把 reducer、component、transport 写在一个文件里。

## 依赖禁止表

| 禁止依赖 | 原因 |
| --- | --- |
| `agent-ui-contracts -> react` | 合同层必须能被 App Server client、fixtures、Node test 使用。 |
| `agent-ui-contracts -> agent-runtime-client` | contract 不能依赖 transport。 |
| `agent-ui-projection -> react-dom` | projection 必须可在 CLI、test、server side replay 运行。 |
| `agent-ui-projection -> provider SDK` | projection 只消费 normalized facts。 |
| `agent-ui-react -> App Server DB` | React 组件不能绕过 runtime client 和 read models。 |
| `agent-runtime-client -> agent-ui-projection` | client 不生成 UI 状态，避免 transport 绑定特定 UI。 |
| `agent-runtime-client -> mock fallback` | production transport 失败必须 fail closed。 |

## 从 Lime 现有包迁移

| Lime 现有路径 | 目标包 | 分类 | 退出条件 |
| --- | --- | --- | --- |
| `packages/app-server-client` | `@limecloud/agent-runtime-client` | `current seed` | JSON-RPC、Host bridge、事件订阅、错误模型统一。 |
| `packages/agent-runtime-projection` | `@limecloud/agent-ui-projection` | `current seed` | reducer/selectors/hydration 命名与 contracts 对齐。 |
| `packages/agent-runtime-ui` | `@limecloud/agent-ui-react` | `current seed` | React surfaces 只消费 ProjectionState。 |
| `packages/agent-app-runtime/projection` | `@limecloud/agent-ui-projection` adapter | `compat` | Agent App task events 全部桥接到标准 projection 后退出独立 owner。 |
| 产品应用 local process component | `@limecloud/agent-ui-react` shared surfaces | `deprecated` | Shared ProcessTimeline / ExecutionGraph 接入后删除。 |

## 版本策略

| 变更 | SemVer | 必须同步 |
| --- | --- | --- |
| RuntimeEvent 字段删除或语义改变 | major | schema、fixtures、projection tests、runtime-client tests、文档。 |
| 新增可选 event family | minor | schema、fixture、selector docs。 |
| React 视觉或 token 调整 | patch/minor | component tests、design token docs。 |
| Runtime client error code 改名 | major | transport tests、UI blocked state mapping。 |
| Fixture 增补 | minor | conformance docs。 |

## 最小导出面

```ts
// @limecloud/agent-ui-contracts
export type {
  RuntimeEvent,
  ThreadReadModel,
  TaskSnapshot,
  ProjectionState,
  RuntimeRef
};
export { runtimeEventSchema, projectionStateSchema };

// @limecloud/agent-ui-projection
export { createAgentUiProjector };
export {
  selectMessageParts,
  selectProcessTimeline,
  selectExecutionGraph,
  selectActionRequired
};

// @limecloud/agent-ui-react
export { AgentRunProvider, useAgentRunProjection };
export {
  MessagePartsSurface,
  ProcessTimelineSurface,
  ExecutionGraphSurface,
  ActionRequiredSurface
};

// @limecloud/agent-runtime-client
export { createAgentRuntimeClient };
export type { AgentRuntimeClient, AgentRuntimeTransport };
```

## Facade 规则

`@limecloud/agent-ui` 只能提供：

```ts
export * from "@limecloud/agent-ui-contracts";
export * from "@limecloud/agent-ui-projection";
export * from "@limecloud/agent-ui-react";
```

它不能导出：

- `createAgentRuntimeClient`
- Host bridge transport
- Provider setup APIs
- App Server JSON-RPC methods

如果产品应用需要 runtime client，必须显式依赖 `@limecloud/agent-runtime-client`，让 transport owner 清晰可见。

