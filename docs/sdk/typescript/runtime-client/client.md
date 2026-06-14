---
title: AgentRuntimeClient
description: AgentRuntimeClient 的方法、返回值和边界。
---

# AgentRuntimeClient

`AgentRuntimeClient` 是 App Server Agent Runtime 的 TypeScript facade。它提供生命周期方法和 event subscription，不拥有 projection state。

## Interface

当前类型来自 `app-server-client`，由 `@limecloud/agent-runtime-client` re-export。

```ts
export interface AgentRuntimeClient {
  startTurn(params: AgentSessionTurnStartParams, options?: AppServerRequestOptions): Promise<AppServerRequestResult<AgentSessionTurnStartResponse>>;
  readThread(params: AgentSessionReadParams, options?: AppServerRequestOptions): Promise<AppServerRequestResult<AgentSessionReadResponse>>;
  cancelTurn(params: AgentSessionTurnCancelParams, options?: AppServerRequestOptions): Promise<AppServerRequestResult<AgentSessionTurnCancelResponse>>;
  respondAction(params: AgentSessionActionRespondParams, options?: AppServerRequestOptions): Promise<AppServerRequestResult<AgentSessionActionRespondResponse>>;
  exportEvidence(params: EvidenceExportParams, options?: AppServerRequestOptions): Promise<AppServerRequestResult<EvidenceExportResponse>>;
  subscribeEvents(listener: AgentRuntimeEventListener): AgentRuntimeClientSubscription;
  nextEvent(timeoutMs?: number): Promise<AgentSessionEventNotification>;
}
```

## Methods

| Method | Purpose | UI 后续动作 |
| --- | --- | --- |
| `startTurn` | 提交用户输入或产品 action。 | 等待 `agentSession/event`，不要本地伪造 assistant 输出。 |
| `readThread` | 读取当前 session/thread read model。 | hydrate projection。 |
| `cancelTurn` | 请求停止当前 turn。 | 等 runtime event 或 read model 反映取消。 |
| `respondAction` | 响应 `action.required`。 | 等 action terminal。 |
| `exportEvidence` | 导出 evidence pack。 | 显示 `EvidenceRef`，不复制大文件内容。 |
| `subscribeEvents` | 注册 event listener。 | 将 event 传给 projection。 |
| `nextEvent` | 测试或 bridge drain 场景读取下一条 event。 | 只用于有明确 event source 的场景。 |

## Example

```ts
const subscription = runtime.subscribeEvents((event) => {
  projector.apply(event);
});

await runtime.startTurn({
  sessionId,
  input: { text: "生成 Content Studio 草稿" }
});

subscription.unsubscribe();
```

## Production Contract

| 场景 | 行为 |
| --- | --- |
| Host bridge unavailable | 返回/抛出 transport error，不切 mock。 |
| Provider not ready | 由 App Server 返回稳定错误，UI 映射到 setup / blocked。 |
| Stream interrupted | client 暴露错误或 stale event，由 projection repair。 |
| Action response | 不乐观更新 action completed。 |

## 禁止事项

- 不从 client 里 import `@limecloud/agent-runtime-ui`。
- 不在 client 内调用 `projectAgentUiState`。
- 不读取产品应用本地 Provider key。
- 不把 JSON-RPC raw response 当 React props 直接传组件。
