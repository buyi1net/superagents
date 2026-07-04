# 跨 agent skill / MCP 管理工具:调研与决策

> 2026-06-14 整理。这份文档要在「明天换电脑、本会话和本机记忆都丢失」的前提下把人或新 agent 从零带起来,所以背景、脉络、前景全写进来了,不依赖任何对话记忆或本机临时文件。
>
> 一句话:想做一个能跨多 agent 看清并筛选所有 skill / MCP 来源的统一管理工具;调研下来,fork cc-switch 来做是合理的,前置该探的都探完了,就差拍板要不要动手。
>
> 证据标注:文中数字分三类,会标明出处。「实扫」= 直接在本机跑命令查到;「调研」= 派子 agent 读源码 / GitHub 查到,附了 file:line 或 issue 号;「推断」= 按路径等线索判断,未逐一坐实。

## 零、给接手者:这是什么、你该知道的背景

(完全没上下文也能从这节进入。)

- **项目:** superagents(本机 `D:\superagents`,git 仓库)。用户(对话里称"老大")在攒一套属于自己的、跨多 agent 的能力体系。当前有两条独立的线:
  1. **dz-skills**:跨 agent 的行为规则总纲(规定 agent 怎么说话、求真、守纪律),在 `skills/core/dz-skills/`。已有的一条线,跟本文档无直接关系,别混。
  2. **本文档这条**:做一个跨 agent 的 skill / MCP「来源管理工具」(看清并筛选机器上所有 skill 各自哪来的)。今天一整天聊的是这条。
- **用户偏好(接手者照做):** 称呼用户"老大";回话用朴实白话,别堆标题 / 加粗 / 破折号 / 术语;他说"看看 / 处理"某东西,通常是先审查诊断、别急着动手改;正式文件他自己定稿,agent 只出草稿、不覆盖。
- **这件事怎么来的(对话脉络):** 老大本想找几个优秀 skill 范本学习(design taste、hyperframes、网页演示三个工作流 skill,另记在 `Docs/工作流类-skills-收集.md`)→ 聊到他在用 cc-switch 管多个 agent → 挖出真正的痛:机器上几百个 skill 来源不明、看不清、没法跨 agent 统一管 → 一路调研到"要不要 fork cc-switch 自己做一个来源管理工具"。本文档就是这轮调研的全部结论。
- **怎么用这份文档:** 下面一到七节顺着读;第七节是决策状态和下一步;最后一节「换机交接注意」是明天换机后怎么续上。

## 缘起:要解决的痛

老大日常重度依赖多个 agent(Claude Code、Codex、Gemini、OpenCode 等),痛点是:机器上 skill / MCP 散落各处,分不清哪些是 agent 内置的、哪些自己装的、哪些插件带的、哪些网上下的;也没有一个地方能跨 agent 统一看清和管理。

现在在用 cc-switch 管,但它只看得见自己经手装的那些,agent 内置的、插件带进来的它完全不显示。

目标:做一个带「来源标记 + 多维筛选(来源 / 启用状态 / 所属 agent)+ 跨来源统一可见」的管理工具,先解决「看清」,再谈「管」。

## 一、现状盘点:本机到底有多少 skill(实扫)

在本机扫了一遍各 agent 配置目录的 SKILL.md:

- **你经手装的:10 个**(都在 `~/.cc-switch/skills/`)。
- **机器上实际躺着:约 674 个 SKILL.md。**

中间差的 660 多个,基本没主动装过,cc-switch 一个都看不到。分布:

| 来源 | 数量 | 位置 |
|---|---|---|
| 你用 cc-switch 装的 | 10 | `~/.cc-switch/skills/`,再 symlink 到各 agent |
| Codex 总计 | 604 | 见下细分 |
| �—— Codex 自带 `.system` | 5 | `~/.codex/skills/.system/`(skill-creator、skill-installer、imagegen 等) |
| �—— Codex 官方精选 curated | 39 | `~/.codex/vendor_imports/skills/skills/.curated/` |
| �—— Codex 插件市场缓存 | 557 | `~/.codex/.tmp/plugins/plugins/`(zoom、twilio、shopify、生物医学等整包拉下来的) |
| �—— Codex 官方 bundled | 3 | `~/.codex/plugins/cache/openai-bundled/`(computer-use、chrome、browser) |
| Claude Code 插件 | 56 | 大头是 superpowers(2026-06-12 装,14 个 skill,带 hooks),其余是官方市场缓存的 telegram、imessage 等 |
| opencode / Gemini | 0 | 没往里放 skill |

