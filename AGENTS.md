# 项目入口

## 项目边界

本仓库是跨 Agent 的规则与 skill 插件。项目说明、安装方式和当前实际目录地图见 [README.md](./README.md)。

## Agent 路由

1. 处理本仓库的任何文件前，先读通用文件治理 [files/general.md](./skills/constitution/files/general.md)。
2. 创建、修改、构建、测试或交付代码时，继续读开发场景治理 [files/development.md](./skills/constitution/files/development.md)。
3. 修改代码前读 [development/coding.md](./skills/constitution/development/coding.md)。
4. 修改 README、文档、注释或提交说明前读 [modules/zh-cn-writing.md](./skills/constitution/modules/zh-cn-writing.md)。
5. 研究插件注入、安装和同步流程时，读 [插件化机制说明](./docs/插件化机制-流程与踩坑.md)。

## 变更边界

- 根目录下的插件清单、`package.json`、`hooks/`、`skills/`、`.opencode/` 和 `.pi/` 属于工具链接口；移动或重命名前必须同时检查清单、脚本和 README 中的路径。
- `skills/` 是正式 skill 源稿，`skills/constitution/` 是全局规则唯一来源；不要在各 Agent 的独立目录复制另一份正稿。
- `.agents/skills/` 只保存本仓库维护和治理测试所需的项目级 skill，不属于正式插件发布源；修改它时仍须更新 `.agents/README.md` 的地图。
- 安装、同步和缓存清理会改写项目根目录之外的 Agent 配置或缓存；只有用户明确要求时执行，并先阅读 [README.md](./README.md) 中对应的影响说明。

## 维护入口

- 人类使用和安装： [README.md](./README.md)
- 通用治理： [files/general.md](./skills/constitution/files/general.md)
- 开发治理： [files/development.md](./skills/constitution/files/development.md)
- 插件流程资料： [docs/插件化机制-流程与踩坑.md](./docs/插件化机制-流程与踩坑.md)
