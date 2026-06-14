---
title: Fixtures
description: "@limecloud/agent-ui-contracts 的 conformance fixtures。"
---

# Fixtures

Fixtures 是 SDK 标准的可执行样本。它们用于验证 runtime provider、projection reducer 和 React surfaces 是否理解同一套 runtime facts。

实现锚点：`packages/agent-ui-contracts/src/fixtures.ts`。

## Fixture Shape

```ts
export interface AgentUiFixture<TEvent = AgentRuntimeExecutionEvent> {
  id: string;
  schemaVersion: string;
  title: string;
  events: TEvent[];
  initialReadModel?: AgentRuntimeReadModel<TEvent>;
  finalReadModel?: AgentRuntimeReadModel<TEvent>;
  expected: {
    status: string;
    messagePartCount?: number;
    timelineEntryCount?: number;
    graphNodeCount?: number;
    pendingActionCount?: number;
    artifactCount?: number;
    evidenceCount?: number;
    subagents?: {
      hasSubagents?: boolean;
      threadCount?: number;
      delegationCallCount?: number;
      activityCount?: number;
      activeThreadCount?: number;
      completedThreadCount?: number;
      failedThreadCount?: number;
    };
    diagnostics?: string[];
  };
}
```

| Property | Description |
| --- | --- |
| `events` | 标准 runtime facts，不能保存 mock-only payload。 |
| `initialReadModel` | 进入页面或 hydrate 前可选快照。 |
| `finalReadModel` | runtime 结束后的 read model。 |
| `expected` | projection / UI conformance 的最低断言。 |
| `expected.subagents` | subagent threads、delegation calls、activities 和线程状态集合的最低断言；没有 subagent facts 时也可显式断言 `hasSubagents: false`。 |

## Built-in Fixtures

| Fixture | 覆盖 | 必须验证 |
| --- | --- | --- |
| `text-basic` | turn lifecycle、model delta、final text、snapshot。 | message part 合并、runtime completed。 |
| `tool-success` | tool started/result、output ref。 | Tool timeline、refs 不内联。 |
| `tool-failure` | tool failed、failure category。 | Diagnostics、failed status。 |
| `hitl-action` | `action.required` -> `action.resolved` terminal 示例。 | pending action 清零，UI 不乐观完成。 |
| `artifact-evidence` | artifact ref、evidence ref。 | Artifact / Evidence lane。 |
| `stream-repair` | sequence gap、snapshot repair。 | repair diagnostics 可声明。 |
| `subagent-handoff` | parent task、subagent、handoff、review verdict。 | ExecutionGraph、Evidence refs、`subagents` counts。 |

## Subagents Assertions

`subagent-handoff` fixture 是 Subagents surface 的最低验收样本。它必须让 projection 生成：

| Projection field | Required assertion |
| --- | --- |
| `state.subagents.hasSubagents` | 有 subagent、worker、handoff 或 review facts 时为 `true`。 |
| `state.subagents.threads` | 至少包含一个 subagent / worker thread。 |
| `state.subagents.delegationCalls` | 包含 spawn / handoff 调用事实。 |
| `state.subagents.activities` | 保留 started / interacted / handoff / review / completed 活动轨迹。 |
| `state.subagents.completedThreadIds` | completed 子代理线程 id。 |
| `state.subagents.failedThreadIds` | failed 子代理线程 id。 |

Fixture 只能保存 normalized runtime facts。大 artifact、evidence pack、原始工具输出必须通过 refs 表达。

## Usage

```ts
import {
  agentUiConformanceFixtures,
  getAgentUiFixture
} from "@limecloud/agent-ui-contracts";

const textFixture = getAgentUiFixture("text-basic");

for (const fixture of agentUiConformanceFixtures) {
  console.log(fixture.id, fixture.expected.status);
}
```

## Writing New Fixtures

新增 fixture 时必须满足：

1. 每个 event 有稳定 `id`。
2. 需要排序的 stream 有 `sequence`。
3. tool/action/artifact/evidence 有对应 scope id。
4. 大输出用 `refIds`、`artifactRefs`、`evidenceRefs`。
5. 预期失败要写入 `expected.diagnostics`，不能让测试偷偷忽略。

## Validation

```ts
import { validateAgentUiFixture } from "@limecloud/agent-ui-contracts";

validateAgentUiFixture(getAgentUiFixture("subagent-handoff"));
```

最低验证：

```bash
npm --prefix packages/agent-ui-contracts run test
npm --prefix packages/agent-runtime-projection run test
npm --prefix packages/agent-runtime-ui run test
```

## 禁止事项

- 不把 fixtures 当 production fallback。
- 不把 fixture payload 写成 Provider 原始响应。
- 不只验证“能渲染一行文本”；fixture 必须覆盖事件族和 projection 结果。
- 不用 fixture 替代真实 App Server JSON-RPC contract tests。
