---
title: Runtime client
description: TypeScript Runtime client 的边界。
---

# Runtime client

Runtime client 只封装 App Server JSON-RPC 和事件订阅。

## 必需能力

- `startTurn`
- `cancelTurn`
- `respondAction`
- `readThread`
- `subscribeEvents`
- `exportEvidence`

Client 不缓存 Provider Key，不实现 runtime 状态机，不生成 UI 投影。
