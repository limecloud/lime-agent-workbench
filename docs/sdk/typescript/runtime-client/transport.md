---
title: Transport Contract
description: AgentRuntimeClient 的 Host bridge、App Server JSON-RPC 与事件传输边界。
---

# Transport Contract

`@limecloud/agent-runtime-client` 只拥有 transport facade：App Server JSON-RPC、Host bridge adapter、session gateway adapter、event subscription、read/action/evidence facade。它不生成 projection state，不包含 React，不读取 Provider key。

实现锚点：`packages/agent-runtime-client/src/index.ts`、`packages/agent-runtime-client/src/sessionGateway.ts`。

## 标准数据流

```text
Product App
  -> AgentRuntimeClient
  -> Host bridge / App Server JSON-RPC
  -> agentSession/turn/start
  -> agentSession/event notification
  -> readThread / evidence/export
  -> projection package
  -> runtime-ui package
```

## Transport 类型

| Transport | Current role | Rule |
| --- | --- | --- |
| App Server JSON-RPC client | current | 标准 runtime facade，返回 typed response。 |
| Host bridge session gateway | current | Renderer 安全适配；不泄露 Provider key。 |
| `nextEvent` / `drainEvents` | current for tests/bridge | 只消费 `agentSession/event` notification。 |
| Fixture replay | test-only | 不进入 production fallback。 |
| SSE / protobuf / Accept negotiation | future gateway candidate | 只允许作为外部 HTTP gateway compatibility 层评估；不是 Lime 本体 current transport。 |
| Direct Provider SDK | dead | 产品应用和 UI 包禁止直连。 |

## 方法合同

| Client method | JSON-RPC owner | Failure behavior |
| --- | --- | --- |
| `startTurn` | `agentSession/turn/start` | transport error 原样暴露；provider not ready 返回稳定错误。 |
| `readThread` | `agentSession/read` | 空或 stale read model 交给 projection repair。 |
| `cancelTurn` | `agentSession/turn/cancel` | 不本地伪造 cancelled event。 |
| `respondAction` | `agentSession/action/respond` | 不本地标记 action resolved。 |
| `exportEvidence` | `evidence/export` | 缺 surface fail closed。 |
| `subscribeEvents` | Host / App Server notification | 只转发 event，不解释 event。 |
| `nextEvent` | session gateway | 没有 event source 时抛出 unavailable。 |

## Fail closed

Production transport 失败时禁止：

- 切到 fixture replay。
- 返回空 read model 伪成功。
- 从产品本地 key / env key 重试 Provider。
- 在 UI 层制造 `turn.completed` 或 action terminal。

应返回或抛出稳定错误，让产品应用显示 `blocked`、`needs-setup`、`unavailable` 或 diagnostics。

## Event routing

`subscribeEvents` / `nextEvent` 只接收：

```json
{
  "jsonrpc": "2.0",
  "method": "agentSession/event",
  "params": {
    "event": {}
  }
}
```

非 `agentSession/event` notification 不进入 Agent Runtime event router。transport 不做 projection，不合并文本，不重排工具状态。

v2.9 后，event router 会消费 adapter / middleware 的 `0..N` 输出和 flush 结果；这只是 transport 兼容层的 fan-out，不改变 durable owner。Lime 本体 current transport 仍是 App Server JSON-RPC / Host bridge，不宣称兼容 AG-UI SSE 或 protobuf wire protocol。

## 验证入口

```bash
npm --prefix packages/agent-runtime-client run test
```

如果改 JSON-RPC 方法名、Host bridge、mock 边界或 command catalog，还必须运行：

```bash
npm run test:contracts
```
