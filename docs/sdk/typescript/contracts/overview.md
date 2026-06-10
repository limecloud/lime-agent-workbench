---
title: "@limecloud/agent-ui-contracts"
description: Lime AgentUI 合同包的 SDK Reference 总览。
---

# @limecloud/agent-ui-contracts

`@limecloud/agent-ui-contracts` 是 Lime AgentUI SDK 的最低层。它只定义跨包共享合同：runtime facts、read model、projection state、message parts、timeline、execution graph、fixtures 和 validation。

它不包含 React，不连接 App Server，不读取 Provider，也不拥有产品应用业务状态。

## 安装

```bash
npm install @limecloud/agent-ui-contracts
```

当前主仓实现路径：

```text
packages/agent-ui-contracts/
  src/runtime.ts
  src/projection.ts
  src/messages.ts
  src/timeline.ts
  src/graph.ts
  src/fixtures.ts
  src/validation.ts
```

## 导出面

```ts
export type {
  AgentRuntimeExecutionEvent,
  AgentRuntimeReadModel,
  AgentRuntimeEventProjection,
  AgentUiProjectionState,
  UIMessagePart,
  ProcessTimelineEntry,
  ExecutionGraphNode,
  AgentUiFixture
} from "@limecloud/agent-ui-contracts";

export {
  agentUiConformanceFixtures,
  getAgentUiFixture,
  validateRuntimeEvent,
  validateThreadReadModel,
  validateProjectionState,
  validateAgentUiFixture
} from "@limecloud/agent-ui-contracts";
```

## 模块

| 文件 | 负责 | 不负责 |
| --- | --- | --- |
| `runtime.ts` | `AgentRuntimeExecutionEvent`、read model、event projection。 | 事件订阅、JSON-RPC、Provider。 |
| `projection.ts` | `AgentUiProjectionState`、projector interface。 | reducer 实现、React。 |
| `messages.ts` | `UIMessagePart` 与 message parts。 | Markdown 渲染、富文本编辑器。 |
| `timeline.ts` | `ProcessTimelineEntry`。 | 产品本地日志面板。 |
| `graph.ts` | `ExecutionGraphNode`。 | 图布局算法和可视化框架。 |
| `fixtures.ts` | conformance fixtures。 | 生产 mock fallback。 |
| `validation.ts` | schema、scope、secret、大 payload 检查。 | 自动修复 runtime facts。 |

## 最小示例

```ts
import {
  getAgentUiFixture,
  validateRuntimeEvent
} from "@limecloud/agent-ui-contracts";

const fixture = getAgentUiFixture("tool-success");
for (const event of fixture.events) {
  validateRuntimeEvent(event);
}
```

## 边界规则

| 规则 | 原因 |
| --- | --- |
| contracts 不依赖 React | App Server client、Node replay、CI validation 都要能使用。 |
| contracts 不导出 transport | runtime transport 属于 `@limecloud/agent-runtime-client`。 |
| contracts 不保存 Provider 原始大 payload | 大输出必须走 refs，避免 UI state 膨胀。 |
| contracts 不翻译稳定 enum | enum 是协议事实，presentation 文案由 UI 层注入。 |

## 验证

```bash
npm --prefix packages/agent-ui-contracts run test
```

如果修改 event family 或 validation rule，还要同步运行 projection tests：

```bash
npm --prefix packages/agent-runtime-projection run test
```

