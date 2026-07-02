# Interface Design

当用户想为某个已选的模块加深候选项探索替代 interface 时，使用这个并行 sub-agent 模式。基于 Ousterhout 的 “Design It Twice”：你的第一个想法不太可能是最好的。

使用 [LANGUAGE.md](LANGUAGE.md) 中的词汇：**module**、**interface**、**seam**、**adapter**、**leverage**。

## 流程

### 1. 框定问题空间

在启动 sub-agents 前，先为用户写一段面向用户的问题空间说明，针对已选候选项解释：

- 新 interface 需要满足哪些约束。
- 它会依赖哪些东西，以及这些依赖属于哪类（见 [DEEPENING.md](DEEPENING.md)）。
- 一个粗略的说明性代码草图，用来落地约束；这不是 proposal，只是让约束更具体。

把这些展示给用户，然后立刻进入第 2 步。用户阅读和思考的同时，sub-agents 并行工作。

### 2. 启动 sub-agents

使用 Agent tool 并行启动 3 个以上 sub-agents。每个 sub-agent 都必须为加深后的 module 产出一个**明显不同**的 interface。

给每个 sub-agent 单独的技术 brief（文件路径、耦合细节、来自 [DEEPENING.md](DEEPENING.md) 的依赖类别、seam 后面是什么）。这个 brief 独立于第 1 步面向用户的问题空间说明。给每个 agent 不同的设计约束：

- Agent 1：“最小化 interface，目标是最多 1–3 个入口。最大化每个入口的 leverage。”
- Agent 2：“最大化灵活性，支持更多用例和扩展。”
- Agent 3：“为最常见调用方优化，让默认情况变得极其简单。”
- Agent 4（如适用）：“围绕 ports & adapters 设计跨 seam 依赖。”

在 brief 中同时包含 [LANGUAGE.md](LANGUAGE.md) 词汇和 CONTEXT.md 词汇，让每个 sub-agent 使用架构语言和项目领域语言一致地命名。

每个 sub-agent 输出：

1. Interface：types、methods、params，以及 invariants、ordering、error modes。
2. 使用示例：调用方如何使用它。
3. Implementation 在 seam 后隐藏了什么。
4. 依赖策略和 adapters（见 [DEEPENING.md](DEEPENING.md)）。
5. 取舍：哪里 leverage 高，哪里较薄。

### 3. 展示和比较

按顺序展示设计，让用户能吸收每个方案，然后用文字比较它们。按 **depth**（interface 上的 leverage）、**locality**（变更集中在哪里）和 **seam placement** 对比。

比较后，给出你自己的推荐：你认为哪个设计最强，以及为什么。如果不同设计中的元素适合组合，提出混合方案。要有判断；用户需要的是明确判断，不是一份菜单。
