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
│   ├── docs/                  # 研究材料（调研 / 学习 / 分析报告）
│   ├── handoff/               # agent 工作交接快照
│   └── settings.local.json
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

开发时改了 `skills/constitution/` 正稿、想同步到本机三家 agent 测试，跑 `node scripts/sync.mjs`——刷到各家 plugin cache、免重装立即生效（详见 README「本机开发同步」）。别再往各 agent 的独立 skill 目录下发：那套老机制（sync-skills）已废弃，会跟 plugin cache 里同一份 skill 撞车、制造 duplicate。

## 规则书写纲领

> 写、改本项目规则（constitution 及各 modules）时遵守。面向"写规则的人"：你，以及帮你写规则的 agent。

1. **用户水平不预设**：别把用户焊死成"资深"或"小白"。按他对当前话题的熟悉度调深浅，拿不准偏讲透，看反馈收。

2. **读者是陌生弱 agent**：每条都站在"没见过你、可能很弱的 agent 第一次冷读"的立场写，意思自足、用词规范，不靠只有作者懂的梗和上下文。

3. **判据优先于清单**：能给"怎么判断"就别列"逐项枚举"。判据兜得住没列到的，清单挂一漏万、弱模型还爱对着勾。清单只在"漏一项就出安全或正确事故"时才留，且必配"拿不准从严"。

4. **精炼是为读懂，不是为短**：删废话因为它碍读；删到费解、砍掉必要的解释和连接，是另一种坏。标准是"一遍读懂"，不是字数。

5. **红线单列、口气要硬**：安全、自造词、敏感信息这类，单独成条、用"禁止 / 必须"，不许混进普通条目被降级。

6. **正面判据加示范，胜过堆禁令**：禁令禁不完，一个判据配一两个"改前 / 改后"能覆盖一片。多写"该怎样"，少堆"别怎样"。

7. **以身作则**：规则文本自己得守自己的规矩，说别用破折号断句就不用，说别堆清单就别列，说精炼自己别啰嗦。改完回读自查，防机械替换出岔子。

8. **场景验收设标尺角色**：做有客观质量标准的专业产出（代码、文档、设计等），验收时代入一个该领域的资深角色，拿他的眼光挑刺；纯适配人的对话交流不设这种角色。
   - 代码 → 资深程序员：命名规不规范、够不够精简、好不好维护和扩展、合不合业务需求。
   - 文档 → 老编辑：有没有 AI 味、易不易读、合不合中文语境、堆没堆辞藻、有没有翻译腔、段落格式规不规范。
   - 设计等其它场景 → 各自的资深角色，各有各的验收维度。
   - 角色是判据不是清单：代入他能挑出没列到的问题，几个维度只是提醒往哪看；别把维度堆成大清单，角色为主、维度为辅。
