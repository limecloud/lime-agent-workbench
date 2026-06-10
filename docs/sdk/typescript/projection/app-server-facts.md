---
title: App Server Facts
description: App Server read/event/evidence facts 到 AgentUI projection 的 adapter。
---

# App Server Facts

`@limecloud/agent-runtime-projection` 提供 App Server facts adapter，用于把 App Server session read、event notification、evidence export 归一为 `AgentRuntimeExecutionEvent[]`。

实现锚点：`packages/agent-runtime-projection/src/appServerFacts.ts`。

## Input Shapes

```ts
export interface AppServerFactsReplayInput {
  readModel?: AppServerSessionReadFacts;
  events?: AppServerAgentEventFact[];
  evidenceExport?: AppServerEvidenceExportFacts;
  sourceCount?: number;
}
```

| Input | Description |
| --- | --- |
| `readModel` | `agentSession/read` 形状。 |
| `events` | `agentSession/event` 事件列表。 |
| `evidenceExport` | evidence export summary。 |
| `sourceCount` | 输入源计数。 |

## replayAppServerFacts

```ts
import { replayAppServerFacts } from "@limecloud/agent-runtime-projection";

const result = replayAppServerFacts({
  readModel,
  events,
  evidenceExport
});

console.log(result.events);
console.log(result.state);
```

返回值：

```ts
export interface AppServerFactsProjectionResult {
  events: AgentRuntimeExecutionEvent[];
  state: AgentUiProjectionState<AgentRuntimeExecutionEvent>;
  diagnostics: string[];
}
```

## Mapping

| App Server fact | Runtime event |
| --- | --- |
| session snapshot | `snapshot.updated` |
| turn started/running | `turn.started` / `run.status` |
| turn completed | `turn.completed` |
| event `message.delta` / model payload | `model.delta` |
| tool payload | `tool.started` / `tool.result` / `tool.failed` |
| action payload | `action.required` / `action.resolved` |
| artifact summary | `artifact.changed` |
| evidence pack summary | `evidence.changed` |

## Diagnostics

| Diagnostic | Meaning |
| --- | --- |
| `app_server_facts_empty` | 没有 read model、events 或 evidence export 可投影。 |

## Boundary

- Adapter 不创建 App Server client。
- Adapter 不订阅 JSON-RPC。
- Adapter 不读取数据库。
- Adapter 不把 evidence pack 文件内容塞进 projection state。

## 验证

```bash
npm --prefix packages/agent-runtime-projection run test
```

App Server method 或 bridge 变更还要运行：

```bash
npm run test:contracts
```

