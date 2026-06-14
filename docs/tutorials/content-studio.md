---
title: Content Studio 接入
description: Content Studio AI agents 工作台如何接入 Lime Runtime 和 AgentUI。
---

# Content Studio 接入

Content Studio 的目标不是重做聊天页，而是把 `AI agents` 工作台接到 Lime App Server Runtime 和共享 AgentUI。产品差异体现在内容工厂的业务上下文、素材、交付物和工作区编排；runtime facts、projection state 和标准 React surfaces 不在 Content Studio 内重新定义。

## 目标链路

```text
AI agents 工作台
  -> LIME_RUNTIME_BRIDGE / lime.agent
  -> Host capability gateway
  -> App Server agentSession/turn/start
  -> RuntimeEvent / ThreadReadModel / TaskSnapshot / Evidence refs
  -> @limecloud/agent-runtime-client
  -> @limecloud/agent-runtime-projection
  -> @limecloud/agent-runtime-ui
  -> Content Studio business shell
```

standalone/dev 可以保留自托管 sidecar 作为 compat，但平台宿主下 current owner 是 Host bridge + App Server provider store。Content Studio 不读取、不保存、不传递 Provider key。

## Product App owns

| 内容 | 说明 |
| --- | --- |
| Business context | 当前内容类型、素材、栏目、目标渠道、图片/视频/文案任务参数。 |
| Workspace shell | 左侧 `AI agents` 入口、内容工厂布局、artifact workspace、素材面板。 |
| Action callbacks | 根据 `onResolveAction` 打开输入源、模型设置、审批面板或调用 `respondAction`。 |
| Artifact / Evidence open | 根据 `onSelectArtifactRef` / `onSelectEvidenceRef` 打开产品工作区。 |
| I18n labels | 注入五语言 aria、标题、按钮、状态文案。 |
| Compatibility cache | 旧 `messages` / `executionEvents` 仅作为迁移缓存或 hydration 输入。 |

## Product App does not own

| 不拥有 | current owner |
| --- | --- |
| Provider key / token / secret | App Server Provider Store / 平台 Provider 设置。 |
| Runtime facts | App Server RuntimeCore / ExecutionBackend。 |
| Tool state machine | RuntimeEvent `tool.*` + read model。 |
| Action completion | RuntimeEvent `action.required` / action terminal。 |
| Subagent lineage truth | TaskSnapshot / ExecutionGraph / `AgentUiProjectionState.subagents` projection。 |
| Artifact / Evidence truth | artifact service / evidence pack / review/replay owner。 |
| App Server DB | App Server sidecar owner。 |
| React runtime transport | `@limecloud/agent-runtime-client`，不是 UI 包。 |

## 接入步骤

1. 通过 Host Snapshot 确认 App Server readiness、provider readiness、capability readiness。
2. 如果旧 `ModelConfigStore` 有 key，只把它当迁移 source，走平台 model settings capability 写入 provider store；成功后清除本地 key，失败 fail closed。
3. 调 `lime.agent` capability 或 current App Server session gateway 发起 turn。
4. Payload 只传业务上下文、workspace refs、provider/model preference，不传 key、token、secret、backendEnv key。
5. 订阅 `agentSession/event`，读取 `agentSession/read` 和必要 TaskSnapshot。
6. 用 `@limecloud/agent-runtime-projection` 生成 `AgentUiProjectionState`。
7. 用 `@limecloud/agent-runtime-ui` 渲染 `AgentUiProjectionView` 或子 surface。
8. 用户动作通过 callback 回到 runtime client 或产品业务模块。

## 标准 surface 映射

| Content Studio 需求 | Lime standard surface | Source fact |
| --- | --- | --- |
| 聊天 / 生成文本 | `UIMessageParts` | `model.delta` / `model.completed`。 |
| 执行过程 | `ProcessTimeline` | all RuntimeEvent by `sequence`。 |
| 多步骤 / 工具 / 子任务结构 | `ExecutionGraph` | `turn/run/task/subagent/tool/action` ids。 |
| 工具结果 | `ToolGroup` | `tool.started` / `tool.result` / `tool.failed`。 |
| 人类介入 | `ActionRequired` | `action.required` / action terminal。 |
| Prompt 草稿 / 交付物 | `ArtifactRefList` + product artifact workspace | `artifact.changed` / artifact refs。 |
| 证据 / replay / review | `EvidenceRefList` + evidence pack | `evidence.changed` / `review.verdict`。 |
| 子代理 / 团队协作 | `SubagentsView` | `task.*` / `subagent.*` / `handoff.*` / `review.*`。 |
| 错误 / 缺事实 / stale | diagnostics + hydration state | `runtime.error` / `snapshot.updated` / read repair。 |

