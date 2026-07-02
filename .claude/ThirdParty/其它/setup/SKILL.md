---
name: setup
description: 为当前仓库（repo）搭建工程类 skills 依赖的仓库级配置，包括 issue tracker、triage 标签词汇表和领域文档布局。首次使用 to-issues、to-prd、triage、improve-codebase-architecture 或 zoom-out 前运行；如果这些 skills 缺少 issue tracker、triage labels 或 domain docs 上下文，也使用本 skill 重新配置。用户说"初始化项目""配置 skill""搭环境""设置 issue tracker"时也可触发。
disable-model-invocation: true
---

# Setup / 初始化项目 Skill 配置

为当前仓库搭建工程类 skills 默认依赖的配置：

- **Issue tracker**：issue 存放在哪里。默认是 GitHub，也支持 local markdown。
- **Triage labels**：五种标准 triage 角色对应的标签字符串。
- **Domain docs**：`CONTEXT.md` 和 ADRs 的位置，以及其他 skills 应如何读取它们。

这是一个对话式 skill，不是确定性脚本。先探索仓库，展示发现，向用户确认，再写入文件。

## 流程

### 1. 探索

查看当前仓库的初始状态。读取已有内容，不要假设：

- `git remote -v` 和 `.git/config`：这是 GitHub 仓库吗？具体是哪一个？
- 如果 `git remote` 指向 GitHub：检查 `gh --version` 和 `gh auth status`。如果未安装或未登录，只记录并稍后提示用户，不要替用户安装或登录。
- 如果 `git remote` 指向 GitLab：检查 `glab --version` 和 `glab auth status`。如果未安装或未登录，只记录并稍后提示用户，不要替用户安装或登录。
- 仓库根目录的 `AGENTS.md` 和 `CLAUDE.md`：是否存在？是否已有 `## Agent skills` 配置块？
- 仓库根目录的 `CONTEXT.md` 和 `CONTEXT-MAP.md`。
- `docs/adr/` 和任何 `src/*/docs/adr/` 目录。
- `docs/agents/`：本 skill 之前是否已经生成过输出？
- `.scratch/`：是否已经在使用 local markdown issue tracker 约定？

### 2. 展示发现并询问

总结当前已存在和缺失的内容。然后按顺序带用户完成三个决策，**一次只问一个小节**：先展示一个小节，拿到用户回答，再进入下一个。不要一次性抛出三个问题。

假设用户不知道这些术语是什么意思。每个小节都先用简短说明解释：它是什么、为什么这些 skills 需要它、选择不同选项会改变什么。然后展示选项和默认建议。

**Section A — Issue tracker。**

> 说明：Issue tracker 是当前仓库存放 issue 的地方。`to-issues`、`triage`、`to-prd` 和 `verification-before-completion` 这类 skills 会读取或写入 issue，因此需要知道应该调用 `gh issue create`、把 markdown 文件写到 `.scratch/`，还是遵循用户描述的其他流程。选择这个仓库实际追踪工作的地方。

默认策略：这些 skills 主要按 GitHub 设计。如果 `git remote` 指向 GitHub，就建议 GitHub。如果 `git remote` 指向 GitLab（`gitlab.com` 或自托管 GitLab），就建议 GitLab。否则，或用户偏好不同，提供以下选项。以后如果要切换 issue tracker，重新运行本 skill，并在确认草稿时检查旧配置是否需要保留。

- **GitHub**：issue 存在仓库的 GitHub Issues 中，使用 `gh` CLI。
- **GitLab**：issue 存在仓库的 GitLab Issues 中，使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI。
- **Local markdown**：issue 作为文件存放在本仓库的 `.scratch/<feature>/` 下，适合个人项目或没有远端 issue tracker 的仓库。
- **Other**（Jira、Linear 等）：让用户用一段话描述工作流；skill 会把它记录为自由文本。

**Section B — Triage label vocabulary。**

> 说明：`triage` skill 处理新提交的 issue 时，会把 issue 推进一个状态机：需要评估、等待报告者补充信息、准备好交给 AFK agent、准备好交给人类、或不修复。为了做到这一点，它需要应用与你的 issue tracker 中实际配置一致的 labels。如果仓库已经使用不同标签名，例如 `bug:triage` 而不是 `needs-triage`，就在这里映射，避免 skill 创建重复标签或用错标签。

