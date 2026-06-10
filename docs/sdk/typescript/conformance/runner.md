---
title: Runner
description: TypeScript conformance runner 的输入、输出和失败分类。
---

# Runner

Conformance runner 用 fixture 和 App Server facts 证明四包协作可用。它不是视觉截图，也不是真实 Provider live gate；它验证 contracts、projection、runtime client transport 和 React controlled surfaces。

## 标准输入

| Input | Source | Required |
| --- | --- | --- |
| `fixture.id` | `@limecloud/agent-ui-contracts` | yes |
| `events` | RuntimeEvent fixtures or App Server event facts | yes |
| `initialReadModel` | 可选 hydration snapshot | no |
| `finalReadModel` | 可选 repair snapshot | no |
| `expected` | fixture expectation | yes |

## Runner stages

```text
validate fixture
  -> validate each RuntimeEvent
  -> replayAgentUiFixture
  -> assert ProjectionState
  -> render AgentUiProjectionView
  -> assert DOM contract
  -> export report
```

## Fixture 清单

| Fixture | Must prove |
| --- | --- |
| `text-basic` | lifecycle、stream delta、final text、snapshot completed。 |
| `tool-success` | tool start/result、output ref、timeline、graph node。 |
| `tool-failure` | failed tool、diagnostic、runtime failed/degraded。 |
| `hitl-action` | action required/resolved、callback surface。 |
| `artifact-evidence` | ArtifactRef / EvidenceRef projection 和 React refs。 |
| `stream-repair` | sequence gap、snapshot repair、text 不重复。 |
| `subagent-handoff` | task/subagent/handoff/review、TeamWorkbench。 |

## Report shape

```ts
export interface AgentUiConformanceReport {
  fixtureId: string;
  passed: boolean;
  diagnostics: Array<{
    code: string;
    message: string;
    sourceEventId?: string;
  }>;
  counts: {
    messages: number;
    timeline: number;
    graph: number;
    actions: number;
    artifacts: number;
    evidence: number;
  };
}
```

## Failure categories

| Code | Meaning | Owner |
| --- | --- | --- |
| `schema_mismatch` | event/read model/projection state 字段不合法。 | contracts |
| `missing_scope_id` | tool/action/artifact/evidence/team event 缺 id。 | runtime provider |
| `sequence_gap` | event stream 需要 repair。 | projection / runtime |
| `large_payload_inline` | 大输出未走 ref。 | runtime provider |
| `secret_leak_risk` | payload 疑似包含 key/token/secret。 | runtime provider / host |
| `projection_mismatch` | fixture expectation 与 projection state 不一致。 | projection |
| `react_contract_missing` | class/data attrs/callback contract 缺失。 | runtime-ui |
| `transport_unavailable` | runtime-client 缺 event/read/evidence surface。 | runtime-client / host |

## CI commands

```bash
npm --prefix packages/agent-ui-contracts run test
npm --prefix packages/agent-runtime-client run test
npm --prefix packages/agent-runtime-projection run test
npm --prefix packages/agent-runtime-ui run test
```

触及 App Server JSON-RPC、Host bridge 或 mock 边界时再跑：

```bash
npm run test:contracts
```

触及 Lime GUI 主路径时再跑：

```bash
npm run smoke:agent-runtime-current-fixture
npm run verify:gui-smoke
```
