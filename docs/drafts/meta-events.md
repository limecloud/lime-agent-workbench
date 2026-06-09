---
title: Meta Events
description: Event stream 自身的修复、压缩和诊断草案。
---

# Meta Events

Meta events 描述事件流自身，而不是 agent 业务过程。

## 候选事件

| 事件 | 用途 |
| --- | --- |
| `stream.gap.detected` | UI 或 client 发现 sequence gap。 |
| `stream.repair.started` | 开始 snapshot/read model 修复。 |
| `stream.repair.completed` | 修复完成并给出 cursor。 |
| `stream.compacted` | 长事件流被压缩为 summary/snapshot。 |
| `stream.replayed` | 回放完成，用于 evidence/review。 |

Meta events 只能辅助恢复和诊断，不能替代 RuntimeEvent 主事实。
