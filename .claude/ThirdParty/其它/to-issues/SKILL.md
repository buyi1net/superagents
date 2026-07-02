---
name: to-issues
description: 采用 tracer bullet 纵向切片，将计划、规格或 PRD 批量拆成可独立承接的实现 issue，并发布到项目 issue tracker。用户想把计划转为 issue、创建实现任务、将工作拆解为可执行 issue 时使用；勿触发于管理已有 issue 状态、标签或补齐信息，那些走 triage。
disable-model-invocation: true
---

# 拆分 Issues

使用纵向切片（tracer bullet）把计划拆成可独立领取的 issues。

issue tracker 和 triage label 词汇表应该已经由仓库配置提供；如果没有，先运行 `setup`。

## 流程

### 1. 收集上下文

基于当前对话中已有的上下文工作。如果用户传入 issue 引用（issue 编号、URL 或路径）作为参数，就根据仓库配置从 issue tracker 获取该 issue，并阅读完整正文和 comments。

如果 issue tracker 配置缺失，先补运行 `setup`。如果目标是 GitHub 或 GitLab，使用仓库配置中指定的 CLI；不要猜平台。CLI 未登录时提示用户运行对应登录命令，例如 `gh auth login` 或 `glab auth login`。国内网络环境下，如果 GitHub/GitLab 认证页面无法打开，提醒用户按团队网络或代理规范处理；不要替用户修改全局网络配置。

### 2. 探索代码库（可选）

如果还没有探索过代码库，先探索当前代码状态。issue 标题和描述应使用项目领域术语表中的词汇，并尊重即将改动区域相关的 ADR。

### 3. 起草纵向切片

把计划拆成 **tracer bullet** issues。每个 issue 都是一条很薄的纵向切片，端到端贯穿所有层次，而不是只覆盖某一层的横向切片。

切片可以是 `HITL` 或 `AFK`。`HITL` 切片需要人类参与，例如架构决策或设计评审。`AFK` 切片可以在没有人工交互的情况下实现并合并。只要可行，优先选择 `AFK`。

<vertical-slice-rules>
- 每个切片都交付一条窄但完整的路径，贯穿所有相关层（schema、API、UI、tests）。
- 完成后的切片应能独立演示或验证。
- 优先拆成多个薄切片，而不是少数几个厚切片。
</vertical-slice-rules>

### 4. 向用户确认

用编号列表展示建议拆分。每个切片都展示：

- **标题**：简短、描述性名称。
- **类型**：`HITL` / `AFK`。
- **阻塞项**：必须先完成哪些其他切片（如果有）。
- **覆盖的用户故事**：该切片覆盖哪些用户故事（如果来源材料里有）。

询问用户：

- 粒度是否合适？是否太粗或太细？
- 依赖关系是否正确？
- 是否有切片需要继续合并或拆分？
- `HITL` 和 `AFK` 标记是否正确？

反复调整，直到用户认可拆分方案。

### 5. 发布 issues 到 issue tracker

对每个已确认的切片，在 issue tracker 中发布一个新 issue。使用下面的 issue 正文模板。除非用户另有说明，这些 issues 视为已经准备好交给 AFK agents，因此发布时应用正确的 triage label。

按依赖顺序发布 issues（阻塞项优先），这样可以在 “Blocked by” 字段中引用真实 issue 标识符。

<issue-template>
## 父 issue

父 issue 在 issue tracker 中的引用；如果来源不是已有 issue，就省略本节。

## 构建内容

对这个纵向切片的简洁描述。描述端到端行为，而不是逐层描述实现。

避免写具体文件路径或代码片段；它们很快就会过期。例外：如果 prototype 产出的代码片段比文字更准确地表达了某个决策（状态机、reducer、schema、类型形状），可以把它内联到这里，并简短注明它来自 prototype。只保留承载决策的信息，不要贴完整可运行演示代码（demo）。

## 验收标准

- [ ] 验收标准 1
- [ ] 验收标准 2
- [ ] 验收标准 3

## 阻塞项

- 阻塞 ticket 的引用（如果有）

如果没有阻塞项，写 "无 — 可以立即开始"。

</issue-template>

不要关闭或修改任何父 issue。
