---
title: Coding 剖面
description: 编程型 Agent 工作台的运行、工具、权限、投影和验收剖面。
---

# Coding 剖面

Coding 剖面是 Lime Agent Workbench 面向编程型任务的产品剖面。它定义的是编程任务需要哪些 runtime facts、工具能力、权限边界和 UI 投影，而不是新的 runtime、CLI 壳或模型 Provider。

固定主链：

```text
coding intent
  -> App Server / RuntimeCore
  -> ExecutionBackend coding tools
  -> RuntimeEvent / ThreadReadModel / TaskSnapshot
  -> AgentUI projection
  -> Coding Workbench surfaces
```

## 目标

Coding 剖面覆盖这些用户目标：

- 创建或修改代码项目。
- 阅读、搜索和解释代码。
- 应用补丁、查看 diff、恢复 checkpoint。
- 运行命令、测试、构建和预览。
- 处理权限、沙箱、命令风险和人工确认。
- 从失败输出继续修复。

它不定义具体 IDE、终端产品、视觉皮肤或单一模型服务。

## 模型槽位

Coding runtime 可以声明多个模型槽位。槽位是能力配置，不是供应商绑定。

| 槽位 | 用途 | 要求 |
| --- | --- | --- |
| `base` | 普通对话、任务说明、低风险回复。 | 可以回退到通用模型。 |
| `coding` | 代码理解、补丁生成、工具规划。 | 必须声明支持工具调用、长上下文或代码任务能力。 |
| `review` | 代码审阅、测试失败解释、风险总结。 | 可与 `coding` 相同，但语义独立。 |
| `fast` | 标题、摘要、轻量分类、UI 辅助文案。 | 不拥有执行主链。 |
| `local` | 本地或离线模型能力。 | 必须声明权限和功能限制。 |

Provider key、base URL、自定义端点和模型目录仍由 Host / App Server Provider store 拥有。产品应用只提交偏好，不保存 key。

## 工具面

Coding 剖面建议声明以下工具面：

| 工具面 | Runtime facts | UI 投影 |
| --- | --- | --- |
| 文件读取 | `tool.*`、`context.attached`、source refs | 文件查看、上下文引用。 |
| 文件写入 | `file.changed`、`artifact.changed`、checkpoint refs | 变更列表、diff、恢复入口。 |
| 补丁应用 | `patch.started`、`patch.applied`、`patch.failed` | PatchView、失败原因、继续修复。 |
| 命令执行 | `command.started`、`command.output`、`command.exited` | 输出 / 日志、退出状态。 |
| 测试执行 | `test.started`、`test.completed` | 测试结果、失败修复入口。 |
| 搜索 | `tool.*`、context refs | 代码来源、召回片段。 |
| 浏览器 / 预览 | `tool.*`、artifact refs、diagnostics | 预览、预览错误、刷新。 |
| MCP / 外部能力 | `tool.*`、evidence refs | ToolGroup、ProcessTimeline。 |

所有副作用必须有 stable ids：`toolCallId`、`stepId`、`actionId`、`artifactId`、`checkpointId` 或等价 owner id。

## 事件扩展

Coding 剖面使用 RuntimeEvent 基础事件族，并补充这些推荐事件类型：

| 类型 | 说明 | 必需关联 |
| --- | --- | --- |
| `file.changed` | 文件被创建、修改、删除或重命名。 | `threadId`、`turnId`、`artifactId` 或 `checkpointId`。 |
| `patch.started` | 开始应用补丁。 | `threadId`、`turnId`、`stepId`、`toolCallId`。 |
| `patch.applied` | 补丁成功应用。 | patch id、changed file refs。 |
| `patch.failed` | 补丁失败。 | failure category、recovery refs。 |
| `command.started` | 命令或进程开始。 | command id、policy summary。 |
| `command.output` | 命令输出增量或输出引用。 | command id、stream、output ref。 |
| `command.exited` | 命令退出。 | command id、exit status。 |
| `test.started` | 测试、构建或检查开始。 | test run id、command ref。 |
| `test.completed` | 测试、构建或检查结束。 | status、summary、output refs。 |

这些类型可以在底层实现中映射为 `tool.*` 子类，但投影层必须能区分 file / patch / command / test 语义。

## 权限与沙箱

Coding 剖面必须把权限作为 facts，不得把权限结果写进 assistant 正文后由 UI 猜测。

| 场景 | 必需行为 |
| --- | --- |
| 文件写入需要确认 | 产生 `action.required`，并关联将要写入的文件或补丁摘要。 |
| 命令有风险 | 产生 `action.required` 或 `permission.denied`。 |
| 沙箱阻断 | 产生 `sandbox.blocked`，保留 blocked reason 和 recovery hint。 |
| 网络不可用 | 产生 policy / diagnostics fact，不静默降级到假结果。 |
| 用户拒绝 | 产生 action terminal 或 denial fact，工具不能继续执行。 |

## UI Surface

Coding Workbench 推荐由这些标准 surface 组成：

| Surface | 输入 | 要求 |
| --- | --- | --- |
| 对话 | UIMessageParts | 不混入工具状态真相。 |
| 过程 | ProcessTimeline | 展示计划、工具、命令、测试和审批。 |
| 执行图 | ExecutionGraph | 展示 task、subagent、attempt、handoff。 |
| 文件 | FileChangeView / ArtifactRef | 展示主文件、文件树、checkpoint。 |
| 变更 | PatchView / FileChangeView | 展示 diff、应用状态、失败原因。 |
| 输出 | CommandOutputView / TestRunView | 展示命令输出、测试结果和继续修复入口。 |
| 预览 | ArtifactRef / diagnostics | 展示可视结果和预览错误。 |
| 审批 | ActionRequired | 等待态必须可恢复。 |
| 证据 | EvidenceRef | 跳转 evidence owner，不复制 verdict。 |

本地 UI state 只能保存 selected tab、collapse、focus、scroll anchor 和 draft input。除本地 UI state 外，所有显示内容都必须能从 RuntimeEvent + ReadModel 重建。

## 兼容外部执行器

外部 CLI 或远程执行器可以作为兼容 adapter，但必须遵守：

- 输出 RuntimeEvent 或可映射的事件。
- 不直接写 UI projection state。
- 不直接保存 Provider key。
- 不直接写 artifact/evidence verdict。
- 缺少事件时 projection 显示 degraded，而不是从日志文本猜测。

## current / compat / deprecated / dead

| 分类 | 说明 |
| --- | --- |
| `current` | App Server / RuntimeCore / ExecutionBackend 写 facts，AgentUI 投影 coding surfaces。 |
| `compat` | 旧本地过程面板、外部执行器 adapter、旧事件名映射。只能委托和迁移。 |
| `deprecated` | 产品应用自建文件/命令/测试状态机、从正文推断执行结果。 |
| `dead` | 生产 mock fallback、产品应用直读 Provider key、第二套 runtime owner。 |

## 最小验收

Coding 剖面至少提供这些 fixture：

1. `coding-file-change`：文件写入、checkpoint、diff projection。
2. `coding-patch-failure`：补丁失败、failure category、继续修复 refs。
3. `coding-command-approval`：命令审批、等待态、action terminal 后继续或终止。
4. `coding-sandbox-blocked`：沙箱阻断、blocked UI、无假完成态。
5. `coding-test-failure-fix`：测试失败、输出引用、继续修复 turn。
6. `coding-hydration-repair`：断流后 read model repair，不重复追加输出。

声明 Coding conformant 的产品应用必须证明：Provider key 不进 payload，生产路径不依赖 mock，UI 不从 prose 推断文件、命令、测试、审批或 evidence 状态。