## 最小代码形态

```ts
import { createAgentRuntimeClientFromSessionGateway } from "@limecloud/agent-runtime-client/sessionGateway";
import { createAgentUiProjector } from "@limecloud/agent-runtime-projection";

const runtime = createAgentRuntimeClientFromSessionGateway(sessionGateway);
const projector = createAgentUiProjector();

await runtime.startTurn({
  sessionId,
  input: {
    text: userPrompt,
    businessRefs: materialRefs,
    providerPreference,
    modelPreference
  }
});

runtime.subscribeEvents((event) => {
  projector.apply(event);
  setAgentUiState(projector.getState());
});
```

```tsx
import { AgentUiProjectionView } from "@limecloud/agent-runtime-ui";

<AgentUiProjectionView
  state={agentUiState}
  onResolveAction={(event, action) => {
    return runtime.respondAction({
      sessionId,
      actionId: event.actionId,
      decision: action.decision
    });
  }}
  onSelectArtifactRef={(ref) => openPromptWorkspace(ref.id)}
  onSelectEvidenceRef={(ref) => openEvidencePack(ref.id)}
  labels={contentStudioAgentLabels}
/>;
```

## 兼容迁移表

| Existing path | Classification | Target | Exit condition |
| --- | --- | --- | --- |
| `AgentPromptSession.messages` | `compat` | `UIMessageParts` | RuntimeEvent hydration 覆盖首屏恢复后只保留迁移读取。 |
| local `executionEvents` | `compat` | `RuntimeEvent` / `ProcessTimeline` | App Server facts adapter 覆盖 tool/action/artifact/evidence 后停止扩展。 |
| 模块内工具状态 | `deprecated` | `tool.*` facts + `ToolGroup` | 工具成功/失败可从 read model replay。 |
| 模块内审批状态 | `deprecated` | `action.required` + action terminal + `ActionRequired` | 所有审批按钮改为 `respondAction`。 |
| 本地 artifact body 当 assistant 正文 | `deprecated` | `ArtifactRef` + artifact workspace | artifact owner 可打开并保留 source event。 |
| 本地 evidence / review 报告 | `deprecated` | `EvidenceRef` + evidence pack | evidence export/review 可追溯到 runtime turn。 |
| `ModelConfigStore` key | `compat` migration source | App Server provider store | 平台宿主迁移成功后本地 key 清除。 |
| Provider key in payload/env | `dead` | none | contract / functional guard 禁止回流。 |

## Blocked / degraded 行为

| 缺口 | UI 行为 |
| --- | --- |
| Host bridge 不可用 | 显示 `unavailable`，引导进入平台设置或 standalone dev。 |
| Provider 未配置 | 显示 `needs-setup` / `blocked`，打开平台 Provider 设置。 |
| Event stream 中断 | 标记 `stale`，调用 read model repair。 |
| 缺 tool/action/artifact/evidence scope id | 降级 diagnostics，不推断成功。 |
| 缺 subagent lineage | 显示 degraded graph，不伪造 teammate。 |
| 只有 fixture/mock backend | 只能作为测试，不标记 production ready。 |

## 验收

Content Studio 接入共享 AgentUI 时至少要证明：

1. turn payload/env 不包含 key、token、secret。
2. `providerPreference` / `modelPreference` 是非敏感 preference，不是 credential。
3. RuntimeEvent 能投影到 MessageParts、ProcessTimeline、ExecutionGraph、ActionRequired、ArtifactRef、EvidenceRef。
4. action 点击只调用 callback；完成态来自 action terminal。
5. artifact/evidence 只显示 ref；完整内容由产品 workspace 或 evidence pack 打开。
6. 缺 App Server / Host / Provider 时 fail closed，不切 production mock。
7. GUI 主路径接入后必须补产品 UI 回归和 GUI smoke；当前 Content Studio 已通过 `npm run test:e2e -- --grep "agents 将平台运行事实投影到 AgentUI 面板而不是普通正文"`，真实页面断言 `.agent-ui-projection`、`.agent-ui-main[data-agent-ui-surface="conversation"]` 和 `.agent-ui-sidecar[data-agent-ui-surface="runtime"]`。

参考验证：

```bash
npm --prefix packages/agent-ui-contracts run test
npm --prefix packages/agent-runtime-client run test
npm --prefix packages/agent-runtime-projection run test
npm --prefix packages/agent-runtime-ui run test
```

产品代码接入后再运行产品仓对应 functional / E2E / smoke gate。
