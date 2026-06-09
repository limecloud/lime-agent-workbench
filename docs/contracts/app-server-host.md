---
title: App Server 宿主
description: Host、产品应用 与 App Server 的运行边界。
---

# App Server 宿主契约

App Server 是 Lime runtime current 写入边界。Desktop Host 和 产品应用 只能通过 host capability 或 App Server client 接入。

## Host 职责

- 启动、停止、监控 App Server sidecar。
- 提供 Host Snapshot：runtime readiness、Provider readiness、capabilities、data root。
- 转发 JSON-RPC 或 capability invoke。
- 拥有 Provider settings UI、账号、billing、host policy。
- 不复制 runtime business logic。

## App Server 职责

- 拥有 Provider store。
- 拥有 RuntimeCore facts。
- 提供 `agentSession/turn/start`、`agentSession/event`、`agentSession/read` 等 current API。
- 写入 runtime events、read models、artifact/evidence refs。
- 对 产品应用 fail closed，不从本地 key/env key 偷读凭证。

## 产品应用 responsibilities

- 提供业务上下文。
- 发起 turn、cancel、resume、respond action。
- 消费 AgentUI 投影。
- 在 hosted mode 下迁移旧 key 后清除本地 key。

## 必需失败模式

| 失败 | 必需行为 |
| --- | --- |
| Provider not ready | 返回 needs-setup / blocked，不读取 产品应用 local key。 |
| Host capability missing | 标记 unavailable，提示进入平台设置或 standalone fallback。 |
| Runtime stream interrupted | UI 标记 stale 并走 read model repair。 |
| Action unresolved | 保持 waiting，不当作 approved。 |
| Mock backend only | 生产路径 fail closed。 |
