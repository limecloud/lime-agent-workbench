---
title: Validation
description: "@limecloud/agent-ui-contracts 的 schema 与边界校验。"
---

# Validation

Validation helpers 用于把“标准”变成可执行门禁。它们检查 runtime event、read model、projection state 和 fixture 是否满足 Lime AgentUI 合同。

实现锚点：`packages/agent-ui-contracts/src/validation.ts`。

## API

```ts
export function validateRuntimeEvent(input: unknown): AgentRuntimeExecutionEvent;
export function validateThreadReadModel(input: unknown): AgentRuntimeReadModel;
export function validateProjectionState(input: unknown): AgentUiProjectionState;
export function validateAgentUiFixture(input: unknown): AgentUiFixture;
```

这些函数遇到问题会抛出 `AgentUiContractValidationError`。

```ts
export class AgentUiContractValidationError extends Error {
  readonly issues: AgentUiContractValidationIssue[];
}

export interface AgentUiContractValidationIssue {
  code: AgentUiContractValidationCode;
  path: string;
  message: string;
}
```

## Error Codes

| Code | 触发条件 | 修复方式 |
| --- | --- | --- |
| `schema_mismatch` | 必填字段缺失或类型错误。 | 按 contracts 类型补齐字段。 |
| `missing_scope_id` | tool/action/artifact/evidence event 缺少稳定 id。 | 补 `toolCallId`、`actionId`、`artifactId`、`evidenceId` 或 refs。 |
| `sequence_gap` | fixture events sequence 不连续。 | 补缺失 event，或在 repair fixture 中声明 diagnostics。 |
| `secret_leak_risk` | payload key 疑似包含 token、secret、password、authorization。 | 删除 secret，改为安全 ref 或 redacted summary。 |
| `large_payload_inline` | payload 超过内联阈值。 | 用 `refIds` / artifact / evidence 存储。 |
| `unknown_event_type` | 预留分类。 | 先登记 event family，再进入 projection。 |

## Usage

```ts
import {
  AgentUiContractValidationError,
  validateRuntimeEvent
} from "@limecloud/agent-ui-contracts";

try {
  validateRuntimeEvent(input);
} catch (error) {
  if (error instanceof AgentUiContractValidationError) {
    for (const issue of error.issues) {
      console.error(issue.code, issue.path, issue.message);
    }
  }
}
```

## Collectors

需要批量报告时使用 collector，不直接抛错。

```ts
import {
  collectAgentUiFixtureValidationIssues
} from "@limecloud/agent-ui-contracts";

const issues = collectAgentUiFixtureValidationIssues(fixture);
```

## Validation Targets

| Target | 必填结构 |
| --- | --- |
| Runtime event | `id`、`schemaVersion`、`runtimeId`、`kind`、`status`、`title`、`createdAt`、integer `sequence`。 |
| Thread read model | `events`、`visibleEvents`、`pendingActions`、`artifactRefs`、`evidenceRefs`、`taskRefs`。 |
| Projection state | `runtime`、`messages`、`timeline`、`graph`、`tools`、`actions`、`artifacts`、`evidence`、`diagnostics`、`teamWorkbench`、`readModel`、`hydration`、`ephemeralUi`。 |
| Fixture | `id`、`schemaVersion`、`title`、`events`、`expected`。 |

## Projection State Contract

`AgentUiProjectionState` 是 `@limecloud/agent-runtime-ui` 的唯一事实输入。`validateProjectionState` 必须拒绝缺失 `teamWorkbench` 的 state；solo run 也要显式提供空模型，而不是省略字段。

```ts
export interface AgentUiProjectionState<TEvent = AgentRuntimeExecutionEvent> {
  runtime: AgentUiRuntimeStatusView;
  messages: UIMessageParts;
  timeline: ProcessTimeline;
  graph: ExecutionGraph;
  tools: AgentRuntimeEventProjection<TEvent>[];
  actions: AgentRuntimeEventProjection<TEvent>[];
  artifacts: AgentUiArtifactRefView[];
  evidence: AgentUiEvidenceRefView[];
  diagnostics: AgentUiDiagnosticView[];
  teamWorkbench: AgentUiTeamWorkbenchModel<TEvent>;
  readModel: AgentRuntimeReadModel<TEvent>;
  hydration: {
    status: AgentUiHydrationStatus;
    eventCount: number;
  };
  ephemeralUi: Record<string, unknown>;
}
```

`teamWorkbench` 的必填结构：

```ts
export interface AgentUiTeamWorkbenchModel<TEvent = AgentRuntimeExecutionEvent> {
  hasTeamSurface: boolean;
  rosterNodes: ExecutionGraph;
  workItems: ExecutionGraph;
  handoffEvents: AgentRuntimeEventProjection<TEvent>[];
  reviewEvents: AgentRuntimeEventProjection<TEvent>[];
  laneEvents: AgentRuntimeEventProjection<TEvent>[];
}
```

| Field | Validation rule |
| --- | --- |
| `hasTeamSurface` | 必须是 boolean；没有 team facts 时为 `false`。 |
| `rosterNodes` | 必须是 `ExecutionGraph` 数组；只放 subagent / worker / participant 节点。 |
| `workItems` | 必须是 `ExecutionGraph` 数组；只放 task / job / run / attempt 工作项。 |
| `handoffEvents` | 必须是 projected events 数组；事件要保留 handoff scope 或 evidence refs。 |
| `reviewEvents` | 必须是 projected events 数组；事件要保留 review scope 或 evidence refs。 |
| `laneEvents` | 必须是 handoff/review lane 的合并数组；顺序由 runtime `sequence` 或 `createdAt` 决定。 |

标准 surface 只建立在这些字段上：`UIMessageParts`、`ProcessTimeline`、`ExecutionGraph`、`ActionRequired`、`ArtifactRef`、`EvidenceRef`、`TeamWorkbench`。其它产品本地视图可以组合这些字段，但不能变成新的 contracts 事实源。

## CI Contract

```bash
npm --prefix packages/agent-ui-contracts run test
```

涉及 App Server event mapping 时继续运行：

```bash
npm --prefix packages/agent-runtime-projection run test
npm run test:contracts
```

## 禁止事项

- 不在 production path 中吞掉 validation error 后切 mock。
- 不为通过 validation 删除 scope id。
- 不在 payload 中保存 secret 后依赖 UI 层隐藏。
- 不让 React component 自己补 event id、action id 或 tool id。
