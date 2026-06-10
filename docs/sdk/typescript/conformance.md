---
title: Conformance
description: TypeScript SDK 的 fixture replay、schema 与包级验收。
---

# Conformance

Conformance 用来证明一个 runtime provider、projection reducer 或 React surface 符合 Lime Agent Workbench 标准。它不是截图检查，也不是“能聊一句话”。

## 包级职责

| 包 | 必须提供 |
| --- | --- |
| `@limecloud/agent-ui-contracts` | schemas、fixtures、version helpers、validation errors。 |
| `@limecloud/agent-ui-projection` | replay runner、idempotency assertions、selector snapshots。 |
| `@limecloud/agent-ui-react` | surface render fixtures、callback contract tests。 |
| `@limecloud/agent-runtime-client` | transport contract tests、error mapping、mock-free production assertions。 |

## Fixture 格式

```ts
export interface AgentUiFixture {
  id: string;
  schemaVersion: string;
  title: string;
  events: RuntimeEvent[];
  initialReadModel?: ThreadReadModel;
  finalReadModel?: ThreadReadModel;
  expected: {
    status: string;
    messagePartCount?: number;
    timelineEntryCount?: number;
    graphNodeCount?: number;
    pendingActionCount?: number;
    artifactCount?: number;
    evidenceCount?: number;
    diagnostics?: string[];
  };
}
```

Fixture 只保存 normalized facts。原生 Provider payload 必须放在 `refs.kind="raw"` 或 diagnostics ref 中，且不能包含 secret。

## 必需 fixture

| Fixture | 覆盖 |
| --- | --- |
| `text-basic` | lifecycle、stream delta、final reconciliation、snapshot completed。 |
| `tool-success` | tool args、progress、result、output ref、timeline。 |
| `tool-failure` | failure category、diagnostic、recovery action。 |
| `hitl-action` | `action.required`、waiting read model、`action.resolved`。 |
| `artifact-evidence` | artifact ref、evidence ref、review/replay correlation。 |
| `stream-repair` | sequence gap、stale、read model repair、text 不重复。 |
| `subagent-handoff` | parent task、child subagent、channel、handoff、review verdict。 |

## Replay runner

```ts
const result = replayAgentUiFixture(fixture, {
  projector: createAgentUiProjector(),
  validateSchema: true
});

expect(result.state).toMatchProjectionSnapshot(fixture.expected);
expect(result.diagnostics).toHaveNoUnexpectedFailures();
```

Replay runner 必须检查：

1. `eventId` 幂等。
2. `sequence` 单调或进入 repair/degraded。
3. final text 不重复追加。
4. missing ids 不升级为 completed。
5. large output 通过 refs 表达。
6. read model 可以修复 active projection。

## Schema validation

contracts 包至少提供：

```ts
export function validateRuntimeEvent(input: unknown): RuntimeEvent;
export function validateThreadReadModel(input: unknown): ThreadReadModel;
export function validateProjectionState(input: unknown): ProjectionState;
```

Validation error 要能分类：

| Error code | 含义 |
| --- | --- |
| `schema_mismatch` | 字段类型或必需字段不匹配。 |
| `missing_scope_id` | tool/action/artifact/evidence/subagent 缺少领域 id。 |
| `sequence_gap` | event stream 有缺口，需要 repair。 |
| `secret_leak_risk` | payload 疑似包含 secret。 |
| `large_payload_inline` | 大输出内联到 event。 |
| `unknown_event_type` | provider 输出未注册 event family。 |

## Runtime client conformance

Runtime client 的 transport tests 必须覆盖：

| 场景 | 要求 |
| --- | --- |
| Host bridge ready | startTurn -> subscribeEvents -> readThread 成功。 |
| Provider not ready | 返回 `provider_not_ready`，不读取产品应用 local key。 |
| Stream interrupted | 抛出 `stream_interrupted` 或标记 stale，不切 mock。 |
| Action response | respondAction 后等待 runtime fact，不乐观改状态。 |
| Evidence export | exportEvidence 返回 EvidenceRefView，并保留 correlation ids。 |
| Production no mock | production transport 不依赖 fixture replay。 |

## React conformance

React surfaces 用 fixture projection state 渲染，不自己跑 runtime。

| Surface | 必须断言 |
| --- | --- |
| MessageParts | text/reasoning/tool preview 不互相污染。 |
| ProcessTimeline | tool、action、artifact、evidence 按 sequence 展示。 |
| ExecutionGraph | task/subagent parent-child edge 可见。 |
| ActionRequired | 点击只调用 callback，不本地标记 resolved。 |
| Artifact / Evidence lane | 只展示 refs，不复制大 payload。 |
| Diagnostics | unknown/unavailable/stale/blocked 可见。 |

## Definition of Done

一个 SDK 切片进入 `current` 前，必须满足：

1. schema validation 通过。
2. fixture replay 通过。
3. projection reducer 有幂等和 repair 测试。
4. React surfaces 只消费 projection state。
5. runtime client transport 不回退 mock。
6. 文档写清 current / compat / deprecated / dead。

## CI 建议

```bash
npm run test:contracts
npm run test:agent-ui-fixtures
npm run test:agent-ui-projection
npm run test:agent-ui-react
```

命令名称可按 Lime 主仓实际脚本调整，但四类检查必须存在：contract、fixture replay、projection reducer、React surface。

