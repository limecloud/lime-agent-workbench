---
title: Runtime 提供方
description: Runtime 提供方 如何向 Lime current 主链写入事实。
---

# Runtime 提供方

Runtime 提供方 是 App Server / RuntimeCore 的执行来源，不是 UI adapter。它可以连接模型、工具、浏览器、命令、远程 agent 或工作流引擎，但输出必须归一化为 Lime runtime facts。

如果实现底层本地执行 agent，可以参考本地 Rust 执行型 runtime 的执行循环、tool executor、approval/sandbox、MCP 和 context compaction 设计。但 provider 输出仍必须是 Lime RuntimeEvent / ReadModel；不能把外部协议对象直接暴露给 AgentUI 或产品应用。

## Runtime 提供方必须输出

| 输出 | 要求 |
| --- | --- |
| `RuntimeEvent` | 有 `eventId`、`sequence`、`schemaVersion`、correlation ids、typed `payload`。 |
| `ThreadReadModel` | 当前状态、active turn、pending actions、tool calls、diagnostics、last outcome。 |
| `TaskSnapshot` | objective、status、attempts、dependencies、progress、outputs、evidence refs。 |
| `ArtifactRef` | 只引用 artifact owner，不把大 payload 塞进 message。 |
| `EvidenceRef` | 指向 evidence/replay/review owner，并保留 runtime correlation。 |

## 推荐依赖

| 用途 | 包 |
| --- | --- |
| 类型、schema、fixtures | `@limecloud/agent-ui-contracts` |
| App Server client 侧集成测试 | `@limecloud/agent-runtime-client` |

Runtime provider 不依赖 `@limecloud/agent-ui-react`，也不生成 React props。

## 最小事件顺序

```text
turn.submitted
turn.started
run.status
model.requested
model.delta
tool.started?
tool.progress?
action.required?
action.resolved?
artifact.changed?
evidence.changed?
model.completed
turn.completed | turn.failed
snapshot.updated
```

## Runtime 适配器规则

- 提供方原生 payload 可以保留为 raw ref，但不能泄漏 secret。
- 大输出用 `output.spilled` 或 ref，不复制到每个 event。
- Permission、sandbox、routing、quota、cost、retry 必须成为 runtime facts。
- 失败要有可分类的 `runtime.error`、`tool.failed`、`model.failed` 或 `turn.failed`。
- 没有事实时不要让 UI 猜；显式输出 unavailable 或 validation failure。

## 执行型 runtime 适配

| 执行型 runtime 能力 | Runtime provider 应输出 |
| --- | --- |
| Submission accepted | `turn.submitted`、`turn.started`。 |
| Agent message item | `model.delta`、`model.completed`。 |
| Reasoning / plan item | `reasoning.delta`、`reasoning.summary`、`plan.*`。 |
| MCP / function tool call | `tool.started`、`tool.args`、`tool.result` 或 `tool.failed`。 |
| Exec / apply patch / file change | `tool.*` + `permission.*` + `artifact.changed`。 |
| Approval / guardian prompt | `action.required`，resolved 后输出 `action.resolved`。 |
| Sandbox block / policy deny | `sandbox.blocked`、`permission.denied`、`runtime.warning/error`。 |
| Context compaction | `history.compacted`、`context.attached`、`snapshot.updated`。 |
| Session repair / rollout replay | `snapshot.updated`、read model cursor、EvidenceRef。 |

适配器可以保留原生 item 为 raw diagnostics ref，但标准 UI 只能消费 Lime 投影状态。

## Provider adapter shape

```ts
interface RuntimeProviderAdapter {
  startTurn(input: StartTurnInput): AsyncIterable<RuntimeEvent>;
  cancelTurn(input: CancelTurnInput): Promise<RuntimeEvent>;
  respondAction(input: RespondActionInput): Promise<RuntimeEvent>;
  readThread(input: ReadThreadInput): Promise<ThreadReadModel>;
}
```

具体模型 SDK、工具框架或多代理框架都应该藏在 adapter 后面。adapter 输出 Lime facts，不把外部 SDK 对象直接暴露给 AgentUI。

## 外部框架映射

| 来源 | 映射目标 |
| --- | --- |
| AI SDK text stream | `model.delta` / `model.completed`，再投影为 UIMessageParts。 |
| AI SDK tool parts | `tool.started` / `tool.args` / `tool.result` / `tool.failed`。 |
| OpenAI Agents handoff | `subagent.*`、`task.*`、`channel.*`、ExecutionGraph edge。 |
| LangGraph node execution | `task.*`、`run.status`、ExecutionGraph node/edge。 |
| MCP tool result | `tool.result` + output/artifact/evidence ref。 |
| 本地执行型 turn item | RuntimeEvent + ReadModel + raw diagnostics ref。 |

## 不接受的实现

```text
LLM stream
  -> assistant text
  -> UI parses text into process/tool/artifact status
```

这条路径只能做 legacy demo，不能声明 Lime conformant。

## 最小验收

- 一个文本 turn 能输出 lifecycle + message + snapshot。
- 一个工具 turn 能输出 tool lifecycle，且大输出使用 ref。
- 一个审批 turn 能挂起并通过 `respondAction` 恢复。
- 一个失败 turn 能给出 failure category 和 recovery hint。
- 断流后 read model 能修复 ProjectionState。
