# 项目入口

## 项目概览

`superagents` 是面向多个 Agent 的规则与 skill 插件仓库，负责维护正式规则源稿、各 Agent 的注入入口以及安装同步工具。项目用途、安装方式和完整目录说明见 [README.md](./README.md)。

项目管理制度正在从开发文件治理拆分为按实际工作场景组织的通用制度；`management/general.md` 和 `management/development.md` 仍是过渡文件，新场景规范只在真实工作暴露出独立治理问题后建立。

## 项目地图

| 内容 | 用途 | 说明入口 | 内容入口 |
|---|---|---|---|
| 正式 skill 源稿 | 保存对外发布的规则与 skill | [项目说明](./README.md#这是什么) | [skills/](./skills/) |
| 项目文档 | 保存插件机制和项目管理复盘等长期说明 | [文档索引](./docs/README.md) | [docs/](./docs/) |
| 参考资料 | 保存外部项目、历史分析和专题资料 | [参考索引](./reference/README.md) | [reference/](./reference/) |
| 项目级 Agent 工具 | 保存本仓库维护和治理测试专用能力 | [Herdr 测试说明](./docs/治理测试/Herdr操作说明.md) | [.agents/skills/](./.agents/skills/) |
| 插件与维护工具链 | 保存各 Agent 的清单、注入入口及安装同步脚本 | [工具链说明](./README.md#四家的注入方式) | [package.json](./package.json) · [hooks/](./hooks/) · [scripts/](./scripts/) |

## 项目维护规则

### 任务路由

| 当前任务 | 继续读取 |
|---|---|
| 处理本仓库中的文件 | [通用文件治理](./skills/constitution/management/general.md) |
| 创建或维护 `AGENTS.md`、`CLAUDE.md` | [Agent 入口治理](./skills/constitution/management/agent-entry.md) |
| 收录、分类、拉取、更新、废弃或整理参考资料 | [参考材料治理](./skills/constitution/management/reference.md)、[参考目录入口](./reference/AGENTS.md) |
| 创建、修改、构建、测试或交付代码 | [开发场景治理](./skills/constitution/management/development.md)、[编码规范](./skills/constitution/development/coding.md) |
| 修改 README、文档、注释或提交说明 | [中文写作规范](./skills/constitution/modules/zh-cn-writing.md) |
| 研究插件注入、安装或同步流程 | [插件化机制说明](./docs/插件机制/插件化机制-流程与踩坑.md) |
| 设计、修改、复核或准备发送治理测试题 | [治理测试出题原则](./docs/治理测试/出题原则.md) |
| 使用 Herdr 启动、派发、等待或审计治理测试 | [Herdr 治理测试操作说明](./docs/治理测试/Herdr操作说明.md) |

### 长期边界

- `skills/` 是正式 skill 源稿，`skills/constitution/` 是全局规则唯一来源；不得在各 Agent 的独立目录复制另一份正稿。
- 项目管理制度按实际场景拆分，上层入口只负责路由，不复制场景细节；不得继续向过渡文件集中堆放新场景规则，也不得预建没有实际问题支撑的空规范。
- 根目录插件清单、`package.json`、`hooks/`、`skills/`、`.opencode/` 和 `.pi/` 属于工具链接口；移动或重命名前必须同步检查清单、脚本和 README 中的路径。
- `.agents/skills/` 只保存本仓库维护和治理测试所需的项目级 skill，不属于正式插件发布源。
- `hooks/`、`scripts/` 和各 Agent 的清单、插件、扩展目录规模小且职责固定，由根 [README.md](./README.md) 统一说明；不得机械补建重复 README。
- 安装、同步和缓存清理会改写项目根目录之外的 Agent 配置或缓存；只有用户明确要求时才能执行。
