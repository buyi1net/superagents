---
name: zh-cn-mode
description: 当 agent 即将产出任何人类可读文本——包括文档正文和标题、代码注释、commit message、issue/PR 描述和评论、设计说明、README——时使用，确保默认使用简体中文，仅技术词汇和代码保持原样。用户说"用中文""用中文回复我""中文输出""简体中文""别用英文""不要英文""用中文写""说中文"时可直接触发。
---

<SUBAGENT-STOP>
如果你是被派发来执行特定任务的子 agent，跳过本 skill。
</SUBAGENT-STOP>

# zh-cn-mode

## 加载判断

根据触发场景决定加载策略：

**场景一：跳过环境搭建**

以下情况只需用 `Read` 工具读取 `rules.md`：
- 通过 AGENTS.md 引导指令加载（偏好已存在）
- 通过 `using-superpowers` 加载
- 通过产出类 skill（`to-prd`、`doc-coauthoring`、`writing-plans`、`writing-skills`、`write-a-skill`）前置依赖加载

**场景二：用户主动触发**

用户说"说中文""用中文""用中文回复我""别用英文"时：

1. 用 `Read` 工具读取 `setup.md`，执行环境搭建
2. setup.md 执行完毕后返回
3. 再用 `Read` 工具读取 `rules.md`，激活输出规范
