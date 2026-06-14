---
title: Events Subscription
description: Runtime client 的 agentSession/event 订阅语义。
---

# Events Subscription

Runtime client 负责把 App Server 的 `agentSession/event` notification 交给调用者，并在分发前运行 sequence verifier。它不合并文本，不生成 UI 状态。

v2.1+ 的 current 接入要求是：事件在交给 projector 或 UI listener 前，先通过 App Server event normalization 和 Sequence Verifier。v2.9+ 还要求 adapter / middleware 的 `0..N` fan-out 输出被真实消费；Runtime client 拥有这个 fail-closed / fan-out 边界检查，但仍然不拥有 projection state。

## Subscribe

```ts
const runtime = createAgentRuntimeClient(connection);

const subscription = runtime.subscribeEvents((event, notification) => {
  // event 已经通过 runtime-client 内置 verifier。
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

如果 adapter / middleware 把一条 transport notification 展开为多条 runtime notification，`nextEvent` 必须先返回 fan-out 后的 pending events，再读取下一条 transport message。这样一条旧格式工具完成事件可以在 verifier 前展开为 `tool.started -> tool.result`，而不是让孤立 `tool.result` 绕过边界。

## Projection Pipeline

```ts
const projector = createAgentUiProjector();
const verifier = createRuntimeSequenceVerifier();

runtime.subscribeEvents((event) => {
  const violations = verifier.push(event);
  if (violations.length > 0) {
    projector.applyDiagnostic({
      code: "runtime_sequence_violation",
      source: "sequence-verifier",
      details: violations
    });
    return;
  }

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
| task / subagent / handoff / review | 传递 lineage、handoff、review facts。 | 生成 `AgentUiProjectionState.subagents` 或重建 graph。 |
| snapshot / repair | 传递 read/repair notification。 | 静默修复 projection state。 |
| state.delta | 传递 patch event，并保留 cursor correlation。 | 在 client 内直接改 React state；projection 只通过 `@limecloud/agent-runtime-projection` apply patch。 |

`@limecloud/agent-runtime-client` 可以暴露 `readThread`、`respondAction`、`exportEvidence` 等 facade，但 UI state 只由 `@limecloud/agent-runtime-projection` 生成。

## App Server Event Normalization

Runtime client 在送入 verifier 前会把 App Server current 事件名规整为 AgentUI 标准事件族：

| App Server event | Verifier eventClass |
| --- | --- |
| `message.delta` / `message.delta_batch` / `message.batch` | `model.delta` |
| `message` / `message.completed` / `item.completed` | `model.completed` |
| `thinking.delta` | `reasoning.delta` |
| `turn.done` / `turn.final_done` | `turn.completed` |
| `artifact.snapshot` | `artifact.changed` |

## Verifier Boundary

| 模式 | 行为 |
| --- | --- |
| production | 默认 fail closed：有未豁免 violation 时不分发给 projector。 |
| fixture / conformance | collect diagnostics：保留 violation 供测试断言。 |
| reconnect / repair | 先 hydrate read model，再用 cursor 继续增量 verifier。 |
| `state.delta` | 先验 schema 和 sequence，再交给 projector patch 子树。 |

当 `state.delta` 通过 verify 后，client 只负责把它交给 projector；projector 才是实际 apply 归并点。失败时应把 projection 标成 stale 并保留 diagnostics，不可静默丢弃。

```ts
createAgentRuntimeClient(connection, {
  sequenceVerifierMode: "fail-closed" // 默认
});

createAgentRuntimeClient(connection, {
  sequenceVerifierMode: "collect-diagnostics"
});

createAgentRuntimeClient(connection, {
  sequenceVerifierMode: "off" // 只允许迁移 / 测试夹具显式使用
});
```

## Boundary

- Event subscription 不保证 UI 已完成渲染。
- `nextEvent` 不是生产轮询 fallback；生产应使用 App Server / Host bridge 的真实 stream。
- 非 `agentSession/event` notification 不进入 AgentRuntime event router。
- adapter / middleware fan-out 不等于 projection apply；多个输出事件仍要逐个经过 verifier 和 projector。
- 客户端不合成 `turn.completed`，终态必须来自 runtime facts。
- 客户端不合成 `AgentUiProjectionState.subagents`；Subagents surface 必须来自 projection 对 runtime facts 的聚合。
