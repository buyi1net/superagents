---
name: herdr-pi-governance-test
description: 发布 superagents 治理规则并核验 GitHub 与 Pi 本地缓存，然后使用用户预先提供的测试目录，在 Herdr 当前 workspace 左侧建立上下两个新 pane、按操作者明确指定的模型启动两路全新 Pi 会话并完成治理回归测试。用户要求上传规则、拉取验证、开 Pi 测试会话、比较多个模型或复测文件治理时使用；不用于普通 Pi 启动、普通 Git 发布或修改被测项目，也不负责创建测试目录。
---

# Herdr Pi 治理回归

## 目标和边界

把一次治理规则回归从本地变更推进到可审计的测试结果：规则源稿提交并推送后，确认远端和 Pi 缓存已到同一提交，再在当前 Herdr workspace 的左侧上下布局启动两个全新的 Pi 会话，派发未复用的开发题目，等待主动完成通知，最后只读核验真实产物。

本 skill 只固化流程，不替测试 Agent 修复代码，不删除测试产物，不把被测项目的 `AGENTS.md`、`README.md` 或其他入口当作当前会话的制度来源。测试 Agent 的自述必须和磁盘、版本库、构建输出及进程证据分开记录。

本文件位于 `.agents/skills/`，是本仓库维护专用的项目级 skill，不属于 `skills/` 正式发布源；发布阶段不得把它复制到 `skills/`，Pi 缓存核验也只针对本轮需要发布的正式治理规则文件。

## 测试目录边界

测试目录由用户提供，本 skill 只验证和使用，不负责创建：

- 启动前必须拿到两个由用户明确给出的、互不相同的绝对路径；两个路径必须已经存在且确实是目录。
- 缺少路径、路径不存在、路径相同或无法访问时，立即停止，不自行猜测旧路径，不从历史会话、记忆或题目推导路径。
- 默认要求测试根位于 `D:\superagents` 之外；不得把治理仓库本身或其子目录当作测试根，除非老大在本轮明确授权。
- 不创建、初始化、重命名、移动、清空或删除测试根目录。不得执行 `mkdir`、`git init`、脚手架初始化或等价操作来补齐外层测试目录。
- 测试 Agent 可以在用户提供的目录内部按题目创建源码和治理要求的子目录；这不等于本 skill 可以创建新的测试根目录。
- 用于运行、打包抽取或审计的临时副本目录也必须由用户提供，或由用户明确授权使用系统临时目录；默认不创建任何额外测试/审计根目录。
- 测试目录名、pane 标签和路径后缀只是操作者的辨认方式，不参与模型选择，也不是治理规则。模型必须由操作者在本轮明确指定并记录；未指定或无法确认时停止，不按目录名、pane 位置、旧名称或模型习惯猜测。

在分割 pane 前只做只读核验，例如：

```bash
test -d "$test_root_top" && test -d "$test_root_bottom"
test "$test_root_top" != "$test_root_bottom"
```

核验失败就报告缺少用户输入，不要继续创建 pane 或启动 Agent。

## 开始前

1. 确认当前目录是 `D:\superagents`（或该仓库的等价路径），读取：
   - `skills/constitution/files/general.md`
   - `skills/constitution/files/development.md`
   - `skills/constitution/SKILL.md`
   - 需要修改文档时再读取 `skills/constitution/modules/zh-cn-writing.md`。
2. 先检查 `git status --short --branch` 和 `git diff`。保留用户已有改动；提交时只纳入本轮明确的治理规则或 skill 文件。
3. 收集本轮输入：目标分支、两个明确的模型配置、thinking 等级、用户预先提供的两个独立项目根路径、两个唯一的 Agent 名称、最新治理规则来源，以及一份本轮从未用过的测试题。先按“测试目录边界”核验路径，再确认模型配置完整；模型不由目录后缀、pane 顺序或临时偏好推断。需要比较模型时，默认把同一份新题目派给两路；用户要求差异化测试时，分别准备两份新题目。
4. 若要控制 Herdr，先在 Git Bash 执行：

   ```bash
   test "${HERDR_ENV:-}" = 1 && echo IN_HERDR || echo NOT_IN_HERDR
   ```

   不是 `IN_HERDR` 就停止 Herdr 操作并报告环境不满足；不要从桌面版或独立终端猜测、控制用户的 pane。

## 一、发布规则

按用户指定的分支执行；以下以 `main` 为例。

1. 阅读 diff，确认根入口、地图链接、治理规则和 skill 的改动范围；先完成仓库已有的可运行校验。没有真实测试结果时，不要声称“测试通过”。
2. 只提交本轮目标文件：

   ```bash
   git status --short
   git add <本轮目标文件>
   git commit -m "<中文变更说明>"
   ```

   不要把无关的用户改动、测试项目、缓存、日志或生成物带入提交。
