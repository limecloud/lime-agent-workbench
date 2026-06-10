---
title: Message Parts
description: UIMessagePartsView 的输入、渲染和边界。
---

# Message Parts

`UIMessagePartsView` 渲染 projection 生成的 `UIMessagePart[]`。它不是聊天 runtime，不合并 streaming，不解析工具状态。

实现锚点：`packages/agent-runtime-ui/src/messages.tsx`。

## Props

```ts
export interface UIMessagePartsViewProps {
  parts?: readonly UIMessagePart[];
  empty?: ReactNode;
  ariaLabel?: string;
  roleLabel?: (role: AgentMessageRole) => string;
  partTitle?: (part: UIMessagePart) => ReactNode;
  partMeta?: (part: UIMessagePart) => ReactNode;
  partPreview?: (part: UIMessagePart) => ReactNode;
}
```

## Part Types

| `UIMessagePart.type` | Meaning |
| --- | --- |
| `text` | assistant / user text。 |
| `reasoning` | reasoning summary 或可展示推理摘要。 |
| `tool-preview` | 工具结果摘要，不是完整 tool output。 |
| `artifact-card` | artifact 引用卡片。 |
| `evidence-citation` | evidence 引用。 |
| `diagnostic-ref` | 诊断或失败引用。 |

## Example

```tsx
<UIMessagePartsView
  parts={state.messages}
  partPreview={(part) => part.text ?? part.artifactId ?? part.evidenceId}
/>
```

## Boundary

- 文本合并在 projection 层完成。
- tool preview 来自 `tool.result` / `tool.failed` projection。
- artifact / evidence 只展示 ref，不读取文件内容。
- 本地化通过 callbacks / labels 注入。

