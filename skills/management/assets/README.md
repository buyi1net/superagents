# assets 说明

本目录是 management skill 的可执行资产。`gov.mjs` 零依赖（Node >= 16），跨平台；`init` / `adopt` 会把它复制进目标项目根，此后项目自治，不依赖本 skill 装载。

## 运行

```
node .gov/gov.mjs init [项目名]        # 新项目初始化
node .gov/gov.mjs adopt                # 既有项目接入，生成 manifest 草稿
node .gov/gov.mjs add-reference <url> [--category 分类] [--name 名称] [--snapshot 快照] [--note 用途]
node .gov/gov.mjs sync                 # 从 manifest 重新生成索引段与参考说明
node .gov/gov.mjs check                # 一致性校验，红灯即欠账
```

init / adopt 把 gov.mjs 种进项目 `.gov/` 隐藏目录（同 `.git/` 惯例），manifest.json 也在 `.gov/` 下；根目录只留 AGENTS.md / CLAUDE.md / README.md 三个入口。旧布局（根目录 manifest.json / gov.mjs）会被 check 拦下并给出迁移指引。

自检：`node --test gov.test.mjs`（在 assets 目录运行，夹具自动建删）。

升级：项目内 gov.mjs 版本落后时，从本目录重新拷贝覆盖即可；manifest 有版本号护栏，跨版本不误读。

## manifest.json 字段参考

| 位置 | 字段 | 说明 |
|---|---|---|
| project | name / summary / allowedRootFiles | 项目名（必填）、一句话用途、根目录合法散文件白名单（业务确需放根目录的文件在这里显式登记） |
| directories[] | path / role / readme / note | 目录、角色（见 principles 角色词典）、索引入口（可选）、职责备注 |
| reference.categories[] | name / dir | 分类名与目录位置 |
| reference.items[] | name / category / source / snapshot / ref / license / lifecycle / captured / note / clone | 参考项元数据；clone=false 表示仅链接；字段为空或 TODO 会被 check 拦截 |
| docs.items[] | file / title / note | 文档索引条目；docs 目录下的 .md 必须全部登记 |
| builds[] | name / dir / zip / checksums | 交付物登记；校验文件须覆盖全部 zip |

## 生成段约定

README 的 `<!-- gov:<key>:start -->` 与 `<!-- gov:<key>:end -->` 之间由 sync 生成（当前 key：dirs、reference-index、docs-index）；参考说明.md 整文件生成。手工改动生成内容会被 check 判为漂移：正确做法是改 manifest 后 sync。

## 闸门接线（会话边界必跑 check）

git pre-commit（项目根）：

```bash
node gov.mjs check || exit 1
```

Claude Code（`.claude/settings.json` 节选，SessionStart 时把欠账摆到会话开头）：

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node gov.mjs check || echo '治理欠账见上，先消化再开工'" } ] }
    ]
  }
}
```

其它宿主（Pi、Codex 等）按各自 hook / 启动配置执行同一命令即可；没有 hook 能力时，把「开工先跑 check」写进项目 AGENTS.md 第一行。

## 设计要点（维护者读）

- check 的输出行 = 欠账工单：一行一个问题 + `→ 修复:` 指引，agent 可直接照单执行；
- 三类「人类看着乱」的盲区有专项检查（iBrowser 首战教训）：根目录散落文件（白名单外一律 fail）、docs 内容类型（只允许文档与插图，数据/备份/代码 fail）、git untracked 非忽略内容（warn，提交节奏留给人但债务必须可见）；
- docs 一律扫磁盘而非 git 索引：未登记的散落文件即使未被版本控制跟踪也要暴露（这正是旧体系漏掉的盲区）；
- 根目录治理文件藏进 `.gov/`（iBrowser 二战教训：gov.mjs/manifest.json 出现在根目录是人类视野污染）；备份/快照归 data 角色而非 temp 或 docs；
- 生成文件一律 UTF-8 + LF，避免 Windows CRLF 漂移；
- 涉及 git 的检查（.gitignore 排除、temp 入库提醒）在无 git 环境自动降级跳过。