三层落差(这是「看不清」的根):

1. 你经手装的:10,唯一有掌控感的一层。
2. 真正在生效的:比 10 多(superpowers 14 在跑 + 你 symlink 进 Claude 的 7 + Codex 自带那几十个),但没有完整清单。
3. 磁盘上全躺着的:674,大半是 agent 自拉的市场缓存,白占地方,看不见也删不清。

cc-switch 只照亮第 1 层。第 2 层看不全,第 3 层完全在视野外。

注:557 个市场缓存是「按路径 `.tmp` 推断未激活」,要逐一坐实各 agent 到底激活了哪些,得再挖各家的已启用清单。

## 二、cc-switch 评估(想 fork 的对象,调研)

cc-switch = farion1231/cc-switch,Tauri 2 + Rust 后端 + React/TS 前端的桌面应用,跨 7 个 agent(Claude Code / Desktop、Codex、Gemini CLI、OpenCode、OpenClaw、Hermes)管 provider / MCP / 提示词 / skills / 会话。约 10 万 star,月度大版本,活跃。

**改造难度:中等偏小,地基出乎意料地好。**

- 「按 agent 筛、按启用筛」几乎白送:数据库里每个 skill / MCP 对每个 agent 已经是一个独立开关位(`enabled_claude` / `enabled_codex`…),前端直接过滤即可。
- 「按来源筛」是唯一要新加的:加一个来源字段。但它已经有扫各 agent 目录、识别 skill 从哪冒出来的能力(`scan_unmanaged`,`src-tauri/src/services/skill.rs:1384`),探测原料现成,主要是归一化 + 持久化 + 加一版 DB 迁移。
- 代码不乱:分层清晰(commands → services → dao → SQLite)、约定一致、复用好、测试 / CI 齐全。短板是缺架构文档 + `src/App.tsx` 1620 行单文件臃肿。你之前「看不懂它的管理方式」,是缺人讲透,不是它乱。

**扩展难度(加「全局规则文件」这类新管理页):前端小、后端中。** CLAUDE.md / AGENTS.md / GEMINI.md 的文件名映射、markdown 编辑器(CodeMirror)都现成,加 tab 是改 `App.tsx` 约 8 处机械布线 + 新建 2-3 个文件;后端要新增读写各 agent 不同路径规则文件的命令。

**商业推广:确凿且深度内建。** README 开头是赞助商墙 + 主动卖广告位;代码里约 145 处 `isPartner` 标记、约 115 处带返佣参数(aff / ref / invitecode / utm)的注册链接;UI 给付费 provider 默认置顶 + 金色星标 + 添加时弹促销话术。一整套返佣变现闭环,30 多个付费大模型在内。

**但要给的公道话:** 抛开推广层,产品工程是真扎实的——54 个前端测试 + 11 个后端集成测试、严到出警告就报错的 CI、三语用户手册;CHANGELOG 显示开发重心压倒性在真痛点(代理路由、OAuth、配置原子性、跨平台修复),推广相关变更仅约 2.4%。它是「好产品叠了层激进变现」,不是靠推广撑的空壳。推广那层是数据 + 配置(preset 文件、i18n、字段),fork 后能刨干净。

## 三、上游态度:能不能提 PR 给作者(调研,决定 fork vs 贡献)

