---
title: 过程树
description: 专业过程组件的结构、状态和治理要求。
---

# 过程树

ProcessTree 是 Agent 工作过程的结构化投影，不是日志列表。它应支持 active run 的即时观察，也支持完成后的 timeline archive。

## Node model

| Field | Requirement |
| --- | --- |
| `nodeId` | 稳定 id，优先来自 `stepId`、`toolCallId`、`actionId`、`taskId`。 |
| `parentId` | 表达 step、tool、subagent、attempt、dependency 或 handoff 关系。 |
| `kind` | `status`、`reasoning`、`tool`、`action`、`artifact`、`evidence`、`task`、`diagnostic`。 |
| `phase` | `preparing`、`planning`、`acting`、`waiting`、`reviewing`、`completed`、`failed` 等。 |
| `owner` | runtime、tool、action、artifact、evidence、task、agent、diagnostics。 |
| `refs` | tool output、artifact、evidence、raw diagnostics、trace。 |

## Active vs archived

| Mode | Behavior |
| --- | --- |
| Active | 展示当前 running/waiting/blocked 节点，允许用户处理 approval、cancel、retry。 |
| Archived | 默认折叠为摘要，用户可展开 timeline detail。 |

## ViewTree requirement

如果要引入更专业的 ViewTree/Tree component，它必须服务这些 runtime 语义：

- 节点增量更新不会重排已完成事实。
- pending action 和 failed tool 有明确 attention state。
- artifact/evidence refs 可跳转到相邻 surface。
- 子代理、后台 job、team work item 不被压平成单层文本。
- 缺少 parent/ids 时渲染 degraded node，不伪造层级。

## Deprecated patterns

- 用字符串前缀、emoji、缩进或正则从正文生成过程树。
- 每个产品 App 自己实现一套 ProcessTree 节点模型。
- 工具成功只依赖 assistant 说“完成了”。
- 完成后丢弃过程，只保留最终文本。
