---
title: ViewTree / ProcessTree
description: 专业过程组件的草案节点模型。
---

# ViewTree / ProcessTree

用户提到的 ViewTree 不是装饰组件，而是 AgentRuntime facts 的结构化投影。

## 节点契约

| 字段 | 说明 |
| --- | --- |
| `nodeId` | 稳定节点 id。 |
| `kind` | status、reasoning、tool、action、artifact、evidence、task、agent。 |
| `owner` | runtime、tool、action、artifact、evidence、task、agent。 |
| `phase` | preparing、planning、acting、waiting、reviewing、completed、failed。 |
| `parentId` | turn、step、attempt、tool、subagent 或 dependency 父节点。 |
| `refs` | tool output、artifact、evidence、diagnostics。 |

## 草案要求

- 不从正文、emoji、缩进或日志字符串生成结构。
- active run 展开当前关注节点，archived timeline 默认折叠。
- pending action、failed tool、blocked task 有明确 attention state。
- 子代理和后台 job 不能被压平成普通 assistant 文本。
