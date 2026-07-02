---
name: opencode
description: 将编码任务明确委托给 OpenCode CLI 代理，用于功能实现、代码重构、PR 审查或长时间自动会话；需提前安装并认证 OpenCode CLI。只有用户说"用 OpenCode 做""交给 opencode""开个 OpenCode 会话""让 OC 跑一下"或明确要求外部 CLI agent 时使用；勿触发于普通实现、调试或代码审查请求。
version: 1.2.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [编码代理, OpenCode, 自动化, 代码重构, 代码审查]
    related_skills: [claude-code, codex, hermes-agent]
---

# OpenCode CLI

使用 [OpenCode](https://opencode.ai) 作为自动编码助手，由 Hermes 终端/进程工具编排调用。OpenCode 是一个不依赖特定服务商的开源 AI 编码代理，提供终端界面（TUI）和命令行界面（CLI）。

## 适用场景

* 用户明确要求使用 OpenCode
* 需要外部编码代理实现、重构或审查代码
* 需要长时间后台运行并跟踪进度的编码任务
* 需要在独立工作目录/工作树中并行执行任务

## 前置条件

* 已安装 OpenCode：`npm i -g opencode-ai@latest` 或 `brew install anomalyco/tap/opencode`
* 已配置认证：`opencode auth login` 或设置服务商环境变量（OPENROUTER_API_KEY 等）
* 验证配置：`opencode auth list` 应显示至少一个可用服务商
* 编码任务推荐在 Git 仓库中执行
* 交互式 TUI 会话需要设置 `pty=true`

> **国内网络提示**：OpenCode 依赖 npm 全局安装和服务商 API 访问。若安装或认证失败，请按团队规范配置 npm registry、认证令牌或代理，不要未确认即修改全局配置。首次使用建议先执行 `opencode auth list` 确认服务商连通性。

## 二进制路径解析（重要）

不同 Shell 环境可能定位到不同的 OpenCode 二进制文件。如果在终端中和在 Hermes 中行为不一致，请检查：

```
terminal(command="which -a opencode")
terminal(command="opencode --version")
```

如果需要，可以指定明确的二进制路径：

```
terminal(command="$HOME/.opencode/bin/opencode run '...'", workdir="~/project", pty=true)
```

> **Windows 注意**：Windows 上 npm 全局包路径依赖 Node.js 安装方式，常见路径为 `%AppData%\npm\opencode.cmd`。若 `opencode` 命令不可用，可通过 `where.exe opencode` 排查。

## 一次性任务

使用 `opencode run` 执行边界清晰的非交互式任务：

```
terminal(command="opencode run '给 API 调用添加重试逻辑并更新测试'", workdir="~/project")
```

使用 `-f` 附带上下文文件：

```
terminal(command="opencode run '审查此配置的安全问题' -f config.yaml -f .env.example", workdir="~/project")
```

使用 `--thinking` 显示模型的思考过程：

```
terminal(command="opencode run '调试 CI 中测试失败的原因' --thinking", workdir="~/project")
```

强制使用指定模型：

```
terminal(command="opencode run '重构认证模块' --model openrouter/anthropic/claude-sonnet-4", workdir="~/project")
```

## 交互式会话（后台运行）

对于需要多轮交互的迭代工作，可以后台启动 TUI 界面：

```
terminal(command="opencode", workdir="~/project", background=true, pty=true)
# 返回会话 ID

# 发送任务指令
process(action="submit", session_id="<id>", data="实现 OAuth 刷新流程并添加测试")

# 监控进度
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# 发送后续指令
process(action="submit", session_id="<id>", data="现在添加令牌过期的错误处理")

# 优雅退出 — Ctrl+C
process(action="write", session_id="<id>", data="\x03")
# 或直接杀死进程
process(action="kill", session_id="<id>")
```

**重要：** 不要使用 `/exit` 命令 — 这不是有效的 OpenCode 命令，会打开代理选择对话框。使用 Ctrl+C（`\x03`）或 `process(action="kill")` 退出。

### TUI 快捷键

| 按键 | 功能 |
|-----|--------|
| `Enter` | 提交消息（如需按两次） |
| `Tab` | 切换代理（构建/规划） |
| `Ctrl+P` | 打开命令面板 |
| `Ctrl+X L` | 切换会话 |
| `Ctrl+X M` | 切换模型 |
| `Ctrl+X N` | 新建会话 |
| `Ctrl+X E` | 打开编辑器 |
| `Ctrl+C` | 退出 OpenCode |

### 恢复会话

退出后，OpenCode 会打印会话 ID。使用以下命令恢复：

```
terminal(command="opencode -c", workdir="~/project", background=true, pty=true)  # 继续上次会话
terminal(command="opencode -s ses_abc123", workdir="~/project", background=true, pty=true)  # 恢复指定会话
```

## 常用参数

| 参数 | 用途 |
|------|-----|
| `run '提示词'` | 一次性执行任务后退出 |
| `--continue` / `-c` | 继续上一次 OpenCode 会话 |
| `--session <id>` / `-s` | 继续指定会话 |
| `--agent <name>` | 选择 OpenCode 代理（build 或 plan） |
| `--model 服务商/模型` | 强制使用指定模型 |
| `--format json` | 机器可读输出/事件格式 |
| `--file <路径>` / `-f` | 附带文件到消息中 |
| `--thinking` | 显示模型思考过程 |
| `--variant <级别>` | 推理强度（high、max、minimal） |
| `--title <名称>` | 为会话命名 |
| `--attach <url>` | 连接到正在运行的 OpenCode 服务器 |

## 使用流程

1. 验证工具就绪：
   * `terminal(command="opencode --version")`
   * `terminal(command="opencode auth list")`
2. 边界明确的任务使用 `opencode run '...'`（不需要 pty）
3. 迭代任务使用 `background=true, pty=true` 启动 `opencode`
4. 使用 `process(action="poll"|"log")` 监控长时间任务
5. 如果 OpenCode 需要输入，通过 `process(action="submit", ...)` 响应
6. 使用 `process(action="write", data="\x03")` 或 `process(action="kill")` 退出
7. 向用户总结文件变更、测试结果和后续步骤

## PR 审查工作流

OpenCode 内置 PR 命令：

```
terminal(command="opencode pr 42", workdir="~/project", pty=true)
```

或在临时克隆中隔离审查：

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && opencode run '审查此PR与main分支的差异，报告bug、安全风险、测试缺口和风格问题。' -f $(git diff origin/main --name-only | head -20 | tr '\n' ' ')", pty=true)
```

> **Windows 注意**：上述命令使用 Unix 工具 `mktemp`、`head`、`tr`，在 Windows 上需使用 Git Bash 或 WSL 执行。纯 PowerShell 等效写法：
> ```
> $REVIEW = New-TemporaryFile | % { Remove-Item $_; New-Item -ItemType Directory -Path $_ }; git clone https://github.com/user/repo.git $REVIEW; cd $REVIEW; $files = (git diff origin/main --name-only | Select-Object -First 20) -join ' '; opencode run '审查此PR与main分支的差异，报告bug、安全风险、测试缺口和风格问题。' -f $files
> ```

## 并行工作模式

使用独立工作目录/工作树避免冲突：

```
terminal(command="opencode run '修复#101问题并提交'", workdir="/tmp/issue-101", background=true, pty=true)
terminal(command="opencode run '添加解析器回归测试并提交'", workdir="/tmp/issue-102", background=true, pty=true)
process(action="list")
```

> **Windows 注意**：`/tmp/` 路径在 Windows 上不存在，使用 `$env:TEMP` 下的子目录替代，例如 `workdir="$env:TEMP\issue-101"`。

## 会话与成本管理

列出历史会话：

```
terminal(command="opencode session list")
```

查看 token 使用量和成本：

```
terminal(command="opencode stats")
terminal(command="opencode stats --days 7 --models anthropic/claude-sonnet-4")
```

## 注意事项

* 交互式 `opencode`（TUI）会话需要 `pty=true`，`opencode run` 命令不需要 pty
* `/exit` 不是有效命令 — 会打开代理选择器，使用 Ctrl+C 退出 TUI
* PATH 环境变量不匹配可能导致选择错误的 OpenCode 二进制/模型配置
* 如果 OpenCode 看起来卡住了，杀死进程前先查看日志：`process(action="log", session_id="<id>")`
* 避免在并行 OpenCode 会话之间共享同一个工作目录
* TUI 中可能需要按两次 Enter 才能提交（第一次确认文本，第二次发送）

## 验证

冒烟测试（smoke test）：

```
terminal(command="opencode run '严格返回：OPENCODE_SMOKE_OK'")
```

成功标准：

* 输出包含 `OPENCODE_SMOKE_OK`
* 命令退出无服务商/模型错误
* 编码任务：预期文件已更改且测试通过

## 使用规则

1. 一次性任务优先使用 `opencode run` — 更简单，不需要 pty
2. 仅当需要迭代时使用交互式后台模式
3. 始终将 OpenCode 会话限定在单个仓库/工作目录中
4. 长时间任务从 `process` 日志中提取进度更新告知用户
5. 报告具体的任务结果（更改的文件、测试情况、剩余风险）
6. 使用 Ctrl+C 或 kill 退出交互式会话，不要使用 `/exit`
