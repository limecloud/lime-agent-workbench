---
title: Subagents
description: Lime Subagents、Team Workbench 与多执行实体的标准边界。
---

# Subagents 标准

Subagent 在 Lime 中不是一个聊天气泡名称，而是 RuntimeCore 可追踪、可取消、可审计的执行实体。只要一个 worker 能独立接受目标、调用工具、产生 artifact、等待审批或交付 evidence，它就必须进入 runtime facts，而不是藏在 assistant 正文或本地 React state 里。

Lime 对 subagents 的标准目标是：

```text
Task / Run / Step
  -> Subagent / Worker / Job / Channel / Handoff facts
  -> RuntimeEvent + TaskSnapshot
  -> ExecutionGraph + Team Workbench projection
  -> Product App shared surfaces
```

这条链路确保 Content Studio、Agent Apps、Harness、Evidence / Replay / Review 看到的是同一组多执行实体事实。

## 概念边界

| 概念 | Runtime owner | UI projection | 说明 |
| --- | --- | --- | --- |
| Foreground agent | `threadId`、`turnId`、`runId` | Conversation、RuntimeStatus | 当前用户直接交互的执行体。 |
| Subagent | `subagentId`、`parentTaskId`、`parentRunId` | Team Roster、ExecutionGraph child | 被委派的执行体，可以有自己的步骤、工具和输出。 |
| Worker | `workerId`、`subagentId` 或 `jobId` | Worker notification、work item row | 负责一类后台工作或工具编排的执行体。 |
| Task | `taskId`、`attemptId`、`dependencyIds` | Work Board、Task Capsule | 可排队、重试、取消和交付的目标工作。 |
| Job | `jobId`、`taskId`、`deliveryState` | Background task row | 持久后台任务，不要求一直占据 conversation。 |
| Channel | `channelId`、participant ids | Teammate Transcript、Handoff Lane | agent 之间或 agent 与用户之间的结构化通信。 |
| Handoff | `handoffId`、source、target、reason | Handoff Lane、Review Lane | 从一个执行体移交给另一个执行体的可审计事实。 |

UI 可以折叠、分组、过滤这些实体，但不能把它们压平成一个匿名 assistant。

## Runtime 事实

Subagents 必须使用稳定事件和 scope ids 表达。

| 事件家族 | 示例类型 | 必需 scope |
| --- | --- | --- |
| Task | `task.created`、`task.updated`、`task.completed`、`task.failed`、`task.cancelled` | `sessionId`、`taskId`，有执行时带 `runId / attemptId`。 |
| Subagent | `subagent.started`、`subagent.progress`、`subagent.completed`、`subagent.failed` | `taskId`、`subagentId`、`parentTaskId` 或 `parentRunId`。 |
| Worker | `worker.started`、`worker.notification`、`worker.blocked`、`worker.completed` | `workerId`、关联 `taskId / subagentId / jobId`。 |
| Channel | `channel.opened`、`channel.message`、`channel.closed` | `channelId`、participants、关联 task/run。 |
| Handoff | `handoff.requested`、`handoff.accepted`、`handoff.rejected`、`handoff.completed` | `handoffId`、source id、target id。 |
| Review | `review.requested`、`review.verdict`、`review.applied` | `reviewId`、artifact/evidence refs、关联 task。 |

所有事件仍遵守 [Runtime 事件契约](/contracts/runtime-event)：必须有 `eventId`、`sequence`、`schemaVersion`、typed payload 和适用 correlation ids。

## TaskSnapshot

Subagent 能力不能只靠 event stream 临时展示。TaskSnapshot 至少要能恢复：

```ts
export interface SubagentSnapshot {
  subagentId: string;
  taskId: string;
  parentTaskId?: string;
  parentRunId?: string;
  role: "planner" | "researcher" | "writer" | "reviewer" | "executor" | "custom";
  status: "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled";
  currentStepId?: string;
  channelIds: string[];
  toolCallIds: string[];
  artifactRefs: RuntimeRef[];
  evidenceRefs: RuntimeRef[];
  lastEventCursor?: string;
}
```

如果 runtime 暂时缺少完整 lineage，必须把状态标为 `unknown`、`unavailable` 或 `stale`，不能让 UI 猜 parent/child 关系。

## UI 投影

Subagents 在 AgentUI 中主要投影到四个 surface。

| Surface | 输入 facts | 表达 |
| --- | --- | --- |
| `ExecutionGraph` | task/subagent/job/step/tool/action events | 父子关系、依赖、执行状态、失败点。 |
| `TeamRoster` | subagent/worker lifecycle | 当前参与者、角色、状态、责任范围。 |
| `WorkBoard` | TaskSnapshot、job events | 队列、后台任务、等待输入、完成项。 |
| `HandoffLane` | channel/handoff/review events | 移交、协作消息、review verdict。 |

