---
title: Middleware
description: Lime 的适配层、兼容层和中间件边界。
---

# Middleware

Middleware 在 Lime 中只允许做适配、归一化和治理埋点。它不能成为第二套业务 runtime。

## 允许

- 把外部 runtime event 转换为 Lime RuntimeEvent。
- 把 legacy `messages` / `executionEvents` 转换为 degraded 投影输入。
- 对缺失字段输出 unknown、unavailable、stale 或 blocked。
- 记录 compat 路径和退出条件。

## 禁止

- 在 middleware 内新增业务状态机。
- 在 产品应用 内维护第二套 Provider Key store。
- 在 UI adapter 中从 prose 推断 tool success。
- 让 mock backend 成为生产 fallback。

Middleware 的目标是让旧系统向 current 主链收敛，而不是给旧系统续命。
