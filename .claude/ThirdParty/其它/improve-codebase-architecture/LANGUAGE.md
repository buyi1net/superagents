# Language

本 skill 提出的每条建议都使用这套共享词汇。严格使用这些术语；不要替换成 “component”、“service”、“API” 或 “boundary”。语言一致就是重点。

## 术语

**Module**

任何同时拥有 interface 和 implementation 的东西。刻意保持尺度无关：function、class、package 或跨层 slice 都适用。
_Avoid_: unit, component, service.

**Interface**

调用方正确使用 module 必须知道的一切。包括 type signature，也包括 invariants、ordering constraints、error modes、required configuration 和 performance characteristics。
_Avoid_: API, signature（太窄，只指 type-level surface）。

**Implementation**

module 内部的代码。不同于 **Adapter**：一个东西可以是小 adapter 但有大 implementation（Postgres repo），也可以是大 adapter 但 implementation 很小（in-memory fake）。当 seam 是讨论重点时，用 “adapter”；否则用 “implementation”。

**Depth**

interface 上的 leverage：调用方（或测试）每学习一单位 interface，可以触达多少行为。大量行为藏在小 interface 背后时，module 就是 **deep**。interface 几乎和 implementation 一样复杂时，module 就是 **shallow**。

**Seam**（来自 Michael Feathers）

一个可以改变行为而不在原地编辑的位置。module interface 所在的**位置**。选择 seam 放在哪里，本身就是一个设计决策，和 seam 后面放什么是不同决策。
_Avoid_: boundary（容易和 DDD 的 bounded context 混淆）。

**Adapter**

在 seam 上满足 interface 的具体事物。它描述的是**角色**（填哪个槽位），不是实质（里面是什么）。

**Leverage**

调用方从 depth 中得到的东西。调用方每学习一单位 interface，就获得更多能力。一个 implementation 能回报 N 个调用点和 M 个测试。

**Locality**

维护者从 depth 中得到的东西。变更、bug、知识和验证集中在一个地方，而不是散落在调用方里。修一次，处处修好。

## 原则

- **Depth 是 interface 的属性，不是 implementation 的属性。** 深模块内部可以由小的、可 mock、可替换部分组成；它们只是不会成为 interface 的一部分。module 可以有**内部 seams**（implementation 私有，供自身测试使用），也可以在 interface 处有**外部 seam**。
- **删除测试**：想象删除这个 module。如果复杂度消失，说明它没有隐藏任何东西，只是透传。如果复杂度在 N 个调用方中重新出现，说明这个 module 值得存在。
- **interface 就是测试表面**：调用方和测试跨越的是同一个 seam。如果你想测穿 interface，这个 module 的形状可能不对。
- **一个 adapter 意味着假想 seam；两个 adapter 意味着真实 seam。** 除非确实有东西会跨 seam 变化，否则不要引入 seam。

## 关系

- 一个 **Module** 恰好有一个 **Interface**，也就是它呈现给调用方和测试的表面。
- **Depth** 是 **Module** 的属性，需要相对于它的 **Interface** 衡量。
- **Seam** 是 **Module** 的 **Interface** 所在的位置。
- **Adapter** 位于 **Seam** 上，并满足 **Interface**。
- **Depth** 为调用方产生 **Leverage**，为维护者产生 **Locality**。

## 被拒绝的表述

- **把 depth 看成 implementation 行数与 interface 行数的比率**（Ousterhout）：这会奖励给 implementation 填水。我们改用 depth-as-leverage。
- **把 “interface” 理解成 TypeScript 的 `interface` 关键字或 class 的 public methods**：太窄；这里的 interface 包含调用方必须知道的每个事实。
- **“Boundary”**：容易和 DDD 的 bounded context 混淆。说 **seam** 或 **interface**。
