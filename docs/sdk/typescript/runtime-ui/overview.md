---
title: "@limecloud/agent-runtime-ui"
description: Lime React AgentUI SDK Reference 总览。
---

# @limecloud/agent-runtime-ui

`@limecloud/agent-runtime-ui` 是 Lime 当前 React AgentUI surface seed。它只消费 `AgentUiProjectionState` 和 callbacks，不拥有 runtime transport、不订阅 Provider、不维护 runtime truth。

实现锚点：`packages/agent-runtime-ui/`。

## 安装

```bash
npm install @limecloud/agent-runtime-ui react react-dom
```

## 导出面

```ts
export {
  AgentUiProjectionView,
  UIMessagePartsView,
  ProcessTimelineView,
  ExecutionGraphView,
  ArtifactRefList,
  EvidenceRefList,
  SubagentsView,
  SubagentThreadList,
  SubagentDelegationList,
  SubagentActivityList,
  RuntimeFactsPanel,
  RuntimeFactsSummary,
  ToolGroup,
  ActionRequiredList
} from "@limecloud/agent-runtime-ui";
```

## Surface Map

| Surface | Input | Purpose |
| --- | --- | --- |
| `AgentUiProjectionView` | `AgentUiProjectionState` | 标准组合视图。 |
| `UIMessagePartsView` | `UIMessagePart[]` | 消息、reasoning、tool preview、artifact/evidence 引用。 |
| `ProcessTimelineView` | `ProcessTimelineEntry[]` | 过程时间线。 |
| `ExecutionGraphView` | `ExecutionGraphNode[]` | task / subagent / tool / action 图。 |
| `SubagentsView` | `AgentUiProjectionState.subagents` | 团队成员、工作板、移交 / review lane。 |
| `SubagentThreadList` | `AgentUiSubagentThreadView[]` | 子代理线程列表。 |
| `SubagentDelegationList` | `AgentUiSubagentDelegationView[]` | spawn / handoff 调用记录。 |
| `SubagentActivityList` | `AgentUiSubagentActivityView[]` | 子代理活动轨迹。 |
| `ArtifactRefList` | `AgentUiArtifactRefView[]` | artifact 引用列表，只输出打开意图。 |
| `EvidenceRefList` | `AgentUiEvidenceRefView[]` | evidence 引用列表，只输出打开意图。 |
| `ActionRequiredList` | projected action events | 人类介入。 |
| `ToolGroup` | projected tool events | 工具调用摘要。 |
| `RuntimeFactsPanel` | `AgentRuntimeReadModel` | read model facts 面板。 |

这些 React surface 的标准输入分别来自 `UIMessageParts`、`ProcessTimeline`、`ExecutionGraph`、`ActionRequired`、`ArtifactRef`、`EvidenceRef`、`AgentUiProjectionState.subagents`。组件可以通过 labels 和 callbacks 注入产品行为，但不能把本地状态写回 runtime facts。

## Example

```tsx
import { AgentUiProjectionView } from "@limecloud/agent-runtime-ui";

export function AgentPanel({ state, onResolveAction }) {
  return (
    <AgentUiProjectionView
      state={state}
      onResolveAction={onResolveAction}
      labels={{
        messagePartsAriaLabel: "消息",
        processTimelineAriaLabel: "过程",
        executionGraphAriaLabel: "执行图",
        subagentsAriaLabel: "子代理"
      }}
    />
  );
}
```

## Boundary

| 允许 | 禁止 |
| --- | --- |
| 渲染 projection state。 | 调用 App Server JSON-RPC。 |
| 通过 callback 上报用户动作。 | 本地标记 action resolved。 |
| 注入 labels / formatting callbacks。 | 硬编码产品五语言文案。 |
| 展示 refs。 | 复制 artifact / evidence 大 payload。 |
| 缺少 subagent facts 时不渲染 Subagents surface。 | 伪造 teammate、handoff 或 review。 |

## 关键参考页

- [Provider Boundary](/sdk/typescript/runtime-ui/provider)
- [Callbacks](/sdk/typescript/runtime-ui/callbacks)
- [Artifact And Evidence Refs](/sdk/typescript/runtime-ui/refs)

## 验证

```bash
npm --prefix packages/agent-runtime-ui run test
```

如果 surface 改动影响产品 GUI，再补产品侧 UI 回归和 GUI smoke。
