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
├── scripts/              # install.mjs(装) / sync.mjs(本机同步) / clean-opencode.mjs(清 opencode 缓存)
└── package.json          # opencode 插件入口(main 字段)
```

各家的清单目录(`.xxx-plugin`)必须放在仓库根——安装时各家先扫根目录的清单认出 plugin,再按清单去 `hooks/`、`skills/` 取内容。

## 安装

> **给 agent 的话:** 用户把本仓库地址交给你、让你安装时,照本节从上往下执行即可。CC/codex 一步到位;**opencode 要多补一步清理**(见"第二步"),别漏。命令跨 Windows / macOS / Linux 通用。

前置:Node.js + 对应 CLI(`claude` / `codex`);opencode 走配置文件、无需 CLI。

### 第一步:一键装

```bash
git clone https://github.com/buyi1net/superagents.git
cd superagents
node scripts/install.mjs                 # 装三家;只装某家加 --cc | --codex | --opencode
```

`install.mjs` 做的事:CC 用 `--sparse` 只拉自己目录、codex 整仓拉,两家装完都按**白名单**把 cache 清到只剩自己需要的;opencode 只往它配置里写一行依赖地址(要它首次运行才真正拉包)。

### 第二步(仅 opencode):清缓存杂物

opencode 机制特殊:它把插件当 git 依赖、**首次运行时才拉包,且会拉整个仓库**(带一堆用不到的杂物),bun 又不给在拉包时清。所以装完 opencode 后补两步:

```bash
# 1) 先正常用一次 opencode,让它把包拉全
#    注意:包是后台 clone、要点时间,用一个正常任务触发,别用秒回的一句话(否则包没拉全就是空的)
# 2) 清掉缓存里的杂物:
node scripts/clean-opencode.mjs
```

清完只剩 opencode 真正加载的 3 样(`package.json` / `.opencode` / `skills`),3.8M → 66K。杂物本就不被 opencode 加载、不影响功能,清理只为整洁省磁盘。(本机开发时 `sync.mjs` 会顺手清,不用单独跑。)

### 分家手动(不想用脚本时)

```bash
# Claude Code
claude plugin marketplace add buyi1net/superagents --sparse .claude-plugin hooks skills
claude plugin install superagents@superagents-dz

# codex
codex plugin marketplace add buyi1net/superagents
codex plugin add superagents@superagents-dz

# opencode:编辑 ~/.config/opencode/opencode.json、plugin 数组加一行,再按"第二步"清缓存:
#   "superagents@git+https://github.com/buyi1net/superagents.git"
```

## 卸载

```bash
node scripts/install.mjs --uninstall
```

## 本机开发同步

改了 `skills/constitution/` 正稿后,一键刷到本机已装的三家(不经 github,顺手清 opencode 杂物):

```bash
node scripts/sync.mjs
```
