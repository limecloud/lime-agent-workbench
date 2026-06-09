---
title: 生成式 UI
description: Lime 如何看待 generative UI 与共享 AgentUI 表面。
---

# 生成式 UI

生成式 UI 可以作为未来能力，但不能绕过 Lime AgentUI 投影契约。

## 当前边界

- current：共享 AgentUI surfaces，消费 RuntimeEvent / ReadModel。
- proposal：agent 输出受约束的 UI intent，由 App 验证后挂载。
- dead：模型直接生成任意组件树并拥有状态真相。

## 原则

1. UI schema 只描述展示意图，不拥有 runtime truth。
2. 所有用户写操作回到拥有方 API。
3. 生成式 UI 只能引用 artifact/evidence/tool/action ids。
4. 缺失事实时 degraded，而不是模型补编。
