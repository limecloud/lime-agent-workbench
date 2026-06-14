---
title: Agents
description: Lime 中 agent、subagent、teammate 与 task 的边界。
---

# Agents

在 Lime 中，Agent 不是一个 UI 名称，而是 RuntimeCore 可追踪的执行实体。只要它能独立接受目标、产生事件、调用工具或交付产物，就必须有稳定 identity。

## Lime 规则

| 概念 | Runtime 事实 | UI 投影 |
| --- | --- | --- |
| 前台 Agent | `threadId`、`turnId`、`runId` | conversation、runtime status。 |
| 子代理 | `subagentId`、parent links | SubagentsView、delegation graph。 |
| 后台任务 | `taskId`、`jobId` | task capsule、projection activity。 |
| 远程 Agent | `channelId`、peer ids | remote teammate。 |

UI 不能把所有 worker 压平成一个匿名 assistant。只要 Runtime 暴露 agent/task identity，AgentUI 必须保留 ownership 和 lineage。

## 不做什么

- 不用一段助手正文代表子代理完成。
- 不把 teammate notification 当作真实用户消息。
- 不让 产品应用 自己维护 agent completion truth。
