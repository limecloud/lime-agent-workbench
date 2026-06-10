---
title: React surfaces
description: "@limecloud/agent-ui-react 的共享组件、hooks 与回调边界。"
---

# React surfaces

`@limecloud/agent-ui-react` 负责把 ProjectionState 渲染成 Lime 产品可复用的 AgentUI 表面。它不是 runtime client，也不是业务状态机。

React 层只做三件事：

1. 接收 ProjectionState 或 selectors 输出。
2. 渲染共享 surfaces。
3. 把用户动作转成 callback，由产品应用或 runtime client 调用 owner API。

## Provider

```tsx
<AgentRunProvider
  state={projectionState}
  labels={labels}
  callbacks={{
    onRespondAction,
    onCancelTurn,
    onOpenArtifact,
    onExportEvidence
  }}
>
  <AgentRunWorkbench />
</AgentRunProvider>
```

Provider 只保存 presentation-level local state，例如展开/折叠、filter、focus、selected tab。它不能写 RuntimeEvent，也不能自行改变 task/action/tool 的完成状态。

## 标准 surfaces

| Surface | 输入 | 回调 |
| --- | --- | --- |
| `MessagePartsSurface` | `UIMessagePart[]` | open citation、open artifact。 |
| `RuntimeStatusSurface` | `RuntimeStatusView` | retry、open setup、cancel。 |
| `ProcessTimelineSurface` | `ProcessTimelineEntry[]` | focus step、open output ref。 |
| `ExecutionGraphSurface` | `ExecutionGraphNode[]` | focus node、filter status。 |
| `ToolGroupSurface` | `ToolCallView[]` | open tool output、copy safe summary。 |
| `ActionRequiredSurface` | `ActionRequiredView[]` | respond action、cancel action。 |
| `ArtifactLaneSurface` | `ArtifactRefView[]` | open/edit/export artifact。 |
| `EvidenceLaneSurface` | `EvidenceRefView[]` | export/open review/replay。 |
| `TeamWorkbenchSurface` | team selectors | focus teammate、open handoff。 |
| `DiagnosticsSurface` | diagnostics selectors | open repair, copy diagnostic ref。 |

产品应用可以组合这些 surfaces，但不应重写它们的事实解释逻辑。

## Hook 边界

```ts
export interface AgentRunCallbacks {
  onRespondAction(input: RespondActionViewInput): Promise<void>;
  onCancelTurn(input: CancelTurnViewInput): Promise<void>;
  onOpenArtifact(input: OpenArtifactViewInput): void;
  onExportEvidence(input: ExportEvidenceViewInput): Promise<void>;
  onFocusTimelineEntry?(input: FocusTimelineEntryInput): void;
}

export function useAgentRunProjection(): AgentRunViewModel;
export function useAgentRunCallbacks(): AgentRunCallbacks;
```

Hook 可以读 React context，但不能：

- 创建 runtime transport。
- 订阅 App Server event stream。
- 读取 Provider key。
- 从 assistant text 解析 tool/action/artifact 状态。

## 文案与本地化

React package 不硬编码产品文案。它提供 key 和默认结构，产品应用或 Lime shell 注入五语言资源。

```ts
export interface AgentUiLabels {
  runtime: {
    running: string;
    waiting: string;
    failed: string;
    stale: string;
  };
  actions: {
    approve: string;
    reject: string;
    submit: string;
    cancel: string;
  };
}
```

Lime 产品主仓落地时，用户可见文案必须覆盖 `zh-CN / zh-TW / en-US / ja-JP / ko-KR`。Workbench 文档可以使用中文描述标准，但 React 包不能把中文句子写死在组件里。

## 设计 token

React surfaces 应依赖 Lime design token 或产品 shell 注入的 token，不自带第二套视觉系统。

| Token | 用途 |
| --- | --- |
| `--agent-ui-bg` | surface 背景。 |
| `--agent-ui-border` | 分隔线和 outline。 |
| `--agent-ui-accent` | active / running 状态。 |
| `--agent-ui-danger` | failed / blocked。 |
| `--agent-ui-warning` | waiting / stale。 |
| `--agent-ui-success` | completed。 |
| `--agent-ui-muted` | folded diagnostics。 |

组件尺寸要稳定：timeline row、tool row、action card、graph node、status badge 不应因 hover 或动态文本导致布局跳动。

## Controlled action

ActionRequired 必须是受控交互。

```tsx
<ActionRequiredSurface
  actions={view.actions}
  onRespondAction={callbacks.onRespondAction}
/>
```

点击 approve / reject 后，组件可以显示 pending UI，但不能把 action 标成 resolved。只有 runtime 返回 `action.resolved` 或 read model repair 后，ProjectionState 才能更新完成态。

## Subagents / Team Workbench

Team surface 只在 runtime facts 足够时显示完整结构。

| Runtime 支持 | React 表达 |
| --- | --- |
| solo run | 不显示 team roster，只显示单 runtime status。 |
| parent/child lineage | ExecutionGraph 显示 child edge。 |
| subagent role/status | TeamRoster 显示 role 与状态。 |
| channel/handoff facts | HandoffLane / TeammateTranscript。 |
| review facts | ReviewLane。 |

缺失 lineage 时显示 degraded diagnostics，不伪造 teammate。

## 测试要求

React package 的测试只覆盖：

- 关键 surfaces 是否按 ProjectionState 渲染。
- 用户动作是否调用 callback。
- blocked / stale / waiting / failed 是否展示。
- 长文本、长 tool name、长 artifact title 不撑破布局。

不在 React component test 中测试 reducer 分支。复杂状态机必须在 `@limecloud/agent-ui-projection` 的 unit tests 中覆盖。
