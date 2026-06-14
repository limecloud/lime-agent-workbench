<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  collectRuntimeEventValidationIssues,
  getAgentUiFixture,
  verifyRuntimeEventSequence,
  type AgentRuntimeExecutionEvent,
  type AgentUiSubagentThreadView
} from "@limecloud/agent-ui-contracts";
import { replayAgentUiFixture } from "@limecloud/agent-runtime-projection";
import { SubagentsView } from "@limecloud/agent-runtime-ui";
import React from "react";
import { createRoot, type Root } from "react-dom/client";

type EventFilter =
  | "all"
  | "subagent"
  | "handoff"
  | "channel"
  | "tool"
  | "artifact"
  | "evidence"
  | "state";

const fixture = getAgentUiFixture("subagent-handoff");
const validationIssues = fixture.events.flatMap((event, index) =>
  collectRuntimeEventValidationIssues(event, `$.events[${index}]`)
);
const sequenceViolations = verifyRuntimeEventSequence(fixture.events);
const replay = replayAgentUiFixture(fixture);
const state = replay.state;
const model = state.subagents;
const reactMount = ref<HTMLElement | null>(null);
const eventFilter = ref<EventFilter>("all");
const selectedThreadId = ref(model.threads[0]?.threadId ?? "");
const selectedEventId = ref(fixture.events[0]?.id ?? "");
let reactRoot: Root | undefined;

const summary = computed(() => ({
  fixtureId: replay.fixtureId,
  passed: replay.passed,
  failedClosed: replay.failedClosed,
  validationIssues: validationIssues.length,
  sequenceViolations: sequenceViolations.length,
  diagnostics: replay.diagnostics,
  eventCount: fixture.events.length,
  graphNodeCount: state.graph.length,
  evidenceCount: state.evidence.length,
  threadCount: model.threads.length,
  delegationCount: model.delegationCalls.length,
  activityCount: model.activities.length,
  activeThreadIds: model.activeThreadIds,
  completedThreadIds: model.completedThreadIds,
  failedThreadIds: model.failedThreadIds
}));

const gates = computed(() => [
  {
    id: "schema",
    title: "Schema",
    detail: `${summary.value.eventCount} events`,
    status: validationIssues.length === 0 ? "pass" : "blocked"
  },
  {
    id: "sequence",
    title: "Sequence",
    detail: `${sequenceViolations.length} violations`,
    status: sequenceViolations.length === 0 ? "pass" : "blocked"
  },
  {
    id: "replay",
    title: "Replay",
    detail: replay.failedClosed ? "failed closed" : "projected",
    status: replay.failedClosed ? "blocked" : "pass"
  },
  {
    id: "projection",
    title: "Projection",
    detail: `${summary.value.threadCount} threads / ${summary.value.activityCount} activities`,
    status: model.hasSubagents ? "pass" : "blocked"
  },
  {
    id: "surface",
    title: "Surface",
    detail: "SubagentsView",
    status: replay.passed ? "pass" : "blocked"
  }
]);

const eventFilters: Array<{ id: EventFilter; label: string }> = [
  { id: "all", label: "全部事件" },
  { id: "subagent", label: "子代理" },
  { id: "handoff", label: "移交" },
  { id: "channel", label: "通道" },
  { id: "tool", label: "工具" },
  { id: "artifact", label: "交付物" },
  { id: "evidence", label: "证据" },
  { id: "state", label: "状态" }
];

function eventMatchesFilter(event: AgentRuntimeExecutionEvent, filter: EventFilter) {
  if (filter === "all") return true;
  if (filter === "subagent") return Boolean(event.subagentId) || event.eventClass?.startsWith("subagent.");
  if (filter === "handoff") return event.kind === "handoff" || event.eventClass?.startsWith("handoff.");
  if (filter === "channel") return event.eventClass?.startsWith("channel.");
  if (filter === "tool") return event.kind === "tool" || event.eventClass?.startsWith("tool.");
  if (filter === "artifact") return event.kind === "draft" || event.eventClass?.startsWith("artifact.");
  if (filter === "evidence") return event.kind === "evidence" || event.eventClass?.startsWith("review.");
  if (filter === "state") return event.kind === "state" || event.eventClass?.startsWith("state.") || event.eventClass === "snapshot.updated";
  return true;
}

const visibleEvents = computed(() =>
  fixture.events.filter((event) => eventMatchesFilter(event, eventFilter.value))
);

const selectedThread = computed(
  () => model.threads.find((thread) => thread.threadId === selectedThreadId.value) ?? model.threads[0]
);

const selectedEvent = computed(
  () =>
    visibleEvents.value.find((event) => event.id === selectedEventId.value) ??
    visibleEvents.value[0] ??
    fixture.events[0]
);

const selectedEventJson = computed(() => JSON.stringify(selectedEvent.value, null, 2));

function selectThread(thread: AgentUiSubagentThreadView) {
  selectedThreadId.value = thread.threadId;
}

function selectEvent(event: AgentRuntimeExecutionEvent) {
  selectedEventId.value = event.id;
}

function mountSubagentsView() {
  if (!reactMount.value) return;
  reactRoot = createRoot(reactMount.value);
  reactRoot.render(
    React.createElement(SubagentsView, {
      state,
      labels: {
        subagentsAriaLabel: "Subagents fixture projection",
        subagentThreadTitle: (thread) => thread.title,
        subagentThreadMeta: (thread) =>
          [thread.role, thread.status, thread.threadId].filter(Boolean).join(" / "),
        subagentThreadSummary: (thread) => thread.summary,
        subagentDelegationTitle: (delegation) =>
          `${delegation.action}: ${delegation.title}`,
        subagentActivityTitle: (activity) => activity.title,
        subagentActivityMeta: (activity) =>
          `${activity.kind} / ${activity.status}`
      },
      onOpenThread: selectThread
    })
  );
}

