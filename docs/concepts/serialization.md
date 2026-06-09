---
title: Serialization
description: Lime runtime facts 的序列化、引用和大输出规则。
---

# Serialization

Lime 的序列化目标是可回放、可审计、可分页，而不是把所有数据塞进一条消息。

## 规则

- Event envelope 必须包含 schema version、ids、sequence、timestamp、type、payload。
- 大输出、artifact bytes、raw provider payload 用 refs。
- raw refs 不进入普通 投影状态。
- secret-bearing payload 只能存在于拥有方安全边界内。
- 旧 session hydration 依赖 snapshot/read model，而不是无限重放完整事件流。

## refs

```json
{
  "refs": {
    "output": "output://tool/123",
    "artifact": "artifact://draft/456",
    "evidence": "evidence://pack/789"
  }
}
```

UI 展示摘要和入口，详情按需加载。
