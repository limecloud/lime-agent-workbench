---
title: 过程投影
description: 专业过程表面的结构、状态和治理要求。
---

# 过程投影

过程投影是 Runtime facts 到用户可见过程表面的标准映射，不是日志列表，也不是新的 runtime truth。它应支持 active run 的即时观察、完成后的 timeline archive，以及 task / subagent / job / attempt / dependency 的结构化查看。

## 标准分层

| 层 | 参考 | 职责 |
| --- | --- |
| `UIMessageParts` | AI SDK `UIMessage.parts` | text、reasoning summary、tool preview、artifact card、evidence citation 等消息级分片。 |
| `ProcessTimeline` | AG-UI event stream | 按 `sequence` 展示 run、status、reasoning、tool、action、artifact、evidence 和 diagnostics。 |
| `ExecutionGraph` | Lime RuntimeCore | 展示 task、subagent、job、attempt、dependency、handoff 的结构关系。 |

## Timeline entry model

| 字段 | 要求 |
| --- | --- |
| `entryId` | 稳定 id，优先来自 `eventId`、`stepId`、`toolCallId`、`actionId`、`artifactId`、`evidenceId`。 |
| `sequence` | 来自 RuntimeEvent，保证流式顺序和回放顺序一致。 |
| `kind` | `status`、`reasoning`、`tool`、`action`、`artifact`、`evidence`、`task`、`diagnostic`。 |
| `phase` | `preparing`、`planning`、`acting`、`waiting`、`reviewing`、`completed`、`failed` 等。 |
| `owner` | runtime、tool、action、artifact、evidence、task、agent、diagnostics。 |
| `refs` | tool output、artifact、evidence、raw diagnostics、trace。 |

## Execution graph node model

| 字段 | 要求 |
| --- | --- |
| `nodeId` | 稳定 id，优先来自 `taskId`、`runId`、`attemptId`、`stepId`、`toolCallId`、`actionId`。 |
| `parentId` | 表达 task、run、attempt、step、tool、subagent、dependency 或 handoff 关系。 |
| `nodeType` | `turn`、`run`、`task`、`subagent`、`job`、`attempt`、`step`、`tool`、`action`。 |
| `status` | `queued`、`running`、`waiting`、`blocked`、`completed`、`failed`、`cancelled`。 |
| `refs` | timeline entries、artifact refs、evidence refs、diagnostics refs。 |

## Active vs archived

| Mode | Behavior |
| --- | --- |
| Active | 展示当前 running/waiting/blocked 事实，允许用户处理 approval、cancel、retry。 |
| Archived | 默认折叠为摘要，用户可展开 timeline detail 或 graph detail。 |

## 组件要求

专业过程组件可以选择树、时间线、列表或工作板形态，但必须服务这些 runtime 语义：

- 节点增量更新不会重排已完成事实。
- pending action 和 failed tool 有明确 attention state。
- artifact/evidence refs 可跳转到相邻 surface。
- 子代理、后台 job、team work item 不被压平成单层文本。
- 缺少 parent/ids 时渲染 degraded node，不伪造层级。

## Deprecated patterns

- 用字符串前缀、emoji、缩进或正则从正文生成过程结构。
- 每个产品 App 自己实现一套过程节点模型。
- 工具成功只依赖 assistant 说“完成了”。
- 完成后丢弃过程，只保留最终文本。

## Dead patterns

- 把任意组件树名称作为 Lime 标准协议名或 runtime 事实名。
- 让模型直接生成任意组件树并拥有状态真相。
