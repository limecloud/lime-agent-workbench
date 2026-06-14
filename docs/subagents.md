---
title: Subagents
description: Lime Subagents 的 current 事实源、投影模型和验收闭环。
aside: false
---

# Subagents

Subagent 在 Lime 中是 RuntimeCore 可追踪、可取消、可审计、可 replay 的执行实体，不是前端本地 worker 列表，也不是 assistant 正文里的一句说明。current 文档以 `AgentUiProjectionState.subagents`、`SubagentsView` 和 `subagent-handoff` fixture 为事实源；旧 `TeamWorkbench` / `teamWorkbench` 命名只作为历史称呼，不再作为 current owner 或可用组件。

本页本身就是最小可运行实现：下面的活体面板读取 `subagent-handoff` fixture，依次通过 schema validation、sequence verifier、fixture replay、projection，再把结果交给真实 `SubagentsView` 渲染。事件筛选、线程详情和事件 JSON 都来自同一组 runtime facts。

<ClientOnly>
  <SubagentsLiveLoop />
</ClientOnly>

```text
RuntimeEvent / ThreadReadModel / TaskSnapshot
  -> JSON Schema
  -> Sequence Verifier
  -> replayAgentUiFixture / projectAgentUiState
  -> AgentUiProjectionState.subagents
  -> SubagentsView
```

## Current Owner

| 层 | current owner | 不属于本层 |
| --- | --- | --- |
| Runtime facts | App Server / RuntimeCore 输出 `task.*`、`subagent.*`、`channel.*`、`handoff.*`、`review.*`、`snapshot.*`。 | React local state、产品页面 worker cache。 |
| Contracts | `@limecloud/agent-ui-contracts` 定义事件、fixture、JSON Schema、Sequence Verifier。 | JSON-RPC transport、Provider 调用。 |
| Runtime client | `@limecloud/agent-runtime-client` 订阅事件、读取 read model、接入 verifier。 | 生成 `AgentUiProjectionState.subagents`。 |
| Projection | `@limecloud/agent-runtime-projection` 从 facts 生成 `AgentUiProjectionState.subagents`。 | 传输、Provider key、审批副作用。 |
| UI | `SubagentsView` 消费 `state.subagents` 和 callbacks。 | 重新解释 graph、写 runtime truth、伪造 teammate。 |

## Projection Model

