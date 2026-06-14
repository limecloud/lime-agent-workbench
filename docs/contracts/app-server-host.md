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
- 拥有同一 session 的 active turn gate：已有 active / queued / waiting turn 时，必须由 RuntimeCore 队列化或返回结构化错误，不能让 UI、SDK 或产品应用自行合并并发 turn。
- 拥有 RuntimeEvent 入库门禁：schema、sequence、tool lifecycle、approval gate 和 batch atomic append 必须在写入 `StoredSession.events` / read model 前完成。

## Claw / Agent App current loop

Claw、Agent App 对话和其它产品应用都必须进入同一条写入链：

```text
Product UI / Claw / Agent App
  -> @limecloud/agent-runtime-client 或产品侧 session gateway
  -> agentSession/start
  -> agentSession/turn/start
  -> RuntimeCore
  -> ExecutionBackend / provider / tool services
  -> RuntimeEvent + ThreadReadModel + EvidenceRef
  -> AgentUI projection
```

固定约束：

- `agentSession/turn/start` 是对话 turn 的唯一 current 写入口；旧 `agent_runtime_*` 或产品本地 adapter 只能作为 compat facade 委托到这条链，不得承接新业务逻辑。
- 同一 session 同时只能有一个 RuntimeCore-owned active turn；需要排队时由 runtime queue 显式记录，不能依赖前端 `queue_if_busy` 或本地状态兜底。
- `TurnAlreadyActive` 这类并发拒绝必须作为 App Server / RuntimeCore 结构化错误暴露，UI 只能显示 blocked / queued / failed 状态，不能启动第二条隐藏 backend turn。
- `turn.completed`、`turn.failed`、`turn.canceled` 是 turn 终态事实；UI 不得用 timeout、固定 grace timer 或 assistant 正文来合成完成态。
- 同一批 RuntimeEvent 必须先完整验证再入库；任一事件违反 schema、sequence、tool lifecycle、approval 或 owner 归属规则时，整批 fail closed，不能把前序事件部分写入 session state。
- 带 `toolCallId` 的 `tool.args`、`tool.args.delta`、`tool.output.delta`、`tool.result`、`tool.failed`、`action.required`、`permission.denied`、`sandbox.blocked` 必须关联 active `tool.started`；未批准或被拒绝的 action 不能被 UI 或 adapter 乐观转换成成功工具结果。
- 生产路径禁止 App Server mock backend、renderer mock fallback 或 fixture 自动替代；fixture 只服务 conformance 和 smoke。

## Current JSON-RPC 面

| 方法 | 方向 | 说明 |
| --- | --- | --- |
| `agentSession/turn/start` | product -> runtime | 提交用户 intent、业务 refs、provider/model preference。 |
| `agentSession/turn/cancel` | product -> runtime | 取消 turn 或 active run。 |
| `agentSession/action/respond` | product -> action owner | 回复审批、结构化输入、plan review。 |
| `agentSession/event/subscribe` | runtime -> client | 订阅 RuntimeEvent stream。 |
| `agentSession/read/thread` | client -> runtime | 读取 ThreadReadModel。 |
| `agentSession/read/task` | client -> runtime | 读取 TaskSnapshot。 |
| `agentSession/evidence/export` | client -> evidence owner | 导出 evidence pack。 |

具体命名可随 Lime App Server 当前协议调整，但语义必须保持：写入事实走 RuntimeCore / owner service，读取状态走 read model，UI 不直接写 DB。

## 方法分组

| 分组 | 方法语义 | owner |
| --- | --- | --- |
| Session / turn | create session、start turn、cancel turn、resume turn | RuntimeCore |
| Events | subscribe、cursor repair、stream heartbeat | RuntimeCore event store |
| Read models | read thread、read task、read session、read artifact summary | RuntimeCore / owner services |
| Actions | respond action、cancel action、expire action | action owner |
| Tools / capabilities | list available tools、resolve capability、check policy | capability gateway / policy service |
| Provider | read readiness、update settings、validate model | Provider store |
| Evidence | export pack、read review/replay refs | evidence owner |

App Server 可以把具体方法命名成 Lime 当前协议，但不能让产品应用绕过这些 owner 直接写 facts。

## Transport contract

| 传输 | 用途 | 要求 |
| --- | --- | --- |
| Desktop Host bridge | Lime 桌面主路径 | 转发到 App Server，不在 Electron 里复制 runtime logic。 |
| HTTP JSON-RPC | hosted / remote | 与 bridge 保持同一 method semantic 和错误模型。 |
| SSE / event stream | RuntimeEvent 订阅 | 保留 `sequence`、cursor、repair 语义。 |
| Fixture replay | 测试 | 只能用于 conformance，不作为 production fallback。 |

`@limecloud/agent-runtime-client` 负责隐藏这些 transport 差异；`@limecloud/agent-runtime-ui` 不直接接触 transport。

## 产品应用 responsibilities

- 提供业务上下文。
- 发起 turn、cancel、resume、respond action。
- 消费 AgentUI 投影。
- 在 hosted mode 下迁移旧 key 后清除本地 key。

## Host Snapshot

Host Snapshot 至少应暴露：

| 字段 | 用途 |
| --- | --- |
| `appServer.ready` | 判断 runtime 是否可用。 |
| `provider.ready` | 判断是否需要进入设置。 |
| `capabilities` | 判断模型、工具、文件、网络、浏览器等能力是否可用。 |
| `policy` | 判断 sandbox、permission、hosted mode 限制。 |
| `dataRoot` | 只用于显示和 diagnostics，不让产品应用拼路径读写。 |

Host Snapshot 不是 runtime read model。它描述平台宿主状态，不描述 turn/tool/action/artifact 的业务事实。

## 必需失败模式

| 失败 | 必需行为 |
| --- | --- |
| Provider not ready | 返回 needs-setup / blocked，不读取 产品应用 local key。 |
| Host capability missing | 标记 unavailable，提示进入平台设置或 standalone fallback。 |
| Runtime stream interrupted | UI 标记 stale 并走 read model repair。 |
| Action unresolved | 保持 waiting，不当作 approved。 |
| Turn already active | RuntimeCore 返回结构化 busy / already-active 错误，或显式排队；UI 不合并并发 turn。 |
| Mock backend only | 生产路径 fail closed。 |

## Mock 与 hosted mode

Mock 只能出现在 fixture、conformance 和本地显式测试中。Hosted mode 下，如果 Provider 尚未迁到 App Server Provider Store，产品应用必须显示 setup / blocked 状态，不能继续读取本地 key、环境变量或嵌入式测试 provider。
