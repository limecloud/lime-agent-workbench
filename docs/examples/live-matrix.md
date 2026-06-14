---
title: 活体 Demo 矩阵
description: v2.7 用于扩展 Workbench 活体闭环的 runtime event family 矩阵。
---

# 活体 Demo 矩阵

`/examples/subagents-live-loop` 已证明单一 `subagent-handoff` fixture 能跑通：

```text
fixture -> schema gate -> sequence verifier -> replay -> projection -> UI surface
```

v2.7 的目标是把这个单点扩成矩阵，避免 Workbench 只在 Subagents 场景“看起来活着”。

<ClientOnly>
  <LiveMatrix />
</ClientOnly>

## 矩阵

| 场景 | 输入事实 | 必须证明 |
| --- | --- | --- |
| `text-basic` | `turn.started`、`message.delta`、`turn.completed` | 文本流先过 verifier，再进入 projection；完成态不靠 timeout 合成。 |
| `tool-success` | `tool.started`、`tool.result` | tool 配对合法，timeline / tool group 可展开。 |
| `tool-failure` | `tool.started`、`tool.failed` | failed 终态不丢失，recovery / diagnostics 可见。 |
| `hitl-action` | `action.required`、`action.resolved` | pending action 未收到 action terminal 前保持等待态，terminal 后退出 waiting。 |
| `artifact-evidence` | `artifact.changed`、`evidence.changed` | refs 不内联大内容，UI 只跳转 owner surface。 |
| `stream-repair` | sequence gap、`snapshot.updated` | hydration 从 stale/repairing 回到 live，不重复追加文本。 |
| `state-delta` | `state.delta` RFC 6902 patch | Rust/App Server schema gate、projection apply、stale diagnostics 都可被验证。 |
| `bad-stream` | 孤立 `tool.result` 或非法 `state.delta` | fail closed，坏流不进入 projector，也不污染 App Server session state。 |

## 验收顺序

```text
Rust/App Server schema gate
  -> TypeScript JSON Schema / validation
  -> Sequence Verifier
  -> replayAgentUiFixture / projectAgentUiState
  -> React surface smoke
```

Rust/App Server 已在入库前同时执行 schema gate 与 sequence gate；TypeScript Sequence Verifier 仍是 conformance runner、runtime-client 和文档站矩阵的可执行事实源。两侧必须保持同一配对语义，不新增另一套规则。
