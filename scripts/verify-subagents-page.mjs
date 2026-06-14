import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  collectRuntimeEventValidationIssues,
  getAgentUiFixture,
  verifyRuntimeEventSequence,
} from "@limecloud/agent-ui-contracts";
import { replayAgentUiFixture } from "@limecloud/agent-runtime-projection";
import { SubagentsView } from "@limecloud/agent-runtime-ui";

const fixture = getAgentUiFixture("subagent-handoff");
const validationIssues = fixture.events.flatMap((event, index) =>
  collectRuntimeEventValidationIssues(event, `$.events[${index}]`),
);
const sequenceViolations = verifyRuntimeEventSequence(fixture.events);
const replay = replayAgentUiFixture(fixture);

assert.equal(validationIssues.length, 0, "subagent-handoff fixture must pass event schema validation");
assert.equal(sequenceViolations.length, 0, "subagent-handoff fixture must pass sequence verification");
assert.equal(replay.failedClosed, false, "subagent-handoff replay must not fail closed");
assert.equal(replay.passed, true, "subagent-handoff replay must satisfy fixture expectations");
assert.equal(replay.state.subagents.hasSubagents, true, "projection must expose subagents");
assert.equal(replay.state.subagents.threads.length, 1, "projection must expose the child thread");
assert.equal(replay.state.subagents.delegationCalls.length, 2, "projection must expose spawn and handoff calls");
assert.ok(replay.state.subagents.activities.length >= 5, "projection must expose subagent activities");

const markup = renderToStaticMarkup(
  React.createElement(SubagentsView, {
    state: replay.state,
    labels: {
      subagentsAriaLabel: "Subagents fixture projection",
      subagentThreadTitle: (thread) => thread.title,
      subagentDelegationTitle: (delegation) => `${delegation.action}: ${delegation.title}`,
      subagentActivityTitle: (activity) => activity.title,
    },
  }),
);

assert.match(markup, /agent-subagents/, "SubagentsView must render the shared surface");
assert.match(markup, /data-subagent-count="1"/, "SubagentsView must render subagent count");
assert.match(markup, /data-delegation-count="2"/, "SubagentsView must render delegation count");
assert.match(markup, /data-thread-id="subagent_fixture_researcher"/, "SubagentsView must render the fixture thread");
assert.match(markup, /data-delegation-action="spawn"/, "SubagentsView must render spawn delegation");
assert.match(markup, /data-delegation-action="handoff"/, "SubagentsView must render handoff delegation");

const [subagentsPage, liveLoop, themeIndex] = await Promise.all([
  readFile("docs/subagents.md", "utf8"),
  readFile("docs/.vitepress/theme/SubagentsLiveLoop.vue", "utf8"),
  readFile("docs/.vitepress/theme/index.ts", "utf8"),
]);

assert.match(subagentsPage, /<SubagentsLiveLoop \/>/, "/subagents page must mount the live loop component");
assert.match(subagentsPage, /aside: false/, "/subagents page must use the wide workbench layout");
assert.match(liveLoop, /getAgentUiFixture\("subagent-handoff"\)/, "live loop must use the canonical fixture");
assert.match(liveLoop, /collectRuntimeEventValidationIssues/, "live loop must show schema gate results");
assert.match(liveLoop, /verifyRuntimeEventSequence/, "live loop must show sequence gate results");
assert.match(liveLoop, /replayAgentUiFixture/, "live loop must replay the fixture before projection display");
assert.match(liveLoop, /<pre class="subagents-live-loop__event-json">/, "live loop must expose selected event details");
assert.match(liveLoop, /eventFilters/, "live loop must expose event filtering controls");
assert.match(liveLoop, /onOpenThread: selectThread/, "live loop must connect SubagentsView thread selection");
assert.match(themeIndex, /SubagentsLiveLoop/, "VitePress theme must register the live loop component");

const [hostContract, runtimeEventContract, runtimeProvider, limeProfile, conformance, roadmap, toolsConcept, sequenceVerifier, contractEvents] =
  await Promise.all([
    readFile("docs/contracts/app-server-host.md", "utf8"),
    readFile("docs/contracts/runtime-event.md", "utf8"),
    readFile("docs/quickstart/runtime-provider.md", "utf8"),
    readFile("docs/profiles/lime.md", "utf8"),
    readFile("docs/contracts/conformance.md", "utf8"),
    readFile("docs/development/roadmap.md", "utf8"),
    readFile("docs/concepts/tools.md", "utf8"),
    readFile("docs/sdk/typescript/contracts/sequence-verifier.md", "utf8"),
    readFile("docs/sdk/typescript/contracts/events.md", "utf8"),
  ]);

