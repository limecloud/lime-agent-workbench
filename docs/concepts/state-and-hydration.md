---
title: 状态与恢复
description: UI state、runtime state 与历史恢复的分界。
---

# 状态与恢复

State 分三类：runtime truth、投影 state、local UI state。混在一起会导致恢复、回放和治理失败。

| 状态 | 拥有方 | 示例 |
| --- | --- | --- |
| Runtime truth | RuntimeCore / owner services | turn status、tool result、permission decision、artifact refs、evidence refs。 |
| Projection state | AgentUI adapter/reducer | UIMessageParts、ProcessTimeline、ExecutionGraph、tool rows、task capsules。 |
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

## Hydration 状态机

| 状态 | 含义 | UI 行为 |
| --- | --- | --- |
| `idle` | 尚未加载。 | 显示骨架或空态。 |
| `hydrating` | 正在读取 SessionSnapshot / ThreadReadModel。 | 禁止把旧本地缓存声明为 final。 |
| `live` | read model 与 event stream 已对齐。 | 正常展示 streaming 和操作。 |
| `stale` | sequence gap、stream 中断或 snapshot 过期。 | 标记 reconnecting，暂停 final reconciliation。 |
| `repairing` | 正在用 read API 补齐。 | 保留本地 UI state，重建投影 state。 |
| `degraded` | runtime 或 profile 不提供必要事实。 | 显示 unknown/unavailable，不伪造状态。 |

## Snapshot merge

Read model merge 必须遵守：

- Runtime facts 由 read model 覆盖或修正。
- Local UI state 不被 read model 覆盖。
- Draft input 不进入 runtime truth，除非用户提交。
- 未确认的 optimistic action 只能显示 pending，不能改写 action owner 状态。
- 如果 snapshot 比当前 event cursor 更旧，必须丢弃或标记 stale。

## Cursor 规则

| Cursor | 用途 |
| --- | --- |
| `historyCursor` | 加载更早 timeline / transcript。 |
| `eventCursor` | 从某个 sequence 继续订阅事件。 |
| `repairCursor` | 断流后请求缺失窗口。 |
| `snapshotVersion` | 判断 read model 是否比当前投影更新。 |

## 队列与转向

Queued turns、steering input、resume tokens 都是 runtime facts。composer 可以显示和提交 intent，但不能把本地 queue 当成 durable truth。

## 反模式

- 把 localStorage 里的 `messages` 当作恢复事实源。
- 用 React state 保存 tool completion，再从 UI 导出 evidence。
- 断流后继续把 delta 追加到 final answer。
- 用产品应用自己的 queue 替代 RuntimeCore queued turns。
