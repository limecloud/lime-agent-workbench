---
title: Subagents 活体闭环
description: 用 subagent-handoff fixture 证明 verifier、replay、projection、read-model 和 SubagentsView 的闭环。
---

# Subagents 活体闭环

本页是 v2.3 的最小活体闭环示例。它不新增协议，只把现有 current 事实源串起来：`subagent-handoff` fixture 先通过 JSON Schema 和 Sequence Verifier，再进入 replay / projection，最后由 `AgentUiProjectionState.subagents` 驱动 `SubagentsView`。

这不是完整活体矩阵。多事件族覆盖见 [活体 Demo 矩阵](/examples/live-matrix)。

<ClientOnly>
  <SubagentsLiveLoop />
</ClientOnly>

```text
subagent-handoff fixture
  -> collectRuntimeEventValidationIssues
  -> verifyRuntimeEventSequence
  -> replayAgentUiFixture
  -> result.state.subagents
  -> SubagentsView
```

## Fixture

`subagent-handoff` 至少包含：

```text
task.created(parent)
subagent.started(child)
channel.opened(parent -> child)
channel.message(child -> parent)
tool.started(child)
tool.result(child)
artifact.changed(child)
handoff.requested(child -> parent)
review.verdict(parent)
subagent.completed(child)
task.completed(parent)
state.delta or snapshot.updated
```

这些事件不是 UI 脚本。它们是 runtime facts，必须能通过 schema、sequence、projection 三层验证。

## Verifier

```ts
import {
  getAgentUiFixture,
  verifyRuntimeEventSequence
} from "@limecloud/agent-ui-contracts";

const fixture = getAgentUiFixture("subagent-handoff");
const violations = verifyRuntimeEventSequence(fixture.events);

if (violations.length > 0) {
  throw new Error(`invalid fixture sequence: ${violations[0].code}`);
}
```

Sequence Verifier 只负责跨事件规则，例如 tool/action 配对、turn 终态后不再出现执行流事件、重复 event id。单事件字段合法性由 JSON Schema / validation 负责。

## Replay / Projection

```ts
import { replayAgentUiFixture } from "@limecloud/agent-runtime-projection";

const result = replayAgentUiFixture(fixture);

if (result.failedClosed || !result.passed) {
  throw new Error(result.diagnostics.join("\n"));
}

const subagents = result.state.subagents;
```

`replayAgentUiFixture` 的关键断言：

| 断言 | 目的 |
| --- | --- |
| `result.failedClosed === false` | 坏流没有进入 projector。 |
| `result.state.graph` 有 parent/child edge | task 与 subagent lineage 可 replay。 |
| `subagents.hasSubagents === true` | UI 可以展示多执行体 surface。 |
| `subagents.threads.length > 0` | 子代理线程来自 runtime facts。 |
| `subagents.delegationCalls.length > 0` | spawn / handoff 调用可审计。 |
| `subagents.activities.length > 0` | started / interacted / handoff / completed 活动可展示。 |

## Read Model / Patch

runtime read API 可以返回 `ThreadReadModel` / `TaskSnapshot` 修复断流状态；`state.delta` 只 patch 派生 state，不伪造业务事实。fixture replay 和 runtime-client pipeline 负责在调用 projector 前执行 schema / sequence gate；projector 负责 apply、refs 同步和 stale diagnostics。

```ts
projector.hydrate(readModel);

for (const event of streamedEvents) {
  const violations = verifier.push(event);
  if (violations.length > 0) {
    projector.applyDiagnostic({
      code: "runtime_sequence_violation",
      source: "sequence-verifier",
      details: violations
    });
    continue;
  }

  projector.apply(event);
}
```

`state.delta` 合法 target 示例：

```json
{
  "eventClass": "state.delta",
  "schemaVersion": "lime-runtime-state-delta/v0.1",
  "payload": {
    "target": "projection.subagents.threads",
    "patch": [
      {
        "op": "replace",
        "path": "/threads/0/summary",
        "value": "Research notes and review evidence are ready."
      }
    ],
    "baseEventId": "evt_27"
  }
}
```

## UI

```tsx
import { SubagentsView } from "@limecloud/agent-runtime-ui";

export function RuntimePanel({ state, onOpenThread }) {
  return (
    <SubagentsView
      model={state.subagents}
      onOpenThread={onOpenThread}
    />
  );
}
```

`SubagentsView` 可以直接接收 `model={state.subagents}`，也可以在组合视图里接收完整 `state`。两种写法的事实源都必须是 `AgentUiProjectionState.subagents`。历史 `TeamWorkbenchView` 命名不再是 current runtime-ui 导出；新接入只能使用 `SubagentsView` / `state.subagents`。

## 最小验收清单

1. `subagent-handoff` fixture 通过 JSON Schema validation。
2. `verifyRuntimeEventSequence(fixture.events)` 返回空数组。
3. `replayAgentUiFixture(fixture).passed === true`。
4. `result.state.subagents.hasSubagents === true`。
5. `SubagentsView` 使用 `state.subagents` 渲染 threads、delegation calls、activities。
6. 断流修复只通过 `snapshot.updated` 或 `state.delta apply`，并保留 diagnostics。
