# Issue tracker: GitLab

当前仓库的 issues 和 PRDs 存放在 GitLab Issues 中。所有操作都使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI。

## 约定

- **创建 issue**：`glab issue create --title "..." --description "..."`。多行 description 使用 heredoc。传入 `--description -` 会打开编辑器。
- **读取 issue**：`glab issue view <number> --comments`。需要机器可读输出时使用 `-F json`。
- **列出 issues**：`glab issue list -F json`，并按需要添加 `--label` filters。
- **评论 issue**：`glab issue note <number> --message "..."`。GitLab 把 comments 称为 notes。
- **添加 / 移除 labels**：`glab issue update <number> --label "..."` / `--unlabel "..."`。多个 labels 可以用逗号分隔，也可以重复传 flag。
- **关闭 issue**：`glab issue close <number>`。`glab issue close` 不支持附带关闭评论，所以先用 `glab issue note <number> --message "..."` 说明原因，再关闭。
- **Merge requests**：GitLab 把 PRs 称为 merge requests。使用 `glab mr create`、`glab mr view`、`glab mr note` 等命令；整体形态类似 `gh pr ...`，只是把 `pr` 换成 `mr`，把 `comment` / `--body` 换成 `note` / `--message`。

从 `git remote -v` 推断仓库；在仓库本地目录内运行时，`glab` 会自动推断仓库。

## 当 skill 说 “publish to the issue tracker”

创建一个 GitLab issue。

## 当 skill 说 “fetch the relevant ticket”

运行：

```bash
glab issue view <number> --comments
```