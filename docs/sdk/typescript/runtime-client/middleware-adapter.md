---
title: Runtime Middleware / Adapter
description: runtime-client 的 normalize、adapter、middleware 到 verifier 再到 dispatch 的协议边界。
---

# Runtime Middleware / Adapter

v2.4 要补的是 runtime client 的协议演进层，不是再造一套 runtime。这里的职责顺序固定为：

```text
normalize -> adapter -> middleware -> sequence verifier -> dispatch
```

这条链的目标是把外部 transport、旧命名、兼容字段和版本差异，先收敛成稳定的 Lime runtime event，再交给 sequence verifier 做序列边界检查，最后才分发给 listener、projector 或产品侧 gateway。

## 职责分层

| 层 | 作用 | 不做什么 |
| --- | --- | --- |
| normalize | 统一事件名、字段、cursor、notification 形状。 | 不判断业务是否完成。 |
| adapter | 连接 JSON-RPC、Host bridge、session gateway、legacy 兼容 surface。 | 不生成 UI state。 |
| middleware | 做兼容、降级、诊断、版本协商。 | 不引入第二套状态机。 |
| sequence verifier | 校验 turn / tool / action / subagent 序列规则。 | 不修复坏流。 |
| dispatch | 把通过校验的事件交给调用方。 | 不替 verifier 兜底。 |

## 典型流程

```ts
const normalized = normalizeRuntimeEvent(notification);
const adapted = adaptRuntimeEvent(normalized, transportContext);
const wrapped = applyRuntimeMiddleware(adapted, middlewareChain);

const violations = verifier.push(wrapped.event);
if (violations.length > 0) {
  handleViolation(violations);
  return;
}

dispatch(wrapped.event, wrapped.notification);
```

这里的关键点是：middleware 可以改写输入形状，但不能越过 verifier 直接把事件送进 dispatch。dispatch 之前的唯一硬闸仍然是 sequence verifier。

## 版本演进

v2.3 已经完成 `/subagents` 活体闭环：`subagent-handoff` fixture 经过 verifier、replay、projection，最终驱动 `SubagentsView`。  
v2.4 继续补的是协议演进机制，重点不在新增 surface，而在让 runtime client 能稳定承接：

- event family 扩展。
- 旧字段到新字段的归一。
- transport 差异的兼容适配。
- 版本协商和 degraded diagnostics。

也就是说，v2.3 证明了闭环可跑，v2.4 负责让闭环能持续演进。

## 边界

- middleware 可以做兼容映射，不能成为业务逻辑容器。
- adapter 可以包 transport，不能直接生成 projection state。
- verifier 失败时必须阻断 dispatch，不可静默放行。
- `/subagents` 已经是 current 闭环，不需要在 runtime-client 里重新解释它，只需要继续保证协议演进不破坏它。
- v2.6 已把单事件 JSON Schema gate 前移到 Rust/App Server 入库边界；runtime-client 仍负责下游 transport 兼容和 sequence verifier，不替代后端事实源校验。
- v2.8 已把跨事件 sequence gate 也前移到 Rust/App Server 入库边界；runtime-client 的 verifier 仍保留，用于 browser / bridge / transport 边界 fail-closed，但不能成为 Lime 本体唯一执行点。
- v2.9 已支持 adapter / middleware 返回 `0..N` 个 notification，并提供 `flush()` / `flushSync()` 排空 buffered transform。Lime 本体 App Server notification、本地 publish、bridge listener 与 Agent App current runtime client options 已消费这条 pipeline 输出。
- v2.9 只是 fan-out / flush substrate 与 Lime 本体消费路径。具体 provider chunk family mapping、message snapshot reconciliation、partial tool args buffer 仍属于后续合同；不能把临时兼容 fan-out 写成新的 durable truth。
- AG-UI 的 `runNextWithState` / subscriber `stopPropagation` 不直接进入 Lime 产品 UI。Lime 的 post-apply state 属于 `@limecloud/agent-runtime-projection`，middleware 只能改写 transport event，不能绕过 projection 生成业务状态。
