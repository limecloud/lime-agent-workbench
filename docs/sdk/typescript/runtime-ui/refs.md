---
title: Artifact And Evidence Refs
description: ArtifactRefList / EvidenceRefList 的轻量引用 surface。
---

# Artifact And Evidence Refs

`ArtifactRefList` 和 `EvidenceRefList` 是 Lime React AgentUI 的标准引用 surface。它们只展示 projection 里的轻量 ref，并把打开意图交给宿主应用。

实现锚点：`packages/agent-runtime-ui/src/refs.tsx`。

## 导出

```ts
export {
  AgentUiRefList,
  ArtifactRefList,
  EvidenceRefList
} from "@limecloud/agent-runtime-ui";
```

## Props

```ts
export interface AgentUiRefListProps<TRef extends AgentUiRefView = AgentUiRefView> {
  refs?: readonly TRef[];
  empty?: ReactNode;
  ariaLabel?: string;
  className?: string;
  refKind?: string;
  refTitle?: (ref: TRef) => ReactNode;
  refMeta?: (ref: TRef) => ReactNode;
  refPreview?: (ref: TRef) => ReactNode;
  refActionLabel?: (ref: TRef) => ReactNode;
  onSelectRef?: (ref: TRef) => void;
}
```

`ArtifactRefListProps` 与 `EvidenceRefListProps` 分别绑定 `AgentUiArtifactRefView` 和 `AgentUiEvidenceRefView`。

## DOM Contract

| Class / attribute | Purpose |
| --- | --- |
| `.agent-artifact-refs` | artifact ref list root。 |
| `.agent-evidence-refs` | evidence ref list root。 |
| `.agent-ref-card` | 单个 ref card。 |
| `.agent-ref-action` | 选择 / 打开按钮。 |
| `data-ref-kind` | `artifact` / `evidence` / custom ref kind。 |
| `data-ref-id` | artifact/evidence id。 |
| `data-source-event-id` | 产生该 ref 的 runtime event id。 |

## Example

```tsx
<ArtifactRefList
  refs={state.artifacts}
  refTitle={(ref) => artifactTitle(ref.id)}
  refActionLabel={() => "打开交付物"}
  onSelectRef={(ref) => openArtifactWorkspace(ref.id)}
/>
```

```tsx
<EvidenceRefList
  refs={state.evidence}
  refTitle={(ref) => evidenceTitle(ref.id)}
  refActionLabel={() => "打开证据"}
  onSelectRef={(ref) => openEvidencePack(ref.id)}
/>
```

## Boundary

- 不读取 artifact body。
- 不导出 evidence pack。
- 不推断 review verdict。
- 不把完整文件或长报告塞进 React state。
- 不把本地 artifact workspace 状态写回 projection facts。

## 验证入口

```bash
npm --prefix packages/agent-runtime-ui run test
```
