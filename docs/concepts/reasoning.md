---
title: Reasoning
description: Reasoning、plan、status 与最终回答的边界。
---

# Reasoning

Reasoning 不等于最终回答。Lime UI 需要展示可解释过程，但不能泄漏或伪造模型内部链路。

## 投影规则

| 来源事实 | UI 表面 |
| --- | --- |
| `reasoning.delta` | active ProcessTimeline entry。 |
| `reasoning.summary` | UIMessageParts reasoning part，默认折叠。 |
| `run.status` | runtime status。 |
| `plan.delta` / `plan.final` | plan review 或 ProcessTimeline entry。 |
| `model.delta` | final answer UIMessageParts。 |

Reasoning 默认不进入最终正文。最终正文只来自明确的 answer/text facts。

## Lime 要求

- 过程可见，但不输出 raw chain of thought。
- plan、status、tool、action 分开投影。
- final reconciliation 防止重复追加文本。
