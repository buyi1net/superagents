# AGENTS.md

## 项目定位

本项目是队长的个人 skill 库，用于沉淀自己在使用 agent 过程中反复验证有效的工作流。

## 目录结构

目录图从项目根目录展开；同一层级按名称排序。

```text
superagents/
├── .claude/               # Claude Code 本仓库配置
│   ├── ThirdParty/        # 第三方参考 skill 归档（写作 / 开发 / 搜索 / 进化 / 其它等）
│   ├── handoff/           # agent 工作交接快照
│   ├── settings.local.json
│   └── skills/            # Claude Code 项目级 skill（如 sync-skills）
├── .gitattributes         # git 属性配置
├── .gitignore
├── AGENTS.md              # agent 项目规则（本文件；CLAUDE.md 指向它）
├── CLAUDE.md              # Claude Code 入口，内容就是 "AGENTS.md"
├── docs/                  # 项目分析、学习、调研报告
└── skills/                # 正式 skill 正稿库（跨 agent，下发源）
    └── core/              # 核心工作流
        └── dz-skills/     # 跨 agent 全局规则总纲（SKILL.md + modules/）
```

## 给 agent

处理本项目文件时，按本文档中的纪律和质量标准执行。新建 skill 时逐条检查质量清单。不确定是否应该新建 skill 时，先确认痛点是否是重复模式。

把 skill 下发到各 agent（Claude Code / OpenCode / Codex）做测试，用项目级 skill `.claude/skills/sync-skills/`：开局不必加载；当用户说“下发”“同步到 agent”“清理备份”时，主动加载它并按其中说明执行，其余时间不碰。
