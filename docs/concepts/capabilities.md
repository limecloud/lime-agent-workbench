---
title: Capabilities
description: Capability gateway、tool inventory 与 产品应用 能力接入。
---

# Capabilities

Capability 是 产品应用 请求宿主或 App Server 执行某类能力的边界。它不是绕过 RuntimeCore 的后门。

## Lime capability 分层

| 能力 | Owner | 规则 |
| --- | --- | --- |
| `lime.agent` | App Server RuntimeCore | 发起 turn/task/run，写入 runtime facts。 |
| `lime.modelSettings` | Host / provider store | 保存 Provider metadata/key，产品应用 不持有 key。 |
| tool inventory | RuntimeCore / policy service | 根据 scope、policy、mode 返回可用工具。 |
| artifact capability | artifact service | 读写产物 metadata/content/version。 |
| evidence capability | evidence service | 导出 replay、review、audit refs。 |

## 产品应用 只传 intent

产品应用提交业务目标、上下文和偏好。真正的 Provider Key、tool permission、sandbox、evidence verdict 由拥有方处理。

## Runtime Provider Capability Manifest

v2.10 已补 runtime / provider 能力声明合同，而不是让 UI 猜测能力。`@limecloud/agent-ui-contracts` 暴露 `AgentRuntimeCapabilityManifest` / `AgentRuntimeCapabilityEntry`，并提供 checked-in JSON Schema 与 validation API。Lime 本体的 App Server `capability/list` 已返回 `runtimeCapabilityManifest`，前端 AgentRuntime gateway 会优先消费该 manifest；旧 App Server 未返回时才从 capability descriptors 做兼容投影。

一个 provider 或 runtime gateway 至少应声明：

| 能力面 | 示例 | UI 规则 |
| --- | --- | --- |
| transport | JSON-RPC stream、Host bridge、external gateway | 只启用已声明的事件源。 |
| tools | native tool calling、tool shim、MCP bridge | 未声明时不显示需要工具调用的操作。 |
| state | `snapshot.updated`、`state.delta`、repair cursor | 不支持 delta 时只能走 snapshot / hydrate。 |
| HITL | permission、structured input、interrupt / resume | 未声明时不生成 action card。 |
| reasoning | summary、encrypted ref、provider continuity | 不展示 raw chain of thought。 |
| multimodal | image/audio/video/document refs | 大 payload 必须走 asset/ref owner。 |
| subagents | task、handoff、delegation facts | 不从 assistant prose 解析多代理状态。 |

当前已固定 manifest 边界与 Lime current path 接入；自动 capability negotiation 不是已完成能力。Lime 已吸收 AG-UI capability 思路，但事实源仍是 App Server / RuntimeCore。
