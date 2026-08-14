# Agent 配置与项目级技能

本目录保存通用 Agent marketplace 配置和本仓库维护流程专用的项目级 skill。它是插件工具链要求的根目录例外，不属于正式插件交付内容或业务源码。

## 直接内容

- [plugins/](./plugins/)：marketplace 清单。
- [skills/](./skills/)：只服务于本仓库维护和测试调度的项目级 skill，不会被正式插件的 `skills/` 源稿目录收录。

## 项目级 skill

- [Herdr Pi 治理回归](./skills/herdr-pi-governance-test/SKILL.md)：发布并同步治理规则，在用户提供的两个测试目录中启动双路 Pi 回归测试。
