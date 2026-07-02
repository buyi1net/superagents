---
name: triage
description: 通过 triage 角色驱动的小型状态机管理已有或新提交的 issue。用户想 triage issue、审查新提交的 bug 或功能请求、补齐信息、标记是否 ready、为 AFK agent 准备 issue 时使用；勿触发于把 PRD 或计划批量拆成实现 issue，那些走 to-issues。
disable-model-invocation: true
---

# Triage

通过一组 triage 角色，让项目 issue tracker 中的 issues 在小型状态机里流转。

triage 过程中发布到 issue tracker 的每条 comment 或 issue 都**必须**以以下免责声明开头：

```markdown
> *此内容由 AI 在 triage 过程中生成。*
```

## 参考文档

- [AGENT-BRIEF.md](AGENT-BRIEF.md)：如何编写耐久的 agent brief。
- [OUT-OF-SCOPE.md](OUT-OF-SCOPE.md)：`.out-of-scope/` 知识库如何工作。

## 角色

两个**分类**角色：

- `bug`：某个东西坏了。
- `enhancement`：新功能或改进。

五个**状态**角色：

- `needs-triage`：维护者需要评估。
- `needs-info`：等待提交者提供更多信息。
- `ready-for-agent`：规格完整，已准备好交给 AFK agent。
- `ready-for-human`：需要人类实现。
- `wontfix`：不会处理。

每个已 triage 的 issue 都应且只应带一个分类角色和一个状态角色。如果状态角色冲突，先标出冲突并询问维护者，不要继续执行其他操作。

这些是标准角色名；issue tracker 中实际使用的 label 字符串可能不同。映射应该已经由仓库配置提供；如果没有，先运行 `setup`。

状态流转：未标记的 issue 通常先进入 `needs-triage`；之后可流转到 `needs-info`、`ready-for-agent`、`ready-for-human` 或 `wontfix`。`needs-info` 在提交者回复后回到 `needs-triage`。维护者可以随时覆盖状态；如果某次流转看起来不寻常，先标出并询问，再继续。

## 调用方式

维护者调用 `/triage`，并用自然语言描述想做什么。理解请求并执行。例如：

以下为英文示例；实际调用时可使用中文描述。

- “Show me anything that needs my attention”
- “Let's look at #42”
- “Move #42 to ready-for-agent”
- “What's ready for agents to pick up?”

## 展示需要关注的 issue

查询 issue tracker，并按从旧到新的顺序展示三个分组：

1. **未标记**：从未 triage。
2. **`needs-triage`**：评估中。
3. **有提交者新回复的 `needs-info`**：自上次 triage notes 后提交者有新回复，需要重新评估。

展示每组数量，并为每个 issue 给出一行摘要。让维护者选择要处理哪一个。

## Triage 指定 issue

1. **收集上下文**：读取完整 issue（正文、comments、labels、提交者、日期）。解析已有 triage notes，避免重复询问已解决的问题。使用项目领域术语表探索代码库，并尊重相关区域的 ADR。读取 `.out-of-scope/*.md`，如果发现类似的历史拒绝记录，就向维护者指出。

2. **给出建议**：告诉维护者你建议的分类和状态，并说明理由；同时给出与该 issue 相关的简短代码库摘要。等待维护者指示。

3. **复现（仅 bug）**：在任何追问前先尝试复现：阅读提交者的步骤，追踪相关代码，运行测试或命令。报告结果：成功复现并给出代码路径、复现失败，或信息不足（这是强烈的 `needs-info` 信号）。已确认复现会让 agent brief 更可靠。

4. **追问（如需要）**：如果 issue 需要补全规格，运行 `/grill-me` 追问会话。

5. **应用结果**：
   - `ready-for-agent`：发布 agent brief comment（见 [AGENT-BRIEF.md](AGENT-BRIEF.md)）。
   - `ready-for-human`：使用和 agent brief 相同的结构，但说明为什么不能委派给 agent（判断取舍、外部访问、设计决策、手工测试等）。
   - `needs-info`：发布 triage notes（模板见下文）。
   - `wontfix`（bug）：礼貌说明原因，然后关闭。
   - `wontfix`（enhancement）：写入 `.out-of-scope/`，在 comment 中链接该文件，然后关闭（见 [OUT-OF-SCOPE.md](OUT-OF-SCOPE.md)）。
   - `needs-triage`：应用该角色。如果已有部分进展，可选择发布 comment。

## 快速状态覆盖

如果维护者说 “move #42 to ready-for-agent”，信任维护者并直接应用该角色。先确认即将执行的操作（角色变更、comment、关闭），然后执行。跳过追问。如果没有经过追问会话就移动到 `ready-for-agent`，询问维护者是否要写 agent brief。

## Needs-info 模板

```markdown
## Triage 记录

**目前已确认：**

- 要点 1
- 要点 2

**仍需提交者提供（@reporter）：**

- 问题 1
- 问题 2
```

把追问过程中已经解决的内容都记录到 “目前已确认” 下，避免信息丢失。问题必须具体、可执行，不要只写 “please provide more info”。

## 恢复之前的会话

如果 issue 上已有 triage notes，先阅读它们，检查提交者是否回答了未决问题，并在继续前展示更新后的情况。不要重复询问已经解决的问题。

## 发布前注意

- 如果 issue tracker 或 triage label 配置缺失，先补运行 `setup`。
- 如果目标是 GitHub 或 GitLab，使用仓库配置中指定的 CLI；不要猜平台。
- 如果 CLI 未登录，提示用户运行对应登录命令，例如 `gh auth login` 或 `glab auth login`。
- 国内网络环境下，如果 GitHub/GitLab 认证页面无法打开，提醒用户按团队网络或代理规范处理；不要替用户修改全局网络配置。
