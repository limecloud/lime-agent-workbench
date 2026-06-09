---
title: TypeScript SDK 总览
description: Lime TypeScript SDK 的规划边界。
---

# TypeScript SDK 总览

TypeScript SDK 是 产品应用 和 AgentUI 消费 Lime App Server 的薄 client，不是第二套 runtime。

## 包规划

| 包 | 目标 |
| --- | --- |
| `@lime-agent/runtime-client` | 调 App Server JSON-RPC、订阅 events、读取 read models。 |
| `@lime-agent/ui-projection` | 把 RuntimeEvent / ReadModel 投影为 AgentUI state。 |
| `@lime-agent/contracts` | 类型、schema、fixtures。 |

当前仓库先定义文档边界，代码包以后必须从现有 Lime App Server client 和 AgentUI 实现收敛，不直接套外部 SDK。
