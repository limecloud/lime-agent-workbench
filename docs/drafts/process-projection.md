---
title: Process Projection
description: Runtime facts 到过程表面的标准投影草案。
---

# Process Projection

Process Projection 是 Runtime facts 到用户可见过程表面的标准投影。它不把某个 React tree component 提升为协议事实源。

## 标准分层

| 层 | 参考 | 职责 |
| --- | --- |
| `UIMessageParts` | AI SDK `UIMessage.parts` | text、reasoning、tool preview、artifact card、evidence citation 等消息级分片。 |
| `ProcessTimeline` | AG-UI event stream | 按 `sequence` 展示 run、status、tool、action、artifact、evidence。 |
| `ExecutionGraph` | Lime RuntimeCore | 展示 task、subagent、job、attempt、dependency、handoff 的结构关系。 |

## Timeline entry

| 字段 | 说明 |
| --- | --- |
| `entryId` | 稳定条目 id。 |
| `sequence` | RuntimeEvent 顺序。 |
| `kind` | status、reasoning、tool、action、artifact、evidence、task、diagnostic。 |
| `phase` | preparing、planning、acting、waiting、reviewing、completed、failed。 |
| `owner` | runtime、tool、action、artifact、evidence、task、agent。 |
| `refs` | tool output、artifact、evidence、diagnostics。 |

## Execution graph node

| 字段 | 说明 |
| --- | --- |
| `nodeId` | 稳定节点 id。 |
| `parentId` | turn、run、task、attempt、step、tool、subagent 或 dependency 父节点。 |
| `nodeType` | turn、run、task、subagent、job、attempt、step、tool、action。 |
| `status` | queued、running、waiting、blocked、completed、failed、cancelled。 |
| `refs` | timeline entries、artifact、evidence、diagnostics。 |

## 草案要求

- 不从正文、emoji、缩进或日志字符串生成结构。
- active run 展开当前关注事实，archived timeline 默认折叠。
- pending action、failed tool、blocked task 有明确 attention state。
- 子代理和后台 job 不能被压平成普通 assistant 文本。
- 过程组件可以用树、时间线、列表或工作板呈现，但只能消费投影状态。
