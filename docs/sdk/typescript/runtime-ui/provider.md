---
title: Provider Boundary
description: 当前 React SDK 不提供公共 Provider，标准入口是受控组件。
---

# Provider Boundary

`@limecloud/agent-runtime-ui` 当前标准不是 Provider / hook runtime，而是受控 React surface。公共 API 只接收 `AgentUiProjectionState`、callbacks 和 labels。

## 当前标准

```tsx
<AgentUiProjectionView
  state={state}
  onResolveAction={handleResolveAction}
  onSelectArtifactRef={handleOpenArtifact}
  onSelectEvidenceRef={handleOpenEvidence}
  labels={labels}
/>
```

这个设计是刻意的：runtime transport、projection reducer、React presentation 分别属于不同包，产品应用必须显式决定每一层的 owner。

## 为什么不提供公共 Provider

| 原因 | 说明 |
| --- | --- |
| 避免隐式 transport | Provider 很容易顺手创建 runtime client，导致 UI 包拥有 transport。 |
| 避免 session store 膨胀 | 产品应用已有自己的 session、workspace、artifact store。 |
| 避免 mock fallback 回流 | Provider 若内置 fixture fallback，会破坏 production fail-closed。 |
| 保持测试分层 | reducer 在 projection 包测，React 只测渲染和 callback。 |

## 允许的本地 Provider

产品应用可以在自己的业务壳层写本地 Provider，例如保存展开/折叠、focus、selected tab、右栏布局等 presentation state。但它不能：

- 创建 runtime transport。
- 订阅 App Server event stream。
- 修改 `AgentUiProjectionState` 里的 runtime facts。
- 从 assistant text 解析 tool/action/artifact 状态。
- 读取 Provider key 或 App Server DB。

## 未来 facade

未来如果需要 `@limecloud/agent-ui` facade，它只能 re-export contracts、projection 和 runtime-ui 的 UI 侧能力。它不得导出 runtime transport，也不得把 Provider 变成新的 runtime owner。

## 验证入口

```bash
npm --prefix packages/agent-runtime-ui run test
```
