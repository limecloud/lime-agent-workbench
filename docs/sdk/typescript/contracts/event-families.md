---
title: Event Families
description: Lime RuntimeEvent 事件族、scope id 与 projection 输出标准。
---

# Event Families

Lime AgentUI 的事件标准参考成熟 streaming SDK 的页面颗粒度，但事件事实源属于 Lime App Server / RuntimeCore。进入 SDK 前，所有 provider、host adapter、product app compat cache 都必须归一为 `AgentRuntimeExecutionEvent`。

实现锚点：`packages/agent-ui-contracts/src/runtime.ts`、`packages/agent-ui-contracts/src/validation.ts`。

## 标准事件族

| Family | Event class | Required scope | Projection output | Validation focus |
| --- | --- | --- | --- | --- |
| Lifecycle | `session.created`、`turn.submitted`、`turn.started`、`turn.completed`、`turn.failed` | `threadId`、`turnId` | `runtime`、`timeline`、`readModel` | terminal event 不重复、失败分类稳定。 |
| Model output | `model.requested`、`model.delta`、`model.completed`、`model.failed` | `messageId` in payload，建议带 `turnId` | `UIMessageParts` | delta 合并、final reconciliation、文本不重复。 |
| Reasoning | `reasoning.started`、`reasoning.delta`、`reasoning.completed` | `messageId` 或 `taskId` | `UIMessageParts.reasoning`、`ProcessTimeline` | 不泄露不可展示推理；只展示 summary。 |
| Tool | `tool.started`、`tool.result`、`tool.failed`、`tool.catalog.resolved` | `toolCallId` | `ToolGroup`、`ProcessTimeline`、`ExecutionGraph` | tool scope 必填，大输出走 refs。 |
| Action / HITL | `action.required`、`action.resolved` | `actionId` | `ActionRequired`、runtime waiting/completed | 点击不本地完成，必须等 runtime fact。 |
| Permission / sandbox | `permission.requested`、`permission.resolved`、`sandbox.applied`、`sandbox.violation` | `actionId` 或 `taskId` | `ActionRequired`、`diagnostics` | policy reason code 稳定。 |
| Context | `context.resolved`、`context.failed` | `threadId` 或 `taskId` | summary、diagnostics | 输入源数量与错误可恢复。 |
| Artifact | `artifact.changed`、`artifact.versioned`、`artifact.exported` | `artifactId` 或 `artifactRefs[]` | `ArtifactRefList`、message artifact card | 不内联大 payload。 |
| Evidence / review | `evidence.changed`、`evidence.exported`、`review.verdict` | `evidenceId`、`reviewId` | `EvidenceRefList`、review lane | 保留 replay / review correlation。 |
| Snapshot / repair | `snapshot.updated`、`stream.repaired` | `threadId`、cursor | hydration、read model repair | gap 检测、幂等去重。 |
| Team / subagent | `task.created`、`subagent.started`、`handoff.requested`、`review.verdict` | `taskId`、`subagentId`、`handoffId`、`reviewId` | `TeamWorkbench`、`ExecutionGraph` | lineage 不能由正文猜测。 |
| Diagnostics | `runtime.error`、`transport.error` | `threadId` 或 `turnId` | `diagnostics`、runtime failed/stale | 错误 code 稳定，不吞掉 transport failure。 |

## Scope id 规则

| Event family | Missing id behavior |
| --- | --- |
| `tool.*` 缺 `toolCallId` | validation 返回 `missing_scope_id`；UI 只能降级为 diagnostics。 |
| `action.*` 缺 `actionId` | validation 返回 `missing_scope_id`；不能进入 ActionRequired。 |
| `artifact.*` 缺 `artifactId` 且无 `artifactRefs` | validation 返回 `missing_scope_id`；不能进入 Artifact lane。 |
| `evidence.*` / `review.*` 缺 evidence / review scope | validation 返回 `missing_scope_id`；不能进入 Evidence lane。 |
| `subagent.*` 缺 `subagentId` 或 parent `taskId` | 可进入 degraded graph，但不能伪造 parent edge。 |

## Payload 边界

`payload` 只承载小型结构化事实，例如 `messageId`、`delta`、`failureCategory`、`decision`、`toolName`。以下内容禁止进入 payload：

- Provider key、token、secret、credential handle。
- 完整文件、图片、视频、长日志、原始 provider response。
- 需要由 artifact / evidence owner 管理的大对象。
- 产品 UI 展示文案的最终翻译结果。

大输出必须走 `refIds`、`artifactRefs`、`evidenceRefs`，由宿主应用通过 artifact workspace 或 evidence pack 打开。

## 与外部参考的关系

AG-UI 的 core 文档把 streaming event、类型和事件 reference 分开；AI SDK 的 UI message 也收敛到 parts。Lime 采用这种“结构化事实优先”的组织方式，但不采用外部 runtime owner。外部事件进入 Lime 后必须补齐 `session/thread/turn/task` scope、App Server read model 和 Evidence refs。

## 验证入口

```bash
npm --prefix packages/agent-ui-contracts run test
npm --prefix packages/agent-runtime-projection run test
```

新增事件族时还要同步：

1. `AgentRuntimeEventClass` 类型。
2. validation scope rule。
3. conformance fixture。
4. projection replay 断言。
5. React surface render smoke。
