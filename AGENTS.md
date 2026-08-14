# 项目入口

## 项目边界

本仓库是跨 Agent 的规则与 skill 插件。项目说明、安装方式和当前实际目录地图见 [README.md](./README.md)。

## 项目管理制度目标

`skills/constitution/management/` 正在从开发场景下的文件治理规则，重构为面向各种项目的项目管理制度。它不以写代码为默认前提，也适用于办公、科研、设计、运营、教育、咨询和其他项目场景。

- 项目管理制度按实际工作场景拆分。每份场景规范独立说明适用范围、职责边界、内容归属、操作流程、生命周期和验收证据，上层规则只负责路由，不复制场景细节。
- `management/general.md` 与 `management/development.md` 是拆分期间的过渡文件，不是最终架构。不要继续把新场景规则集中写入这两个文件，也不要默认它们会永久保留；已有职责应随场景规范成熟逐步迁移。
- 新场景规范必须针对真实工作中已经出现的失控问题建立。先明确要解决的问题，再决定文件、名称和层级；不得为了制度看起来完整而预建空规范或机械拆分。
- `management/reference.md` 是首个独立场景规范，负责各种项目中的外部参考材料，不局限于代码、源码或开发依赖。其他场景规范也应按同样方向摆脱开发项目的默认语境。

## Agent 路由

1. 处理本仓库的任何文件前，先读通用文件治理 [management/general.md](./skills/constitution/management/general.md)。
2. 处理参考材料的收录、归类、记录、拉取、更新、删除或参考目录维护时，读 [management/reference.md](./skills/constitution/management/reference.md)。
3. 创建、修改、构建、测试或交付代码时，继续读过渡期开发场景治理 [management/development.md](./skills/constitution/management/development.md)。
4. 修改代码前读 [development/coding.md](./skills/constitution/development/coding.md)。
5. 修改 README、文档、注释或提交说明前读 [modules/zh-cn-writing.md](./skills/constitution/modules/zh-cn-writing.md)。
6. 研究插件注入、安装和同步流程时，读 [插件化机制说明](./docs/插件化机制-流程与踩坑.md)。

## 变更边界

- 根目录下的插件清单、`package.json`、`hooks/`、`skills/`、`.opencode/` 和 `.pi/` 属于工具链接口；移动或重命名前必须同时检查清单、脚本和 README 中的路径。
- `skills/` 是正式 skill 源稿，`skills/constitution/` 是全局规则唯一来源；不要在各 Agent 的独立目录复制另一份正稿。
- `.agents/skills/` 只保存本仓库维护和治理测试所需的项目级 skill，不属于正式插件发布源；修改它时仍须更新 `.agents/README.md` 的地图。
- 安装、同步和缓存清理会改写项目根目录之外的 Agent 配置或缓存；只有用户明确要求时执行，并先阅读 [README.md](./README.md) 中对应的影响说明。

## 维护入口

- 人类使用和安装： [README.md](./README.md)
- 通用治理： [management/general.md](./skills/constitution/management/general.md)
- 参考材料治理： [management/reference.md](./skills/constitution/management/reference.md)
- 开发治理（过渡）： [management/development.md](./skills/constitution/management/development.md)
- 插件流程资料： [docs/插件化机制-流程与踩坑.md](./docs/插件化机制-流程与踩坑.md)
