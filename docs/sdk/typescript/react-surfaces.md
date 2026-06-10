---
title: React surfaces
description: "@limecloud/agent-runtime-ui 的受控组件、refs 与回调边界。"
---

# React surfaces

本页是历史规划页，current reference 以 [`@limecloud/agent-runtime-ui`](/sdk/typescript/runtime-ui/overview) 章节为准。当前物理实现没有公共 Provider 组件，标准入口是受控组件：

```tsx
<AgentUiProjectionView
  state={projectionState}
  onResolveAction={handleResolveAction}
  onSelectArtifactRef={handleOpenArtifact}
  onSelectEvidenceRef={handleOpenEvidence}
  labels={labels}
/>
```

React 层只做三件事：

1. 接收 `AgentUiProjectionState`。
2. 渲染共享 surfaces 和稳定 DOM contract。
3. 把用户动作转成 callback，由产品应用或 runtime client 调用 owner API。

## Current surfaces

| Surface | Current component | Input | Callback |
| --- | --- | --- | --- |
| Message parts | `UIMessagePartsView` | `state.messages` | open citation / artifact 由宿主组合。 |
| Runtime status | `AgentUiProjectionView` root attrs | `state.runtime` | retry / cancel 由宿主按钮组合。 |
| Process timeline | `ProcessTimelineView` | `state.timeline` | focus / open ref 由宿主组合。 |
| Execution graph | `ExecutionGraphView` | `state.graph` | focus node 由宿主组合。 |
| Tool group | `ToolGroup` | `state.tools` | open tool output 由宿主组合。 |
| Action required | `ActionRequiredList` | `state.actions` | `onResolveAction`。 |
| Artifact refs | `ArtifactRefList` | `state.artifacts` | `onSelectArtifactRef`。 |
| Evidence refs | `EvidenceRefList` | `state.evidence` | `onSelectEvidenceRef`。 |
| Team Workbench | `TeamWorkbenchView` | `state.teamWorkbench` | focus teammate / handoff 由宿主组合。 |
| Diagnostics | runtime fact cards | `state.diagnostics` / failed facts | open repair 由宿主组合。 |

## Provider boundary

公共 SDK 不提供 Provider。产品应用可以在自己的业务壳层写 presentation Provider，但不得让它创建 transport、订阅 App Server stream、读取 Provider key、改写 runtime facts 或从 assistant 正文解析 tool/action/artifact 状态。

详细边界见 [Provider Boundary](/sdk/typescript/runtime-ui/provider) 和 [Callbacks](/sdk/typescript/runtime-ui/callbacks)。

## 文案与本地化

React package 默认 label 只是 fallback。产品应用必须通过 `labels`、`partTitle`、`eventStatusLabel`、`refTitle`、`refActionLabel` 等 callback 注入五语言资源。

Workbench 文档可以使用中文描述标准，但 React 包不能把产品中文句子写死在组件里。

## Controlled action

ActionRequired 必须是受控交互：

```tsx
<ActionRequiredList
  actions={state.actions}
  onResolveAction={(event, action) => runtime.respondAction({ actionId: event.actionId, decision: action.decision })}
/>
```

点击 approve / reject 后，组件可以显示宿主自己的 pending UI，但不能把 action 标成 resolved。只有 runtime 返回 `action.resolved` 或 read model repair 后，ProjectionState 才能更新完成态。

## 测试要求

React package 的测试只覆盖：

- 关键 surfaces 是否按 ProjectionState 渲染。
- 用户动作是否调用 callback。
- ArtifactRef / EvidenceRef 是否只展示轻量引用。
- blocked / stale / waiting / failed 是否展示。
- 长文本、长 tool name、长 artifact title 不撑破布局。

复杂 reducer 分支必须在 `@limecloud/agent-runtime-projection` 的 unit tests 中覆盖。
