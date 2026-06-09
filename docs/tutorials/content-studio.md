---
title: Content Studio 接入
description: Content Studio AI agents 工作台如何接入 Lime Runtime 和 AgentUI。
---

# Content Studio 接入

Content Studio 的目标不是重做聊天页，而是把 `AI agents` 工作台接到 Lime App Server Runtime 和共享 AgentUI。

## 步骤

1. 通过 Host Snapshot 确认 provider readiness。
2. 调 `lime.agent` capability 发起 turn。
3. 只传业务上下文、provider/model preference，不传 key。
4. 订阅 RuntimeEvent stream。
5. 读取 ThreadReadModel / TaskSnapshot。
6. 使用共享 AgentUI 投影 渲染 MessageParts、ProcessTree、ToolGroup、ActionRequired、ArtifactRef、EvidenceRef。

## 兼容路径

旧 `messages` 和 `executionEvents` 只能作为 compat cache。缺字段时显示 unknown/unavailable/blocked/stale，不能从助手正文推断完成状态。
