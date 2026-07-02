# Out-of-Scope 知识库

仓库中的 `.out-of-scope/` 目录用于长期记录被拒绝的功能请求。它有两个作用：

1. **组织记忆**：记录某个功能为什么被拒绝，避免 issue 关闭后原因丢失。
2. **去重**：当新 issue 与之前被拒绝的请求相似时，本 skill 可以指出之前的决策，而不是重新争论一遍。

## 目录结构

```text
.out-of-scope/
├── dark-mode.md
├── plugin-system.md
└── graphql-api.md
```

每个**概念**一个文件，而不是每个 issue 一个文件。多个请求同一件事的 issues 会归到同一个文件下。

## 文件格式

文件应采用放松、可读的写法，更像短设计文档，而不是数据库条目。可以使用段落、代码示例和例子，让第一次读到它的人也能理解拒绝原因。

下面示例使用中文正文；文件名、类型名和代码保持原样。

```markdown
# 暗色模式

本项目不支持暗色模式，也不支持面向用户的主题能力。

## 为什么这不在范围内

渲染管线假设只存在一个由 `ThemeConfig` 定义的调色板。支持多主题需要：

- 用 theme context provider 包裹整个组件树
- 为每个组件增加感知主题的样式解析
- 为用户主题偏好增加持久化层

这是一次重大的架构变更，不符合项目聚焦内容创作的方向。主题能力应由嵌入或再分发输出内容的下游消费者处理。

```ts
// The current ThemeConfig interface is not designed for runtime switching:
interface ThemeConfig {
  colors: ColorPalette; // single palette, resolved at build time
  fonts: FontStack;
}
```

## 历史请求

- #42 — “支持暗色模式”
- #87 — “增加无障碍夜间主题”
- #134 — “增加暗色主题选项”
```

### 命名文件

用简短、描述性的 kebab-case 名称表示这个概念：`dark-mode.md`、`plugin-system.md`、`graphql-api.md`。文件名应足够清楚，让浏览目录的人不打开文件也能大致知道被拒绝的是什么。

### 编写原因

原因应该有实质内容，不要只写“我们不想做”。好的原因会引用：

- 项目范围或理念，例如“本项目聚焦 X；主题能力是下游消费者关注的问题”。
- 技术约束，例如“支持这个能力需要 Y，而 Y 与我们的 Z 架构冲突”。
- 战略决策，例如“我们选择 A 而不是 B，因为……”。

原因应该耐久。避免引用临时情况，例如“我们现在太忙了”；这不是真正的拒绝，只是延期。

## 什么时候检查 `.out-of-scope/`

triage 期间（第 1 步：收集上下文），读取 `.out-of-scope/` 中的所有文件。评估新 issue 时：

- 检查该请求是否匹配已有 out-of-scope 概念。
- 匹配依据是概念相似度，不是关键词；“night theme” 可以匹配 `dark-mode.md`。
- 如果匹配，向维护者指出：“这和 `.out-of-scope/dark-mode.md` 类似；之前因为 [reason] 拒绝过。你现在仍然这么认为吗？”

维护者可能会：

- **确认**：把新 issue 加到已有文件的 “历史请求” 列表中，然后关闭。
- **重新考虑**：删除或更新 out-of-scope 文件，并让该 issue 进入正常 triage 流程。
- **不同意匹配**：这些 issues 相关但不同，继续正常 triage 流程。

## 什么时候写入 `.out-of-scope/`

只有当一个 **enhancement**（不是 bug）被判定为 `wontfix` 时才写入。流程：

1. 维护者决定某个功能请求不在范围内。
2. 检查是否已有匹配的 `.out-of-scope/` 文件。
3. 如果有：把新 issue 追加到“历史请求”列表。
4. 如果没有：用概念名创建新文件，写入决策、原因和第一个历史请求。
5. 在 issue 上发布 comment 说明决策，并提到 `.out-of-scope/` 文件。
6. 用 `wontfix` label 关闭 issue。

## 更新或删除 out-of-scope 文件

如果维护者改变了对某个已拒绝概念的看法：

- 删除 `.out-of-scope/` 文件。
- 本 skill 不需要重新打开旧 issues；它们是历史记录。
- 触发重新考虑的新 issue 进入正常 triage 流程。
