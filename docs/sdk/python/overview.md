---
title: Python SDK 总览
description: Python 工具主要服务 fixture、schema 和 conformance。
---

# Python SDK 总览

Python SDK 优先服务标准验证，而不是运行 Lime 产品主链。

## 目标

- 校验 RuntimeEvent fixtures。
- 回放事件流。
- 检查 read model completeness。
- 导出 conformance report。

产品主链仍通过 App Server / RuntimeCore 实现。
