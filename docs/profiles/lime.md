---
title: Lime 剖面
description: Lime current AgentRuntime 与 AgentUI 的产品剖面。
---

# Lime 剖面

Lime 剖面是本工作台的主产品剖面。它比通用协议更严格，因为 Lime 要治理真实产品代码库。

## 底层 Runtime 参考

Lime 底层 AgentRuntime 的设计会更多参考本地 Rust 执行型 runtime，但事实源仍以 Lime 当前实现为准。参考对象是执行循环、工具治理和安全边界，不是直接复用外部协议类型或包结构。

| Runtime 参考面 | Lime 采纳方式 | Lime 事实源 |
| --- | --- | --- |
| Submission Queue / Event Queue | turn 输入与 runtime event 输出分离，支持异步执行和恢复。 | App Server JSON-RPC + RuntimeEvent stream。 |
| `TurnItem` / response item mapping | 将 user、assistant、reasoning、plan、tool、file change、compaction 等归一化。 | `UIMessageParts`、`ProcessTimeline`、`ExecutionGraph`。 |
| approval / guardian / exec policy | command、network、MCP tool、permission escalation 进入 action/policy facts。 | `action.*`、`permission.*`、`sandbox.*`、policy service。 |
| sandbox / permission profile | 文件系统、网络、命令执行和权限提升必须可解释、可拒绝、可审计。 | Desktop Host policy + App Server RuntimeCore。 |
| tool lifecycle / MCP | 工具调用有稳定 id、参数、状态、输出、失败分类。 | Tool inventory、ToolGroup、`tool.*` events。 |
| context compaction / history | 历史压缩和上下文注入是 runtime facts，不是 UI 字符串拼接。 | `context.*`、`history.*`、ThreadReadModel。 |
| app-server protocol / schema fixtures | 协议、schema、fixture 必须可导出、可校验、可回放。 | Lime contracts、fixtures、conformance。 |

底层执行型 runtime 是工程参考，不是 Lime 的产品标准名。进入 Lime 主链后，一切仍必须落到 App Server、RuntimeCore、ExecutionBackend、AgentUI 投影和治理分类。

## 当前执行主链

```text
Objective
  -> Session
  -> Thread
  -> Turn
  -> Step / Item
  -> ToolCall / Action / Process / Subagent
  -> RuntimeEvent
  -> Snapshot / ThreadReadModel / TaskSnapshot
  -> EvidencePack / Replay / Review / UI 投影
```

## 当前实现边界

```text
App surface / Electron Desktop Host bridge
  -> App Server JSON-RPC
  -> RuntimeCore
  -> ExecutionBackend
  -> Tool / Skill / Workspace / Artifact / Evidence / Policy services
```

Claw 与 Agent App 对话不再拥有第二套 runtime。当前唯一对话主链是：

```text
Frontend / Claw / Agent App
  -> runtime client / session gateway
  -> App Server agentSession/*
  -> RuntimeCore
  -> ExecutionBackend
  -> RuntimeEvent schema + sequence gate
  -> ThreadReadModel
  -> AgentUI projection
```

这条链路的工程含义：

- `current`：App Server JSON-RPC、RuntimeCore、ExecutionBackend、AgentUI projection、evidence/replay/review。
- `compat`：旧 `agent_runtime_*` facade、产品本地 session shell、历史 adapter。它们只允许委托和形状投影。
- `dead`：生产 mock fallback、UI 本地 runtime truth、产品应用直连 Provider、第二套 tool/action/projection owner。

## 必需事实

Lime 剖面核心要求这些事件族：

- `session.*`、`thread.*`、`turn.*`
- `task.*`、`task.attempt.*`、`run.status`
- `model.*`、`reasoning.*`
- `tool.*`、`process.*`、`output.*`
- `action.*`、`permission.*`、`sandbox.*`、`hook.*`
- `context.*`、`history.*`
- `routing.*`、`cost.*`、`quota.*`、`limit.changed`
- `subagent.*`、`job.*`、`channel.*`
- `artifact.changed`、`evidence.changed`、`snapshot.updated`
- `runtime.warning`、`runtime.error`

## Runtime item 到 Lime facts 的映射

| 执行型 runtime item / event | Lime facts | UI 投影 |
| --- | --- | --- |
| UserMessage | `turn.submitted`、`messages.snapshot` | UIMessageParts user part。 |
| AgentMessage | `model.delta`、`model.completed` | UIMessageParts assistant text。 |
| Reasoning / Plan | `reasoning.*`、`plan.*`、`run.status` | ProcessTimeline reasoning/plan entry。 |
| WebSearch / MCP tool call | `tool.*`、`output.spilled`、`evidence.changed` | ToolGroup、ProcessTimeline、EvidenceRef。 |
| FileChange / patch apply | `tool.*`、`artifact.changed`、`permission.*` | ToolGroup、ArtifactRef、ActionRequired。 |
| ContextCompaction | `history.compacted`、`context.attached`、`snapshot.updated` | Hydration/diagnostics。 |
| Guardian / approval request | `action.required`、`permission.*`、`sandbox.*` | ActionRequired、RuntimeStatus。 |

## 所有权

| 对象 | 拥有方 |
| --- | --- |
| Runtime 事实 | RuntimeCore |
| Provider Key | App Server Provider store |
| Host lifecycle | Desktop Host |
| Projection | AgentUI |
| 产品上下文 | 产品应用 |
| Evidence verdict | Evidence/review service |

## 硬规则

- 缺失 correlation 是 degraded fact。
- 产品应用 不得 import 内部 runtime 实现。
- 产品应用 不得把 retired desktop command path 当 current API。
- UI-only state 不能修改 runtime truth。
- Evidence/replay/review 必须消费同一组 runtime facts。
- RuntimeCore 拥有 session 单 active turn gate；UI/SDK 不能用本地队列合并并发 turn 后再伪造完成态。
- Tool lifecycle 必须由 RuntimeCore / provider core 统一拥有；MCP、ACP、skills、shell、project tools 不能各自输出不相邻、不可 replay 的结果。
- RuntimeCore event append 必须 batch atomic；坏事件不能部分写入 `StoredSession.events` 或提前推进 turn/read model。
- Tool lifecycle owner guard、approval gate 和 tool owner adjacency 是 Claw loop 的后端事实源，不是 AgentUI projection 的补丁逻辑。
- RuntimeBackend 必须把 `ToolEnd { result.success: false }` 输出为 `tool.failed`，保留 `failureCategory` / `error` / `output`；失败工具不能被 Claw UI 或 AgentUI projection 当成成功 `tool.result`。
