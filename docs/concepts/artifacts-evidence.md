---
title: 产物与证据
description: 产物、证据、回放和审查的 ownership。
---

# 产物与证据

Artifact 和 evidence 是 Agent 产品从“聊天”进化为“工作台”的关键。它们必须是稳定引用，不是正文里的长文本。

## 产物边界

| 产物事实 | 拥有方 |
| --- | --- |
| metadata、kind、status | artifact service |
| preview、versions、diffs | artifact service |
| creation link | runtime event refs |
| export state | artifact service |

Runtime 可以发出 `artifact.changed`，但 artifact bytes 和版本历史由 artifact owner 管。

## ArtifactRef

```ts
interface ArtifactRef {
  artifactId: string;
  kind: "document" | "image" | "video" | "dataset" | "code" | "report" | "other";
  owner: "artifact-service" | "product-app";
  status: "creating" | "ready" | "failed" | "exported";
  title?: string;
  versionId?: string;
  previewRef?: string;
  source: {
    sessionId: string;
    threadId: string;
    turnId?: string;
    taskId?: string;
    toolCallId?: string;
  };
}
```

UIMessageParts 可以引用 ArtifactRef，但不能复制 artifact bytes。产品应用可以拥有业务产物入口，但 runtime correlation 必须保留。

## 证据边界

Evidence 包含 trace、replay、review、verification、audit、benchmark refs。它消费 runtime facts，不重新发明运行真相。

```json
{
  "runtimeCorrelation": {
    "runtimeId": "runtime_local",
    "sessionId": "session_123",
    "threadId": "thread_123",
    "turnId": "turn_123",
    "taskId": "task_123",
    "runId": "run_123",
    "traceId": "trace_123"
  }
}
```

## EvidenceRef

```ts
interface EvidenceRef {
  evidenceId: string;
  kind: "trace" | "replay" | "review" | "verification" | "audit" | "benchmark";
  status: "collecting" | "ready" | "failed";
  title?: string;
  summaryRef?: string;
  exportRef?: string;
  runtimeCorrelation: RuntimeCorrelation;
}
```

EvidenceRef 必须能回答三个问题：

1. 它证明的是哪个 session/thread/turn/task/run。
2. 它来自哪个 owner，是否可回放。
3. 它的 verdict 是否来自 review/eval owner，而不是 assistant prose。

## UI 投影

- Message 中只显示 artifact/evidence 引用和摘要。
- Timeline/evidence lane 提供 review、replay、verification 入口。
- 缺失 evidence 时显示 unavailable 或 known gap，不输出通用假 gap。
- Evidence verdict 不得从 assistant prose 推断。

## 反模式

- 把 Markdown 正文当作 artifact 唯一存储。
- evidence export 只导出最终回答，不带 runtime correlation。
- review verdict 由模型一句话直接决定，不经过 review/eval owner。
- UI 在本地生成 artifact/evidence id 后不回写 owner service。
