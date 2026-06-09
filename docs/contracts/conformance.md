---
title: 一致性验收
description: Lime Agent Workbench 的兼容性等级与验收。
---

# 一致性验收

Conformance 不是“页面看起来能聊”。它要求 runtime facts、read models、投影、治理分类和验证用例一起成立。

## 等级

| 等级 | 要求 |
| --- | --- |
| `Prototype` | 可展示一个 turn，但允许 mock 和不完整 facts。不能用于生产声明。 |
| `Projection compatible` | UI 消费 RuntimeEvent/ReadModel，缺事实 degraded，不从 prose 猜。 |
| `Runtime compatible` | App Server/RuntimeCore 输出 required event families 和 read models。 |
| `Lime 剖面 core` | Provider store、permissions、tools、artifacts、evidence、routing、task facts 可 join。 |
| `Product conformant` | 产品应用不传 key、不 fork runtime/UI、旧路径有退出条件。 |

## 最小验收场景

1. First text 前 runtime status 可见，且不进入 final answer。
2. Tool call 有 `toolCallId`，失败/成功不从 assistant text 推断。
3. Pending approval 有 `actionId`，未解决时 UI 显示 waiting。
4. Artifact 通过 `artifactId` 引用，不复制完整 bytes 到 message。
5. Evidence export 包含 runtime correlation spine。
6. Old session 可通过 read model hydration 恢复。
7. 缺失 runtime fact 显示 unknown/unavailable/stale/blocked。
8. 产品应用 payload 不含 key/token/secret。
9. Production path 不依赖 mock fallback。
10. Existing local ProcessTree/ToolGroup 标为 deprecated 或迁到共享 AgentUI。

## 建议检查

- JSON schema validation for events/read models/投影 fixtures。
- Contract tests for App Server client and AgentUI reducer。
- Fixture replay for active run、tool failure、approval、artifact、evidence、hydration。
- Governance scan for deprecated imports and mock production fallback。
