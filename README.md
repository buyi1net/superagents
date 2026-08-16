面向 Claude Code、Codex、OpenCode 和 Pi 的跨 Agent 规则与 skill 工具包。

## 工具列表

| Skill | 用途 |
|---|---|
| [`constitution`](./skills/constitution/SKILL.md) | 全局规则总纲，定义语言、沟通和工作纪律等基础约束。 |
| [`grill`](./skills/grill/SKILL.md) | 在开放式需求中逐层确认决策点和边界。 |
| [`handoff`](./skills/handoff/SKILL.md) | 在切换 Agent 或主动交接时生成可继续执行的工作快照。 |

## 前置条件

- 已安装目标 Agent。
- OpenCode 需支持 `opencode plugin` 命令；运行更新脚本时还需要 Node.js。
- Windows 上的 Claude Code 需要 Bash 执行会话 hook，标准安装的 Git for Windows 已包含所需环境。

## Claude Code

通过 Marketplace 插件安装。Claude Code 原生发现 skill，并在会话启动、恢复、清空、压缩、分叉及子 Agent 启动时注入本插件。

```bash
# 安装
claude plugin marketplace add buyi1net/superagents
claude plugin install superagents@superagents-dz

# 验证
claude plugin list

# 启用
claude plugin enable superagents@superagents-dz

# 禁用
claude plugin disable superagents@superagents-dz

# 更新
claude plugin marketplace update superagents-dz
claude plugin update superagents@superagents-dz

# 卸载
claude plugin uninstall superagents@superagents-dz
claude plugin marketplace remove superagents-dz
```

## Codex

通过 Codex 内置的 Marketplace 和插件命令安装。Codex 原生发现并按需加载 skill，不使用 SessionStart hook。

```bash
# 安装
codex plugin marketplace add buyi1net/superagents
codex plugin add superagents@superagents-dz

# 验证
codex plugin list

# 更新
codex plugin marketplace upgrade superagents-dz
codex plugin remove superagents@superagents-dz
codex plugin add superagents@superagents-dz

# 卸载
codex plugin remove superagents@superagents-dz
codex plugin marketplace remove superagents-dz
```

## OpenCode

通过 OpenCode 原生插件命令安装。插件使用正式服务端入口注册 `skills.paths`，并向会话的第一条用户消息注入本插件。

```bash
# 安装
opencode plugin "superagents@git+https://github.com/buyi1net/superagents.git" --global

# 验证
opencode debug skill

# 更新，在 superagents 仓库目录执行
node scripts/install.mjs --opencode

# 卸载
# 从 ~/.config/opencode/opencode.json 或 opencode.jsonc 的 plugin 数组中删除：
# superagents@git+https://github.com/buyi1net/superagents.git
```

OpenCode 尚无插件更新和卸载命令。更新脚本会失效本插件的 Git 缓存后重新调用原生安装命令；安装、更新或卸载后重新启动 OpenCode，验证输出中应包含本仓提供的 skill。

## Pi Agent

通过 Pi 原生 Git 包机制安装。Pi 从包清单加载扩展和 skill，并在每次用户提交提示时注入本插件。

```bash
# 安装
pi install git:github.com/buyi1net/superagents

# 验证
pi list

# 启用或禁用包内资源
pi config

# 更新
pi update git:github.com/buyi1net/superagents

# 卸载
pi remove git:github.com/buyi1net/superagents
```

安装或更新后重启 Pi，或在已打开的 Pi 中执行 `/reload`。`pi list` 应显示该包，`pi config` 中的扩展和 skill 应处于启用状态。

## 许可证

本项目使用 [MIT License](./LICENSE)。