五个标准角色：

- `needs-triage`：维护者（Maintainer）需要评估。
- `needs-info`：等待报告者提供更多信息。
- `ready-for-agent`：规格完整，AFK-ready，agent 可以在没有额外人工上下文的情况下接手。
- `ready-for-human`：需要人类实现。
- `wontfix`：不会处理。

默认值：每个角色的字符串等于角色名。询问用户是否要覆盖其中任何一个。如果 issue tracker 里还没有现成标签，默认值即可。初始化后如果只是标签名映射错了，直接编辑 `docs/agents/triage-labels.md` 右侧列，不需要重跑本 skill。

**Section C — Domain docs。**

> 说明：部分 skills（`improve-codebase-architecture`、`systematic-debugging`、`test-driven-development`）会读取 `CONTEXT.md` 来理解项目领域语言，并读取 `docs/adr/` 了解过去的架构决策。它们需要知道仓库是一个全局 context，还是多个 context，例如 monorepo 中前后端各自有领域文档，这样才能读对位置。

确认文档布局：

- **Single-context**：仓库根目录有一个 `CONTEXT.md` 和 `docs/adr/`。大多数仓库属于这种。
- **Multi-context**：仓库根目录有 `CONTEXT-MAP.md`，指向每个 context 自己的 `CONTEXT.md`，通常用于 monorepo。

### 3. 确认并编辑

向用户展示以下草稿：

- 将添加到 `CLAUDE.md` 或 `AGENTS.md` 的 `## Agent skills` 配置块（选择规则见第 4 步）。
- `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` 的内容。
- 如果这些目标文件已经存在，列出哪些文件会被更新，并提醒用户重跑本 skill 会替换这些配置文件的内容；确认前检查是否有手工补充内容需要保留。

让用户有机会修改后再写入。

### 4. 写入

**选择要编辑的文件：**

- 如果 `CLAUDE.md` 存在，编辑它。
- 否则如果 `AGENTS.md` 存在，编辑它。
- 如果两者都不存在，询问用户要创建哪一个，不要替用户决定。

当 `CLAUDE.md` 已存在时，不要创建 `AGENTS.md`；反之亦然。始终编辑已经存在的那个文件。

如果目标文件里已经有 `## Agent skills` 配置块，就原地更新内容，不要追加重复配置块。不要覆盖周围小节中的用户编辑。

要写入的配置块：

```markdown
## Agent skills

### Issue tracker

[一句话说明 issue 存放在哪里]。详见 `docs/agents/issue-tracker.md`。

### Triage labels

[一句话说明 label 词汇表]。详见 `docs/agents/triage-labels.md`。

### Domain docs

[一句话说明布局：single-context 或 multi-context]。详见 `docs/agents/domain.md`。
```

然后使用本 skill 文件夹里的种子模板（seed template）作为起点，写入三个 docs 文件：

- [issue-tracker-github.md](./issue-tracker-github.md)：GitHub issue tracker。
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)：GitLab issue tracker。
- [issue-tracker-local.md](./issue-tracker-local.md)：local markdown issue tracker。
- [triage-labels.md](./triage-labels.md)：label 映射。
- [domain.md](./domain.md)：domain docs 读取规则和布局。

对于 “other” issue tracker，根据用户描述从零编写 `docs/agents/issue-tracker.md`。

### 5. 完成

告诉用户配置已完成，并说明哪些工程类 skills 之后会读取这些文件。提醒用户以后可以直接编辑 `docs/agents/*.md`；只有当他们想切换 issue tracker 或重新初始化配置时，才需要重新运行本 skill。

同时提示常见问题：

- 如果直接运行 `/to-issues`、`/to-prd` 或 `/triage` 时缺少 issue tracker 配置，先补运行本 skill。
- 如果选择 GitHub 或 GitLab 但 CLI 未登录，先运行 `gh auth login` 或 `glab auth login`。
- 如果标签名映射错了，直接编辑 `docs/agents/triage-labels.md` 右侧列。
- 如果想切换 issue tracker，重跑本 skill，并在确认草稿时检查旧配置是否需要保留。