---
title: UIMessageParts
description: 消息内容与过程事实的边界。
---

# UIMessageParts

UIMessageParts 只表达会话中的可读内容和可引用摘要，参考 AI SDK `UIMessage.parts` 的消息分片模型。它不应该承载工具成功、审批结果、artifact kind、evidence verdict 或 routing state。

## 分片类型

| 分片 | 来源 | 规则 |
| --- | --- | --- |
| `text` | user input snapshot、`model.delta` / final text fact | 可进入 transcript；final 负责 reconciliation。 |
| `reasoning` | `reasoning.summary` | 默认折叠，不输出 raw chain of thought。 |
| `tool-preview` | `tool.result` summary | 以 ref 链接 ToolGroup，不复制大输出。 |
| `artifact-card` | `artifact.changed` | 进入 artifact surface，可在 message 中引用。 |
| `evidence-citation` | `evidence.changed` | 进入 evidence surface，可在 message 中引用。 |
| `diagnostic-ref` | `runtime.warning/error` | 只显示诊断入口，不进入正常正文。 |

## Part model

```ts
type UIMessagePart =
  | { type: "text"; partId: string; messageId: string; text: string; state: "streaming" | "final" }
  | { type: "reasoning"; partId: string; summary: string; encryptedRef?: string }
  | { type: "tool-preview"; partId: string; toolCallId: string; outputRef?: string; status: ToolStatus }
  | { type: "artifact-card"; partId: string; artifactId: string; versionId?: string }
  | { type: "evidence-citation"; partId: string; evidenceId: string; verdict?: string }
  | { type: "diagnostic-ref"; partId: string; diagnosticId: string };
```

Lime 可以映射到 AI SDK 的 `UIMessage.parts`，但不会把全部 runtime truth 塞进 message。消息只是用户可读层，工具、审批、产物、证据仍各有 owner。

## 流式与最终内容对齐

Streaming text 与 final text 必须 reconcile：

```text
text.delta* -> text.final -> message part finalized
```

不能在已流式输出文本后把 final completion 再追加一次。final event 应确认、修正或替换同一 `messageId/partId` 的内容。

## Multimodal input

用户输入可以包含文本、图片、音频、视频、文档和业务引用，但进入 RuntimeEvent 时必须拆清楚：

| 输入 | 规则 |
| --- | --- |
| 文本 | 可直接进入 user text part。 |
| 图片 / 音频 / 视频 / 文档 | 使用 upload/asset/document ref，不把大 bytes 放入消息状态。 |
| 业务对象 | 使用 workspace/product/material/campaign ref，由产品应用 owner 解析。 |
| 敏感附件 | 只传授权后的 capability ref，不传本地绝对路径或 secret。 |

## Worker 通知

即使来源 transport 把 worker notification 放在 user-role channel，AgentUI 也不能把它当真实用户消息。它应投影到 task/agent/team surface，并链接到 worker result 或 transcript refs。

## 禁止事项

- 从 assistant text 中解析 artifact 类型、tool success、approval decision。
- 把 reasoning delta 当最终回答展示。
- 把 diagnostics 或 raw provider payload 放进正常 transcript。
- 用 message part 保存 UI collapse、focus 或 selected tab。
