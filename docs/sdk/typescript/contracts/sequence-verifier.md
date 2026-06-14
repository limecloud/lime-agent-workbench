---
title: Sequence Verifier
description: 流式 runtime event 序列状态机，拦截协议违规事件流。
---

# Sequence Verifier

`@limecloud/agent-ui-contracts` 提供可执行的**流式协议状态机**，对应 AG-UI 的 `verifyEvents`，但校验 Lime 自有的 `AgentRuntimeExecutionEvent` 配对规则。

这是 v2 可执行协议内核的核心：坏流（违反配对 / 收口 / 终态规则）必须在抵达 projector 前被拦截，而不是靠 projector 兜底、文档自觉或运行时提供方的自律。

## 为什么需要 Sequence Verifier

Lime 的 `collectRuntimeEventValidationIssues` 只做**逐事件 schema 校验**（字段是否存在、类型是否正确）。跨事件配对规则必须由 Sequence Verifier 执行：`tool.started` 必须有对应的 `tool.result`/`tool.failed`，`action.required` 必须有对应 action terminal，turn 终态前执行流必须收口。

Sequence Verifier 补上这个缺口：把文档规则编码成可执行状态机，让违规在边界被短路，而不是悄悄流进 UI state。

## 核心原则

1. **只检查「违反规则」，不检查「不完整」。** 进行中的流、截取片段的 fixture，未闭合的 tool/action **不是 violation**。
2. **按 turn 维度维护状态**。收口检查只在 turn 终态（`turn.completed` / `turn.failed` / `turn.canceled`）真实出现时触发。
3. **双模式**：批量验证（fixture / conformance runner）和增量 push/finalize（runtime client 流式拦截）。

## API

### `verifyRuntimeEventSequence(events)` — 批量验证

```ts
import { verifyRuntimeEventSequence } from "@limecloud/agent-ui-contracts";

const violations = verifyRuntimeEventSequence(fixture.events);
// violations: RuntimeSequenceViolation[]
// 空数组 = 流的序列合法
```

### `createRuntimeSequenceVerifier()` — 增量验证

```ts
import { createRuntimeSequenceVerifier } from "@limecloud/agent-ui-contracts";

const verifier = createRuntimeSequenceVerifier();

// push 每个事件时立即返回该事件触发的 violation
const violations = verifier.push(event);

// 结束流后获取全部 violation
const all = verifier.finalize();

// 随时查看当前累积 violation（不结束流）
const current = verifier.getViolations();
```

## Violation 类型

| code | 含义 |
| --- | --- |
| `duplicate_event_id` | 同一 `id` 出现超过一次 |
| `tool_result_without_start` | `tool.result` 无匹配的 `tool.started` |
| `tool_failed_without_start` | `tool.failed` 无匹配的 `tool.started` |
| `tool_started_already_active` | 同 `toolCallId` 重复开启 `tool.started` |
| `tool_unclosed_at_turn_end` | turn 终态时仍有未收口的 tool call |
| `action_resolved_without_request` | `action.resolved`、`action.cancelled`、`action.canceled` 或 `action.expired` 无匹配的 `action.required` |
| `action_required_already_active` | 同 `actionId` 重复开启 `action.required` |
| `action_unresolved_at_turn_end` | turn 终态时仍有未解决的 action |
| `model_unclosed_at_turn_end` | turn 终态时 model 流未收口（`model.delta` 后无 `model.completed`/`model.failed`）|
| `execution_after_turn_terminal` | turn 终态后仍出现同 turn 的执行流事件 |
| `turn_terminal_repeated` | 同 turn 重复进入终态（`turn.completed` / `turn.failed` / `turn.canceled`）|

## 在 Fixture Replay 中的行为

`replayAgentUiFixture` 在调用 projector 前先运行 verifier。存在**未被 `expected.diagnostics` 豁免**的 violation 时，**fail closed**：不把坏流投影成 state，state 退化为合法空 state。

```ts
const result = replayAgentUiFixture(fixture);

result.failedClosed      // true = 坏流被拦截
result.sequenceViolations // 未豁免的 violation 列表
result.state             // failedClosed 时为空 state，否则为正常投影结果
result.passed            // true = 无 violation、无 validation issue、无 diagnostic
```

