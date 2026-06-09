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
  -> action.resolved
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
- UI optimistic state 必须在 runtime 返回 `action.resolved` 后 reconcile。
- delegated approval 必须显示请求来源：tool、subagent、task 或 remote teammate。

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
