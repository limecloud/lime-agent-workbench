---
title: 人在回路
description: Approval、interrupt、structured input 与 resume 的标准边界。
---

# 人在回路

人工介入必须是 runtime action fact。UI 显示审批卡片，但不拥有审批结果。

## Action lifecycle

```text
action.required
  -> user approves / rejects / edits / answers
  -> respond_action
  -> action.resolved | action.cancelled | action.canceled | action.expired
  -> runtime resumes or fails
```

## Action types

| Type | Examples |
| --- | --- |
| Permission | 运行命令、访问网络、写文件、调用敏感工具。 |
| Structured input | 选择模型、确认素材、补充字段、选择引用。 |
| Plan review | 接受、修改、拒绝计划。 |
| Interrupt | 暂停、取消、转人工、恢复。 |
| Policy waiver | 临时放宽限制或确认风险。 |

## Action fact

```ts
interface ActionRequiredFact {
  actionId: string;
  threadId: string;
  turnId: string;
  owner: "runtime" | "tool" | "artifact" | "policy" | "subagent";
  actionType: "permission" | "structured_input" | "plan_review" | "interrupt" | "policy_waiver";
  status: "required" | "resolved" | "cancelled" | "expired";
  title: string;
  description?: string;
  inputSchema?: unknown;
  options?: Array<{ id: string; label: string; destructive?: boolean }>;
  refs?: Array<{ kind: string; id: string }>;
}
```

`inputSchema` 只描述用户需要补充的数据，不得包含 secret 默认值。需要调用敏感 capability 时，action fact 只引用 capability id 和 policy reason。

## 要求

- `actionId` 必须稳定。
- 未解决 action 不能当作 approved。
- 未解决 action 默认阻断同 turn 的继续执行；除非 runtime 明确发出 resume / override fact，否则 UI 不能本地推进下一步。
- UI optimistic state 必须在 runtime 返回 action terminal 后 reconcile。
- delegated approval 必须显示请求来源：tool、subagent、task 或 remote teammate。

## Resume Contract

v2.10 已把 AG-UI active run / interrupt / resume 的机制落成 Lime 合同。`@limecloud/agent-ui-contracts` 暴露 `AgentRuntimeResumeContract` / `AgentRuntimeResumeActionDecision`，并提供 checked-in JSON Schema 与 validation API。Lime 本体的 `agentSession/thread/resume` 可接收 `resumeContract`；RuntimeCore 在启动 queued turn 前校验 schema version、session match 和 open action coverage，失败时 fail closed。

- resume payload 必须覆盖目标 turn 内所有 open action，或者显式列出只恢复的 `actionId`。
- `resumeMode=all-open-actions` 或 `selected-actions` 时，`decisions[].actionId` 必须覆盖 `openActionIds` 的全部 id。
- action expiry 必须由 RuntimeEvent 表达，不能由 UI timeout 自动批准。
- cancel / interrupt 必须产生 terminal 或 blocked fact；UI 不能只停掉 spinner。
- 下一轮提交遇到 open action 时应 fail closed 或先要求 resume / cancel，不应静默开启并行隐式 run。

这部分当前是合同和 Lime current path 接入，不表示所有 runtime provider 已支持自动 resume negotiation。

## 失败模式

| 场景 | 标准行为 |
| --- | --- |
| 用户关闭页面 | action 保持 required，恢复时由 read model 显示。 |
| 用户拒绝 | 发 `respondAction(rejected)`，Runtime 决定 fail、retry 或替代路径。 |
| action 过期 | Runtime 发 `action.expired`，UI 不自动批准。 |
| policy 阻断 | 发 `permission.denied` 或 `sandbox.blocked`，UI 显示 blocked。 |
| optimistic UI 与 Runtime 返回不一致 | Runtime fact 覆盖 UI optimistic state。 |

## 产品应用 boundary

产品应用可以提供业务表单和文案，但提交后必须回到 RuntimeCore 或 action owner API。不能只改本地 React state。