3. 推送并记录本地提交和远端分支：

   ```bash
   git push origin main
   local_sha="$(git rev-parse HEAD)"
   remote_sha="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
   test "$local_sha" = "$remote_sha"
   ```

   远端 SHA 不一致时，停止后续“已同步”结论，先保留错误证据并报告。

## 二、拉取并验证 Pi

1. 使用 Pi 的正式更新入口，不手工覆盖缓存：

   ```bash
   pi update --all
   pi list --approve
   ```

2. 从 `pi list --approve` 的实际输出找到 `git:github.com/buyi1net/superagents` 的缓存路径；不要根据 pane 顺序或旧路径臆测。核对缓存提交：

   ```bash
   pi_cache="<pi list 输出的实际缓存路径>"
   test "$(git -C "$pi_cache" rev-parse HEAD)" = "$local_sha"
   git -C "$pi_cache" log -1 --oneline
   ```

3. 至少抽取一条本轮变更的规则证据，在源仓库和缓存中比较同一文件内容，而不是只看目录存在：

   ```bash
   rule_file="skills/constitution/files/general.md"
   git -C "$pi_cache" show HEAD:"$rule_file" | sha256sum
   git show "$local_sha":"$rule_file" | sha256sum
   ```

   需要验证多个文件时重复比较；任何 SHA 或内容不一致都标记为同步失败，不启动依赖最新规则的测试。更新过程改写了仓库外缓存，报告实际路径和影响，不擅自清理其他缓存。

## 三、在 Herdr 左侧建立上下布局

### 目标布局

保留用户原有工作在右侧，左侧为本轮两个测试 pane：上方和下方各一个，均从干净的交互式 shell 启动 Pi。建立新一轮前，先按下一节关闭已确认属于上一轮的旧测试 pane；不得关闭用户 pane、当前工作 pane 或无关 pane。

### 清理上一轮测试 pane

“新开测试会话”包括上一轮测试 Agent 所在的 pane；新会话启动前必须先关闭已确认属于上一轮的老测试会话，再创建新的 pane 和 Pi 进程。

在分割新 pane 前，读取当前 workspace 的实际 pane 列表和布局，按旧测试目录、旧标签或本轮记录确认哪些 pane 属于上一轮测试：

```bash
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
herdr pane layout --pane "$HERDR_PANE_ID"
```

只关闭已确认的旧测试 pane，并记录关闭前的 pane ID、cwd、标签和 Agent；不要根据侧栏顺序猜测目标：

```bash
herdr pane close <上一轮测试 pane-id>
```

关闭后只做一次列表/布局复核，确认用户 pane 仍在且旧测试 pane 已释放。目标不明确、pane 仍有用户工作或无法判断归属时停止，不关闭任何 pane；不得为了腾出位置关闭用户 pane 或无关 Agent。

### 由单一当前 pane 创建左列

Herdr 的 `pane split` 当前只接受 `right`、`down`。因此从当前 pane 建左列时，用“先向右分割，再交换内容，再向下分割”的顺序：

1. 记录调用上下文和当前 pane 的真实 ID，并查看布局：

   ```bash
   printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
   herdr pane current --current
   herdr pane layout --pane "$HERDR_PANE_ID"
   ```

2. 在当前 pane 向右创建一个位于用户提供的上方测试根、不给焦点的新 shell，记下 JSON 返回的 pane ID；这里不能使用不存在的路径，也不能为了满足 `--cwd` 创建目录：

   ```bash
   herdr pane split --current --direction right --cwd "$test_root_top" --no-focus
   ```

3. 用实际返回的两个 pane ID 交换内容，使调用者的原 shell 回到右侧、左侧留下新 shell：

   ```bash
   herdr pane swap --source-pane <原当前 pane ID> --target-pane <新 pane ID>
   ```

4. 对左侧上方 shell（交换前的原当前 pane ID；仍须以 `herdr pane layout` 复核）向下分割到用户提供的下方测试根：

   ```bash
   herdr pane split --pane <左侧上方 pane ID> --direction down --cwd "$test_root_bottom" --no-focus
   ```

   读取返回 JSON，得到左侧下方 pane ID。最终再次读取布局，确认用户 pane 在右侧、两个新 shell 在左侧上下排列。若当前 workspace 已经有合适的左列，先读取布局并复用明确空闲的 shell pane，不要机械追加列。

5. 给两个 pane 设置本轮唯一且可追踪的名称，例如 `glm-round-<日期>` 和 `deepseek-round-<日期>`；名称必须符合 Herdr 的命名限制并且在当前 workspace 唯一：

   ```bash
   herdr pane rename <pane-id> <pane-name>
   ```

### 启动全新 Pi 会话

