---
title: AgentUI 最小面板
description: 从 runtime client 到 projection 到 React surface 的最小闭环。
---

# AgentUI 最小面板

本页给产品应用一个最小可用接入顺序。它不是新 runtime，也不是单包 facade；每一步都落在 Lime 四包 current owner 上。

## 数据流

```text
@limecloud/agent-runtime-client
  -> RuntimeEvent / ThreadReadModel / Evidence refs
  -> @limecloud/agent-runtime-projection
  -> AgentUiProjectionState
  -> @limecloud/agent-runtime-ui
```

## 1. 创建 runtime client

```ts
import { createAgentRuntimeClientFromSessionGateway } from "@limecloud/agent-runtime-client/sessionGateway";

const runtime = createAgentRuntimeClientFromSessionGateway(sessionGateway);
```

`sessionGateway` 由产品应用注入，通常来自 Host bridge 或 App Server JSON-RPC client。它不能读取 Provider key，也不能在失败时切 fixture。

## 2. 创建 projector

```ts
import { createAgentUiProjector } from "@limecloud/agent-runtime-projection";

const projector = createAgentUiProjector();
```

## 3. 提交 turn 并消费 events

```ts
await runtime.startTurn({
  sessionId,
  input: { text: prompt },
  runtimeOptions: { providerPreference, modelPreference }
});

const subscription = runtime.subscribeEvents((event) => {
  projector.apply(event);
  render(projector.getState());
});
```

产品应用可以先调用 `readThread` 做 hydration，再订阅 event stream。缺少 event source 时必须显示 unavailable/stale，不要本地伪造完成态。

## 4. 渲染 AgentUI

```tsx
import { AgentUiProjectionView } from "@limecloud/agent-runtime-ui";

<AgentUiProjectionView
  state={state}
  onResolveAction={(event, action) => {
    runtime.respondAction({
      sessionId,
      actionId: event.actionId,
      decision: action.decision
    });
  }}
  onSelectArtifactRef={(ref) => openArtifactWorkspace(ref.id)}
  onSelectEvidenceRef={(ref) => openEvidencePack(ref.id)}
  labels={{
    messagePartsAriaLabel: t("agent.messages"),
    processTimelineAriaLabel: t("agent.timeline"),
    artifactRefsAriaLabel: t("agent.artifacts"),
    evidenceRefsAriaLabel: t("agent.evidence")
  }}
/>;
```

## 产品应用拥有的部分

| Product app owns | Shared SDK owns |
| --- | --- |
| 业务 context、输入素材、workspace layout。 | runtime event/read model/projection contracts。 |
| Provider/model preference，不含 key。 | transport facade 和 fail-closed error。 |
| Artifact workspace 打开逻辑。 | ArtifactRef projection 和 React ref list。 |
| Evidence pack / review 打开逻辑。 | EvidenceRef projection 和 React ref list。 |
| 五语言文案和视觉样式。 | 稳定 DOM contract 和 callback shape。 |

## 验证

```bash
npm --prefix packages/agent-ui-contracts run test
npm --prefix packages/agent-runtime-client run test
npm --prefix packages/agent-runtime-projection run test
npm --prefix packages/agent-runtime-ui run test
```

产品主路径接入后再补产品自己的 UI 回归和 GUI smoke。
