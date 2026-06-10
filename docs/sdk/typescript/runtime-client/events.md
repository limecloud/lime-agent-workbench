---
title: Events Subscription
description: Runtime client 的 agentSession/event 订阅语义。
---

# Events Subscription

Runtime client 只负责把 App Server 的 `agentSession/event` notification 交给调用者。它不解释事件，不合并文本，不生成 UI 状态。

## Subscribe

```ts
const subscription = runtime.subscribeEvents((event, notification) => {
  projector.apply(event);
});

subscription.unsubscribe();
```

| 参数 | Type | Description |
| --- | --- | --- |
| `event` | `AgentEvent` / `AgentRuntimeExecutionEvent` compatible | App Server event payload。 |
| `notification` | `AgentSessionEventNotification` | 原始 JSON-RPC notification，用于调试和 correlation。 |

## nextEvent

```ts
const notification = await runtime.nextEvent(5_000);
```

`nextEvent` 优先调用 gateway 自带 `nextEvent`。如果没有，则尝试 `drainEvents(1)` 并筛选 `agentSession/event` notification。

## Projection Pipeline

```ts
const projector = createAgentUiProjector();

runtime.subscribeEvents((event) => {
  projector.apply(event);
});

const read = await runtime.readThread({ sessionId });
projector.hydrate({
  executionEvents: read.result.events
});
```

实际项目中 App Server read response 可能不是 `AgentRuntimeExecutionEvent[]`，应通过 `@limecloud/agent-runtime-projection` 的 App Server facts adapter 归一。

## Event Families

Runtime client 不过滤标准事件族。只要 App Server notification 是 Agent runtime event compatible payload，就交给调用者或 projector 处理。

| Event family | Client responsibility | Not client responsibility |
| --- | --- | --- |
| model / message | 传递 event、保留 notification correlation。 | 合并 `UIMessageParts`。 |
| tool / action | 传递 scope id 与 status。 | 本地完成 action 或 tool。 |
| artifact / evidence | 传递 refs。 | 读取或内联大 payload。 |
| task / subagent / handoff / review | 传递 lineage、handoff、review facts。 | 生成 `TeamWorkbench` 或重建 graph。 |
| snapshot / repair | 传递 read/repair notification。 | 静默修复 projection state。 |

`@limecloud/agent-runtime-client` 可以暴露 `readThread`、`respondAction`、`exportEvidence` 等 facade，但 UI state 只由 `@limecloud/agent-runtime-projection` 生成。

## Boundary

- Event subscription 不保证 UI 已完成渲染。
- `nextEvent` 不是生产轮询 fallback；生产应使用 App Server / Host bridge 的真实 stream。
- 非 `agentSession/event` notification 不进入 AgentRuntime event router。
- 客户端不合成 `turn.completed`，终态必须来自 runtime facts。
- 客户端不合成 `TeamWorkbench`；team surface 必须来自 projection 对 runtime facts 的聚合。
