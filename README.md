# superagents

跨 agent 的规则与 skill 容器 **superagents** —— 核心是规则总纲 skill **constitution**,装到 Claude Code / codex / opencode 三家,每个会话开场自动注入并全程生效;以后可往里扩展更多配套 skill。

## 这是什么

`superagents` 是一个跨 agent 的 plugin(容器),里头装规则和配套 skill。核心 skill `constitution` 是一份「规则总纲」(语言规范、交流规范、工作纪律、流程规范、开发规范);装上后三家 agent 在新会话开场就把总纲拉进上下文、全程按规则办事,不用每次手动提醒。以后可往 `skills/` 里加更多配套 skill,跟 constitution 并列。

## 三家的注入方式

| Agent | 方式 | 强度 |
|---|---|---|
| **Claude Code** | SessionStart hook 注入**全文** | 强(开场强制) |
| **opencode** | 插件 transform 注入**全文** | 强(开场注入首条消息) |
| **codex** | skill 引用(开场露 description、正文按需调) | 软(靠模型自觉;codex 的 hook 对 `exec` 不触发,故走此路) |

## 目录结构

```
superagents/
├── .claude-plugin/       # CC 的 plugin + marketplace 清单
├── .codex-plugin/        # codex 的 plugin 清单
├── .opencode/plugins/    # opencode 插件(superagents.mjs)
├── .agents/plugins/      # 通用 marketplace 清单(codex 用)
├── hooks/                # CC 的 SessionStart hook(run-hook.cmd + session-start)
├── skills/constitution/  # 总纲正文 SKILL.md + modules/
├── scripts/install.mjs   # 跨平台一键安装器
└── package.json          # opencode 插件入口(main 字段)
```

各家的清单目录(`.xxx-plugin`)必须放在仓库根——安装时各家先扫根目录的清单认出 plugin,再按清单去 `hooks/`、`skills/` 取内容。

## 安装

需 Node.js + 各家 CLI(`claude` / `codex`);opencode 走配置文件。

### 一键装(推荐,跨 Windows / macOS / Linux)

```bash
git clone https://github.com/buyi1net/superagents.git
cd superagents
node scripts/install.mjs                 # 装三家
# 单装:node scripts/install.mjs --cc | --codex | --opencode
```

安装器保证每家 cache 干净:CC 用 `--sparse` 只拉自己的目录;codex / opencode 只能整仓拉,装完自动清掉别家清单和 `docs`、`.claude` 等杂物。

### 分家手动

```bash
# Claude Code
claude plugin marketplace add buyi1net/superagents --sparse .claude-plugin hooks skills
claude plugin install superagents@superagents-dz

# codex
codex plugin marketplace add buyi1net/superagents
codex plugin add superagents@superagents-dz

# opencode:编辑 ~/.config/opencode/opencode.json,在 plugin 数组加一行:
#   "superagents@git+https://github.com/buyi1net/superagents.git"
```

## 卸载

```bash
node scripts/install.mjs --uninstall
```

## 本机开发同步

改了 `skills/constitution/` 正稿后,一键刷到本机已装的三家(不经 github):

```bash
node scripts/sync.mjs
```
