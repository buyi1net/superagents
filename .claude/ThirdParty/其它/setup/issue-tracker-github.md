# Issue tracker: GitHub

当前仓库的 issues 和 PRDs 存放在 GitHub Issues 中。所有操作都使用 `gh` CLI。

## 约定

- **创建 issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 issue**：`gh issue view <number> --comments`，同时获取 comments 和 labels；需要结构化处理时可配合 `jq` 过滤。
- **列出 issues**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，并按需要加上 `--label` 和 `--state` filters。
- **评论 issue**：`gh issue comment <number> --body "..."`。
- **添加 / 移除 labels**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`。
- **关闭 issue**：`gh issue close <number> --comment "..."`。

从 `git remote -v` 推断仓库；在仓库本地目录内运行时，`gh` 会自动推断仓库。

## 当 skill 说 “publish to the issue tracker”

创建一个 GitHub issue。

## 当 skill 说 “fetch the relevant ticket”

运行：

```bash
gh issue view <number> --comments
```