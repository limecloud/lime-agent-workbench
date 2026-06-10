---
title: Agentic protocols
description: Lime 如何看待 AG-UI、MCP、A2A 与内部 Runtime/UI 标准。
---

# Agentic protocols

Lime 接受外部协议的启发，但不能把外部协议当成内部治理答案。外部标准解决通用互操作，Lime 标准解决巨大既有代码库里的事实源、组件复用和迁移边界。

| Layer | External reference | Lime standard |
| --- | --- | --- |
| Agent ↔ User Interaction | AG-UI、assistant-ui | Lime AgentUI 投影 契约。 |
| Agent ↔ Runtime facts | OpenAI Agents SDK、LangGraph runtime、AI SDK streams | Lime AgentRuntime 剖面、RuntimeEvent、ThreadReadModel、TaskSnapshot。 |
| Agent ↔ Tools/Data | MCP、tool calling schemas | App Server capability gateway、Tool inventory、Policy/Permission/Sandbox facts。 |
| Agent ↔ Agent | A2A、multi-agent runtimes | RuntimeCore task/subagent/job/channel facts 与 Team Workbench 投影。 |
| Evidence/Replay/Review | tracing、eval、observability tools | Lime evidence/replay/review refs joined by runtime correlation ids。 |

## 采用原则

1. 外部协议可参考事件分类、客户端体验和抽象命名。
2. Lime current 写入边界仍是 App Server / RuntimeCore。
3. 产品应用 只能通过版本化 client、JSON-RPC、投影 model 或 host capability 接入。
4. 如果外部模型缺少 Lime 必需事实，Lime 剖面 应显式补充，而不是降低标准。

## AG-UI 对 Lime 的启发

AG-UI 的价值在于把 agent/frontend 连接建模为事件流，并把 lifecycle、text、tools、state、interrupts 等分开。Lime 采用这类信息架构，但必须进一步处理：

- App Server Provider store 和 产品应用 不持有 key。
- RuntimeCore 是 durable truth，不是 UI client 本地 reducer。
- Evidence、replay、review、benchmark 必须能通过 correlation ids join。
- 旧 `messages`、`executionEvents` 只能作为兼容缓存，不是标准输出。

## AI SDK 对 Lime 的启发

AI SDK 的价值在于把用户可见消息拆成 `UIMessage.parts`，让 text、reasoning、tool、artifact 等内容能被 UI 逐段渲染。Lime 采用“消息分片”这个方向，但边界更严格：

- `UIMessageParts` 只表达可读消息和可引用摘要。
- Tool、Action、Artifact、Evidence 的完成状态仍来自 RuntimeEvent / owner service。
- `agent-runtime-projection` 可以把 Lime facts 映射成 AI SDK 风格的 parts，但不能把 parts 当 runtime truth。
- 产品应用不能只接 AI SDK text stream 后绕过 App Server Provider store。

## OpenAI Agents JS 对 Lime 的启发

OpenAI Agents JS 对 Lime 有参考价值的是 tracing、tool lifecycle、handoff、guardrail 和 multi-agent 编排经验。Lime 不直接套用它的 runtime：

- Lime current 写入边界仍是 App Server JSON-RPC + RuntimeCore。
- 外部 agent 的 trace/handoff 必须映射到 `RuntimeEvent`、`ExecutionGraph` 和 EvidenceRef。
- Tool call 需要进入 Lime ToolGroup / permission / sandbox / output ref。
- 多代理 handoff 需要进入 task/subagent/job/channel facts，而不是只显示成 assistant 文本。

## 本地执行型 Runtime 对 Lime 的启发

Lime 底层 runtime 更接近本地执行型 agent：它要处理工作目录、命令、补丁、MCP、沙箱、审批、上下文压缩、工具输出、历史恢复和多轮执行。这类 runtime 对 Lime 的价值是底层运行时工程经验，而不是外部互操作协议。

| Runtime 设计点 | Lime 采用 | Lime 不采用 |
| --- | --- | --- |
| Submission Queue / Event Queue | turn 输入和 event 输出解耦，支持异步执行。 | 直接暴露外部 protocol 给产品应用。 |
| TurnItem / item mapping | user、assistant、reasoning、tool、file change、compaction 映射为 Lime facts。 | 把外部 item 名称作为 AgentUI 标准组件名。 |
| exec policy / guardian / approvals | command、network、MCP、permission escalation 进入 action/policy facts。 | UI 直接决定安全结果。 |
| sandbox permission profile | 文件、网络、命令权限进入 Host/App Server policy。 | 产品应用私自放宽权限。 |
| tool lifecycle / MCP | 工具有稳定 id、状态、输出 ref 和失败分类。 | 工具成功由 assistant prose 表达。 |
| context compaction / history | 历史压缩是 runtime fact，可水合、可审计。 | 前端本地拼接 prompt 作为事实。 |

因此，本地执行型 runtime 位于 Lime 的“底层 runtime 参考层”，AG-UI / AI SDK 位于“UI 与消息参考层”。冲突时优先级是：Lime 当前实现和治理规则 > Lime contracts > 执行型 runtime pattern > 外部协议体验。

## 采用 / 不采用

| 外部能力 | 采用 | 不采用 |
| --- | --- | --- |
| AG-UI event stream | 事件分类、streaming frontend mental model。 | 把 AG-UI event 当 Lime durable truth。 |
| AI SDK UIMessage.parts | 消息分片和 React 渲染经验。 | 用 parts 承载 tool/action/artifact/evidence truth。 |
| OpenAI Agents JS | tracing、handoff、tool lifecycle 参考。 | 直接替换 Lime RuntimeCore。 |
| 本地执行型 Runtime | 本地执行循环、审批、沙箱、工具、上下文压缩参考。 | 直接暴露外部 protocol 或替换 Lime App Server。 |
| MCP | tool inventory、tool invocation 边界。 | 产品应用绕过 App Server 直连敏感工具。 |
| A2A | agent-to-agent 语义参考。 | 在 UI 层自建多代理运行状态。 |

## 内部标准优先级

当外部协议与 Lime 当前事实源冲突时，按以下顺序处理：

1. 保护 Lime ownership：谁写入事实、谁只能投影。
2. 保留可迁移性：compat 只能向 current 委托。
3. 保持可验证：schema、fixture、契约 test 优先于散文约定。
4. 保持产品复用：Content Studio、Zhongcao、Agent Apps 共享 Runtime/UI，不复制。
