---
title: 更新记录
description: Lime Agent Workbench 的变更记录。
---

# 更新记录

## v0.2.0 - 2026-06-09

- 移除非标准组件树术语，统一过程投影为 `UIMessageParts`、`ProcessTimeline`、`ExecutionGraph`。
- 补全 AgentUI / AgentRuntime 架构标准：App Server、RuntimeCore、ExecutionBackend、AgentUI Projection、TypeScript 四包产品线。
- 增强 RuntimeEvent、UI Projection、App Server Host、Conformance 契约，加入事件家族、hydration、fixture 矩阵和包级验收。
- 补充产品应用、Runtime provider、UI consumer 接入指南，明确 current / compat / deprecated / dead 治理分类。
- 增加本地 Rust 执行型 runtime 参考层，但事实源仍以 Lime current 实现为准。

## 2026-06-09

- 创建 Lime Agent Workbench 文档站。
- 采用 VitePress 和 GitHub Pages workflow。
- 初始信息架构对齐 AG-UI 风格：概览、快速开始、核心概念、契约、实现剖面、演进。
- 初始内容从 Lime 当前现实出发：App Server、RuntimeCore、ExecutionBackend、AgentUI 投影、Content Studio 剖面、治理分类。

## 变更规则

影响 runtime event、read model、UI 投影、host 契约 或 conformance 的改动，必须同步更新：

- 对应 契约 页面。
- 至少一个 剖面 页面。
- fixture/schema 或验收场景。
- 治理分类。
