# Issue tracker: Local Markdown

当前仓库的 issues 和 PRDs 以 markdown 文件形式存放在 `.scratch/` 中。

## 约定

- 每个功能（feature）一个目录：`.scratch/<feature-slug>/`。
- PRD 文件是 `.scratch/<feature-slug>/PRD.md`。
- 实现 issues 位于 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号。
- Triage 状态记录在每个 issue 文件顶部附近的 `Status:` 行中；角色字符串见 `triage-labels.md`。
- Comments 和对话历史追加到文件底部的 `## Comments` heading 下。

## 当 skill 说 “publish to the issue tracker”

在 `.scratch/<feature-slug>/` 下创建新文件；目录不存在时先创建目录。

## 当 skill 说 “fetch the relevant ticket”

读取引用路径对应的文件。用户通常会直接提供路径或 issue 编号。