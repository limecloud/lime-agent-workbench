---
title: "@limecloud/agent-runtime-client"
description: Lime AgentRuntime client SDK Reference 总览。
---

# @limecloud/agent-runtime-client

`@limecloud/agent-runtime-client` 是 TypeScript 侧访问 Lime App Server Agent Runtime 的 current client facade。它封装 JSON-RPC / Host bridge / session gateway 差异，但不生成 UI projection，不订阅 Provider，不持有 Provider key。

实现锚点：`packages/agent-runtime-client/`。

## 安装

```bash
npm install @limecloud/agent-runtime-client
```

## 导出面

```ts
export {
  createAgentRuntimeClient,
  AppServerAgentRuntimeClient
} from "@limecloud/agent-runtime-client";

export {
  createAgentRuntimeClientFromSessionGateway
} from "@limecloud/agent-runtime-client/sessionGateway";
```

主入口 re-export `app-server-client` 的 current App Server client types；`./sessionGateway` 提供 browser-safe adapter。

## Responsibilities

| 能力 | API |
| --- | --- |
| 提交 turn | `startTurn(params, options)` |
| 读取 read model | `readThread(params, options)` |
| 取消 turn | `cancelTurn(params, options)` |
| 响应 human action | `respondAction(params, options)` |
| 导出 evidence | `exportEvidence(params, options)` |
| 订阅 events | `subscribeEvents(listener)`、`nextEvent(timeoutMs)` |

## Runtime Pipeline

v2.4 的 runtime client 协议演进层按 `normalize -> adapter -> middleware -> sequence verifier -> dispatch` 收口。详见 [Runtime Middleware / Adapter](/sdk/typescript/runtime-client/middleware-adapter)。

## Boundary

| 允许 | 禁止 |
| --- | --- |
| App Server JSON-RPC / Host bridge adapter。 | 直接调用 Provider SDK。 |
| 返回 RuntimeEvent / ReadModel / Evidence response。 | 返回 React props 或 ProjectionState。 |
| transport error fail closed。 | production transport 失败后切 fixture/mock。 |
| session gateway adapter。 | 在 UI component 中创建 runtime truth。 |

## Example

```ts
import { createAgentRuntimeClientFromSessionGateway } from "@limecloud/agent-runtime-client/sessionGateway";

const runtime = createAgentRuntimeClientFromSessionGateway(gateway);
const turn = await runtime.startTurn({
  sessionId: "session_1",
  input: { text: "分析这份文档" }
});

const thread = await runtime.readThread({ sessionId: turn.result.sessionId });
```

## 验证

```bash
npm --prefix packages/agent-runtime-client run test
```

如果修改 JSON-RPC method、bridge 或 mock 边界：

```bash
npm run test:contracts
```
