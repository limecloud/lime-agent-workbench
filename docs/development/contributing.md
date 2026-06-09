---
title: 贡献指南
description: 修改 Lime Agent Workbench 标准的规则。
---

# 贡献指南

修改标准时必须同步改动事实源、契约和验收，而不是只补说明文字。

## 规则

- 新 runtime 能力必须声明 owner 和 event/read model。
- 新 UI surface 必须声明 投影输入。
- 新 产品应用 profile 必须列 current/compat/deprecated/dead。
- 新草案必须说明进入 核心契约 的条件。
- 任何生产路径不得依赖 mock fallback。

## 最小 PR 内容

1. 文档页面。
2. 契约或剖面更新。
3. fixture/schema 或验收场景。
4. 迁移或治理分类。