1. 启动前用 `herdr pane process-info` 或等价的只读信息确认两个 pane 的 cwd 分别等于用户提供的两个测试根；两个 pane 都必须是交互式 shell，没有前台命令、编辑器或旧 Agent。按操作者已明确指定的模型启动；模型配置必须和最终报告中的目录、pane、Agent 一一对应，不能从目录后缀推断或临时交换。每个 pane 都用 `pane run` 手动启动，不能用不可控的旧 session 续接：

   ```bash
   herdr pane run <上方 pane-id> "pi --model <操作者指定的上方模型> --thinking <level>"
   herdr pane run <下方 pane-id> "pi --model <操作者指定的下方模型> --thinking <level>"
   ```

   治理回归默认使用用户指定的 `max`；若用户另有明确等级，以用户要求为准。模型、thinking、cwd 和启动时间必须记入最终报告。
2. 等 Pi 被 Herdr 识别为可交互 Agent 后，用唯一名称派题。两路需要公平比较时发送同一份新题目；题目内容必须包含：从操作者给出的规则来源读取最新治理规则、从用户提供的项目根规划、实现完整任务、运行测试和构建、报告真实磁盘证据，并明确不要修复或清理测试结果。不要让 Agent 把测试目录里的入口文件当作本会话的制度来源。示例模板：

   ```text
   这是全新治理回归测试，禁止复用旧会话、旧题目或旧产物。你当前工作目录就是用户提供的测试根，不要另建外层项目目录。请从 `<最新治理规则来源>` 读取规则，再从项目根规划并实现以下任务：<本轮新题目>。完成后运行适合的测试和构建，检查目录、入口、链接、运行数据、交付物和项目外副作用；只报告真实证据，不让本会话替你修复或清理结果。
   ```

   使用：

   ```bash
   herdr agent prompt <上方 agent 名称> "<题目>"
   herdr agent prompt <下方 agent 名称> "<题目>"
   ```

## 四、等待和审计

在能接收 Herdr 主动通知的 Codex / ChatGPT 会话中，派题成功后立即结束当前轮次，等待 `done` 或 `blocked` 事件。禁止循环 `herdr pane read`、`herdr agent list/get/read`、`herdr agent wait` 或宿主等待工具来窥视进度。收到主动通知后，每个 Agent 默认只读取一次：

```bash
herdr agent read <agent 名称> --source recent-unwrapped --lines 120
```

只有最终回报缺少关键证据时，才补充一次读取或让 Agent 把完整回报写到用户预先提供、且不属于测试根的临时路径再直接读取；没有这类路径时就报告证据不足，不自行创建临时目录，也不要把临时回报写入测试项目根。

收到两路回报后，主会话只读检查实际结果，不替模型改动：

- 扫描项目根的实际一级、二级目录，核对 README、AGENTS、CLAUDE、地图链接和职责边界；不要用 Agent 自述替代扫描。
- 分开检查源码、测试、脚本、文档、设计材料、构建暂存、交付包和运行数据；确认交付包的类型、完整性、可重建性和是否夹带运行时缓存。
- 检查测试命令、构建命令和可运行副本的结果；构建暂存不能直接冒充运行根，打包后要在用户提供或明确授权的临时/抽取副本验证并重新扫描原包；没有这类副本路径时不自行创建，明确报告无法完成该项验证。
- 检查项目根外是否新增进程、端口、服务、计划任务、环境变量、全局安装或其他系统副作用；只记录证据，不擅自卸载、删除或修复。
- 记录两路相同点和差异点，区分“规则明确要求”“规则没有覆盖”“Agent 自行决策”和“证据不足”。

## 五、交付报告

报告至少包含：

1. 规则源仓库提交 SHA、GitHub 远端 SHA、Pi 缓存路径和缓存 SHA；
2. 两个 pane/Agent 的真实名称、ID、模型、thinking 等级、测试项目根和本轮新题目；
3. 每路 Agent 的 `done` / `blocked` 结果、测试和构建证据；
4. 实际目录治理、入口与地图、源码说明、运行数据、交付物和项目外副作用的发现；
5. 明确列出未确认项、同步失败或被 Agent 遗漏的证据。

不要把“远端推送成功”写成“项目质量通过”，不要把 Agent 的声称写成磁盘事实，也不要在未获授权时修复测试项目、删除测试产物或再次改规则。

## 异常处理

- Git 提交、推送或远端 SHA 校验失败：保留现场，停止同步后的步骤并报告，不强推、不重写历史。
- `pi update --all` 失败或缓存 SHA 不一致：报告缓存实际状态，不使用旧缓存冒充新规则。
- pane 分割、交换或启动失败：先读取一次命令错误和当前布局；只复用本轮明确创建的空 pane。建立新轮次时可以按“清理上一轮测试 pane”关闭已确认的旧测试 pane，但不得关闭用户既有 pane 或无关 Agent。
- Agent 进入 `blocked`：只读取阻塞原因，按用户授权决定是否发送一次明确答复；不通过轮询绕过阻塞。
- 当前会话无法接收主动通知：按照 Herdr skill 的兼容模式使用 `--wait` 或 `agent wait`，并在报告中说明等待机制不同。
