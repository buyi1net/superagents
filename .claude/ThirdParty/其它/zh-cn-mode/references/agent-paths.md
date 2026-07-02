# Agent 路径配置

本文件维护所有支持全局指令文件的 agent 的检测路径。新增 agent 或路径变更时只需更新本文件，无需修改 skill 逻辑。

## 检测路径

| 平台 | Windows | Linux / macOS | Skills 目录 |
|------|---------|---------------|-------------|
| OpenCode | `%USERPROFILE%\.config\opencode\AGENTS.md` | `~/.config/opencode/AGENTS.md` | 通过 `opencode.json` 的 `skills.paths` 配置 |
| Claude Code | `%USERPROFILE%\.claude\CLAUDE.md` | `~/.claude/CLAUDE.md` | `~/.claude/skills/` |
| Gemini CLI | `%USERPROFILE%\.gemini\GEMINI.md` | `~/.gemini/GEMINI.md` | 在 `~/.gemini/settings.json` 的 `skills` 配置中查找 |
| Codex | `%USERPROFILE%\.codex\AGENTS.md` | `~/.codex/AGENTS.md` | `~/.codex/skills/` |
| Windsurf | `%USERPROFILE%\.codeium\windsurf\memories\global_rules.md` | `~/.codeium/windsurf/memories/global_rules.md` | `~/.codeium/windsurf/rules/` |

## 规则文件机制

| 平台 | 文件名 | 机制说明 |
|------|--------|----------|
| OpenCode | `AGENTS.md` | 全局 + 项目级，Claude Code 兼容（回退到 `CLAUDE.md`） |
| Claude Code | `CLAUDE.md` | 全局 + 项目级，支持 `CLAUDE.local.md` |
| Gemini CLI | `GEMINI.md` | 全局 + 工作区级，文件名可通过 `settings.json` 自定义 |
| Codex | `AGENTS.md` | 全局 + 项目级，支持 `.Codex-plugin/` 插件入口 |
| Windsurf | `global_rules.md` | 同时支持 `AGENTS.md`，支持多种激活模式 |

## 无独立全局规则文件的 agent

以下 agent 不支持全局规则文件机制，需要通过设置 UI 或其他方式配置：

- **Cursor**：全局规则在 Settings > Rules for AI 中
- **GitHub Copilot**：项目级 `.github/copilot-instructions.md`，无全局文件
- **Aider**：使用 `~/.aider.conf.yml`，可通过 `read` 指令引用外部文件

## 维护规则

- 新增 agent：在本文件添加一行检测路径
- 路径变更：更新对应行，注明变更理由和日期
- 路径不确定：标注 `⚠️ 推测`，优先使用 CLI 命令获取实际路径
- 移除 agent：标注 `[已废弃]` 和移除日期，保留行用于历史记录
