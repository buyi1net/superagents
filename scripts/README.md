# 维护脚本

本目录保存与插件包生命周期相关的可重复脚本。脚本可能修改项目根目录之外的 Agent 配置、插件缓存或 marketplace 配置；执行前必须确认目标和影响范围。

## 直接内容

- [install.mjs](./install.mjs)：安装、更新或卸载 Claude Code、Codex 和 OpenCode 集成。
- [sync.mjs](./sync.mjs)：把本地正稿同步到支持本地预览的插件缓存。
- [clean-opencode.mjs](./clean-opencode.mjs)：清理 OpenCode 插件缓存中的非必要内容。
