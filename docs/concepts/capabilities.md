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
