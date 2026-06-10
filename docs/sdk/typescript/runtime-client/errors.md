---
title: Errors
description: Runtime client 错误模型与 UI 映射。
---

# Errors

Runtime client 的错误策略是 fail closed：transport 或 App Server 失败必须向上暴露，不切 mock，不从 UI 层伪造完成态。

## Error Classes

当前 package 复用 `app-server-client` 的 request result / thrown error 形态。文档层要求错误至少可映射到以下 UI 状态。

| Runtime condition | UI status | Retry |
| --- | --- | --- |
| `host_unavailable` | `stale` / `blocked` | 等 Host bridge ready 后重试。 |
| `provider_not_ready` | `blocked` | 打开 Provider setup。 |
| `permission_denied` | `blocked` / `failed` | 需要用户处理或调整策略。 |
| `stream_interrupted` | `stale` | read model repair。 |
| `schema_mismatch` | `failed` | 修 contracts / adapter。 |
| `runtime_failed` | `failed` | 展示 diagnostics ref。 |

## Recommended Shape

```ts
export interface RuntimeClientError {
  code:
    | "provider_not_ready"
    | "host_unavailable"
    | "permission_denied"
    | "stream_interrupted"
    | "schema_mismatch"
    | "runtime_failed";
  message: string;
  retryable: boolean;
  actionId?: string;
  diagnosticsRef?: string;
}
```

## UI Mapping

```ts
function runtimeStatusFromError(error: RuntimeClientError) {
  if (error.code === "stream_interrupted") return "stale";
  if (error.code === "provider_not_ready") return "blocked";
  if (error.retryable) return "blocked";
  return "failed";
}
```

## 禁止事项

- 不把 transport error 静默转换成空 read model。
- 不在 production path 中使用 fixture replay 伪造事件。
- 不把 Provider error 文案直接当稳定 enum。
- 不在 React surface 中捕获错误后修改 runtime truth。

