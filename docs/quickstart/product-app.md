---
title: 产品应用
description: 产品应用 如何接入共享 Runtime 和 AgentUI。
---

# 产品应用

产品应用 的职责是提供业务上下文和用户工作流，不是重写 AgentRuntime 或 AgentUI。

## 接入步骤

1. 通过 Host Snapshot 或 App Server client 确认 runtime readiness。
2. 提交 turn 时只传业务上下文、workspace refs、Provider/model preference。
3. 订阅 `agentSession/event` 或等价 event stream。
4. 用 `agentSession/read` 恢复 `ThreadReadModel` 和 `TaskSnapshot`。
5. 把 facts 交给共享 AgentUI 投影。
6. 只在业务壳层组合 surfaces，不 fork 投影 契约。

## 推荐依赖

| 用途 | 包 |
| --- | --- |
| 调 App Server / 订阅事件 | `@limecloud/agent-runtime-client` |
| 渲染共享 surfaces | `@limecloud/agent-ui-react` |
| 业务侧测试 fixture | `@limecloud/agent-ui-contracts` |

产品应用通常不直接依赖 `@limecloud/agent-ui-projection`，除非它在 React 外做 replay、导出或测试。

## Payload 边界

产品应用可以传：

- 用户输入和业务上下文。
- workspace、asset、document、campaign、product refs。
- 非敏感 Provider/model preference。
- 用户可见 intent，例如 create article、generate prompt、analyze material。

产品应用 不得传：

- API Key、token、secret、env key。
- Provider store 的内部记录。
- App Server DB path。
- UI-only completion state。
- mock-only runtime facts。

## Content Studio 的目标路径

```text
AI agents 工作台
  -> agentPromptSessions:start / continue
  -> AppServerPromptAgentService
  -> Host capability lime.agent
  -> App Server agentSession/turn/start
  -> RuntimeBackend -> Provider store -> LLM
  -> RuntimeEvent / ThreadReadModel / ArtifactRef / EvidenceRef
  -> Shared AgentUI 投影
```

旧 `messages` 和 `executionEvents` 可以短期保留为 compat cache，但不能继续驱动完成状态、工具成功、审批结果或 evidence verdict。

## 接入代码形态

```ts
const client = createAgentRuntimeClient({ transport: hostTransport });

const turn = await client.startTurn({
  sessionId,
  threadId,
  input: {
    text: userText,
    intent: "content.create_article",
    businessRefs: [{ kind: "material", id: materialId }],
    providerPreference,
    modelPreference
  }
});

const readModel = await client.readThread({ threadId: turn.threadId });
projection.hydrate(readModel);

for await (const event of client.subscribeEvents({ threadId: turn.threadId })) {
  projection.apply(event);
}
```

## 迁移 checklist

1. 找出本地 `messages`、`executionEvents`、tool status、approval state 的写入点。
2. 标记 `current` / `compat` / `deprecated` / `dead`。
3. 把 Provider key 读取迁到 Host / App Server Provider store。
4. 把工具、审批、artifact、evidence 状态改为 RuntimeEvent / ReadModel 驱动。
5. 把本地过程组件迁到共享 AgentUI surfaces。
6. 为一个真实 turn 补 fixture replay 和 conformance 验收。

## 不合格接入

- 产品应用直接调用模型 API 并把结果伪装成 Lime runtime。
- 用本地 mock backend 支撑 production happy path。
- 只接 streaming text，不接 status/tool/action/artifact/evidence。
- 把 UI 状态写回 runtime read model。
