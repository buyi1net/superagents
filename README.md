# superagents

面向 Claude Code、Codex、OpenCode 和 Pi 的跨 Agent 规则与 skill 工具包。

## 支持范围

| Agent | 安装方式 | 会话加载方式 | Skill 发现 |
|---|---|---|---|
| Claude Code | Marketplace 插件 | 在启动、清空上下文和压缩上下文时注入 `constitution` | 插件原生发现 |
| Codex | Marketplace 插件 | 不使用 SessionStart hook，由 Codex 发现并按需加载 skill | 插件原生发现 |
| OpenCode | Git 插件 | 向会话的第一条用户消息注入 `constitution` | 注册 `skills.paths` |
| Pi | Git 包 | 在会话开始和上下文压缩后注入 `constitution` | 注册原生 skill 目录 |

## 产品列表

| Skill | 用途 |
|---|---|
| [`constitution`](./skills/constitution/SKILL.md) | 全局规则总纲，定义语言、沟通和工作纪律等基础约束。 |
| [`management`](./skills/management/SKILL.md) | 项目创建、接手、整理、维护和交付的场景入口。 |
| [`grill`](./skills/grill/SKILL.md) | 在开放式需求中逐层确认决策点和边界。 |
| [`handoff`](./skills/handoff/SKILL.md) | 在切换 Agent 或主动交接时生成可继续执行的工作快照。 |

## 使用说明

通常只需把仓库地址 `https://github.com/buyi1net/superagents` 和目标平台交给具备终端权限的 Agent。Agent 可以读取本页并完成安装、验证、更新或卸载。

需要 Git、Node.js 和目标 Agent 的 CLI。Windows 上的 Claude Code 还需要 Bash，标准安装的 Git for Windows 已包含所需环境。

### 安装

```bash
git clone https://github.com/buyi1net/superagents.git
cd superagents
```

按目标平台执行：

| 目标 | 命令 |
|---|---|
| Claude Code | `node scripts/install.mjs --cc` |
| Codex | `node scripts/install.mjs --codex` |
| OpenCode | `node scripts/install.mjs --opencode` |
| Claude Code、Codex 和 OpenCode | `node scripts/install.mjs` |
| Pi | `pi install git:github.com/buyi1net/superagents` |

`--cc`、`--codex` 和 `--opencode` 可以组合使用。Pi 使用自身的包管理命令，不由 `install.mjs` 处理。

安装完成后，新建会话以加载插件和 skill。

### 验证

按已安装的平台检查插件或包是否存在：

```bash
claude plugin list
codex plugin list
pi list
```

OpenCode 应在 `~/.config/opencode/opencode.json` 中包含 `superagents@git+https://github.com/buyi1net/superagents.git`。新会话应能发现 `constitution`、`management`、`grill` 和 `handoff`。

### 更新

在仓库目录中拉取最新版本，再执行安装时使用的目标命令：

```bash
git pull --ff-only
node scripts/install.mjs --cc
```

将 `--cc` 换成实际目标参数；更新 Claude Code、Codex 和 OpenCode 时也可以直接运行 `node scripts/install.mjs`。Pi 单独更新：

```bash
pi update git:github.com/buyi1net/superagents
```

更新完成后，新建会话进行验证。OpenCode 会在下次启动时重新拉取最新版本。

### 卸载

同时卸载 Claude Code、Codex 和 OpenCode：

```bash
node scripts/install.mjs --uninstall
```

Pi 单独卸载：

```bash
pi remove git:github.com/buyi1net/superagents
```

只卸载单个平台时使用对应方式：

| 目标 | 卸载方式 |
|---|---|
| Claude Code | 依次运行 `claude plugin uninstall superagents@superagents-dz` 和 `claude plugin marketplace remove superagents-dz`。 |
| Codex | 依次运行 `codex plugin remove superagents@superagents-dz` 和 `codex plugin marketplace remove superagents-dz`。 |
| OpenCode | 从 `~/.config/opencode/opencode.json` 的 `plugin` 数组中删除本插件条目。 |
| Pi | 运行 `pi remove git:github.com/buyi1net/superagents`。 |

安装、更新和卸载会修改对应 Agent 的用户级插件配置与缓存，不会修改当前业务项目。

## 许可证

本项目使用 [MIT License](./LICENSE)。
