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

## 要求

- `actionId` 必须稳定。
- 未解决 action 不能当作 approved。
- UI optimistic state 必须在 runtime 返回 `action.resolved` 后 reconcile。
- delegated approval 必须显示请求来源：tool、subagent、task 或 remote teammate。

## 产品应用 boundary

产品应用可以提供业务表单和文案，但提交后必须回到 RuntimeCore 或 action owner API。不能只改本地 React state。
