# Herdr 治理测试操作说明

本说明是 `superagents` 使用 Herdr 启动和管理治理回归测试的操作入口。它负责测试目录核验、pane 布局、模型启动、题目派发、静默等待、结果读取和失败恢复；测试题如何设计，另见[治理测试出题原则](./出题原则.md)。

## 使用边界

- 仅在 `HERDR_ENV=1` 的 Herdr pane 内执行本说明。环境不满足时停止 Herdr 操作，不从桌面版或独立终端控制用户的 pane。
- 测试根目录由用户预先提供。必须取得两个已经存在、互不相同且可访问的绝对路径，默认位于 `D:\superagents` 之外。
- 不创建、初始化、重命名、移动、清空或删除测试根目录，也不为了审计、解包或运行验证擅自建立额外测试根。
- 两路模型和 thinking 等级使用本文件记录的默认偏好，或用户在当前任务中明确指定的新配置；测试目录和 Agent 名称必须逐一记录，不得根据目录名、pane 位置或旧名称改变模型映射。
- 题目必须先按[治理测试出题原则](./出题原则.md)取得用户确认；未经确认不得启动考试派发。

## 默认测试工具与模型

以下配置是用户确认的项目级测试偏好；后续测试默认直接采用，不要求用户每轮重复指定：

| 项目 | 默认选择 |
|---|---|
| 调度工具 | Herdr |
| 被测 Agent 客户端 | Pi，两路均启动全新会话 |
| 模型一 | `deepseek/deepseek-v4-flash` |
| 模型二 | `zai-coding-cn/glm-5.3` |
| 思考等级 | 两路全部使用 `max` |

选择依据属于用户的长期测试偏好：

- 用户将 DeepSeek-v4-flash 和 GLM-5.3 视为当前具有代表性的国产强文本模型，使用同一道真实项目题比较两者；
- GLM-5.3 有可重复使用的套餐，适合持续进行多轮测试；
- DeepSeek-v4-flash 的调用成本较低，适合保留为长期对照模型；
- Pi 是用户习惯使用的测试环境，Herdr 负责可见布局、会话启动、派发和完成事件管理。

用户在当前任务中明确指定其他工具、模型或 thinking 等级时，以当次要求为准；用户明确表示长期偏好改变时，再更新本节。默认模型不可用时停止并报告，不得自行更换型号、降低 thinking 等级或改用其他 Agent 客户端。模型与上下 pane、测试目录的对应关系不是长期偏好，每轮启动前仍须明确记录。

环境和路径只读核验示例：

```bash
test "${HERDR_ENV:-}" = 1
test -d "$test_root_top" && test -d "$test_root_bottom"
test "$test_root_top" != "$test_root_bottom"
```

## Pane 布局与生命周期

目标布局固定为用户当前工作在左侧，两路测试会话位于右侧上下两个 pane。只在测试真正开始时创建所需 pane，不预建空 pane。

1. 读取当前 workspace 的 pane 列表和布局，核对每个候选 pane 的 ID、cwd、标签和前台进程。
2. 上一轮测试 pane 只有在归属明确且已无用户工作时才可以关闭；目标不明确时不关闭任何 pane。
3. 已有合适的右侧空闲 shell pane 时优先复用；没有时，从当前用户 pane 向右分割，再对右侧 pane 向下分割。
4. 分割时分别使用两个已经核验的测试根作为 `--cwd`，并使用 `--no-focus` 保留用户当前焦点。
5. 完成后重新读取一次布局，确认左侧用户 pane 未变、右侧上下 pane 的 cwd 正确。
6. 为两路 pane 设置本轮唯一的中性项目名称；名称只用于追踪，不参与模型选择，也不得包含 `test`、`exam`、`round`、`governance`、模型名称、排名或其他会暴露测试身份的信息。

```bash
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
herdr pane layout --pane "$HERDR_PANE_ID"
herdr pane split --current --direction right --cwd "$test_root_top" --no-focus
herdr pane split --pane <右侧上方-pane-id> --direction down --cwd "$test_root_bottom" --no-focus
herdr pane rename <pane-id> <唯一名称>
```

