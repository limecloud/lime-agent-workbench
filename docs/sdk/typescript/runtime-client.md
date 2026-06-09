---
title: Runtime client
description: TypeScript Runtime client 的边界。
---

# Runtime client

Runtime client 由 `@limecloud/agent-runtime-client` 提供，只封装 App Server JSON-RPC、Host bridge transport 和事件订阅。它不缓存 Provider Key，不实现 runtime 状态机，不生成 UI 投影。

## 必需能力

- `startTurn`
- `cancelTurn`
- `respondAction`
- `readThread`
- `subscribeEvents`
- `exportEvidence`

## Client shape

```ts
export interface AgentRuntimeClient {
  startTurn(input: StartTurnInput): Promise<StartTurnResult>;
  cancelTurn(input: CancelTurnInput): Promise<RuntimeEvent>;
  respondAction(input: RespondActionInput): Promise<RuntimeEvent>;
  readThread(input: ReadThreadInput): Promise<ThreadReadModel>;
  readTask(input: ReadTaskInput): Promise<TaskSnapshot>;
  subscribeEvents(input: SubscribeEventsInput): AsyncIterable<RuntimeEvent>;
  exportEvidence(input: ExportEvidenceInput): Promise<EvidenceRefView>;
}
```

## Transport

| Transport | 场景 | 规则 |
| --- | --- | --- |
| Desktop Host bridge | Lime 桌面主路径。 | 走 Host capability / JSON-RPC bridge，不绕过 App Server。 |
| HTTP SSE | future remote / hosted。 | 事件仍用同一 RuntimeEvent envelope。 |
| WebSocket | future collaborative mode。 | 必须保留 sequence、cursor、repair 语义。 |
| fixture replay | 测试。 | 只能在测试和 conformance 使用，不进 production fallback。 |

## 错误模型

```ts
export interface RuntimeClientError {
  code:
    | "provider_not_ready"
    | "host_unavailable"
    | "permission_denied"
    | "stream_interrupted"
    | "schema_mismatch"
    | "runtime_failed";
  message: string;
  retryable: boolean;
  actionId?: string;
  diagnosticsRef?: string;
}
```

错误必须能映射到 UI 的 `blocked`、`unavailable`、`stale`、`failed` 状态。客户端不得吞掉错误后回退到 mock。

## 使用示例

```ts
const client = createAgentRuntimeClient({ transport });
const projection = createAgentUiProjector();

const turn = await client.startTurn({ sessionId, threadId, input });
projection.hydrate(await client.readThread({ threadId: turn.threadId }));

for await (const event of client.subscribeEvents({ threadId: turn.threadId })) {
  projection.apply(event);
}
```

## 禁止事项

- 在 client 内读取或缓存 Provider Key。
- 在 client 内维护 tool/action/artifact 状态机。
- 在 production transport 失败时切到 fixture/mock。
- 返回没有 schemaVersion 的 ad hoc payload。
