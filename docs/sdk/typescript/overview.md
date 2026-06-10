---
title: TypeScript SDK 总览
description: Lime TypeScript SDK 的包线、事实源与落地顺序。
---

# TypeScript SDK 总览

Lime TypeScript SDK 是 AgentUI 与 AgentRuntime 之间的标准边界。它借鉴成熟 SDK 文档的组织方式，但事实源必须来自 Lime 自己的 App Server、RuntimeCore、ExecutionBackend 和现有 package seed。

当前标准主链：

```text
App Server / RuntimeCore / ExecutionBackend
  -> RuntimeEvent / ThreadReadModel / TaskSnapshot / EvidencePack
  -> @limecloud/agent-ui-contracts
  -> @limecloud/agent-runtime-projection
  -> @limecloud/agent-runtime-ui
  -> Product Apps / Content Studio / Agent Apps
```

SDK 不拥有 Provider key，不绕过 App Server，不把产品应用里的本地过程组件升级为标准。

## 包规划

| 包 | 分类 | 目标 |
| --- | --- | --- |
| `@limecloud/agent-ui-contracts` | `current` | Runtime event、read model、projection state、message parts、timeline、graph、TeamWorkbench、fixtures、validation。 |
| `@limecloud/agent-runtime-client` | `current` | App Server JSON-RPC client facade、session gateway adapter、event subscription、action response、evidence export。 |
| `@limecloud/agent-runtime-projection` | `current` | 把 RuntimeEvent / App Server facts 投影为 `UIMessageParts`、`ProcessTimeline`、`ExecutionGraph`、`ActionRequired`、`ArtifactRef`、`EvidenceRef`、`TeamWorkbench`。 |
| `@limecloud/agent-runtime-ui` | `current` | React projection view、message parts、process timeline、execution graph、action required、team workbench、runtime facts surfaces。 |

这四个包是当前物理实现和文档事实源。后续如果需要提供 `@limecloud/agent-ui` facade，只允许 re-export UI 侧能力，不导出 runtime transport。

## 章节

| 章节 | 用途 |
| --- | --- |
| [`@limecloud/agent-ui-contracts`](/sdk/typescript/contracts/overview) | 类型、事件、fixture、validation 的 SDK reference。 |
| [`@limecloud/agent-runtime-client`](/sdk/typescript/runtime-client/overview) | Runtime client、session gateway、事件订阅、错误模型。 |
| [`@limecloud/agent-runtime-projection`](/sdk/typescript/projection/overview) | Projector、App Server facts adapter、selectors、fixture replay。 |
| [`@limecloud/agent-runtime-ui`](/sdk/typescript/runtime-ui/overview) | React surfaces、projection view、消息、过程、图、审批、团队工作台。 |
| [Runtime Schemas](/sdk/schemas/runtime-event) | JSON schema / 跨语言序列化锚点。 |
| [Conformance](/sdk/typescript/conformance) | 包级验收和 fixture replay 规范。 |

## 为什么不统一成一个物理包

统一的是标准和契约，不是把 transport、projection、React 组件塞进一个包。

| 拆分点 | 原因 |
| --- | --- |
| `contracts` 独立 | App Server client、projection、fixture、conformance tests 都要共享，不能依赖 React。 |
| `runtime-client` 独立 | transport owner 必须显式可见，产品应用不能通过 UI 包隐式拿到 JSON-RPC。 |
| `projection` 独立 | reducer 和 replay 要能在 Node / CLI / tests 中运行，不依赖 DOM。 |
| `runtime-ui` 独立 | React 只负责 presentation 和 callbacks，不拥有 runtime truth。 |

## API 分层

| 层 | API 形态 | 单测重点 |
| --- | --- | --- |
| Contracts | TypeScript types、fixtures、validation helpers。 | schema validation、scope id、secret redaction、大 payload ref。 |
| Runtime client | `createAgentRuntimeClient`、`createAgentRuntimeClientFromSessionGateway`、event subscription。 | transport error、mock-free production、action response、evidence export。 |
| Projection | `createAgentUiProjector`、`projectAgentUiState`、`replayAgentUiFixture`、`replayAppServerFacts`。 | replay 幂等、sequence repair、final reconciliation、App Server facts normalization。 |
| Runtime UI | `AgentUiProjectionView`、`UIMessagePartsView`、`ProcessTimelineView`、`ExecutionGraphView`、`ActionRequiredList`、`TeamWorkbenchView`。 | 渲染、交互接线、长文案布局、无 runtime 写入。 |

## 最小落地顺序

1. 先把 contracts 和 fixtures 固定下来。
2. Runtime client 独立验证 App Server JSON-RPC / Host bridge。
3. 用 fixture replay 和 App Server facts adapter 驱动 projection。
4. React surfaces 只消费 projection view model。
5. 产品应用最后接入，不把本地 process component 继续扩展成事实源。

## 发布与版本策略

| 包 | SemVer 风险 | 破坏性变更示例 |
| --- | --- | --- |
| `agent-ui-contracts` | 最高 | RuntimeEvent 字段语义变化、ProjectionState 删除字段、schema 不兼容。 |
| `agent-runtime-client` | 高 | JSON-RPC 方法、错误 code、cursor/repair 语义变化。 |
| `agent-runtime-projection` | 高 | projector 输出结构变化、selector 语义变化、hydration 行为变化。 |
| `agent-runtime-ui` | 中 | component props、label callback、CSS token contract 变化。 |

任何 contracts 变更必须同步 fixtures、validation、projection tests、runtime client tests 和文档。React-only 视觉调整不能修改 contracts。

## Definition of Done

一个 SDK 切片只有同时满足以下条件，才能声明进入 `current`：

1. 有 TypeScript 类型和 schema。
2. 有至少一个 fixture replay。
3. Projection reducer 可在 React 外运行。
4. React surface 只依赖 projection state 和 command callbacks。
5. Runtime client 不含 Provider Key 读取逻辑。
6. 文档写清 current / compat / deprecated / dead。
