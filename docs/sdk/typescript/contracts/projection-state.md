---
title: Projection State
description: AgentUiProjectionState 字段、不变量和 React 输入合同。
---

# Projection State

`AgentUiProjectionState` 是 Lime React AgentUI 的唯一事实输入。React 组件只能消费它和宿主 callback，不能从 App Server、Provider、assistant 正文或本地 UI state 重新解释 runtime truth。

实现锚点：`packages/agent-ui-contracts/src/projection.ts`、`packages/agent-runtime-projection/src/uiState.ts`。

## 字段总览

| Field | Owner | UI surface | Invariant |
| --- | --- | --- | --- |
| `runtime` | projection | root status、summary | 必须可由 runtime terminal / active events 重建。 |
| `messages` | projection | `UIMessagePartsView` | text/reasoning/tool/artifact/evidence parts 不互相污染。 |
| `timeline` | projection | `ProcessTimelineView` | 按 event sequence / createdAt 稳定排序。 |
| `graph` | projection | `ExecutionGraphView` | 保留 turn/run/task/subagent/tool/action lineage。 |
| `tools` | read model projection | `ToolGroup` | 只来自 `tool.*` facts。 |
| `actions` | read model projection | `ActionRequiredList` | 只包含未解决或需要展示的人类动作。 |
| `artifacts` | read model projection | `ArtifactRefList` | 只保存轻量 ref，不含大 payload。 |
| `evidence` | read model projection | `EvidenceRefList` | 保留 review/replay/evidence correlation。 |
| `diagnostics` | projection | diagnostics / degraded UI | failed、blocked、runtime.error 可见。 |
| `teamWorkbench` | projection | `TeamWorkbenchView` | 必填；solo run 输出空模型。 |
| `readModel` | App Server / projection | hydration、summary | 可水合，但不替代 event stream。 |
| `hydration` | projection | root status / repair UI | 标记 idle/live/stale/repairing/degraded。 |
| `ephemeralUi` | product shell | focus/collapse 等局部 UI | 不得写 runtime truth。 |

## Runtime status

`runtime.status` 是 UI 可见运行态，不是后端内部枚举直传。

| Event condition | Status |
| --- | --- |
| `turn.failed`、`runtime.error`、failed status | `failed` |
| unresolved `action.required` | `waiting` |
| blocked status | `blocked` |
| `turn.completed`、`model.completed` | `completed` |
| `turn.started`、`model.delta`、running status | `running` |
| no events | `idle` |

## Message parts

`messages` 遵循 parts 模型：

- `text`：模型或用户文本。
- `reasoning`：可展示推理摘要。
- `tool-preview`：工具结果摘要。
- `artifact-card`：artifact ref 卡片。
- `evidence-citation`：evidence ref。
- `diagnostic-ref`：诊断、失败或恢复提示。

Streaming 合并在 projection 层完成。React 不合并 delta，不从工具结果正文猜状态。

## Team Workbench

`teamWorkbench` 是必填字段：

```ts
{
  hasTeamSurface: false,
  rosterNodes: [],
  workItems: [],
  handoffEvents: [],
  reviewEvents: [],
  laneEvents: []
}
```

没有 team facts 时用空模型表达 solo run；有 task/subagent/handoff/review facts 时，projection 必须提前构建 roster、work board 和 lane。React 不能从 `graph` 或 `visibleEvents` 重新过滤出团队模型。

## Ref views

`ArtifactRef` / `EvidenceRef` 在 projection state 中只包含：

```ts
interface AgentUiRefView {
  id: string;
  sourceEventId: string;
}
```

完整内容由 artifact workspace、evidence pack、review/replay service 或产品业务壳打开。React 包只提供引用列表和选择 callback。

## 禁止事项

- 不把 `readModel` 当成永久替代 event stream。
- 不在 React 里解析 assistant 正文生成 `tools/actions/artifacts/evidence`。
- 不把 `ephemeralUi` 写成 runtime status。
- 不复制大 payload 到 `messages` 或 refs。
- 不让产品应用新增第二套 projection state。

## 验证入口

```bash
npm --prefix packages/agent-ui-contracts run test
npm --prefix packages/agent-runtime-projection run test
npm --prefix packages/agent-runtime-ui run test
```
