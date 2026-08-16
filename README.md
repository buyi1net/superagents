面向 Claude Code、Codex、OpenCode 和 Pi 的跨 Agent 规则与 skill 工具包。

## 工具列表

| Skill | 用途 |
|---|---|
| [`constitution`](./skills/constitution/SKILL.md) | 全局规则总纲，定义语言、沟通和工作纪律等基础约束。 |
| [`grill`](./skills/grill/SKILL.md) | 在开放式需求中逐层确认决策点和边界。 |
| [`handoff`](./skills/handoff/SKILL.md) | 在切换 Agent 或主动交接时生成可继续执行的工作快照。 |

## 前置条件

- 已安装目标 Agent。
- Codex、OpenCode、Pi 当前使用项目安装脚本，需要 Git Bash 和 Node.js。
- Windows 上的 Claude Code 需要 Bash 执行会话 hook，标准安装的 Git for Windows 已包含所需环境。

## Claude Code

通过 Marketplace 插件安装。Claude Code 原生发现 skill，并在会话启动、恢复、清空、压缩、分叉及子 Agent 启动时注入本插件。

```bash
# 安装
claude plugin marketplace add buyi1net/superagents
claude plugin install superagents@superagents-dz

# 验证
claude plugin list

# 禁用
claude plugin disable superagents@superagents-dz

# 启用
claude plugin enable superagents@superagents-dz

# 更新
claude plugin marketplace update superagents-dz
claude plugin update superagents@superagents-dz

# 卸载
claude plugin uninstall superagents@superagents-dz
claude plugin marketplace remove superagents-dz
```

安装或更新后新建会话。插件列表中应显示已启用的 `superagents@superagents-dz`。

## Codex

通过项目脚本安装 Marketplace 插件。Codex 原生发现并按需加载 skill，不使用 SessionStart hook。

```bash
# 安装
git clone https://github.com/buyi1net/superagents.git
cd superagents
node scripts/install.mjs --codex

# 验证
codex plugin list

# 更新，在 superagents 仓库目录执行
git pull --ff-only
node scripts/install.mjs --codex

# 卸载
codex plugin remove superagents@superagents-dz
codex plugin marketplace remove superagents-dz
```

安装或更新后新建会话。插件列表中应显示已启用的 `superagents@superagents-dz`。

## OpenCode

通过项目脚本安装 Git 插件。插件注册 `skills.paths`，并向会话的第一条用户消息注入本插件。

```bash
# 安装
git clone https://github.com/buyi1net/superagents.git
cd superagents
node scripts/install.mjs --opencode

# 验证
opencode debug skill

# 更新，在 superagents 仓库目录执行
git pull --ff-only
node scripts/install.mjs --opencode

# 卸载
# 从 ~/.config/opencode/opencode.json 的 plugin 数组中删除：
# superagents@git+https://github.com/buyi1net/superagents.git
```

安装、更新或卸载后重新启动 OpenCode。验证输出中应包含本仓提供的 skill。

## Pi Agent

通过 Git 包安装。Pi 使用原生 skill 目录，并在会话开始和上下文压缩后注入本插件。

```bash
# 安装
pi install git:github.com/buyi1net/superagents

# 验证
pi list

# 更新
pi update git:github.com/buyi1net/superagents

# 卸载
pi remove git:github.com/buyi1net/superagents
```

安装或更新后新建会话。包列表中应显示 `git:github.com/buyi1net/superagents`。

## 许可证

本项目使用 [MIT License](./LICENSE)。
