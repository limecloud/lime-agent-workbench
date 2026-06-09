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

## 长期目标

Lime Agent Workbench 应成为 Lime 内部 Agent Apps 的标准入口：所有新 Agent 功能先声明 剖面 和 契约，再实现 runtime/UI。
