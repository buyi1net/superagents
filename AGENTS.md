# AGENTS.md

## 项目定位

本项目是队长的个人 skill 库，用于沉淀自己在使用 agent 过程中反复验证有效的工作流。

## 目录结构

目录图从项目根目录展开；同一层级按名称排序。

```text
superagents/
├── .agents/
│   └── plugins/
│       └── marketplace.json   # 通用 marketplace 清单（Codex 用）
├── .claude/                   # 本仓库开发用的 Claude Code 配置（不打进 plugin）
│   ├── ThirdParty/            # 第三方参考 skill 归档
│   ├── handoff/               # agent 工作交接快照
│   ├── settings.local.json
│   └── skills/                # 项目级 skill（如 sync-skills）
├── .claude-plugin/            # Claude Code 的 plugin + marketplace 清单
│   ├── marketplace.json
│   └── plugin.json
├── .codex-plugin/             # Codex 的 plugin 清单
│   └── plugin.json
├── .gitattributes
├── .gitignore
├── .opencode/                 # OpenCode 插件
│   └── plugins/
│       └── superagents.mjs    # 开场注入总纲的插件入口（package.json main 指向它）
├── AGENTS.md                  # agent 项目规则（本文件；CLAUDE.md 指向它）
├── CLAUDE.md                  # Claude Code 入口，内容就是 "AGENTS.md"
├── README.md                  # 安装 / 使用说明（面向装本插件的人和 agent）
├── docs/                      # 项目分析、学习、调研报告
├── hooks/                     # Claude Code 的 SessionStart hook
│   ├── hooks.json             # hook 声明
│   ├── run-hook.cmd           # 跨平台入口（Windows 走 cmd、unix 走 bash）
│   └── session-start          # 读 SKILL.md、拼注入 JSON
├── package.json               # OpenCode 插件入口（main 字段）
├── scripts/                   # 安装 / 同步脚本
│   ├── clean-opencode.mjs     # 清 OpenCode 缓存杂物
│   ├── install.mjs            # 从 github 装三家
│   └── sync.mjs               # 本机改了正稿一键刷到三家
└── skills/                    # 正式 skill 正稿库（跨 agent，打包 / 下发源）
    └── constitution/          # 跨 agent 全局规则总纲
        ├── SKILL.md           # 总纲正文
        └── modules/           # 分场景规范（开发 / grill / 交接 / 网络 / 写作等）
```

## 给 agent

处理本项目文件时，按本文档中的纪律和质量标准执行。新建 skill 时逐条检查质量清单。不确定是否应该新建 skill 时，先确认痛点是否是重复模式。

把 skill 下发到各 agent（Claude Code / OpenCode / Codex）做测试，用项目级 skill `.claude/skills/sync-skills/`：开局不必加载；当用户说“下发”“同步到 agent”“清理备份”时，主动加载它并按其中说明执行，其余时间不碰。