fixture 可在 `expected.diagnostics` 中声明要豁免的 violation code，用于构造故意违规的测试 fixture：

```ts
const broken: AgentUiFixture = {
  ...base,
  expected: {
    status: "completed",
    diagnostics: ["tool_result_without_start"],  // 豁免该 violation
  },
};
```

## 在 Runtime Client 中的用法（v2.1+）

`@limecloud/agent-runtime-client` 已在 `dispatchEvent` / `nextEvent` 分发 listener 前接入 verifier。默认 fail closed，测试夹具可显式 collect diagnostics 或关闭 verifier。

```ts
const client = createAgentRuntimeClient(connection);

client.subscribeEvents((event) => {
  projector.apply(event); // 只有通过 verifier 的事件才会抵达 listener
});

const diagnosticsClient = createAgentRuntimeClient(connection, {
  sequenceVerifierMode: "collect-diagnostics"
});
```

## 与 AG-UI verifyEvents 的对比

| 维度 | AG-UI `verifyEvents` | Lime `createRuntimeSequenceVerifier` |
| --- | --- | --- |
| 校验的事件名 | `RUN_STARTED`、`TEXT_MESSAGE_START/END`、`TOOL_CALL_START/END`、`STEP_STARTED/FINISHED` 等 AG-UI 协议 | `tool.started`/`tool.result`/`tool.failed`、`action.required`/`action.resolved`/`action.canceled`、`turn.completed`/`turn.failed`/`turn.canceled` 等 Lime 协议 |
| 流式模型 | RxJS Observable pipe，当场 throwError 短路 | 同步状态机，`push()` 返回即时 violation，供调用方决定是否短路 |
| 版本演进 | BackwardCompatibility_0_0_39/45/47 middleware 横切 | 后续 v2.x 补 middleware；当前已完成序列状态机和 runtime-client gate |
| 批量模式 | 无（流式设计） | `verifyRuntimeEventSequence(events)` 批量验证 |
| 未完整流 | 不允许（流必须以 `RUN_FINISHED` 收口） | 允许（进行中的流不产生 violation） |

## Action terminal 规则

`action.required` 只能由 runtime fact 收口，UI 点击不等于完成。当前 action terminal 集合为：

```text
action.resolved
action.cancelled
action.canceled
action.expired
```

这些事件都必须携带同一个 `actionId`，并在 App Server 入库前通过 sequence gate。孤立的 action terminal 必须 fail closed；合法 action terminal 会让 read model 清理 pending action，并允许 turn 从 waiting-action 恢复为 running 或进入后续终态。

## 与 Codex Agent loop 的边界

Sequence Verifier 只保证事件流合法，不能替代执行内核。Codex 的强壮点在 core session / tool lifecycle：单 active turn、tool router、approval、sandbox、retry、cancel token 都在 core 中统一处理。

Lime 当前已经把 single active turn gate 放回 RuntimeCore：同一 session 若已有 active / queued / waiting turn，runtime 必须 queue 或结构化拒绝。Sequence Verifier 仍只检查事件流，不负责排队。

Lime 已将 schema gate、sequence gate、tool lifecycle owner guard、batch atomic append、approval gate 与 tool owner adjacency 放到 App Server / RuntimeCore 入库边界。坏 batch 不能部分写入 `StoredSession.events`，未批准或被拒绝的 tool action 不能继续产生成功 `tool.result`。

RuntimeBackend 也必须在进入 projection 前固定失败终态：`ToolEnd { result.success: false }` 输出 `tool.failed`，携带 `failureCategory`、`error` 和 `output`；Sequence Verifier 只检查配对，不负责把失败 `tool.result` 改写成 `tool.failed`。

下一步仍应把 MCP / ACP / skills / shell / project tools 落实到完整 RuntimeCore tool orchestrator。runtime client 和 projection 保留为下游保护层，不能继续在 UI 里复制 approval、sandbox、retry、cancel 或 tool completion 判断。