查了 cc-switch 的全部 issues(到 #4196)和 PR(到 #4194)。结论:**你要的功能社区早反复提过、还把代码写好了 PR,作者基本不合并。**

- 你要的三件事(标来源、按来源筛、认出内置 / 插件带的 skill),社区相关 issue 十几条;还有人写好了 PR:
  - **PR #3869**(OPEN,未合并):`feat(skills): add source filter, search, batch operations, and skill detail view`,几乎就是你要的 1+2+3 打包。
  - 同类:#2910(筛选排序工具栏)、#1917(扫描未管理 skill)、#3421(标签分组)、#3500(可见性开关)。
- **核对了 9 个这类体验功能 PR,无一合并**(8 OPEN、1 关闭)。作者对它们的全部互动只是挂一句机器人审查 `@codex review`,没有人工 review、排期或合并。
- 对照变现侧:给某模型加返佣链接的 PR #3809,**当天合并**;有人谈买广告位 / OEM,作者回「可以聊一聊」;有人投诉某赞助平台口碑差要求下架,作者替赞助商辩护,只说「出大事故才下掉」。
- 根因(作者 #791 原话大意):按他自己的用法,各家装的插件基本都一样,他不确定有没有必要做这类管理。**他没有这个痛,心思在 provider 变现。** 这类不赚钱的体验功能他承认「有意义、你们随意做」,但自己不碰、也不合并。

**判断:贡献上游不靠谱**(你提的会是第 10 个躺平的 PR),**fork 自己做是路。**

一个利好:作者自己在 v3.13 做过一次「多源扫描 + 标注来源」(issue #1800),说明后端其实已有「来源」雏形,只是没往 UI 上做成筛选。

## 四、竞品调查:市面上有没有现成的(调研,两路独立查,结论一致)

**结论:全市场空白,没有任何现成产品(开源或商业)完整解决这个痛点。你不是信息封闭,是这东西确实还没人做出来。**

- 跟 cc-switch 一个量级的全家桶(skill + MCP + 规则 + 会话、跨多 agent):**就它自己**,十万星,没有第二个接近的。但它没有来源标记和多维筛选。
- **zcf**(UfoMiao/zcf,约 6k 星):是个 CLI 零配置初始化器,帮你一键装好 Claude Code、Codex 环境。管得比 cc-switch 窄(不碰 skill、不碰会话),不做来源 / 筛选。**互补,不是同类,替代不了。**
- skill 来源管理这块,有人做了,但全都只管 skill 一类、不跨到 MCP / 规则 / 会话:
  - **yibie/skills-manager**(约 173 星,macOS 原生):明确区分 local vs plugin、能认出 Codex 的 plugin 缓存,覆盖 44 个 agent。
  - **xingkongliang/skills-manager**(约 2.2k 星,Tauri):按 来源 / 标签 / agent 筛(其实是来源×标签二维 + agent 分页),覆盖 50+ agent。
- MCP 的来源标注:**全市场零实现,处女地。**
- 你要的「跨多对象 + 来源标记 + 多维筛选 + 内置 / 插件可见」整合到一起,**没人做。**

风险:cc-switch 哪天自己补上这块。但结合第三节(作者既不自己做、又把 9 个 PR 全晾着),这风险很低,空白大概率会一直在。

## 五、来源分类底图(动手改造的设计基础)

**最大发现:三家工具都没做「agent 内置 / 官方预置 / 市场缓存」的区分**——yibie 有 plugin 但无 builtin;xingkongliang 把插件目录扫出来的全塞成笼统的 import;cc-switch 只有「GitHub 装的 vs 本地」二元。而「内置 / 预置 / 缓存」恰好是你机器上的大头(Codex 那 600 个)和你最初的痛点。**你要填的是个没人填过的空。**

把本机 674 个套进来源分类底图:

| 来源类型 | 本机的量 | 怎么自动认出来(判据) | 现成工具做了吗 |
|---|---|---|---|
| 你用 cc-switch 装的 | 10 | 在 `~/.cc-switch/skills/` 或库里有记录;带 GitHub repo 字段的再细分「网络装的」 | 三家都做了 |
| 第三方插件带的 | superpowers 等 | 路径在插件缓存四层结构 `.../plugins/cache/{源}/{插件}/{版本}/skills/` | 只 yibie 做了 |
| Agent 官方内置 / 预置 | Codex `.system` 5 + curated 39 + bundled 3 | 路径在 agent 自带系统目录(`.system/`、`vendor_imports/.curated/`、`openai-bundled/`) | 三家全没做 |
| 插件市场缓存(没激活) | Codex `.tmp` 557 | 路径在 `.tmp/plugins` 市场索引缓存目录 | 没人碰 |
| 本地手丢进去的 | 本机暂无明显的 | 在 agent skills 目录顶层、非 symlink、无 repo、又不落在上面几类路径里 | yibie / xingkongliang 的 local |
| (横切)同步副本 | `~/.claude/skills` 那 7 个 symlink | 是指向 cc-switch 的符号链接,折叠去重,不算独立来源 | yibie 用 inode、xingkongliang 判 symlink |

三个能直接抄的工程招:

1. **来源靠路径分流,不靠猜内容**(yibie 核心思路):不分析 skill 本身,只看它在哪个目录被扫到。维护两张表——「agent → skills 目录」和「插件缓存根目录」,扫到哪儿标哪类。
2. **symlink 用 inode 去重**(yibie):本机那 7 个指向 cc-switch 的链接 inode 相同,折叠成一条记录(记「在这几个 agent 生效」),不会被误判成 7 个外部来源。
3. **cc-switch 有现成落脚点**:它的 `scan_unmanaged` 已经在扫各 agent 目录、还记下了每个 skill「在哪发现」(`found_in`),只是用完就扔。fork 后把 `found_in` 升级成正经的来源字段存下来,活就接上,不用从零。

两个难点(诚实):

1. 那几类没人做过的(内置 / 预置 / 缓存),判据得靠逐个 agent 摸清它的内置目录长什么样,一个 agent 一个 agent 地摸。这是真工作量,也是没人做的原因。
2. 照抄 cc-switch 的递归扫描(PR #1917)得避开它自己都没修的两个坑:嵌套目录名字错位(directory key 与下游 basename 比对不一致)、符号链接成环无 guard 会栈溢出。

## 六、三家参考实现的细节(动手时查)

### yibie/skills-manager
- 来源 = 路径分流。分类(去噪后):local / plugin / projectLocal / 网络(skills.sh,独立模型)。**没有「官方内置」类,要自己加。**
- plugin 识别:四层路径 `{source}/{plugin}/{version}/skills/`,版本取最新(numeric 比较)。认 Codex 缓存 = 把 `~/.codex/plugins/cache` 加进缓存根表,无需专属代码。
- symlink:inode 去重(resolve → stat → 按 inode 聚合 → 累积 compatibleAgents),不单列 symlinked 类。
- 来源运行时探测、不落库;落库的只有 star / install 这类用户元数据。
- 有 44 个 agent 的「id → skillsDir / detectPath」映射表。
- 关键文件(需重新 clone):`SkillsManager/Models/Skill.swift`、`Adapters/AgentRegistry.swift`、`Adapters/ClaudeCodeAdapter.swift`、`Adapters/UniversalAdapter.swift`(inode 去重)、`tui/src/services/SkillStore.ts`(Codex 缓存探测唯一出处)。

### xingkongliang/skills-manager
- 架构:hub-and-spoke,所有 skill 先进中央库(`~/.skills-manager`,SQLite),再 symlink / copy 同步到各 agent。
- 来源 4 类(`source_type` 自由字符串):git / skillssh(skills.sh 市场)/ local(本地或 zip)/ import(扫描发现的野生 skill)。**也没有内置 / 插件类**,插件目录扫出来全是 import。
- 三维拆三处存:来源 = skill 字段;标签 = 独立多对多表(用户手打);agent = `skill_targets` 表(skill↔tool,带 symlink/copy mode)。
- 「三维筛选」名不副实:来源×标签是真二维筛选,agent 是独立分页。**真三维同屏筛选是它没做、你可超越的点。**
- 扫野生 skill 两道判据:跳过指向中央库的 symlink + 跳过已管理路径;skill 判据 = 目录含 SKILL.md / skill.md;内容哈希去重分组。
- 50+ agent 路径表 + 用户自定义工具覆盖。
- 关键文件:`src-tauri/src/core/tool_adapters.rs`(agent 路径表)、`core/scanner.rs`(扫描 + symlink 过滤 + 去重)、`core/migrations.rs:69-175`(三维 schema)、`src/views/MySkills.tsx:231-274`(筛选逻辑)。

### cc-switch PR #3869 + #1917
- #3869 来源模型:**二元**(`repo_owner && repo_name` → `owner/repo`,否则 → `local`),纯复用已有 repo 字段,零新增探测。来源是可被用户手动改写的元数据标签(`batch_update_skill_source`),只用于更新检测和文档链接,不代表真实出处。
- #3869 筛选骨架(`sourceKey` / `sourceOptions` / `filterSource`)可直接借用,只需把二元 `sourceKey` 扩成多类。
- #1917 unmanaged scan:递归找「含 SKILL.md 的最浅目录」即一个 skill 单元,命中即停。扫三类源(各 app skills 目录 / agents 目录 / cc-switch SSOT),每个带 label 存进 `found_in`——**但 label 没被建模成来源,浪费了**(这正是 fork 的接入点)。
- **两个 PR 都完全没有「内置 vs 插件」概念,这是最大缺口,也是你的核心差异化。**
- fork 改动落点:`src-tauri/src/database/schema.rs:84`(skills 表加 source 列)、`src/app_config.rs:169`(InstalledSkill)、`services/skill.rs:1384`(scan_unmanaged 加探测)、`src/lib/api/skills.ts:26`(TS 类型)、`src/components/skills/UnifiedSkillsPanel.tsx`(筛选 UI)。

## 七、决策状态与下一步

fork 前该探的全探完了:

- **能做:** 地基好,改造中等偏小,筛选大半白送(第二节)。
- **没人占:** 全市场空白,没现成解药(第四节)。
- **有参考:** 三家的探测代码摆着,可抄(第五、六节)。
- **有底图:** 来源分类表已提炼(第五节)。

**待老大拍板:要不要 fork 动手。**

若动手,第一步不是写代码,是基于来源底图把「来源怎么分类」最终定死(尤其「内置 vs 插件」的判据),然后在 fork 上:

1. 给 skills 表加来源字段 + 一版迁移;
2. 把 cc-switch 的 `found_in` 升级成来源探测(逐 agent 摸内置目录),复用 yibie 的路径分流 + inode 去重;
3. 把 #3869 的二元筛选骨架扩成多类;
4. 同步给 MCP 加来源(全市场没人做,独一份);
5. 把推广层刨掉。

代价(要认):fork 一个月度大迭代的项目,长期要跟上游同步(但你加的来源 / 筛选上游不碰,不冲突;同步的只是它勤维护的底座);「内置 / 插件」判据要逐 agent 摸。

## 资源指引

- cc-switch 源码:本次 clone 在 `/tmp/cc-switch-review`(**临时目录,重启会清,明天动手要重新 `git clone https://github.com/farion1231/cc-switch`**)。
- 参考项目:`github.com/yibie/skills-manager`、`github.com/xingkongliang/skills-manager`。
- 关键 PR / issue:cc-switch #3869(来源筛选实现)、#1917(递归扫描)、#791(作者对插件管理的态度)、#1800(后端已有来源雏形)、#3809(返佣 PR 当天合并,对照证据)。
- 本机 skill 分布的实扫命令:`find ~/.claude ~/.cc-switch ~/.config ~/.codex ~/.gemini -iname "SKILL.md"`(本环境无 `wc`,计数用 `arr=($(find ...)); echo ${#arr[@]}`)。

## 换机交接注意(明天换机前必看)

- **会话和记忆都不跟走。** 明天那台电脑上拿不到的:① 本会话对话历史;② 本机 agent 记忆(`~/.claude/projects/.../memory/`,里面有用户偏好、dz-skills 状态、本调研摘要,新机器没有);③ `/tmp/cc-switch-review` 源码(重启即清)。**换机后一切以本文档 + 项目 git 仓库里的文件为准。**
- **关键动作:本文档和今天的所有改动必须先 `git commit` 再 `git push`,新电脑 `git pull` 下来才有。不推 = 明天全白做。** 截至写作,这些改动尚未提交(待老大确认是否由 agent 代为提交推送)。
- **新电脑 / 新会话开局怎么续:** 先读本文档全文;要了解项目另一条线 dz-skills,读 `skills/core/dz-skills/SKILL.md` 和 `Docs/superpowers-架构学习.md`(都在 git 里,跟得走);工作流 skill 范本见 `Docs/工作流类-skills-收集.md`。
- **真动手做工具时:** cc-switch 源码重新 `git clone https://github.com/farion1231/cc-switch`;按第五节来源底图先把"来源怎么分类"定死,再按第七节下一步推进。
- 本文档是自包含交接件,日后任何更新都要保持"脱离记忆和对话也能读懂"。
