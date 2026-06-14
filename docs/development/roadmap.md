---
title: 路线图
description: Lime Agent Workbench 标准化路线图。
---

# 路线图

路线图按“标准先行、主链打通、治理收口”推进。

## 阶段 0：标准站点骨架

Status: current

- 建立 GitHub Pages 文档站。
- 复用 AG-UI 的信息架构，但重写为 Lime 剖面。
- 定义 RuntimeEvent、ReadModel、UI Projection、Host、Conformance。
- 把 Content Studio 剖面 写成第一个产品接入样板。
- 补 Coding 剖面，明确编程型任务的工具、权限、模型槽位、投影和 fixture 要求。

## 阶段 1：契约 fixtures

目标：

- 增加 `fixtures/`：turn、tool、approval、artifact、evidence、hydration、failure。
- 增加 JSON schemas 或链接到 AgentRuntime/AgentUI schema。
- 建立 fixture replay 页面，验证 Projection reducer。

## 阶段 2：共享 AgentUI 包对齐

目标：

- 对齐 UIMessageParts、ProcessTimeline、ExecutionGraph、ToolGroup、ActionRequired、ArtifactRef、EvidenceRef。
- 明确过程投影模型，不引入非标准组件树协议。
- 给 Content Studio 迁移 checklist。

## 阶段 3：App Server Runtime 一致性

目标：

- 对齐 App Server JSON-RPC 方法和 read APIs。
- 补 RuntimeCore event families。
- 补 Provider store readiness、permission/action、artifact/evidence refs。

## 阶段 4：治理守卫

目标：

- 扫描产品应用的 local process component / ToolGroup / runtime mock。
- 扫描 hosted mode key leakage。
- 扫描 legacy executionEvents 被当 truth 的路径。
- 把 compat 退出条件写入每个产品 剖面。

## v2：可执行协议内核

Status: active

目标：把「标准文档 + fixture replay」推进到「协议边界能自己拦截坏流」。

