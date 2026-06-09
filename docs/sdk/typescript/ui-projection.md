---
title: UI 投影
description: TypeScript UI 投影 helper 的边界。
---

# UI 投影

UI 投影 helper 把 facts 转为 UI state。

```ts
const state = projector.apply(event, previousState);
```

它只能维护 投影状态 和 local UI state，不能写 runtime truth。
