---
name: sync-skills
description: 把项目 skills/ 下的正稿 skill 下发到 Claude Code、opencode、codex 的 skill 目录,供新开会话测试改动效果;也负责清理下发备份。仅在用户明确说"下发"或"清理备份"时运行,不主动执行。
---

# sync-skills

把项目里的 skill 正稿复制到各 agent,让新开的 Claude Code、opencode、codex 会话能加载到最新版本做测试。通用工具,不只管 dz-skills,项目 `skills/` 下任何带 SKILL.md 的 skill 都能下发。

## 何时运行

- 用户说"下发""下发 skill""下发到 agent" → 下发。
- 用户说"清理备份""清理一下备份缓存" → 只清理过期备份。

不要主动跑,也别跟 git 同步混(那是另一回事)。

## 怎么运行

```bash
node ~/Documents/SuperSkill/.claude/skills/sync-skills/sync.js            # 下发全部
node ~/Documents/SuperSkill/.claude/skills/sync-skills/sync.js dz-skills  # 只下发指定的
node ~/Documents/SuperSkill/.claude/skills/sync-skills/sync.js --clean    # 只清理过期备份
```

路径按当前系统自动选,配置在 sync.js 的 `TARGETS_BY_PLATFORM`。

## 规则

- 源:项目 `skills/` 下所有含 SKILL.md 的目录(自动发现),只读,绝不改。
- 目标:Claude Code、opencode、codex 三家的 skill 目录,按系统在 sync.js 里各配一份(darwin / linux / win32),换新机器照着加一份。项目根脚本自己定位,不用写死。只动各家目录下对应的 skill 子目录,不碰目标里其他 skill。
- 复制即镜像:目标的核心文件跟源对齐,源里删掉的目标也清掉。
- 草稿不碰:文件名含「草稿」「-claude」「手记」的,以及 `.DS_Store`、`.git`,不下发,目标里有也不删。
- 备份:覆盖前把目标现有副本原样备份到 `~/.skill-sync-backups/`,带时间戳。
- 清理:两种触发。一是用户喊"清理备份"时单独清(`--clean`);二是每次下发完顺带清。规则都是删掉超过 7 天的备份(改 sync.js 的 `BACKUP_TTL_DAYS`),忘了也不会堆。
- 下发后逐个 agent 验收:比对文件清单和内容 hash,全一致才算过,对不上就报警。

## 加载机制(另一条腿)

下发只解决"内容到位"。各 agent 新开会话能不能开场自动加载,靠各自的全局规则文件引导:Claude Code 看 `~/.claude/CLAUDE.md`,opencode 看它的全局规则文件(待建),codex 看 `~/.codex/AGENTS.md`(待写)。内容下发和加载引导都到位,才测得准改动效果。
