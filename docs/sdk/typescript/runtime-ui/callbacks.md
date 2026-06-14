---
title: Callbacks
description: React AgentUI 的受控 callback、动作提交和引用打开合同。
---

# Callbacks

`@limecloud/agent-runtime-ui` 采用 controlled components。组件只渲染 `AgentUiProjectionState`，并通过 callback 把用户意图交还宿主应用；真正的 runtime 调用必须回到 `@limecloud/agent-runtime-client` 或产品应用的 current gateway。

实现锚点：`packages/agent-runtime-ui/src/types.ts`、`packages/agent-runtime-ui/src/projectionView.tsx`。

## Callback surface

| Callback | Source surface | Required host behavior | Forbidden behavior |
| --- | --- | --- | --- |
| `onResolveAction(event, action)` | `ActionRequiredList`、`RuntimeEventList` | 调 `runtime.respondAction` 或打开业务模块。 | 本地把 action 标记 resolved。 |
| `onSelectArtifactRef(ref)` | `ArtifactRefList` | 打开 artifact workspace / product artifact panel。 | 在 UI 包内读取 artifact body。 |
| `onSelectEvidenceRef(ref)` | `EvidenceRefList` | 打开 evidence pack / review / replay。 | 在 UI 包内导出 evidence。 |

## Action flow

```text
action.required event
  -> projection.state.actions
  -> ActionRequiredList button
  -> onResolveAction(event, action)
  -> AgentRuntimeClient.respondAction(...)
  -> action terminal event
  -> projection repair
  -> React rerender
```

按钮点击后可以显示宿主自己的 pending UI，但 runtime fact 只有 action terminal 或 read model repair 到达后才能变成 completed。

## Artifact / Evidence flow

```text
artifact.changed / evidence.changed
  -> projection.state.artifacts / state.evidence
  -> ArtifactRefList / EvidenceRefList
  -> onSelectArtifactRef / onSelectEvidenceRef
  -> Product workspace opens owner surface
```

引用 list 不复制大内容。需要预览时，宿主通过 `refPreview` 回调提供短摘要；完整内容由 artifact/evidence owner 读取。

## Label callbacks

UI 包默认 label 只做 fallback。产品应用必须注入：

- aria label。
- action 按钮文案。
- event status 文案。
- artifact/evidence title、meta、preview、action label。

Lime 产品侧需要覆盖 `zh-CN / zh-TW / en-US / ja-JP / ko-KR`，不要把 UI 包英文 fallback 当作产品文案。

## 验证入口

```bash
npm --prefix packages/agent-runtime-ui run test
```

React conformance 至少断言：

1. action 点击只调用 callback。
2. artifact/evidence refs 有稳定 DOM contract。
3. callback 不修改 projection state。
4. labels 可以由宿主覆盖。
