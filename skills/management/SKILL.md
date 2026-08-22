---
name: management
description: 项目治理工具集：新项目建立治理（init）、既有项目接入（adopt）、参考材料登记（add-reference）、一致性校验（check）。治理目标是项目不乱——状态一致性由项目内 manifest 和 gov 脚本机器判定，不依赖条文自觉；涉及文件目录治理、项目整理、治理缺口修复或审计时加载。
---

# 项目管理（装载器）

## 治理原理

「不乱」定义为：项目的治理状态（目录职责、参考项、文档索引、交付物）与磁盘实际内容的一致性可以被机器判定。本 skill 不再用条文请求 Agent 自觉维护文档——那已被证明会同时产生「执行不到位」（漏登记、后补说明）和「过度执行」（空目录配三件套）。

三层防线：

1. **机器检查**：`gov.mjs check` 扫描 manifest ↔ 磁盘 ↔ 索引，红灯即欠账工单，任何 Agent 都能跑，不依赖本 skill 装载；
2. **硬红线**：少量必须人工把关的判断（见下）；
3. **软原则**：粒度、归属、生命周期这类不可机械化的判断，见 [principles.md](./principles.md)，按需读取。

治理状态活在项目里（manifest.json + 项目自带的 gov.mjs），不活在会话记忆里。上一个会话忘没忘无所谓：新会话开工跑 check，欠账自动现形。

## 使用路径

| 场景 | 动作 |
|---|---|
| 新项目、空目录形成长期成果 | `node <skill>/assets/gov.mjs init [项目名]`（在项目根运行；治理文件落在项目内 `.agents/gov/`，不占一级目录） |
| 既有项目首次接入治理 | 项目根运行 `node <skill>/assets/gov.mjs adopt`，补齐 TODO 字段后消化 check 红灯 |
| 登记外部参考材料 | `node .agents/gov/gov.mjs add-reference <git-url> [--category 分类] [--note 用途]`：克隆、固定快照、登记、生成说明是一个原子动作 |
| 日常维护任何已治理项目 | 执行项目内规则 + `node .agents/gov/gov.mjs check`；不需要读本 skill 正文 |
| 治理审计 / 接手陌生项目 | 跑 check，红灯清单就是现状报告 |
| 完成任何任务前 | `node .agents/gov/gov.mjs check` 全绿才算完成 |

## gov 命令速查

```
node .agents/gov/gov.mjs init [项目名]     初始化：.gov/（manifest + gov.mjs）+ AGENTS.md + README.md + CLAUDE.md
node .agents/gov/gov.mjs adopt             扫描既有项目生成 manifest 草稿（未知字段标 TODO）
node .agents/gov/gov.mjs add-reference <url> [--category --name --snapshot --note]
node .agents/gov/gov.mjs sync              从 manifest 重新生成索引段和参考说明
node .agents/gov/gov.mjs check             校验三方一致；退出码非 0 = 有欠账
```

治理状态活在 `.agents/gov/`（manifest.json + gov.mjs）。一级目录准入规则：只有需要人和 AI 共同治理的目录才进一级；agent 专用的工具、记忆、skill 统一住 `.agents/`（同 `.git/` 一样隐藏）。README 索引段、参考说明由 sync 从 manifest 生成（`<!-- gov:...:start/end -->` 标记内），不手工维护、不平行抄写；修订元数据改 manifest，散文写标记外。字段说明与 hook 接线见 [assets/README.md](./assets/README.md)。

## 硬红线

1. 密钥、凭据等敏感信息不入库、不写进对外产物。
2. 外部参考仓库副本不提交进项目仓库（add-reference 自动维护 .gitignore 排除）。
3. 删除、覆盖、对外发布前向用户确认影响范围。
4. 治理状态与磁盘分叉时不掩盖：跑 check 把欠账摆出来，修完再收工；禁止删掉 manifest 或绕过 check 来「变绿」。

## 与旧版的关系

12 个条文模块与三件套底稿已退役，完整备份在仓库 `archive/management.rar`（对应提交 `3452f67`）。存量项目已按旧制度生成的 AGENTS.md / README 继续有效，按维护模式沿用其结构，不强制迁移；可单独引入 `gov.mjs` 作为校验增强。判断类规则的存续文本见 [principles.md](./principles.md)。