```ts
interface AgentUiProjectionState {
  subagents: AgentUiSubagentsModel;
}

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

| 字段 | runtime facts | UI 表达 |
| --- | --- | --- |
| `hasSubagents` | 是否出现可投影的 subagent / handoff facts。 | 控制 `SubagentsView` 是否展示多执行体 surface。 |
| `threads` | `subagent.*`、worker lifecycle、handoff target thread。 | 子代理线程、角色、状态、parent task / thread。 |
| `delegationCalls` | `subagent.*` / `handoff.*` 委派事实。 | spawn、handoff、send input、wait、interrupt、close 调用记录。 |
| `activities` | 子代理相关 runtime facts。 | started、interacted、handoff、review、completed 等活动轨迹。 |
| `activeThreadIds` | `pending/running/blocked` thread status。 | 活跃子代理计数与筛选。 |
| `completedThreadIds` | completed thread status。 | 已完成子代理计数与筛选。 |
| `failedThreadIds` | failed thread status。 | 失败子代理计数与诊断入口。 |

`hasSubagents: false` 表示 solo run 或 runtime 不提供 subagent facts。UI 必须展示 solo / unavailable / stale，而不是从标题、正文或旧组件状态推断团队结构。

## Runtime Facts

Subagents 使用稳定 scope id 表达：

| 事件家族 | 示例类型 | 必需 scope |
| --- | --- | --- |
| Task | current fixture 覆盖 `task.created`、`task.completed`；provider 可扩展 `task.updated / failed / canceled`。 | `sessionId`、`taskId`，有执行时带 `runId / attemptId`。 |
| Subagent | `subagent.started`、`subagent.progress`、`subagent.completed`、`subagent.failed` | `taskId`、`subagentId`、`parentTaskId` 或 `parentRunId`。 |
| Channel | current fixture 覆盖 `channel.opened`、`channel.message`；`channel.closed` 仍是 provider extension。 | `channelId`、participants、关联 task/run。 |
| Handoff | current fixture 覆盖 `handoff.requested`；accepted / rejected / completed 仍是 provider extension。 | `handoffId`、source id、target id。 |
| Review | current fixture 覆盖 `review.verdict`；requested / applied 仍是 provider extension。 | `reviewId`、artifact/evidence refs、关联 task。 |
| Snapshot / patch | `snapshot.updated`、`state.delta` | cursor、target、ops、关联 thread/task。 |

所有事件仍遵守 [Runtime 事件契约](/contracts/runtime-event)：必须有 event id、sequence、schema version、typed payload 和适用 correlation ids。

## Fixture Contract

`subagent-handoff` 是 current 最小 fixture，覆盖一条父任务委派、子代理交付、移交、评审、收口的闭环。

```text
task.created(parent)
subagent.started(child)
channel.opened(parent -> child)
channel.message(child -> parent)
tool.started(child)
tool.result(child)
artifact.changed(child)
handoff.requested(child -> parent)
review.verdict(parent)
subagent.completed(child)
task.completed(parent)
snapshot.updated or state.delta
```

验收要求：

1. Sequence Verifier 不报告未豁免 violation。
2. Projection replay 后 `ExecutionGraph` 有 parent/child edge。
3. `AgentUiProjectionState.subagents.threads` 显示 child thread role 和 status。
4. `delegationCalls` 显示 spawn / handoff 调用。
5. `activities` 保留 interacted、handoff、review、completed 等活动轨迹。
6. 断流后可以通过 `snapshot.updated` 或 `state.delta` 修复，且 diagnostics 可见。

完整链路见 [Subagents 活体闭环](/examples/subagents-live-loop)。

## 控制面

控制命令必须回到 runtime owner。

| 用户动作 | Runtime command semantic | 规则 |
| --- | --- | --- |
| 启动运行 / 子任务 intent | `agentSession/turn/start` | 产品应用提交 intent、业务 refs 和 turn config；是否分派子代理由 runtime owner 决定。 |
| 取消当前 turn | `agentSession/turn/cancel` | 产生 current turn 终态 fact，不只隐藏 UI。 |
| 读取 / 订阅 facts | `agentSession/read`、`agentSession/event` | UI 只消费 runtime facts 和 projection state。 |
| 回复等待点 | `agentSession/action/respond` | 审批、补充输入、plan review 都走 action owner。 |
| 导出证据 | `evidence/export` | 从同一 task/runtime facts 导出。 |
| 子代理专用 spawn / pause / resume / handoff respond | future API | 当前不作为公开 App Server method；文档和 UI 不应假设这些命令已存在。 |

React 组件只能拿到 command callbacks，不能直接写 task/subagent 状态。

## Current / Compat / Dead

| Surface | 分类 | 规则 |
| --- | --- | --- |
| `AgentUiProjectionState.subagents` | `current` | 多执行体 AgentUI 的唯一 projection owner。 |
| `SubagentsView` | `current` | 只消费 `state.subagents` 和 callbacks。 |
| `subagent-handoff` fixture | `current` | 最小活体闭环验收入口。 |
| `TeamWorkbenchView` / `teamWorkbench` | `dead / historical name` | 当前 runtime-ui 不导出该组件；只可在迁移说明中指向 `SubagentsView`。 |
| 产品应用本地 worker panel | `compat` | 只允许作为迁移展示，不拥有完成事实。 |
| assistant 正文里的“另一个 agent 已完成” | `deprecated` | 可作为摘要，不能作为状态机。 |
| 本地组件树协议 / 自建多代理 runtime | `dead` | 不作为 Lime 标准术语或事实源。 |

## 降级状态

| 状态 | UI 行为 | 不允许 |
| --- | --- | --- |
| `solo_run` | 只显示单 agent runtime，不显示 subagents surface。 | 伪造 teammate。 |
| `lineage_unavailable` | 显示无法建立父子关系的诊断。 | 从标题或正文猜 parent。 |
| `remote_unavailable` | channel 显示 unavailable，允许 retry。 | 静默降级为 completed。 |
| `snapshot_stale` | 保留旧图，标记 repairing。 | 直接清空执行图。 |
| `permission_blocked` | 显示 ActionRequired。 | 自动 approve。 |

## 实现落点

1. `@limecloud/agent-ui-contracts`：维护 `AgentUiSubagentsModel`、`subagent-handoff` fixture、JSON Schema 和 Sequence Verifier 规则。
2. `@limecloud/agent-runtime-client`：在 subscribe / nextEvent pipeline 接入 verifier，传递 `state.delta`，不生成 UI state。
3. `@limecloud/agent-runtime-projection`：从 runtime facts / read model / `state.delta` patch 生成 `AgentUiProjectionState.subagents`，并在 patch 失败时保留 stale diagnostics。
4. `@limecloud/agent-runtime-ui`：提供 `SubagentsView`，只消费 projection state。
5. Product apps：组合 shared surfaces 和 callbacks，不复制 projection reducer。
