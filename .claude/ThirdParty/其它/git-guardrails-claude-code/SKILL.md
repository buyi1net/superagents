---
name: git-guardrails-claude-code
description: 为 Claude Code 设置钩子，在执行前拦截危险 git 命令（push、reset --hard、clean、branch -D 等）。用户想防止破坏性 git 操作、添加 git 安全钩子、阻止 git push/reset 时使用。
disable-model-invocation: true
---

# 设置 Claude Code Git 危险命令拦截

设置一个 Claude Code `PreToolUse` hook，在 Claude Code 通过 Bash 工具执行危险 git 命令前拦截。这里的 hook 指 Claude Code hook，不是 Git 自身的 hooks；脚本读取 Claude Code 传入的 `tool_input.command`，因此主要用于 Claude Code 的 Bash 工具调用拦截。

## 会被阻止的命令

- `git push`（所有变体，包括 `--force`）
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

被阻止时，Claude Code 会看到一条消息，提示它无权执行这些命令。

## 步骤

### 1. 询问作用范围

询问用户：**仅当前项目**安装（`.claude/settings.json`），还是**所有项目**安装（`~/.claude/settings.json`）？

### 2. 复制钩子脚本

附带脚本：[scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh)

根据作用范围复制到目标位置：

- **项目级**：`.claude/hooks/block-dangerous-git.sh`
- **全局**：`~/.claude/hooks/block-dangerous-git.sh`

用 `chmod +x` 赋予可执行权限。

### 3. 将钩子添加到设置文件

在对应的设置文件中添加以下配置：

**项目级**（`.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

**全局**（`~/.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

如果设置文件已存在，将钩子合并到已有的 `hooks.PreToolUse` 数组中——不要覆盖其他设置。

### 4. 询问自定义配置

询问用户是否想从拦截列表中增删命令。如有需要，编辑复制后的脚本。

### 5. 验证

如果验证过程中需要访问 GitHub，先运行 `gh auth status` 确认 GitHub CLI 已登录；未登录时提示用户运行 `gh auth login`。国内网络环境下如认证页面无法打开，提醒用户按团队网络或代理规范处理，不要替用户修改全局网络配置。

快速测试：

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <脚本路径>
```

应该以退出码 2 结束，并向 stderr 输出 BLOCKED 消息。
