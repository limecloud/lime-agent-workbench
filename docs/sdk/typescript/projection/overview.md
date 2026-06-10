---
title: "@limecloud/agent-runtime-projection"
description: Lime AgentRuntime projection SDK Reference 总览。
---

# @limecloud/agent-runtime-projection

`@limecloud/agent-runtime-projection` 把 runtime facts 投影为 AgentUI 可渲染状态。它是 headless 包，可以在 Node、fixture replay、CLI、测试和 React 之外运行。

实现锚点：`packages/agent-runtime-projection/`。

## 安装

```bash
npm install @limecloud/agent-runtime-projection
```

## 导出面

```ts
export {
  createAgentUiProjector,
  projectAgentUiState,
  replayAgentUiFixture,
  replayAppServerFacts,
  projectAppServerEventsToExecutionEvents
} from "@limecloud/agent-runtime-projection";
```

## Responsibilities

| 能力 | API |
| --- | --- |
| Event -> ProjectionState | `projectAgentUiState`、`createAgentUiProjector` |
| Fixture replay | `replayAgentUiFixture` |
| App Server facts adapter | `replayAppServerFacts`、`projectAppServer*ToExecutionEvents` |
| Read model projection | `projectAgentRuntimeReadModel` |
| Event normalization | `normalization.ts` helpers |

## Boundary

| 允许 | 禁止 |
| --- | --- |
| 消费 normalized facts。 | 发起 Provider 请求。 |
| 合并 streaming message parts。 | 从 assistant prose 解析 tool 状态。 |
| 生成 timeline / graph / action / evidence projection。 | 渲染 React DOM。 |
| 对 read model 做 hydration。 | 持有 App Server transport。 |

## Example

```ts
import {
  createAgentUiProjector
} from "@limecloud/agent-runtime-projection";

const projector = createAgentUiProjector();

for await (const event of runtimeEvents) {
  projector.apply(event);
}

const state = projector.getState();
```

## 验证

```bash
npm --prefix packages/agent-runtime-projection run test
```

如果 event contracts 变化：

```bash
npm --prefix packages/agent-ui-contracts run test
```

