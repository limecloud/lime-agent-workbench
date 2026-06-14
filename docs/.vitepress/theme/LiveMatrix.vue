<script setup lang="ts">
import { computed } from "vue";
import {
  agentUiConformanceFixtures,
  collectRuntimeEventValidationIssues,
  verifyRuntimeEventSequence
} from "@limecloud/agent-ui-contracts";
import { replayAgentUiFixture } from "@limecloud/agent-runtime-projection";

const scenarioLabels: Record<string, string> = {
  "text-basic": "Text",
  "tool-success": "Tool Success",
  "tool-failure": "Tool Failure",
  "hitl-action": "HITL",
  "artifact-evidence": "Artifact / Evidence",
  "stream-repair": "Stream Repair",
  "subagent-handoff": "Subagents"
};

const rows = computed(() =>
  agentUiConformanceFixtures.map((fixture) => {
    const validationIssues = fixture.events.flatMap((event, index) =>
      collectRuntimeEventValidationIssues(event, `$.events[${index}]`)
    );
    const sequenceViolations = verifyRuntimeEventSequence(fixture.events);
    const replay = replayAgentUiFixture(fixture);
    return {
      id: fixture.id,
      title: scenarioLabels[fixture.id] ?? fixture.title,
      eventCount: fixture.events.length,
      validationIssueCount: validationIssues.length,
      sequenceViolationCount: sequenceViolations.length,
      failedClosed: replay.failedClosed,
      passed: replay.passed,
      messageCount: replay.state.messages.length,
      timelineCount: replay.state.timeline.length,
      toolCount: replay.state.tools.length,
      actionCount: replay.state.actions.length,
      artifactCount: replay.state.artifacts.length,
      evidenceCount: replay.state.evidence.length,
      subagentActivityCount: replay.state.subagents.activities.length,
      diagnostics: replay.diagnostics
    };
  })
);

const summary = computed(() => ({
  total: rows.value.length,
  passed: rows.value.filter((row) => row.passed && !row.failedClosed).length,
  failedClosed: rows.value.filter((row) => row.failedClosed).length,
  validationIssues: rows.value.reduce(
    (count, row) => count + row.validationIssueCount,
    0
  ),
  sequenceViolations: rows.value.reduce(
    (count, row) => count + row.sequenceViolationCount,
    0
  )
}));
</script>

<template>
  <section class="live-matrix" aria-label="AgentUI live matrix">
    <div class="live-matrix__header">
      <p>Fixture Matrix</p>
      <strong>Schema -> Verifier -> Replay -> Projection</strong>
    </div>
    <div class="live-matrix__status">
      <code>fixtures: {{ summary.total }}</code>
      <code>passed: {{ summary.passed }}</code>
      <code>failedClosed: {{ summary.failedClosed }}</code>
      <code>validationIssues: {{ summary.validationIssues }}</code>
      <code>sequenceViolations: {{ summary.sequenceViolations }}</code>
    </div>
    <div class="live-matrix__table" role="table" aria-label="fixture replay matrix">
      <div class="live-matrix__row live-matrix__row--head" role="row">
        <span role="columnheader">Scenario</span>
        <span role="columnheader">Gate</span>
        <span role="columnheader">Projection</span>
        <span role="columnheader">Diagnostics</span>
      </div>
      <div v-for="row in rows" :key="row.id" class="live-matrix__row" role="row">
        <span role="cell">
          <strong>{{ row.title }}</strong>
          <small>{{ row.id }} / {{ row.eventCount }} events</small>
        </span>
        <span role="cell">
          <code>{{ row.passed && !row.failedClosed ? "pass" : "blocked" }}</code>
          <small>
            schema {{ row.validationIssueCount }} / sequence {{ row.sequenceViolationCount }}
          </small>
        </span>
        <span role="cell">
          <small>
            msg {{ row.messageCount }},
            timeline {{ row.timelineCount }},
            tools {{ row.toolCount }},
            actions {{ row.actionCount }},
            refs {{ row.artifactCount + row.evidenceCount }},
            subagent activities {{ row.subagentActivityCount }}
          </small>
        </span>
        <span role="cell">
          <small>{{ row.diagnostics.length ? row.diagnostics.join(", ") : "none" }}</small>
        </span>
      </div>
    </div>
  </section>
</template>
