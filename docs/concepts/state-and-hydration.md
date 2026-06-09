---
title: 状态与恢复
description: UI state、runtime state 与历史恢复的分界。
---

# 状态与恢复

State 分三类：runtime truth、投影 state、local UI state。混在一起会导致恢复、回放和治理失败。

| 状态 | 拥有方 | 示例 |
| --- | --- | --- |
| Runtime truth | RuntimeCore / owner services | turn status、tool result、permission decision、artifact refs、evidence refs。 |
| Projection state | AgentUI adapter/reducer | message parts、process nodes、tool rows、task capsules。 |
| Local UI state | UI controller | selected tab、expanded node、draft、focused artifact。 |

## 恢复流程

```text
open session
  -> load SessionSnapshot
  -> load ThreadReadModel
  -> load recent window detail
  -> reconstruct 投影
  -> mark stale/degraded gaps
  -> subscribe new events
```

## 修复

如果 event stream 中断或 sequence gap 出现，UI 应：

1. 暂停把新事件提升为 final state。
2. 请求 snapshot/read model repair。
3. 标记 stale 或 reconnecting。
4. 用 read model 重新 reconcile 投影。

## 队列与转向

Queued turns、steering input、resume tokens 都是 runtime facts。composer 可以显示和提交 intent，但不能把本地 queue 当成 durable truth。
