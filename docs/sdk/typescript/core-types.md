---
title: Core types
description: TypeScript core types 的最小集合。
---

# Core types

核心类型应与 RuntimeEvent、ThreadReadModel、TaskSnapshot、ProjectionState 对齐。

```ts
export interface RuntimeEvent {
  schemaVersion: string;
  runtimeId: string;
  sessionId: string;
  eventId: string;
  sequence: number;
  timestamp: string;
  type: string;
  payload: unknown;
}
```

类型包只描述合同，不包含业务执行逻辑。
