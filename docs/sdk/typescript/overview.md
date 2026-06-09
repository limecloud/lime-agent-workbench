---
title: TypeScript SDK 总览
description: Lime TypeScript SDK 的规划边界。
---

# TypeScript SDK 总览

TypeScript SDK 是产品应用、AgentUI 和 Runtime 集成消费 Lime App Server 的标准 TypeScript 包线，不是第二套 runtime，也不是把外部 SDK 直接套进 Lime。

## 包规划

| 包 | 分类 | 目标 |
| --- | --- | --- |
| `@limecloud/agent-ui-contracts` | `current` | RuntimeEvent、ThreadReadModel、TaskSnapshot、ProjectionState、fixtures、schemas。 |
| `@limecloud/agent-ui-projection` | `current` | 把 RuntimeEvent / ReadModel 投影为 `UIMessageParts`、`ProcessTimeline`、`ExecutionGraph`、ToolGroup、ActionRequired。 |
| `@limecloud/agent-ui-react` | `current` | React hooks、共享 AgentUI surfaces、产品应用可复用的过程/消息/工具/审批/证据组件。 |
| `@limecloud/agent-runtime-client` | `current` | 调 App Server JSON-RPC、订阅 events、读取 read models、提交 action、导出 evidence。 |
| `@limecloud/agent-ui` | `optional facade` | 只 re-export contracts/projection/react；不承载真实实现，不包含 runtime transport。 |

## 为什么不统一成一个物理包

统一的是标准和契约，不是发布形态。

- `contracts` 必须能被 App Server client、projection reducer、fixture tools、conformance tests 共同引用。
- `projection` 必须可在 React 之外运行，方便 replay、CLI、单元测试和服务端校验。
- `react` 只负责视图和 hooks，不拥有 runtime truth。
- `runtime-client` 是 transport/runtime 边界，不应被 UI facade 隐式带入。

## Lime 现有实现收敛路径

| 现有实现 | 目标包 | 迁移规则 |
| --- | --- | --- |
| `packages/agent-runtime-projection` | `@limecloud/agent-ui-projection` | 保留 reducer/selector 事实，统一命名和输入输出类型。 |
| `packages/agent-runtime-ui` | `@limecloud/agent-ui-react` | 只保留 React surfaces 和 hooks，不复制 projection 状态机。 |
| `packages/app-server-client` | `@limecloud/agent-runtime-client` | 作为 App Server JSON-RPC current client 收敛，不放进 UI 包。 |
| `packages/agent-app-runtime/projection` | `@limecloud/agent-ui-projection` | 合并投影 API，避免第二套 projection。 |

当前仓库先定义文档边界。代码包以后必须从现有 Lime App Server client 和 AgentUI 实现收敛，不直接套外部 SDK。

## 发布与版本策略

| 包 | SemVer 风险 | 破坏性变更示例 |
| --- | --- | --- |
| `agent-ui-contracts` | 最高 | RuntimeEvent 字段语义变化、ProjectionState 删除字段、schema 不兼容。 |
| `agent-ui-projection` | 高 | reducer 输出结构变化、selector 语义变化、hydration 行为变化。 |
| `agent-ui-react` | 中 | hook signature、组件 props、CSS token contract 变化。 |
| `agent-runtime-client` | 高 | JSON-RPC 方法、错误 code、cursor/repair 语义变化。 |

任何 contracts 变更必须同步 schema、fixtures、projection tests、runtime client tests 和文档。React-only 视觉调整不能修改 contracts。

## Definition of Done

一个 SDK 切片只有同时满足以下条件，才能声明进入 `current`：

1. 有 TypeScript 类型和 schema。
2. 有至少一个 fixture replay。
3. Projection reducer 可在 React 外运行。
4. React surface 只依赖 projection state 和 command callbacks。
5. Runtime client 不含 Provider Key 读取逻辑。
6. 文档写清 current / compat / deprecated / dead。
