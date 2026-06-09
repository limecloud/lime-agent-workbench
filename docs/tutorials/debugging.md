---
title: 调试 Runtime 事件
description: 如何检查 Lime Agent 事件、读模型和投影问题。
---

# 调试 Runtime 事件

调试顺序应从事实源开始，而不是从 UI 截图开始。

## Checklist

1. 事件是否有 `sessionId/threadId/turnId/eventId/sequence/type`。
2. tool/action/artifact/evidence 是否有对应 id。
3. ThreadReadModel 是否能恢复 active turn。
4. Projection 是否把 text、reasoning、tool、action、artifact、evidence 分开。
5. UI 是否从 prose 推断状态。
6. 生产路径是否依赖 mock。

## 常见问题

| 现象 | 优先检查 |
| --- | --- |
| 过程树混乱 | `stepId`、parent relation、sequence。 |
| 工具状态不可信 | `toolCallId`、`tool.result` / `tool.failed`。 |
| 审批卡片消失 | `actionId`、pending actions read model。 |
| 旧会话恢复慢 | window detail、timeline pagination。 |
