---
title: Session Gateway
description: createAgentRuntimeClientFromSessionGateway 的 adapter 合同。
---

# Session Gateway

`createAgentRuntimeClientFromSessionGateway` 把产品侧已有 session gateway 包装成标准 `AgentRuntimeClient`。它用于 Lime 前端 App Server client 的闭包适配，避免 SDK adapter 依赖 `this` 绑定。

实现锚点：`packages/agent-runtime-client/src/sessionGateway.ts`。

## API

```ts
export function createAgentRuntimeClientFromSessionGateway(
  gateway: AgentRuntimeSessionGateway
): AgentRuntimeClient;
```

## Gateway Shape

```ts
export type AgentRuntimeSessionGateway = {
  startTurn: AgentRuntimeGatewayMethod<AgentSessionTurnStartParams, AgentSessionTurnStartResponse>;
  readSession: AgentRuntimeGatewayMethod<AgentSessionReadParams, AgentSessionReadResponse>;
  cancelTurn: AgentRuntimeGatewayMethod<AgentSessionTurnCancelParams, AgentSessionTurnCancelResponse>;
  respondAction: AgentRuntimeGatewayMethod<AgentSessionActionRespondParams, AgentSessionActionRespondResponse>;
  exportEvidence?: AgentRuntimeGatewayMethod<EvidenceExportParams, EvidenceExportResponse>;
  nextEvent?(timeoutMs?: number): Promise<AgentSessionEventNotification>;
  drainEvents?(limit?: number): Promise<JsonRpcMessage[]>;
};
```

| Gateway method | Client method |
| --- | --- |
| `startTurn` | `runtime.startTurn` |
| `readSession` | `runtime.readThread` |
| `cancelTurn` | `runtime.cancelTurn` |
| `respondAction` | `runtime.respondAction` |
| `exportEvidence` | `runtime.exportEvidence` |
| `nextEvent` / `drainEvents` | `runtime.nextEvent` |

## Event Routing

Adapter 只接受 JSON-RPC notification：

```ts
{
  jsonrpc: "2.0",
  method: "agentSession/event",
  params: { event }
}
```

非 `agentSession/event` message 会被忽略，不会进入 projection。

## Example

```ts
const runtime = createAgentRuntimeClientFromSessionGateway({
  startTurn: (params, options) => appServer.agentSession.turnStart(params, options),
  readSession: (params, options) => appServer.agentSession.read(params, options),
  cancelTurn: (params, options) => appServer.agentSession.turnCancel(params, options),
  respondAction: (params, options) => appServer.agentSession.actionRespond(params, options),
  exportEvidence: (params, options) => appServer.evidence.export(params, options),
  drainEvents: (limit) => appServer.drainEvents(limit)
});
```

## Failure Modes

| 场景 | 行为 |
| --- | --- |
| `exportEvidence` 未提供 | 调用时抛出明确错误。 |
| `nextEvent` 和 `drainEvents` 都未提供 | `nextEvent` 抛出 event subscription unavailable。 |
| `drainEvents` 没有返回 `agentSession/event` | 抛出 timeout-aware 错误。 |
| gateway method 抛错 | 原样传播 transport error。 |

## 验证

```bash
npm --prefix packages/agent-runtime-client run test
```

测试必须覆盖 lifecycle、event dispatch、nextEvent、drainEvents、optional exportEvidence fail closed 和 browser-safe 子路径。