Conversation 只展示与用户阅读相关的摘要和引用。完整 subagent 过程应进入 ExecutionGraph / Team Workbench，而不是污染最终回答正文。

## 控制面

控制命令必须回到 runtime owner。

| 用户动作 | Runtime command semantic | 规则 |
| --- | --- | --- |
| 启动子代理 | `task/start` 或 `subagent/spawn` | 产品应用只提交 intent 和业务 refs。 |
| 取消子代理 | `task/cancel` 或 `subagent/cancel` | 产生 cancelled fact，不只隐藏 UI。 |
| 暂停 / 恢复 | `task/pause`、`task/resume` | 保留 reason 和 actor。 |
| 回复等待点 | `action/respond` | 审批、补充输入、plan review 都走 action owner。 |
| 移交任务 | `handoff/respond` | source、target、reason、payload 都可审计。 |
| 导出证据 | `evidence/export` | 从同一 task/runtime facts 导出。 |

React 组件只能拿到 command callbacks，不能直接写 task/subagent 状态。

## 与外部协议的关系

| 参考 | 可参考 | Lime 采用边界 |
| --- | --- | --- |
| AG-UI | event stream、sub-agents and composition、state / tool / interrupt 分类 | 进入 Lime 后必须补齐 session/thread/turn/task ids 和 Evidence refs。 |
| AI SDK | `UIMessage.parts` 的 text/reasoning/tool 分片思想 | Subagent truth 不进入 message parts；message 只保留可读摘要和 citation。 |
| OpenAI Agents JS | handoff、tool lifecycle、tracing | SDK 对象不能越过 App Server；必须映射为 RuntimeEvent / TaskSnapshot。 |
| LangGraph / CrewAI | node graph、multi-agent routing | 原生 graph 只作为 adapter 输入；Lime ExecutionGraph 是 UI 投影事实。 |

## 降级状态

| 状态 | UI 行为 | 不允许 |
| --- | --- | --- |
| `solo_run` | 只显示单 agent runtime，不显示 team surface。 | 伪造 teammate。 |
| `lineage_unavailable` | 显示无法建立父子关系的诊断。 | 从标题或正文猜 parent。 |
| `remote_unavailable` | channel 显示 unavailable，允许 retry。 | 静默降级为 completed。 |
| `snapshot_stale` | 保留旧图，标记 repairing。 | 直接清空执行图。 |
| `permission_blocked` | 显示 ActionRequired。 | 自动 approve。 |

## Conformance fixture

Subagents 至少要有一个标准 fixture：

```text
task.created(parent)
subagent.started(child)
channel.opened(parent -> child)
tool.started(child)
tool.result(child)
artifact.changed(child)
handoff.requested(child -> parent)
review.verdict(parent)
subagent.completed(child)
task.completed(parent)
snapshot.updated
```

验收要求：

1. Projection replay 后 `ExecutionGraph` 有 parent/child edge。
2. TeamRoster 显示 child role 和 status。
3. ArtifactRef / EvidenceRef 保留 child correlation。
4. HandoffLane 能显示移交状态。
5. 断流后可以通过 TaskSnapshot 修复。

## current / compat / deprecated / dead

| Surface | 分类 | 规则 |
| --- | --- | --- |
| RuntimeEvent + TaskSnapshot + ExecutionGraph | `current` | 后续多代理能力只向这里收敛。 |
| Lime 现有 subagent/team projection seed | `current seed` | 可作为实现参考，需进入共享包。 |
| 产品应用本地 worker panel | `compat` | 只允许作为迁移展示，不拥有完成事实。 |
| assistant 正文里的“我已让另一个 agent 完成” | `deprecated` | 可作为可读摘要，不能作为状态机。 |
| 本地组件树协议 | `dead` | 不作为 Lime 标准术语或事实源。 |
| 业务 App 自建多代理 runtime | `dead` | 与 App Server / RuntimeCore 主链冲突。 |

## 实现落点

对 Lime 主仓的实现要求：

1. contracts：补 `SubagentSnapshot`、channel/handoff/review event payload schema。
2. projection：补 ExecutionGraph parent/child reducer、TeamRoster selector、handoff selector。
3. React：补共享 Team Workbench surface，消费 projection state 和 callbacks。
4. runtime-client：补 task/subagent control plane 方法，但不生成 UI 状态。
5. conformance：补 `subagent-handoff` fixture replay。

这不是立即要求每个产品应用展示完整 Team Workbench。P0 可以先支持 solo run + required skills；只有 runtime facts 完整时才打开 roster、work board、handoff 和 review lane。
