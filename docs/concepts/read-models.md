---
title: 读模型
description: Runtime read models 是 UI 快速恢复和治理验证的基础。
---

# 读模型

Event stream 必要但不充分。UI 不能每次打开 session 都重放全量历史，也不能用本地 state 自己恢复 truth。Runtime 必须提供有边界的 read models。

## 必需读模型

| 读模型 | 用途 |
| --- | --- |
| `SessionSnapshot` | session shell、threads、recent history、task/evidence refs、recovery cursor。 |
| `ThreadReadModel` | current status、active turn、queued turns、pending actions、incidents、tool calls、last outcome。 |
| `TaskSnapshot` | objective、status、attempts、dependencies、progress、outputs、artifacts、evidence refs。 |
| `PermissionSandboxSummary` | permission mode、pending approvals、decisions、sandbox 剖面、violations。 |
| `RoutingLimitSummary` | task 剖面、candidate count、selected model、fallback/no-candidate、cost/quota/rate limit。 |
| `EvidenceSummary` | evidence pack refs、replay refs、review refs、verification outcomes、known gaps。 |
| `BenchmarkSummary` | dataset/config/trial/reward/comparison facts。 |

## Read model 契约

Read model 必须来自 runtime facts，而不是 UI 投影 反写。它可以为了性能做摘要，但不能改变 owner。

```text
RuntimeEvent log
  -> Snapshot projector
  -> ThreadReadModel / TaskSnapshot / summaries
  -> AgentUI 投影 hydration
```

## 窗口详情

老 session 打开时推荐分层读取：

1. `listSummary`：侧边栏和 tabs。
2. `sessionSnapshot`：shell 和近期状态。
3. `windowDetail`：最近 N 条 messages、最小 process refs、active task state。
4. `timelinePage`：用户展开时按 cursor 拉历史过程。
5. `artifactPreview` / `evidenceJob`：按需加载产物和证据。

## 反模式

单个 `getSession` 返回所有 messages、tool output、artifact content、evidence detail，会同时伤害性能和治理。它也会诱导客户端把完整 session detail 当成新的事实源。
