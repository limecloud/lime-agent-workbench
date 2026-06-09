---
title: 消息分片
description: 消息内容与过程事实的边界。
---

# 消息分片

MessageParts 只表达会话中的可读内容。它不应该承载工具成功、审批结果、artifact kind、evidence verdict 或 routing state。

## 分片类型

| 分片 | 来源 | 规则 |
| --- | --- | --- |
| User text | user input snapshot | 可进入 transcript。 |
| Assistant text | `model.delta` / `text.final` | 只承载最终回答。 |
| Reasoning summary | `reasoning.summary` | 默认进入 process，不进入 final answer。 |
| Tool preview | `tool.result` summary | 以 ref 链接 ToolGroup，不复制大输出。 |
| Artifact card | `artifact.changed` | 进入 artifact surface，可在 message 中引用。 |
| Evidence citation | `evidence.changed` | 进入 evidence surface，可在 message 中引用。 |
| Diagnostics | `runtime.warning/error` | 进入 diagnostics，不进入正常正文。 |

## 流式与最终内容对齐

Streaming text 与 final text 必须 reconcile：

```text
text.delta* -> text.final -> message part finalized
```

不能在已流式输出文本后把 final completion 再追加一次。final event 应确认、修正或替换同一 `messageId/partId` 的内容。

## Worker 通知

即使来源 transport 把 worker notification 放在 user-role channel，AgentUI 也不能把它当真实用户消息。它应投影到 task/agent/team surface，并链接到 worker result 或 transcript refs。
