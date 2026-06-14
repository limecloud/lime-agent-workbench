---
title: 一致性验收
description: Lime Agent Workbench 的兼容性等级与验收。
---

# 一致性验收

Conformance 不是“页面看起来能聊”。它要求 runtime facts、read models、投影、治理分类和验证用例一起成立。

## 等级

| 等级 | 要求 |
| --- | --- |
| `Prototype` | 可展示一个 turn，但允许 mock 和不完整 facts。不能用于生产声明。 |
| `Projection compatible` | UI 消费 RuntimeEvent/ReadModel，缺事实 degraded，不从 prose 猜。 |
| `Runtime compatible` | App Server/RuntimeCore 输出 required event families 和 read models。 |
| `Lime 剖面 core` | Provider store、permissions、tools、artifacts、evidence、routing、task facts 可 join。 |
| `Product conformant` | 产品应用不传 key、不 fork runtime/UI、旧路径有退出条件。 |

## 最小验收场景

1. First text 前 runtime status 可见，且不进入 final answer。
2. Tool call 有 `toolCallId`，失败/成功不从 assistant text 推断。
3. Pending approval 有 `actionId`，未解决时 UI 显示 waiting。
4. Artifact 通过 `artifactId` 引用，不复制完整 bytes 到 message。
5. Evidence export 包含 runtime correlation spine。
6. Old session 可通过 read model hydration 恢复。
7. 缺失 runtime fact 显示 unknown/unavailable/stale/blocked。
8. 产品应用 payload 不含 key/token/secret。
9. Production path 不依赖 mock fallback。
10. Existing local process component / ToolGroup 标为 deprecated 或迁到共享 AgentUI。
11. 同一 session 并发提交 turn 时，runtime 能 queue 或结构化拒绝，不能启动两个 backend active turn。
12. 工具调用、审批、沙箱、重试和取消由 RuntimeCore / provider core 统一收口，UI 不拥有 tool/action truth。
13. RuntimeCore 对外部 runtime event batch 执行原子入库；任一坏事件失败时，不污染 `StoredSession.events`、turn state 或 read model。
14. Tool terminal 与 owning assistant item 可追踪；显式 `messageId` / `itemId` / `assistantMessageId` 不一致时 fail closed。

## Fixture 矩阵

| Fixture | RuntimeEvent | ReadModel | Projection | UI |
| --- | --- | --- | --- | --- |
| `text-basic` | lifecycle + model delta/final | thread completed | UIMessageParts final | conversation 正常。 |
| `tool-success` | tool started/args/progress/result | tool summary/ref | ToolGroup + timeline | tool 输出可展开。 |
| `tool-failure` | tool failed + failure category | incident | failed attention | recovery action 可见。 |
| `approval` | action required + action terminal | pending action | ActionRequired | 未收到 action terminal 前保持 waiting。 |
| `artifact-evidence` | artifact/evidence changed | refs summary | artifact/evidence lane | 可跳转 owner surface。 |
| `stream-repair` | sequence gap / snapshot updated | stale -> live | repair/reconcile | 不重复追加文本。 |
| `runtime-single-active-turn` | active turn + second start rejected/queued | busy / queued state | blocked 或 queue projection | 不启动第二个 backend turn。 |
| `runtime-event-batch-atomic` | batch 中含坏事件 | session state 不变 | failed closed / diagnostics | 不展示半截工具或半截正文。 |
| `tool-orchestrator` | tool args + approval/sandbox + result/failed | tool summary + pending action | ToolGroup + ActionRequired | 工具终态不从正文推断。 |
| `tool-owner-adjacency` | tool start/result owner 一致或显式冲突 | owner correlation | ToolGroup 归属稳定 | 冲突结果不进入 UI。 |
| `subagent-handoff` | task/subagent/handoff/review events | task snapshot / evidence refs | ExecutionGraph + `state.subagents` | threads、delegation calls、activities 可见。 |
| `coding-file-change` | file changed + artifact/checkpoint refs | changed files summary | FileChangeView + artifact refs | 文件变更不从正文推断。 |
| `coding-patch-failure` | patch started/failed | incident + recovery refs | PatchView failed state | 可继续修复。 |
| `coding-command-approval` | command started + action required + action terminal | pending action | ActionRequired + command output | 未审批前不执行危险命令。 |
| `coding-sandbox-blocked` | sandbox blocked / permission denied | blocked incident | blocked state | 不伪造成功。 |
| `coding-test-failure-fix` | test started/completed failed | output refs | TestRunView + repair action | 测试失败可继续修复。 |
| `coding-hydration-repair` | sequence gap / snapshot updated | stale -> live | repair/reconcile | 不重复追加命令输出。 |

