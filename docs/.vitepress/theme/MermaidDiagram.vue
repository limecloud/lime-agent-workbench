<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import mermaid from "mermaid";

const props = defineProps<{
  code: string;
}>();

const element = ref<HTMLElement | null>(null);
const diagramId = computed(() => `mermaid-${hashCode(props.code)}`);

function hashCode(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function renderDiagram() {
  if (!element.value) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: document.documentElement.classList.contains("dark") ? "dark" : "default"
  });

  const { svg } = await mermaid.render(diagramId.value, props.code);
  element.value.innerHTML = svg;
}

onMounted(async () => {
  await nextTick();
  await renderDiagram();
});

watch(
  () => props.code,
  async () => {
    await nextTick();
    await renderDiagram();
  }
);
</script>

<template>
  <div ref="element" class="mermaid-diagram" aria-label="Mermaid diagram" />
</template>
