# SuperpowersCN 其它 Skills 功能说明

来源：`D:\superagents\.claude\ThirdParty\SuperpowersCN\skills`

范围：排除报告中列出的 14 个上游 `superpowers` skill 后，复制剩余 19 个 SuperpowersCN skill。

## Skill 列表

| # | Skill | 原始路径 | 复制后路径 | 功能 |
|---|---|---|---|---|
| 1 | `zh-cn-mode` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\meta\zh-cn-mode` | `D:\superagents\.claude\ThirdParty\其它\zh-cn-mode` | 简体中文输出模式。用于确保文档、标题、代码注释、commit message、issue/PR 描述、评论、设计说明、README 等人类可读文本默认使用简体中文，技术词汇和代码保持原样。 |
| 2 | `grill-me` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\grill-me` | `D:\superagents\.claude\ThirdParty\其它\grill-me` | 高强度追问和方案压力测试。围绕已有计划、设计草案或方案逐层追问关键假设、风险、范围、数据、接口、交付和验收，直到形成共享理解。 |
| 3 | `prototype` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\prototype` | `D:\superagents\.claude\ThirdParty\其它\prototype` | 可丢弃原型。用于正式实现前验证设计、状态模型、数据模型或 UI 方向，强调一个问题一个原型、一个命令可运行、默认不持久化、完成后删除或吸收结论。 |
| 4 | `setup` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\setup` | `D:\superagents\.claude\ThirdParty\其它\setup` | 仓库级 skill 配置初始化。配置 issue tracker、triage label 词汇表和领域文档布局，为 `to-issues`、`to-prd`、`triage`、`improve-codebase-architecture`、`zoom-out` 等工程类 skill 提供上下文。 |
| 5 | `to-issues` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\to-issues` | `D:\superagents\.claude\ThirdParty\其它\to-issues` | 将计划、规格或 PRD 拆成可独立承接的实现 issue。采用 tracer bullet 纵向切片，区分 HITL/AFK，确认粒度和依赖后发布到项目 issue tracker。 |
| 6 | `to-prd` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\to-prd` | `D:\superagents\.claude\ThirdParty\其它\to-prd` | 将当前对话上下文整理为 PRD，并发布或准备发布到项目 issue tracker。基于已有上下文和代码库理解生成问题陈述、解决方案、用户故事、实现决策、测试决策、范围外和未决问题。 |
| 7 | `triage` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\triage` | `D:\superagents\.claude\ThirdParty\其它\triage` | Issue 分诊状态机。管理已有或新提交 issue，按 bug/enhancement 分类和 needs-triage、needs-info、ready-for-agent、ready-for-human、wontfix 等状态流转，并生成 triage notes 或 agent brief。 |
| 8 | `zoom-out` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\zoom-out` | `D:\superagents\.claude\ThirdParty\其它\zoom-out` | 从局部代码放大到系统全局。用于用户不熟悉某段代码或想先理解整体位置时，说明相关模块、调用方、领域概念、数据流/控制流和架构影响。 |
| 9 | `improve-codebase-architecture` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\improve-codebase-architecture` | `D:\superagents\.claude\ThirdParty\其它\improve-codebase-architecture` | 架构改进和模块加深分析。基于领域语言和 ADR，寻找浅模块、耦合泄漏、测试困难和低 locality 的位置，提出提高 leverage、locality 和可测试性的重构候选。 |
| 10 | `setup-pre-commit` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\setup-pre-commit` | `D:\superagents\.claude\ThirdParty\其它\setup-pre-commit` | 设置 Husky pre-commit hooks。集成 lint-staged、Prettier、type checking 和 tests，提交前格式化暂存区文件并运行已有质量脚本。 |
| 11 | `git-guardrails-claude-code` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\git-guardrails-claude-code` | `D:\superagents\.claude\ThirdParty\其它\git-guardrails-claude-code` | Claude Code Git 安全护栏。通过 PreToolUse hook 拦截危险 git 命令，例如 `git push`、`git reset --hard`、`git clean -f`、`git branch -D`、`git checkout .`、`git restore .`。 |
| 12 | `opencode` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\dev\opencode` | `D:\superagents\.claude\ThirdParty\其它\opencode` | OpenCode CLI 代理委托。用于用户明确要求把编码、重构、审查或长时间自动会话交给 OpenCode CLI 时，说明安装认证、一次性任务、交互式会话和后台跟踪方式。 |
| 13 | `doc-coauthoring` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\docs\doc-coauthoring` | `D:\superagents\.claude\ThirdParty\其它\doc-coauthoring` | 结构化文档协作。通过上下文收集、优化与结构化、读者测试三个阶段，帮助用户写技术规范、RFC、提案、文档草稿或改进文档结构。 |
| 14 | `docx` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\docs\docx` | `D:\superagents\.claude\ThirdParty\其它\docx` | Word 文档处理。用于创建、读取、编辑或分析 `.docx`，包括提取内容、查找替换、处理修订/评论、插入图片、生成目录/页码/信头等正式文档能力。 |
| 15 | `pdf` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\docs\pdf` | `D:\superagents\.claude\ThirdParty\其它\pdf` | PDF 处理。支持读取、提取文本/表格、合并、拆分、旋转、加水印、创建、填表、加密/解密、提取图片和扫描版 OCR。 |
| 16 | `caveman` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\meta\caveman` | `D:\superagents\.claude\ThirdParty\其它\caveman` | 三级压缩沟通模式。按 L1/L2/L3 控制回答长度，删除填充词、客套话和语义重复，在保留技术准确性的前提下压缩输出。 |
| 17 | `handoff` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\meta\handoff` | `D:\superagents\.claude\ThirdParty\其它\handoff` | 会话交接文档。把当前对话整理为 Markdown 交接文档，记录摘要、当前状态、已检查/修改文件、未完成工作、下一步建议和建议使用的 skills。 |
| 18 | `write-a-skill` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\meta\write-a-skill` | `D:\superagents\.claude\ThirdParty\其它\write-a-skill` | 改造、汉化或增强已有 agent skill。用于审查 skill 结构、触发边界、渐进披露组织，并产出可审查的中文增强或翻译草稿。 |
| 19 | `playwright-cli` | `D:\superagents\.claude\ThirdParty\SuperpowersCN\skills\automation\playwright-cli` | `D:\superagents\.claude\ThirdParty\其它\playwright-cli` | 浏览器自动化。通过 `playwright-cli` 打开页面、跳转、点击、输入、截图、获取快照、执行页面脚本，辅助检查网页状态、调试交互或生成 Playwright 测试。 |

## 已排除的上游 superpowers skills

以下 14 个 skill 按你的要求没有复制到 `其它` 目录：

- `brainstorming`
- `writing-plans`
- `using-git-worktrees`
- `test-driven-development`
- `subagent-driven-development`
- `executing-plans`
- `systematic-debugging`
- `verification-before-completion`
- `requesting-code-review`
- `receiving-code-review`
- `finishing-a-development-branch`
- `dispatching-parallel-agents`
- `writing-skills`
- `using-superpowers`