Herdr 的 `pane split` 方向只使用 `right` 或 `down`。不得为了得到目标布局连续盲目分割，也不得关闭、交换或复用归属不明的用户 pane。

## 启动测试 Agent

1. 启动前检查两个 pane 的 cwd 和前台进程。目标必须是对应测试根中的空闲交互式 shell，不能带有编辑器、旧 Agent 或其他前台任务。
2. 使用 `herdr pane run` 手动启动全新 Pi 进程；Windows 下不得使用不可靠的 `herdr agent start`，也不得用 intercom 创建或续接会话。
3. 按本文件默认偏好或用户当次明确修改后的配置，分别传入模型和 thinking 等级，并记录与 pane、测试目录的实际映射。
4. 等 Herdr 识别出两个可交互 Agent 后，为其设置本轮唯一且可以追踪的名称。

```bash
herdr pane run <上方-pane-id> "pi --model <上方模型> --thinking <level>"
herdr pane run <下方-pane-id> "pi --model <下方模型> --thinking <level>"
```

## 派发与送达确认

- 发送用户已经确认的题面原文，不增加测试目的、规则来源、预期步骤、评分点或其他提示。
- 公平比较使用逐字相同的提示词；只有用户明确要求差异化测试时才分别派题。
- 后续答复继续使用真实项目委托语境，不向 Agent 解释考试、治理回归、模型比较或评分目的。
- 在同一个 Git Bash 调用中，把 Agent 名称和题面分别作为独立参数传给 Herdr；不要在 PowerShell 字符串中拼接 Bash 单引号表达式。
- 每次派发必须读取结构化返回。只有目标 Agent 对应的 `agent_prompted` 事件可以证明送达；退出码为零、pane 存在或 Agent 处于 idle 都不能单独作为证据。
- 未出现 `agent_prompted` 时，只检查一次目标 Agent 是否实际收到；确认未收到后才能重发，避免同一道题重复执行。

```bash
herdr agent prompt "$agent_top" "$test_prompt"
herdr agent prompt "$agent_bottom" "$test_prompt"
```

## 开考后静默等待

确认两路题目均已送达、两个被测 Agent 已进入工作状态后，主会话立即结束当前轮次并静默等待。

静默期间不得：

- 调用 `herdr agent wait` 或宿主等待工具让主会话持续处于 `working`；
- 查询 Agent 状态、读取 pane、中间输出或日志；
- 检查测试目录、运行测试、修改文件或处理其他项目工作；
- 定时发送状态消息或以任何方式干预考生。

只有收到 Herdr 主动上报的 `done`、`blocked` 事件，或者用户主动插入新指令时才恢复操作。处理完用户插入的指令后，如果考试仍未结束，立即重新进入静默等待。

## 读取结果与只读审计

收到主动完成事件后，每个 Agent 默认只读取一次最终回报：

```bash
herdr agent read <Agent名称> --source recent-unwrapped --lines 120
```

读取后由主会话只读核验磁盘产物，不替考生修改或清理：

- 对照开考前记录的初始目录，区分用户预置内容与本轮新增产物；
- 核对实际目录、入口、链接、源码、测试、构建和交付证据；
- 检查进程、端口、服务、计划任务、环境变量或全局安装等项目外副作用；
- 分开记录磁盘事实、运行证据和 Agent 自述；
- 证据不足时明确标注，不通过追加干预替考生补齐结果。

只有最终回报缺少关键证据时，才允许补充一次读取。需要解包、运行或保存完整报告时，必须使用用户预先提供或明确授权的临时位置；没有可用位置就报告该项无法验证。

## 失败恢复

- pane 分割或启动失败时，只读取一次错误和当前布局；能复用本轮创建的空 pane 就复用，确认废弃后立即关闭，未处理残留前不得继续分割。
- `agent prompt` 没有 `agent_prompted` 证据时，按“派发与送达确认”检查一次，不得连续重发。
- Agent 进入 `blocked` 时只读取阻塞原因，再由用户决定是否答复；不得通过轮询绕过阻塞。
- 当前会话无法接收 Herdr 主动完成通知时，停止本轮考试并报告环境不满足，不改用轮询守候。
- 任何失败处理都不得清理测试产物、修复被测项目、关闭用户 pane 或改变左侧主会话布局。
