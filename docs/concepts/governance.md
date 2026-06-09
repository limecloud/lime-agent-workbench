---
title: 治理
description: 用 current / compat / deprecated / dead 收敛 Lime Agent 标准。
---

# 治理

治理目标不是再写一个更新版本，而是让系统以后只能向一个版本收敛。

## 第一原则

**同一种能力，在同一时期只能存在一个继续演进的事实源。**

对 Lime Agent 标准，这句话具体化为：

```text
新增 Agent runtime 能力只进入 App Server JSON-RPC + RuntimeCore + ExecutionBackend。
新增 Agent UI 表面只进入共享 AgentUI 投影 + components。
产品应用 只提供业务上下文和样式适配。
```

## 分类

| 分类 | 含义 | 动作 |
| --- | --- | --- |
| `current` | 继续演进的事实源。 | 新能力只向这里收敛。 |
| `compat` | 迁移期适配层。 | 只能委托、转换、埋点、登记退出条件。 |
| `deprecated` | 旧实现还存在但不应扩展。 | 迁移或删除。 |
| `dead` | 不得再使用。 | 删除、阻断或加守卫。 |

## Agent 专项分类

| 表面 | 分类 |
| --- | --- |
| App Server JSON-RPC runtime API | `current` |
| RuntimeCore event/read model | `current` |
| ExecutionBackend adapter boundary | `current` |
| Shared AgentUI 投影 | `current` |
| Electron Host bridge transport | `current bridge` |
| Local `messages` cache | `compat` |
| Local `executionEvents` text list | `compat` |
| Module-local process component / ToolGroup | `deprecated` |
| UI-only completion/evidence state | `deprecated` |
| 产品应用 Provider Key store in hosted mode | `deprecated` |
| Production mock runtime fallback | `dead` |
| New copied RuntimeCore in 产品应用 | `dead` |

## 守卫

- Production cannot mock。
- compat 层不能新增业务逻辑、独立存储或新状态来源。
- 缺失事实必须显式 degraded。
- 旧路径必须有退出条件和扫描/测试守卫。
- 文档、schema、fixture、契约 test 必须跟随主链。

## 审查清单

1. 这个改动是否新增了第二套事实源？
2. 产品应用 是否传递了 key、secret 或 Provider internals？
3. UI 是否从 prose 推断了 runtime status？
4. Evidence 是否能通过 correlation ids join？
5. 旧路径是否只做适配并有退出条件？
