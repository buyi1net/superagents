# zh-cn-mode — 环境搭建

用户主动要求中文环境时执行。负责扫描、检查并批量配置系统中所有 agent 的语言偏好和引导指令。

---

## Step 1：扫描系统中所有 agent

先读取 `references/agent-paths.md` 获取最新的 agent 检测路径表。

然后按表中的路径，逐一检测每个 agent 的安装状态（不管当前使用的是哪个）：

1. 检查全局规则文件所在目录是否存在
2. 目录存在 → 用 `Read` 读取全局规则文件（不存在视为空）
3. 目录不存在 → 标记为"未安装"

对每个检测到的 agent，存入变量：{名称, 已安装, 规则文件路径, Skills 目录路径}。

### 补充遗漏

读取 `references/agent-paths.md` 中"无独立全局规则文件的 agent"小节，告知用户这些 agent 需手动配置。同时询问是否有表中未列出的 agent 需要一并处理。

---

## Step 2：逐 agent 检查状态

对 Step 1 检测到的每个 agent，检查：

1. 全局规则文件是否存在？
2. 文件中是否包含语言偏好（"简体中文"或"Simplified Chinese"）？
3. 文件中是否包含引导指令（`加载一次 zh-cn-mode` 或 `加载 zh-cn-mode`）？
4. zh-cn-mode skill 是否已安装？（检查该 agent 的 skills 目录下是否存在 `zh-cn-mode/` 子目录，包含 `SKILL.md`）

汇总表格（示例，实际内容按 Step 1 检测结果填充）：

```
| Agent | 规则文件 | 语言偏好 | 引导指令 | Skill 已安装 |
|-------|---------|---------|---------|-------------|
| OpenCode | 存在 | ✅ | ✅ | ✅ |
| Claude  | 不存在 | — | — | — |
| Gemini  | 存在 | ✅ | ❌ | ❌ |
| Codex   | 不存在 | — | — | — |
| Windsurf| 存在 | ❌ | ❌ | ❌ |
```

后续 Step 3（配置写入）和 Step 4（skill 安装）都**直接使用这张表格的结果**，不再重新检测。

---

## Step 3：询问用户 → 批量配置

向用户展示汇总表格，然后询问：

> 检测到 N 个 agent。是否全部配置？（默认：是）
> 
> 将为以下 agent 写入语言偏好和引导指令：
> - Claude Code（新建 %USERPROFILE%\.claude\CLAUDE.md）
> - Gemini CLI（补充引导指令到 %USERPROFILE%\.gemini\GEMINI.md）
> - Codex（新建 %USERPROFILE%\.codex\AGENTS.md）
> - Windsurf（写入 %USERPROFILE%\.codeium\windsurf\memories\global_rules.md）
>
> 以下 agent 全局规则在设置 UI 中，需手动操作：
> - Cursor：Settings > Rules for AI，粘贴偏好和引导指令
> - GitHub Copilot：项目级写入 .github/copilot-instructions.md

用户确认后执行 Step 4。如果用户想逐个选择，按用户指定执行。

---

## Step 4：批量写入

对每个确认的 agent：

**写入偏好和引导指令**：
- 文件不存在 → 创建并写入
- 文件存在但缺偏好 → 追加
- 文件存在且已有偏好但缺引导指令 → 只补充引导指令行
- 文件存在且完整 → 跳过

写入内容：

```
Always respond in Simplified Chinese (简体中文).
在输出文档、注释或任何人类可读文本前，加载一次 zh-cn-mode。
```

## Step 4.5：询问是否安装 skill

从 Step 2 汇总表格中，取出所有"Skill 已安装"列为 ❌ 或 — 的 agent。

**来源路径**：当前 setup.md 所在的实际目录。用 `Read` 确认目录中存在 `SKILL.md`、`setup.md`、`rules.md`。

**目标路径**：直接使用 Step 1 检测时存入每个 agent 的 Skills 目录路径，拼接 `zh-cn-mode/` 子目录。

逐 agent 询问用户：

> {agent 名称}（Step 2 表格中 Skill 未安装），是否现在安装？
> 来源：{来源目录的绝对路径}
> 目标：{Step 1 记录的 Skills 目录}/zh-cn-mode/

用户确认后，将来源目录完整复制到目标路径（包含三个文件）。复制后验证目标目录中存在 `SKILL.md`。

用户拒绝则不操作该 agent。

全部完成后报告结果。

---

环境搭建完成。返回 SKILL.md 的路由，继续下一步。
