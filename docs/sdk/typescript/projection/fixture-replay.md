---
title: Fixture Replay
description: replayAgentUiFixture 的 conformance 用法。
---

# Fixture Replay

`replayAgentUiFixture` 用 contracts fixtures 验证 projection 是否符合标准。

实现锚点：`packages/agent-runtime-projection/src/fixtureReplay.ts`。

## API

```ts
export function replayAgentUiFixture<TEvent extends AgentRuntimeExecutionEvent>(
  fixture: AgentUiFixture<TEvent>
): AgentUiFixtureReplayResult<TEvent>;
```

```ts
export interface AgentUiFixtureReplayResult<TEvent = AgentRuntimeExecutionEvent> {
  fixtureId: string;
  state: AgentUiProjectionState<TEvent>;
  validationIssues: AgentUiContractValidationIssue[];
  sequenceViolations: RuntimeSequenceViolation[];
  failedClosed: boolean;
  diagnostics: string[];
  passed: boolean;
}
```

## Example

```ts
import { getAgentUiFixture } from "@limecloud/agent-ui-contracts";
import { replayAgentUiFixture } from "@limecloud/agent-runtime-projection";

const result = replayAgentUiFixture(getAgentUiFixture("hitl-action"));

if (!result.passed) {
  console.error(result.diagnostics);
}
```

## Checks

Replay 当前检查：

| Check | Description |
| --- | --- |
| validation issues | 复用 contracts validation。 |
| message count | `expected.messagePartCount` 下限。 |
| timeline count | `expected.timelineEntryCount` 下限。 |
| graph count | `expected.graphNodeCount` 下限。 |
| pending action count | `expected.pendingActionCount` 精确值。 |
| artifact / evidence count | refs 下限。 |
| subagents counts | `expected.subagents` 中 thread、delegation call、activity 和线程状态 count。 |
| expected diagnostics | 允许特定 repair / failure diagnostics。 |

`subagents` 是必填 projection state 字段。Replay 对没有 subagent facts 的 fixture 也应确认它存在，并且 `hasSubagents` 与空数组一致。旧 `teamWorkbench` seed 名称不能作为 current state owner。

## Required Fixtures

每次修改 projection 逻辑，至少跑内置 fixtures：

```ts
for (const fixture of agentUiConformanceFixtures) {
  expect(replayAgentUiFixture(fixture).passed).toBe(true);
}
```

## Boundary

- Fixture replay 不是 production transport。
- Replay 不调用 App Server。
- Replay 不渲染 React。
- Replay 不替代 GUI smoke；它证明 projection reducer 对标准 facts 的理解。