onMounted(mountSubagentsView);

onBeforeUnmount(() => {
  reactRoot?.unmount();
  reactRoot = undefined;
});
</script>

<template>
  <section class="subagents-live-loop" aria-label="Subagents live loop demo">
    <div class="subagents-live-loop__header">
      <div>
        <p>{{ summary.fixtureId }} fixture</p>
        <strong>Schema -> Verifier -> Replay -> Projection -> SubagentsView</strong>
      </div>
      <span :data-state="summary.passed && !summary.failedClosed ? 'pass' : 'blocked'">
        {{ summary.passed && !summary.failedClosed ? "conformant" : "blocked" }}
      </span>
    </div>
    <div class="subagents-live-loop__status">
      <code>passed: {{ String(summary.passed) }}</code>
      <code>failedClosed: {{ String(summary.failedClosed) }}</code>
      <code>validationIssues: {{ summary.validationIssues }}</code>
      <code>sequenceViolations: {{ summary.sequenceViolations }}</code>
    </div>
    <div class="subagents-live-loop__gates" aria-label="Subagents conformance gates">
      <article v-for="gate in gates" :key="gate.id" :data-state="gate.status">
        <span>{{ gate.title }}</span>
        <strong>{{ gate.status }}</strong>
        <small>{{ gate.detail }}</small>
      </article>
    </div>
    <div class="subagents-live-loop__grid">
      <article>
        <span>Projection Counts</span>
        <dl>
          <div><dt>events</dt><dd>{{ summary.eventCount }}</dd></div>
          <div><dt>graph</dt><dd>{{ summary.graphNodeCount }}</dd></div>
          <div><dt>threads</dt><dd>{{ summary.threadCount }}</dd></div>
          <div><dt>delegationCalls</dt><dd>{{ summary.delegationCount }}</dd></div>
          <div><dt>activities</dt><dd>{{ summary.activityCount }}</dd></div>
          <div><dt>evidence</dt><dd>{{ summary.evidenceCount }}</dd></div>
        </dl>
      </article>
      <article>
        <span>Thread Sets</span>
        <dl>
          <div><dt>active</dt><dd>{{ summary.activeThreadIds.join(", ") || "-" }}</dd></div>
          <div><dt>completed</dt><dd>{{ summary.completedThreadIds.join(", ") || "-" }}</dd></div>
          <div><dt>failed</dt><dd>{{ summary.failedThreadIds.join(", ") || "-" }}</dd></div>
        </dl>
      </article>
      <article>
        <span>Diagnostics</span>
        <ol v-if="summary.diagnostics.length">
          <li v-for="diagnostic in summary.diagnostics" :key="diagnostic">
            <code>{{ diagnostic }}</code>
          </li>
        </ol>
        <p v-else>No diagnostics</p>
      </article>
    </div>
    <div class="subagents-live-loop__workbench">
      <div class="subagents-live-loop__primary">
        <div class="subagents-live-loop__section-title">
          <span>Shared UI Surface</span>
          <strong>SubagentsView</strong>
        </div>
        <div ref="reactMount" class="subagents-live-loop__react"></div>
      </div>
      <aside class="subagents-live-loop__detail" aria-label="Selected subagent detail">
        <div class="subagents-live-loop__section-title">
          <span>Selected Thread</span>
          <strong>{{ selectedThread?.title ?? "No thread" }}</strong>
        </div>
        <dl v-if="selectedThread">
          <div><dt>thread</dt><dd>{{ selectedThread.threadId }}</dd></div>
          <div><dt>role</dt><dd>{{ selectedThread.role ?? "-" }}</dd></div>
          <div><dt>status</dt><dd>{{ selectedThread.status }}</dd></div>
          <div><dt>task</dt><dd>{{ selectedThread.taskId ?? "-" }}</dd></div>
          <div><dt>artifacts</dt><dd>{{ selectedThread.artifactRefs.join(", ") || "-" }}</dd></div>
          <div><dt>evidence</dt><dd>{{ selectedThread.evidenceRefs.join(", ") || "-" }}</dd></div>
        </dl>
      </aside>
    </div>
    <div class="subagents-live-loop__events" aria-label="Runtime event stream">
      <div class="subagents-live-loop__section-title">
        <span>Runtime Facts</span>
        <strong>Event Stream</strong>
      </div>
      <div class="subagents-live-loop__filters" role="tablist" aria-label="Filter runtime events">
        <button
          v-for="filter in eventFilters"
          :key="filter.id"
          type="button"
          :class="{ active: eventFilter === filter.id }"
          @click="eventFilter = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>
      <div class="subagents-live-loop__event-layout">
        <ol class="subagents-live-loop__event-list">
          <li v-for="event in visibleEvents" :key="event.id">
            <button
              type="button"
              :class="{ active: selectedEvent?.id === event.id }"
              @click="selectEvent(event)"
            >
              <small>#{{ event.sequence }} / {{ event.kind }}</small>
              <strong>{{ event.eventClass ?? event.kind }}</strong>
              <span>{{ event.title }}</span>
            </button>
          </li>
        </ol>
        <pre class="subagents-live-loop__event-json"><code>{{ selectedEventJson }}</code></pre>
      </div>
    </div>
  </section>
</template>
