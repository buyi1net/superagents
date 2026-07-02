# 编写 Agent Brief

agent brief 是 issue 移动到 `ready-for-agent` 时发布在 GitHub issue 上的结构化 comment。它是 AFK agent 后续工作的权威规格。原始 issue 正文和讨论只是上下文；agent brief 才是执行契约。

## 原则

### 耐久性优先于精确定位

issue 可能会在 `ready-for-agent` 状态停留数天或数周。在这期间代码库会变化。编写 brief 时要让它在文件重命名、移动或重构后仍然有用。

- **应该**描述接口、类型和行为契约。
- **应该**指出 agent 应查找或修改的具体类型、函数签名或配置形状。
- **不要**引用文件路径；它们会过期。
- **不要**引用行号。
- **不要**假设当前实现结构会保持不变。

### 描述行为，不描述步骤

描述系统**应该做什么**，而不是**如何实现**。agent 会重新探索代码库，并自行做实现决策。

- **好**：`SkillConfig` 类型应接受一个可选的 `schedule` 字段，类型为 `CronExpression`。
- **差**：打开 `src/types/skill.ts`，在第 42 行添加 schedule 字段。
- **好**：当用户不带参数运行 `/triage` 时，应看到需要关注的 issues 摘要。
- **差**：在主 handler 函数里加一个 switch 语句。

### 完整验收标准

agent 需要知道什么时候算完成。每个 agent brief 都必须包含具体、可测试的验收标准。每条标准都应能独立验证。

- **好**：运行 `gh issue list --label needs-triage` 会返回已经完成初始分类的 issues。
- **差**：Triage 应该正常工作。

### 明确范围边界

说明哪些内容不在范围内。这可以防止 agent 镀金或对相邻功能做假设。

## 模板

下面模板最终会作为 issue comment 发布；示例正文使用中文，字段名保留英文以便和 agent brief 协议术语对应，确保子 agent 可解析。

```markdown
## 任务简要说明

**Category:** bug / enhancement
**Summary:** 用一句话描述需要发生什么

**Current behavior:**
描述现在会发生什么。对于 bug，这里写已损坏的行为。
对于 enhancement，这里写该功能基于的当前状态。

**Desired behavior:**
描述 agent 完成工作后应该发生什么。
具体说明边界场景和错误条件。

**Key interfaces:**
- `TypeName` — 需要变更什么，以及为什么
- `functionName()` return type — 当前返回什么，以及应该返回什么
- Config shape — 需要新增的配置选项

**Acceptance criteria:**
- [ ] 具体、可测试的验收标准 1
- [ ] 具体、可测试的验收标准 2
- [ ] 具体、可测试的验收标准 3

**Out of scope:**
- 这个 issue 不应变更或处理的事项
- 看似相关但实际独立的相邻功能
```

## 示例

### 好的 agent brief（bug）

```markdown
## 任务简要说明

**Category:** bug
**Summary:** skill description 截断时会切断单词，导致输出损坏

**Current behavior:**
当 skill description 超过 1024 个字符时，它会在正好 1024 个字符处截断，
不考虑单词边界。这会导致 description 以半个单词结尾，
例如 “Use when the user wants to confi”。

**Desired behavior:**
截断应发生在 1024 个字符前的最后一个单词边界，
并追加 “...” 表示内容已截断。

**Key interfaces:**
- `SkillMetadata` 类型的 `description` 字段 — 不需要改类型，
  但填充该字段的校验或处理逻辑需要尊重单词边界
- 任何读取 SKILL.md frontmatter 并提取 description 的函数

**Acceptance criteria:**
- [ ] 1024 个字符以内的 description 保持不变
- [ ] 超过 1024 个字符的 description 会在 1024 个字符前的最后一个单词边界截断
- [ ] 截断后的 description 以 “...” 结尾
- [ ] 包含 “...” 在内的总长度不超过 1024 个字符

**Out of scope:**
- 修改 1024 个字符限制本身
- 支持多行 description
```

### 好的 agent brief（enhancement）

```markdown
## 任务简要说明

**Category:** enhancement
**Summary:** 增加 `.out-of-scope/` 目录支持，用于跟踪被拒绝的功能请求

**Current behavior:**
功能请求被拒绝时，issue 会带着 `wontfix` label 和一条 comment 关闭。
目前没有持久记录保存该决策或原因。
未来出现类似请求时，维护者需要凭记忆或搜索找回之前的讨论。

**Desired behavior:**
被拒绝的功能请求应记录到 `.out-of-scope/<concept>.md` 文件中，
包含决策、原因，以及所有请求该功能的 issue 链接。
triage 新 issue 时，应检查这些文件是否存在匹配项。

**Key interfaces:**
- `.out-of-scope/` 中的 Markdown 文件格式 — 每个文件应包含
  `# Concept Name` 标题、`**Decision:**` 行、`**Reason:**` 行，
  以及带 issue 链接的 `**Prior requests:**` 列表
- triage 工作流应尽早读取所有 `.out-of-scope/*.md` 文件，
  并按概念相似度匹配新提交的 issues

**Acceptance criteria:**
- [ ] 将功能标记为 wontfix 并关闭时，会在 `.out-of-scope/` 中创建或更新文件
- [ ] 文件包含决策、原因，以及已关闭 issue 的链接
- [ ] 如果匹配的 `.out-of-scope/` 文件已经存在，新 issue 会追加到它的 “Prior requests” 列表，而不是创建重复文件
- [ ] triage 期间会检查已有 `.out-of-scope/` 文件；当新 issue 匹配之前的拒绝记录时，会明确指出

**Out of scope:**
- 自动匹配（由人类确认是否匹配）
- 重新打开之前已拒绝的功能
- bug 报告（只有 enhancement 拒绝才进入 `.out-of-scope/`）
```

### 差的 agent brief

```markdown
## 任务简要说明

**Summary:** 修复 triage bug

**What to do:**
triage 那块坏了。看看主文件然后修一下。
问题在第 150 行附近的函数里。

**Files to change:**
- src/triage/handler.ts (line 150)
- src/types.ts (line 42)
```

这份 brief 很差，因为：

- 没有 category。
- 描述含糊（“triage 那块坏了”）。
- 引用了很快会过期的文件路径和行号。
- 没有验收标准。
- 没有范围边界。
- 没有描述当前行为和期望行为。