## 包级验收

| 包 | 验收 |
| --- | --- |
| `@limecloud/agent-ui-contracts` | schema 与 fixtures 能校验；破坏性字段变更有版本说明。 |
| `@limecloud/agent-runtime-projection` | projector 幂等、乱序降级、hydration repair、final reconciliation 有单测。 |
| `@limecloud/agent-runtime-ui` | 组件不直接订阅 runtime stream，不读 Provider，不写 runtime truth。 |
| `@limecloud/agent-runtime-client` | JSON-RPC / host bridge / SSE transport 有统一错误模型，不回退 mock。 |

## 产品剖面验收

每个产品应用剖面必须写清：

- 使用哪些 shared surfaces。
- 哪些旧路径是 `compat`，退出条件是什么。
- hosted mode 下 Provider Key 如何迁到 Provider store。
- 断流、未配置 Provider、权限阻断如何展示。
- 哪些 fixture 证明该产品接入符合标准。

### Coding 剖面验收

声明 Coding conformant 的产品应用还必须写清：

- 使用哪些模型槽位：`base`、`coding`、`review`、`fast`、`local`。
- 启用哪些工具面：file、patch、command、test、search、browser、MCP。
- command / patch / test 输出如何进入 output refs，而不是进入 assistant 正文。
- 文件变更如何关联 artifact/checkpoint refs。
- 权限、沙箱和用户拒绝如何产生 `action.*` / `permission.*` / `sandbox.*` facts。
- 继续修复如何基于结构化失败 facts 发起同一 thread 的后续 turn。

## 建议检查

- **Sequence Verifier**：用 [`verifyRuntimeEventSequence`](/sdk/typescript/contracts/sequence-verifier) 验证事件流的配对 / 收口 / 终态约束；违规必须在抵达 projector 前被拦截。
- **App Server Schema Gate**：Rust/App Server current pipeline 必须在 RuntimeCore event 入库前执行 Workbench runtime event schema gate；`state.delta` patch 不合法时不得污染 session state。
- **App Server Sequence Gate**：Rust/App Server current pipeline 必须在 RuntimeCore event 入库前执行跨事件配对检查；孤立 `tool.result`、未解决 action、终态前未收口 tool/action 不得写入 `StoredSession.events`。
- **RuntimeCore Single Turn Gate**：同一 session 的 active / queued / waiting turn 必须由 RuntimeCore 统一拥有；第二个未排队 turn 必须 fail closed，不能由 runtime client、UI 或产品应用本地队列代替。
- **Tool Orchestrator Gate**：MCP / ACP / skills / shell / project tools 必须进入同一 tool lifecycle；审批、沙箱、重试、取消必须产生 action / permission / sandbox / tool terminal facts。
- **RuntimeCore Batch Atomic Gate**：外部 runtime event append 先完整验证再统一写入；坏 batch 不得部分改变 session/read model。
- **Tool Owner Adjacency Gate**：显式工具 owner 必须与 `tool.started` 一致；terminal 缺 owner 或 owner 冲突时按 degraded / fail closed 处理，不能被 UI 归到其它 assistant item。
- **RuntimeBackend Tool Failure Terminal Gate**：`ToolEnd` 失败结果必须进入 `tool.failed`，并保留 `failureCategory` / `error` / `output`；不能让失败工具以 `tool.result` 进入 projection。
- JSON schema validation for events/read models/投影 fixtures。
- Contract tests for App Server client and AgentUI reducer。
- Fixture replay for active run、tool failure、approval、artifact、evidence、hydration。
- Governance scan for deprecated imports and mock production fallback。

## 不可声明 conformant 的情况

- 只支持聊天文本，不支持 tool/action/artifact/evidence facts。
- 生产入口依赖 mock runtime。
- 产品应用保存 Provider Key 并绕过 App Server。
- UI 从 prose 推断运行结果。
- 旧路径没有退出条件。
- UI 或 SDK 自己维护并发 turn 队列、tool/action terminal、approval/sandbox/retry 真相。
