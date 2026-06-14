---
title: 工具
description: Tool call lifecycle、输出引用和权限边界。
---

# 工具

Tool call 是 runtime fact，不是 assistant message 的装饰。

## 生命周期

```text
tool.catalog.resolved
tool.started
tool.args
tool.progress*
tool.result | tool.failed
output.spilled?
artifact.changed?
evidence.changed?
```

## Runtime owner

工具生命周期的 owner 是 RuntimeCore 或 provider core，不是 React 组件、runtime client、产品应用 adapter。

所有工具面先进入统一 inventory 和解析层，再写出同一组 runtime facts：

| 工具面 | 进入方式 | 必需事实 |
| --- | --- | --- |
| MCP | `mcp__<server>__<tool>` 命名和 tool inventory。 | `tool.started`、`tool.args`、`tool.result/failed`、output refs。 |
| ACP / remote agent | capability / subagent bridge。 | `tool.*` + `subagent.*` / `task.*` correlation。 |
| skills | skill binding / SkillTool registry。 | `tool.*` + artifact/evidence refs。 |
| shell / command | policy + sandbox gate。 | `tool.*`、`command.*` 或 output refs、`permission.*`。 |
| project tools | workspace file / artifact owner。 | `tool.*` + `artifact.changed` / checkpoint refs。 |

approval、sandbox、retry、cancel、denial 都必须在 tool lifecycle 内收口。UI 可以显示 pending / blocked / failed，但不能在本地补 `tool.result` 或把 assistant 正文当工具结果。

## 入库约束

RuntimeCore 在接收 provider / external backend 事件时必须先验证工具归属，再写入 read model：

- `tool.args`、`tool.args.delta`、`tool.output.delta`、`tool.result`、`tool.failed` 必须先看到同 `toolCallId` 的 active `tool.started`。
- 带 `toolCallId` 的 `action.required`、`permission.denied`、`sandbox.blocked` 必须关联 active tool call，不能悬空挂在 turn 上。
- `action.required` 让 tool 进入 waiting；收到 `action.resolved` 前不得继续 `tool.output.delta`、`tool.result` 或 `tool.failed`。
- `action.cancelled` / `action.canceled` / `action.expired` / denied 后，工具只能失败或被取消，不能成功完成。
- 显式 owner 必须相邻一致：如果 `tool.started`、`tool.result` 或 `tool.failed` 携带 `messageId`、`itemId`、`assistantMessageId`，它们必须指向同一个 owning assistant item。
- MCP、ACP、skills、shell、project tools 只能映射成这套 lifecycle；不能各自实现一套 tool result 投影或本地完成态。

## ToolCallState

| 字段 | 用途 |
| --- | --- |
| `toolCallId` | 关联 args、progress、result、failure。 |
| `stepId` | 关联 ProcessTimeline entry 和 ExecutionGraph step node。 |
| `status` | pending、running、waiting、completed、failed、cancelled。 |
| `inputSummary` | 安全摘要，不含 secret。 |
| `outputRef` | 大输出或原始输出引用。 |
| `artifactRefs` | 工具产物。 |
| `evidenceRefs` | 工具证据、trace、review。 |
| `permissionActionId` | 需要审批时链接 action。 |

## UI 规则

- ToolGroup 显示安全摘要和状态，详情按需加载。
- 工具输出过大时必须使用 ref。
- 工具失败要保留 failure category 和 recovery action。
- tool event 可以产生 artifact/evidence，但 artifact/evidence owner 不变。
- `tool.args` 与 `tool.result/failed` 必须能用 `toolCallId` 相邻关联；如果流断开，projection 标记 stale 并读取 read model repair，不猜测工具是否完成。

## 安全规则

Tool args、process env、raw Provider payload 可能包含敏感信息。默认只进 raw diagnostics ref，不进入 投影 state。
