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

## ToolCallState

| 字段 | 用途 |
| --- | --- |
| `toolCallId` | 关联 args、progress、result、failure。 |
| `stepId` | 挂到 ProcessTree。 |
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

## 安全规则

Tool args、process env、raw Provider payload 可能包含敏感信息。默认只进 raw diagnostics ref，不进入 投影 state。