- **v2.0（已完成）**：在 `@limecloud/agent-ui-contracts` 实现流式 [Sequence Verifier](/sdk/typescript/contracts/sequence-verifier)；`replayAgentUiFixture` fail-closed；补充负向测试。
- **v2.1（已完成）**：Runtime client pipeline 默认 fail-closed 接入 verifier；projector `apply()` 增量化，消除 O(N²) 全量重投影。
- **v2.2（已完成）**：`state.delta` 字段级 patch seed；runtime event / state delta / projection state JSON Schema 跨语言校验。
- **v2.3（已完成）**：[Subagents 活体闭环](/examples/subagents-live-loop) 以 `subagent-handoff` fixture 证明 verifier -> replay -> projection -> `SubagentsView`；`/subagents` 顶层标准页对齐 current `AgentUiProjectionState.subagents`。
- **v2.4（已完成）**：[Runtime Middleware / Adapter](/sdk/typescript/runtime-client/middleware-adapter) 补 `normalize -> adapter -> middleware -> sequence verifier -> dispatch` 的协议演进层；`@limecloud/agent-runtime-client`、`sessionGateway` 与 Lime 本体 current event gateway 已共用同一 pipeline。
- **v2.5（已完成）**：`state.delta` 已进入 `@limecloud/agent-runtime-projection` 的 `projectAgentUiState()` 与 `createAgentUiProjector.apply()`；projection / read model patch batch 与 incremental 输出等价，patch 失败进入 stale diagnostics。
- **v2.6（已完成）**：Rust/App Server RuntimeCore 在 event 入库前接入 AgentUI runtime event / `state.delta` JSON Schema gate；非法 patch fail closed，不写入 session state。
- **v2.7（已完成）**：[活体 Demo 矩阵](/examples/live-matrix) 已从单一 `/subagents` fixture 扩展到 text、tool、HITL、artifact/evidence、stream-repair、Subagents 多事件族 replay 面板。下一步如果继续加深，应补 App Server 真实 fixture backend 与 bad-stream 负向可视化。
- **v2.8（已完成）**：Lime Rust/App Server RuntimeCore 在 event 入库前接入 AgentUI sequence gate；孤立 `tool.result`、终态前未收口 tool/action 等坏流 fail closed，不写入 `StoredSession.events`，也不提前改变 turn/session 状态。`action.required` 可由 `action.resolved / action.cancelled / action.canceled / action.expired` 收口。
- **v2.9（已完成）**：runtime-client pipeline 支持 `0..N` fan-out 与 flush；Lime 本体 App Server notification、本地 publish、bridge listener 和 Agent App current runtime client options 已消费同一 pipeline 输出。当前只完成承载层和最小兼容 fan-out，不等同于完整 AG-UI `transformChunks` mapping。
- **v2.10（已完成）**：Runtime / Provider capability manifest 与 resume contract 已落 contracts seed，并接入 Lime current path：`capability/list` 返回 `runtimeCapabilityManifest`，`agentSession/thread/resume` 承接 `resumeContract`，前端 AgentRuntime gateway 会读取/构造同一合同。它明确运行时声明什么、UI 如何启用功能、open action 如何阻断 / 覆盖 / 过期；仍不宣称已实现自动 capability negotiation。
- **v2.10.1（已完成）**：Codex Agent loop 复核补强：后端 schema / sequence gate、runtime client、projection read model 统一 action terminal 语义，避免 RuntimeCore 已收口但 UI 仍保留 pending action。
- **v2.10.2（已完成）**：Claw / Agent App current loop 对齐到 App Server `agentSession/* -> RuntimeCore -> ExecutionBackend`；Workbench 文档明确 single active turn gate、`TurnAlreadyActive` / busy 结构化拒绝、禁止 UI 合并并发 turn、禁止生产 mock fallback。
- **v2.11（进行中）**：RuntimeCore tool orchestrator 与 Projection reconciliation：参考 Codex `ToolRouter + ToolOrchestrator` 把 MCP / ACP / skills / shell / project tools 收敛到单一 tool lifecycle owner；同时补 message snapshot、tool result adjacency、partial tool args、reasoning continuity。实现时不得继续把 approval / sandbox / retry / cancel 判断复制到 runtime client 或 UI。
- **v2.11.1（已完成）**：RuntimeCore tool lifecycle owner guard：`tool.args` / `tool.output.delta` / `tool.result` / `tool.failed` 必须有 active `tool.started`，带 `toolCallId` 的 action / permission / sandbox facts 不得悬空。
- **v2.11.2（已完成）**：RuntimeCore event append batch atomic guard：外部 runtime event batch 先完整验证，再统一写入 `StoredSession.events` 和 read model；坏 batch 不允许部分入库。
- **v2.11.3（已完成）**：RuntimeCore approval gate guard：`action.required` 未收口前禁止工具继续输出，action denied / canceled / expired 后禁止成功 `tool.result`。
- **v2.11.4（已完成）**：RuntimeCore tool owner adjacency guard：显式 `messageId` / `itemId` / `assistantMessageId` 必须与 `tool.started` 的 owning assistant item 一致，防止多处投影把 tool terminal 归到不同消息。
- **v2.11.5（已完成）**：RuntimeBackend tool args fact：底层 `ToolStart { arguments }` 输出紧邻的 `tool.args`，JSON 参数进入 `args`，非 JSON 参数保留 `rawArgs`。
- **v2.11.6（已完成）**：RuntimeBackend tool failure terminal fact：底层 `ToolEnd { result.success: false }` 输出 `tool.failed`，并保留 `toolCallId`、`status=failed`、`failureCategory`、`error` 和 `output`；成功结果继续输出 `tool.result`。
- **v2.11.7（下一刀）**：完整 ToolRouter / ToolOrchestrator execution slice：MCP / ACP / skills / shell / project tools 的 dispatch、approval、sandbox、retry、cancel 仍需进入 RuntimeCore 单一执行 owner。
- **v2.12（计划）**：Coding 剖面 fixtures 与 projection conformance：文件变更、补丁失败、命令审批、沙箱阻断、测试失败继续修复和 hydration repair。

## 产品接入验收

Status: complete

Content Studio 已完成真实产品主路径接入验收：

- registry 版 `@limecloud/agent-runtime-client@0.1.1/sessionGateway` 包装 App Server session gateway。
- `AgentUiProjectionSurface` 在 `AI agents` 工作台渲染标准 conversation / runtime surface。
- `npm run verify:lime-agent` 通过边界审计，防止产品页面绕过标准 surface 直接拼共享 primitives。
- `npm run test:e2e -- --grep "agents 将平台运行事实投影到 AgentUI 面板而不是普通正文"` 通过真实 Electron 页面回归，断言 `.agent-ui-projection.agent-ui-conversation-only`、`.agent-ui-main[data-agent-ui-surface="conversation"]`、`.agents-runtime-inline.agent-ui-runtime-only`、`.agent-ui-sidecar[data-agent-ui-surface="runtime"]`。
- 同一 E2E 证明工具、evidence、action 等运行事实进入 AgentUI runtime facts，不泄漏为普通 assistant 正文。

## 长期目标

Lime Agent Workbench 应成为 Lime 内部 Agent Apps 的标准入口：所有新 Agent 功能先声明 剖面 和 契约，再实现 runtime/UI。
