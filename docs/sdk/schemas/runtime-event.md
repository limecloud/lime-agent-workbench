---
title: 事件 Schema
description: RuntimeEvent schema 的对齐入口。
---

# 事件 Schema

RuntimeEvent schema 是跨语言 runtime provider、fixture、verifier 和 projection 的共同边界。TypeScript 类型仍由 `@limecloud/agent-ui-contracts` 暴露；JSON Schema 是它的可执行发布形态，不能另写一套语义。

v2.6 后，Lime Rust/App Server 已把这份 schema 接到 current 入库边界：`RuntimeCore` 在保存 `AgentEvent` 前，先把 App Server event 规范化为 Workbench `AgentRuntimeExecutionEvent` 形状并校验；`state.delta` payload 还会额外通过 state delta schema。校验失败时 fail closed，不写入 session state，也不会继续发给 UI。

v2.8 后，同一入库边界还会执行 AgentUI sequence gate：`tool.result/failed` 必须有同 turn `tool.started`，`action.required` 必须由 `action.resolved / action.cancelled / action.canceled / action.expired` 收口，turn terminal 前 active tool/action 必须收口，终态后执行流不能继续污染 state。sequence violation 同样 fail closed，且发生在 turn/session 状态迁移前。

v2.10 后，runtime/provider 能力与 resume 也有可执行合同：`AgentRuntimeCapabilityManifest` 固定 runtime 声明能力，`AgentRuntimeResumeContract` 固定 open action 覆盖规则。Lime App Server `capability/list` 会返回 `runtimeCapabilityManifest`，`agentSession/thread/resume` 可接收 `resumeContract` 并在 RuntimeCore 启动 queued turn 前校验。

## 当前 Schema 集

| Schema | 覆盖范围 | 入口 |
| --- | --- | --- |
| `agentruntime-event.schema.json` | 标准 `AgentRuntimeExecutionEvent` envelope、scope id、sequence、时间戳和 typed payload。 | runtime provider、fixture validation、conformance runner。 |
| `agentruntime-lime-profile-event.schema.json` | Lime profile 的 event families：`turn.*`、`model.*`、`tool.*`、`action.*`、`task.*`、`subagent.*`、`channel.*`、`handoff.*`、`review.*`、`artifact.*`、`evidence.*`、`snapshot.*`、`state.delta`。 | App Server / RuntimeCore adapter 与 AgentUI projection。 |
| `agent-runtime-capability-manifest.v0.1.schema.json` | Runtime / provider capability manifest：transport、tools、state.delta、reasoning、multimodal、HITL、subagents、evidence 等支持面。 | `capability/list`、runtime provider readiness、UI capability enablement。 |
| `agent-runtime-resume-contract.v0.1.schema.json` | Resume contract：`all-open-actions` / `selected-actions` 必须覆盖所有 `openActionIds`。 | `agentSession/thread/resume`、HITL resume / cancel / interrupt gate。 |

## 最小约束

每个 runtime event 必须满足：

```json
{
  "id": "evt_01",
  "eventClass": "tool.started",
  "schemaVersion": "2.2",
  "sequence": 12,
  "threadId": "thread_01",
  "turnId": "turn_01",
  "toolCallId": "tool_01",
  "createdAt": "2026-06-12T00:00:00.000Z",
  "payload": {}
}
```

| 字段 | 规则 |
| --- | --- |
| `id` | 全局稳定，Sequence Verifier 用它拒绝重复事件。 |
| `eventClass` | 细粒度事件族；不得只靠 `kind/status` 让 projector 猜语义。 |
| `schemaVersion` | 当前文档闭环使用 `2.2+`，变更字段语义必须升级。 |
| `sequence` | 同一 stream 内单调递增；乱序进入 repair / stale，不由 UI 重排事实。 |
| scope id | `tool.*` 必须有 `toolCallId`，`action.*` 必须有 `actionId`，`subagent.*` 必须有 `subagentId` 和可 join 的 `taskId` 或 parent id。 |
| `payload` | 只允许小型结构化摘要；secret、大文件、完整 Provider response 必须转成 refs。 |

## `state.delta`

`state.delta` 是 v2.2 的字段级 patch 事件，用来表达可 replay 的 read-model / projection 修复，不替代业务事件。

```json
{
  "id": "evt_delta_01",
  "eventClass": "state.delta",
  "schemaVersion": "2.2",
  "sequence": 28,
  "threadId": "thread_01",
  "turnId": "turn_01",
  "createdAt": "2026-06-12T00:00:05.000Z",
  "payload": {
    "target": "projection.subagents.threads",
    "ops": [
      {
        "op": "replace",
        "path": "/items/0/status",
        "value": "completed"
      }
    ],
    "baseCursor": "cursor_27"
  }
}
```

规则：

- `target` 必须指向已定义 read-model 或 projection 子树，例如 `readModel.tasks`、`projection.subagents.threads`、`projection.graph`。
- `ops` 使用字段级 patch；不能用整块 opaque JSON 覆盖 runtime facts。
- `baseCursor` 或等价 cursor 必须可用于判断 patch 是否适用于当前状态。
- `state.delta` 只能修复派生 state 或 read-model cache，不能伪造 `tool.result`、`action.resolved`、`action.canceled`、`subagent.completed` 等业务事实。
- projector 应在应用 patch 前先通过事件 schema 与 Sequence Verifier；patch 失败时进入 `stale` 诊断，不污染目标 state。

## 校验顺序

```text
JSON Schema
  -> Runtime sequence verifier
  -> fixture replay / App Server facts adapter
  -> AgentUiProjectionState
```

JSON Schema 负责单事件字段合法性；[Sequence Verifier](/sdk/typescript/contracts/sequence-verifier) 负责跨事件配对和终态；projection 只消费已经通过边界的 facts。

当前 Rust/App Server 已执行单事件 schema gate 与跨事件 sequence gate；TypeScript runtime client 与 Lime 前端 current event gateway 仍保留下游 fail-closed，作为 transport / renderer 边界保护。两侧必须复用同一配对语义，不能新增另一套 violation 规则。

## Codex loop 对齐边界

Codex 的强壮性来自 core session loop 与 tool orchestrator：turn 所有权、tool routing、approval、sandbox、retry、cancel token 都在执行内核里统一处理。Workbench v2.8-v2.10.1 只完成了 Lime 事件入库和投影边界的 fail-closed，并不等同于完整 Codex 级 tool loop。

下一阶段应把 MCP / ACP / skills / shell / project tools 收敛到 RuntimeCore 的单一 tool lifecycle owner，再输出标准 `tool.started -> tool.result/failed`、`action.required -> action terminal` 和 evidence facts。UI 与 runtime client 只消费这些 facts，不得重新实现 approval、sandbox 或 retry 语义。
