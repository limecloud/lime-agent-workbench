---
title: 集成方式
description: 产品应用、宿主、Runtime 提供方与 UI 消费方的集成方式。
---

# 集成方式

Lime Agent Workbench 的集成不是“装一个 SDK”。它要求接入方选择自己的角色，并遵守对应边界。

| 角色 | 拥有 | 不应拥有 |
| --- | --- | --- |
| 产品应用 | 业务上下文、业务工作流、业务产物入口、样式适配。 | Provider Key、runtime truth、tool completion、evidence verdict。 |
| Desktop Host | App Server sidecar lifecycle、Host Snapshot、capability dispatch、窗口/IPC。 | 业务 runtime 逻辑、第二套 Provider store。 |
| App Server | JSON-RPC protocol、RuntimeCore、Provider store、read models。 | 具体产品 UI 表面。 |
| ExecutionBackend | 执行引擎 adapter、tool/process/subagent integration。 | UI 投影。 |
| AgentUI | 投影、components、surface state、diagnostics rendering。 | runtime truth、Provider calls、policy decisions。 |

## 推荐接入路径

```text
产品应用
  -> Host capability or App Server client
  -> agentSession/turn/start
  -> agentSession/event
  -> agentSession/read
  -> AgentUI 投影
```

产品应用 传业务上下文、workspace refs、Provider/model preference 和 capability intent。App Server 读取 Provider store、执行 runtime、写入 facts，再由 AgentUI 投影成用户可见表面。

## 禁止路径

- 产品应用 直接保存或传递 API Key。
- 产品应用 自建 runtime DB 并把结果伪装成 Lime runtime facts。
- UI 从 assistant prose 推断 tool success、artifact kind、approval state 或 evidence verdict。
- 新能力落在 legacy desktop facade 或 retired command catalog。
- 生产入口依赖 mock backend 或 mock priority commands 才能运行。

## 最小迁移策略

旧 App 不需要一次性删完，但必须给每条路径分类：

| 现有路径 | 目标分类 | 迁移规则 |
| --- | --- | --- |
| Module-local message cache | `compat` | 只做 hydration cache，最终状态来自 read model。 |
| `executionEvents` text list | `compat` | 转为 投影 input，缺字段标记 unknown。 |
| Local ProcessTree component | `deprecated` | 迁到共享 AgentUI ProcessTree。 |
| Local Provider Key store | `compat` in standalone, `deprecated` in hosted mode | 平台宿主下迁到 Provider store 后清除本地 key。 |
| Mock runtime in production | `dead` | fail closed，改为 needs-setup 或 unavailable。 |