assert.match(
  hostContract,
  /Product UI \/ Claw \/ Agent App[\s\S]*agentSession\/turn\/start[\s\S]*RuntimeCore/,
  "App Server host contract must document the unified Claw / Agent App loop",
);
assert.match(
  hostContract,
  /same session|同一 session/,
  "App Server host contract must mention per-session turn ownership",
);
assert.match(
  hostContract,
  /batch atomic append|整批 fail closed|完整验证再入库/,
  "App Server host contract must require atomic runtime event append",
);
assert.match(
  hostContract,
  /tool\.args[\s\S]*tool\.output\.delta[\s\S]*tool\.result[\s\S]*tool\.failed[\s\S]*active `tool\.started`/,
  "App Server host contract must keep tool lifecycle ownership in RuntimeCore",
);
assert.match(
  runtimeEventContract,
  /Tool failure terminal fact[\s\S]*tool\.failed[\s\S]*failureCategory[\s\S]*success=false[\s\S]*tool\.result/,
  "Runtime event contract must require failed ToolEnd to stay a tool.failed fact",
);
assert.match(
  runtimeProvider,
  /active \/ queued \/ waiting turn/,
  "Runtime provider quickstart must require active-turn queue or rejection semantics",
);
assert.match(
  runtimeProvider,
  /schema[\s\S]*sequence[\s\S]*tool lifecycle[\s\S]*approval gate[\s\S]*owner adjacency/,
  "Runtime provider quickstart must document RuntimeCore event append gates",
);
assert.match(
  runtimeProvider,
  /messageId[\s\S]*itemId[\s\S]*assistantMessageId[\s\S]*tool\.started[\s\S]*tool\.result/,
  "Runtime provider quickstart must document tool owner adjacency",
);
assert.match(
  runtimeProvider,
  /success=false[\s\S]*tool\.failed[\s\S]*failureCategory[\s\S]*error[\s\S]*output[\s\S]*tool\.result/,
  "Runtime provider quickstart must require failed tool terminals to emit tool.failed",
);
assert.match(
  limeProfile,
  /Frontend \/ Claw \/ Agent App[\s\S]*App Server agentSession\/\*[\s\S]*AgentUI projection/,
  "Lime profile must align Claw and Agent App to the current App Server runtime chain",
);
assert.match(
  limeProfile,
  /batch atomic[\s\S]*StoredSession\.events/,
  "Lime profile must keep RuntimeCore batch atomic append as a hard rule",
);
assert.match(
  limeProfile,
  /ToolEnd \{ result\.success: false \}[\s\S]*tool\.failed[\s\S]*tool\.result/,
  "Lime profile must keep failed tool terminals out of successful tool.result projection",
);
assert.match(
  conformance,
  /runtime-single-active-turn/,
  "Conformance matrix must include the runtime single-active-turn fixture slice",
);
assert.match(
  conformance,
  /runtime-event-batch-atomic[\s\S]*tool-owner-adjacency/,
  "Conformance matrix must include batch atomic and tool owner adjacency slices",
);
assert.match(
  conformance,
  /Tool Owner Adjacency Gate/,
  "Conformance recommendations must include the tool owner adjacency gate",
);
assert.match(
  conformance,
  /RuntimeBackend Tool Failure Terminal Gate[\s\S]*tool\.failed[\s\S]*failureCategory/,
  "Conformance recommendations must include failed tool terminal mapping",
);
assert.match(
  roadmap,
  /v2\.10\.2（已完成）[\s\S]*single active turn gate/,
  "Roadmap must record the Claw loop single-turn alignment",
);
assert.match(
  roadmap,
  /v2\.11\.1（已完成）[\s\S]*tool lifecycle owner guard[\s\S]*v2\.11\.2（已完成）[\s\S]*batch atomic guard[\s\S]*v2\.11\.3（已完成）[\s\S]*approval gate guard[\s\S]*v2\.11\.4（已完成）[\s\S]*tool owner adjacency guard[\s\S]*v2\.11\.5（已完成）[\s\S]*tool args fact[\s\S]*v2\.11\.6（已完成）[\s\S]*tool failure terminal fact[\s\S]*v2\.11\.7（下一刀）[\s\S]*ToolRouter \/ ToolOrchestrator/,
  "Roadmap must track the RuntimeCore tool lifecycle hardening slices",
);
assert.match(
  toolsConcept,
  /MCP[\s\S]*ACP[\s\S]*skills[\s\S]*shell[\s\S]*project tools/,
  "Tools concept must keep MCP / ACP / skills / shell / project tools on one lifecycle",
);
assert.match(
  toolsConcept,
  /action\.required[\s\S]*action\.resolved[\s\S]*tool\.result/,
  "Tools concept must require approval gate before tool result",
);
assert.match(
  toolsConcept,
  /messageId[\s\S]*itemId[\s\S]*assistantMessageId[\s\S]*owning assistant item/,
  "Tools concept must require owning assistant item adjacency",
);
assert.match(
  sequenceVerifier,
  /single active turn gate[\s\S]*RuntimeCore/,
  "Sequence verifier docs must keep single active turn ownership in RuntimeCore",
);
assert.match(
  sequenceVerifier,
  /schema gate[\s\S]*sequence gate[\s\S]*tool lifecycle owner guard[\s\S]*batch atomic append[\s\S]*approval gate[\s\S]*tool owner adjacency/,
  "Sequence verifier docs must distinguish downstream verifier from RuntimeCore ingress gates",
);
assert.match(
  sequenceVerifier,
  /ToolEnd \{ result\.success: false \}[\s\S]*tool\.failed[\s\S]*Sequence Verifier[\s\S]*失败 `tool\.result`/,
  "Sequence verifier docs must keep failed terminal mapping in RuntimeBackend",
);
assert.match(
  contractEvents,
  /tool\.failed[\s\S]*success=false[\s\S]*tool\.failed[\s\S]*payload\.failureCategory[\s\S]*payload\.error[\s\S]*payload\.output/,
  "Event reference must document tool.failed payload shape",
);

console.log(
  JSON.stringify(
    {
      fixture: fixture.id,
      events: fixture.events.length,
      threads: replay.state.subagents.threads.length,
      delegations: replay.state.subagents.delegationCalls.length,
      activities: replay.state.subagents.activities.length,
      passed: replay.passed,
    },
    null,
    2,
  ),
);
