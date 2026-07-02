# superpowers 架构学习

> 2026-06-14 整理。目的:学习 superpowers 怎么做"跨 agent 的总纲注入 + 技能按需",给 dz-skills 落地做参考。本文是学习记录,不是实施方案;怎么搞由老大定。

## 一句话

superpowers 是 dz-skills 想做的那套东西的完整样板:一套技能内容,跨多个 agent,会话一开始把"总纲"硬注入上下文,其余技能按需用 Skill 工具调。dz-skills 的方向跟它一致,它把每个环节都落地了。

## 来源

- 项目:github `obra/superpowers`(MIT,作者 Jesse Vincent)。
- 本机:作为 Claude Code 插件安装,版本 5.1.0,在 `C:\Users\Administrator\.claude\plugins\cache\superpowers-dev\superpowers\5.1.0\`。
- 启用方式:`~/.claude/settings.json` 里 `enabledPlugins` 写一行 `superpowers@superpowers-dev`,市场源指向该 github 仓库。
- 注:插件装在本机 `.claude` 目录,不随本项目仓库走;换机器后需重新安装。

## 1. 打包方式

- 一个插件 = 一个 git 仓库,根目录放 `.claude-plugin/plugin.json`。manifest 极简,只有 name / version / author / description / keywords,不声明技能和钩子的路径。
- 技能放 `skills/` 下,一个技能一个文件夹,里面一个 `SKILL.md`。要带的参考资料、脚本、子 agent 提示词放同一文件夹,用到才加载,平时不占 token(渐进式加载)。
- 钩子放 `hooks/`。
- 目录名 `skills/`、`hooks/` 是约定,plugin.json 不用声明,Claude Code 自动发现。
- 共 14 个技能:brainstorming、systematic-debugging、test-driven-development、writing-plans、writing-skills、using-git-worktrees、executing-plans、subagent-driven-development、dispatching-parallel-agents、requesting-code-review、receiving-code-review、verification-before-completion、finishing-a-development-branch、using-superpowers。
- 分发靠 marketplace:用户 settings.json 加一行启用,装一次全部到位,用 `/superpowers:技能名` 调。

## 2. 总纲注入(核心,即"系统注入")

机制是 Claude Code 的 SessionStart 钩子,三步:

1. `hooks/hooks.json` 注册 SessionStart 钩子,matcher 为 `startup|clear|compact`(注意没有 `resume`)。
2. 钩子执行 `hooks/run-hook.cmd session-start`,最终跑 bash 脚本 `hooks/session-start`。脚本把 `skills/using-superpowers/SKILL.md` 整篇读出,外包一层 `<EXTREMELY_IMPORTANT>You have superpowers…</EXTREMELY_IMPORTANT>`,转义成 JSON 输出。
3. 脚本按平台输出不同字段:Claude Code 用 `hookSpecificOutput.additionalContext`,Cursor 用 `additional_context`,Copilot 等用顶层 `additionalContext`。Claude Code 把这段塞进上下文,每次会话都塞。

关键:只注入 `using-superpowers` 这一个"总纲"技能,其余 13 个不注入,模型要用时自己用 Skill 工具调。等于"主文件常驻 + 模块按需",跟 dz-skills 现在的设计一致。

## 3. 跨 agent

内容一套,注入各家各接:

- Claude Code / Cursor / Copilot:共用同一个 `hooks/session-start` 脚本,脚本内按环境变量判断平台、输出对应字段名。
- opencode:不用钩子,用 JS 插件 `.opencode/plugins/superpowers.js`。它做两件事:把技能目录注入 opencode 配置(`config.skills.paths`)让它发现技能;用 `experimental.chat.messages.transform` 把总纲塞进每个会话的第一条用户消息(用用户消息而非系统消息,避免每轮重复占 token、以及多条系统消息搞坏某些模型)。
- Codex:`.codex-plugin/`(有 `scripts/sync-to-codex-plugin.sh` 同步)。
- Gemini:`gemini-extension.json` + `GEMINI.md`。

结论:"跨 agent"不是一个开关,是同一套技能内容 + 每家一段注入插件。

## 4. Windows 处理

Claude Code 在 Windows 用 CMD 跑钩子,CMD 不执行 .sh、也找不到 bash。解法是多语言兼容包装文件 `hooks/run-hook.cmd`:同一个文件 CMD 和 bash 都能解析。Windows 上 CMD 那半负责定位 Git 自带的 `bash.exe`(默认 `C:\Program Files\Git\bin\bash.exe`)再跑真正的脚本;Unix 上 bash 直接跑。前提是装了 Git for Windows。详见插件内 `docs/windows/polyglot-hooks.md`。

## 5. 一个边界

注入再硬也只保证"在场",不保证"照做"。superpowers 自己也只能靠 `<EXTREMELY_IMPORTANT>` 加"哪怕 1% 可能也必须调"这种强措辞去压。说明 dz-skills 现在的强措辞元规则跟它是同一招。

## 对 dz-skills 的待定决策(怎么搞,留给老大定)

1. dz-skills 做成插件形态(plugin.json + skills/ + hooks/),还是先只把"总纲注入"按它的钩子做了。
2. 接哪几家:实际在用 Claude Code 和 opencode,优先接这两根管子(SessionStart 钩子 + opencode JS 插件)。
3. 单一源去重:做成插件正好把仓库 / opencode 两份副本收成一个源。

## 还没读的

- 插件内 `skills/writing-skills/`:superpowers 的"怎么写好一个技能"方法论(含 `anthropic-best-practices.md`、`persuasion-principles.md`、`testing-skills-with-subagents.md`)。对以后落地新技能有用,尚未细读。
