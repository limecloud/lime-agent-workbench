---
title: 投影 Schema
description: AgentUI 投影 schema 的对齐入口。
---

# 投影 Schema

UI 投影 schema 定义 `AgentUiProjectionState` 的可序列化形态。它是 React surfaces、fixture replay、文档示例和跨语言 read-model 验收的共同边界。

## 当前投影根

```ts
interface AgentUiProjectionState {
  runtime: AgentUiRuntimeStatusView;
  messages: UIMessageParts;
  timeline: ProcessTimeline;
  graph: ExecutionGraph;
  tools: AgentRuntimeEventProjection[];
  actions: AgentRuntimeEventProjection[];
  artifacts: AgentUiArtifactRefView[];
  evidence: AgentUiEvidenceRefView[];
  diagnostics: AgentUiDiagnosticView[];
  subagents: AgentUiSubagentsModel;
  readModel: AgentRuntimeReadModel;
  hydration: AgentUiHydrationState;
  ephemeralUi: Record<string, unknown>;
}
```

`subagents` 是 v2.3 多执行体 UI 的 current owner。旧文档或 seed 代码中出现的 `teamWorkbench` 只能视为兼容 surface 名称，不能作为新的事实字段或产品 owner。

## Subagents Schema

```ts
interface AgentUiSubagentsModel {
  hasSubagents: boolean;
  threads: AgentUiSubagentThreadView[];
  delegationCalls: AgentUiSubagentDelegationView[];
  activities: AgentUiSubagentActivityView[];
  activeThreadIds: string[];
  completedThreadIds: string[];
  failedThreadIds: string[];
}
```

| 字段 | 来源 | 规则 |
| --- | --- | --- |
| `hasSubagents` | `subagent.*`、`handoff.*`、review / worker 相关 facts | solo run 必须是 `false`，不能伪造成团队运行。 |
| `threads` | `subagent.*` / worker lifecycle / handoff target | 展示执行体线程、状态和 parent lineage。 |
| `delegationCalls` | `subagent.*` / `handoff.*` 调用事实 | 保留 spawn、handoff、send input、wait、interrupt、close 记录。 |
| `activities` | 子代理相关 runtime facts | 展示 started、interacted、handoff、review、completed 活动轨迹。 |
| `activeThreadIds` | pending / running / blocked thread status | 活跃子代理筛选。 |
| `completedThreadIds` | completed thread status | 已完成子代理筛选。 |
| `failedThreadIds` | failed thread status | 失败子代理筛选和诊断入口。 |

## `state.delta` 到投影

`state.delta` patch 可以更新 projection / readModel 子树，但只能作用在 schema 已知字段上。`@limecloud/agent-runtime-projection` 的 batch `projectAgentUiState()` 与 incremental `createAgentUiProjector.apply()` 已使用同一 apply 链；patch 失败时 projection 进入 `stale` 并写入 diagnostics。

| target | 允许 | 禁止 |
| --- | --- | --- |
| `projection.messages` | 修复 message part 的完成状态或 refs。 | 从纯文本解析 tool 结果。 |
| `projection.graph` | 修复节点状态、edge、sequence 派生排序。 | 新造 runtime 没有的 task/subagent。 |
| `projection.subagents` | 修复 threads / delegation calls / activities 派生状态。 | 让 `SubagentsView` 自己保存 runtime truth。 |
| `projection.diagnostics` | 添加 repair / stale / unavailable 诊断。 | 静默吞掉 schema 或 verifier violation。 |
| `readModel.taskRefs` / refs cache | 修复可重建 cache。 | 伪造 `readModel.events` / pending action facts。 |

## 验收

最小验收链路：

```text
subagent-handoff fixture
  -> JSON Schema validation
  -> Sequence Verifier
  -> replayAgentUiFixture
  -> state.delta apply
  -> AgentUiProjectionState.subagents
  -> SubagentsView
```

任何产品文档声称支持 subagents，都必须能说明自己消费的是 `AgentUiProjectionState.subagents`，而不是本地 worker 列表或旧 `teamWorkbench` owner。
