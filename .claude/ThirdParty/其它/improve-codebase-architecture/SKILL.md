---
name: improve-codebase-architecture
description: 基于 CONTEXT.md 中的领域语言和 docs/adr/ 中的架构决策，主动寻找代码库中的模块加深和架构改进机会。用户想改进架构、寻找重构机会、合并紧耦合模块，或让代码库更易测试、更便于 AI 导航时使用；勿触发于只想理解某段代码在系统中的位置，那些走 zoom-out。
disable-model-invocation: true
---

# 改进代码库架构

发现架构摩擦，并提出**模块加深机会**：把浅模块重构成深模块。目标是提高可测试性和 AI 可导航性。

## 术语表

所有建议都必须严格使用这些术语。术语一致就是重点；不要改用 “component”、“service”、“API” 或 “boundary”。完整定义见 [LANGUAGE.md](LANGUAGE.md)。

- **Module**：任何同时拥有 interface 和 implementation 的东西，例如 function、class、package 或 slice。
- **Interface**：调用方正确使用 module 必须知道的一切，包括 types、invariants、error modes、ordering、config；不只是 type signature。
- **Implementation**：内部代码。
- **Depth**：interface 上的 leverage；小 interface 背后藏着大量行为。**Deep** = 高 leverage。**Shallow** = interface 几乎和 implementation 一样复杂。
- **Seam**：interface 所在的位置；一个可以改变行为而不在原地编辑的位置。使用这个词，不要说 “boundary”。
- **Adapter**：在 seam 上满足 interface 的具体事物。
- **Leverage**：调用方从 depth 中获得的收益。
- **Locality**：维护者从 depth 中获得的收益：变更、bug、知识集中在一个地方。

关键原则（完整列表见 [LANGUAGE.md](LANGUAGE.md)）：

- **删除测试**：想象删除这个 module。如果复杂度消失，说明它只是透传。如果复杂度在 N 个调用方中重新出现，说明它确实有价值。
- **interface 就是测试表面**。
- **一个 adapter = 假想 seam；两个 adapter = 真实 seam。**

本 skill 会参考项目领域模型。领域语言帮助命名好的 seam；ADR 记录本 skill 不应重新争论的决策。

## 流程

### 1. 探索

先读取项目领域术语表，以及即将处理区域相关的 ADR。

然后使用 Agent tool，并指定 `subagent_type=Explore`，让子 agent 遍历代码库。不要死板套用启发式规则；有机探索，并记录你在哪些地方感受到摩擦：

- 理解一个概念是否需要在很多小 modules 之间来回跳？
- 哪些 modules 是**浅的**：interface 几乎和 implementation 一样复杂？
- 哪些 pure functions 只是为了测试而被抽出来，但真正 bug 藏在调用方式里，导致没有 **locality**？
- 哪些紧耦合 modules 泄漏到了 seam 外？
- 代码库哪些部分没有测试，或很难通过当前 interface 测试？

对任何疑似浅的东西应用**删除测试**：删掉它会集中复杂度，还是只是移动复杂度？“会集中复杂度”就是你要找的信号。

### 2. 展示候选项

展示一个编号列表，列出模块加深机会。每个候选项包含：

- **文件**：涉及哪些文件或 modules。
- **问题**：当前架构为什么造成摩擦。
- **方案**：用平实语言描述将发生什么变化。
- **收益**：用 locality 和 leverage 解释，也说明测试会如何变好。

**领域内容使用 CONTEXT.md 词汇，架构内容使用 [LANGUAGE.md](LANGUAGE.md) 词汇。** 如果 `CONTEXT.md` 定义了 “Order”，就说 “Order intake module”，不要说 “FooBarHandler”，也不要说 “Order service”。

**ADR 冲突**：如果候选项和已有 ADR 冲突，只有当摩擦真实到值得重新打开该 ADR 时才提出。明确标注，例如 _“contradicts ADR-0007 — but worth reopening because…”_。不要列出每个理论上被 ADR 禁止的重构。

此时**不要**提出 interface。询问用户：“你想深入探索哪一个？”

### 3. 追问循环

用户选择候选项后，进入追问对话。和用户一起沿设计树推进：约束、依赖、加深后 module 的形状、seam 后面放什么、哪些测试应该保留。

当决策逐渐清晰时，同步处理副作用：

- **加深后的 module 以某个概念命名，但该概念不在 `CONTEXT.md` 中？** 将该术语加入 `CONTEXT.md`，遵循 `setup/domain.md` 中定义的领域文档约定。如果文件不存在，按需创建。写入前先向用户展示草稿并确认。
- **对话中收紧了一个模糊术语？** 立即更新 `CONTEXT.md`。
- **用户基于关键理由拒绝了候选项？** 提议记录 ADR，表述为：“要不要把这个记录成 ADR，避免未来架构评审再次提出同一个建议？” 只有当这个理由确实能帮助未来探索者避免重复建议时才提出；临时理由（“现在不值得”）和显而易见的理由跳过。参考 `setup/domain.md` 中的 ADR 约定。写入 ADR 前必须展示草稿并等待用户确认。
- **想探索加深后 module 的替代 interface？** 见 [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md)。
