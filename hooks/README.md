# Hook 目录

本目录保存 Claude Code 的 SessionStart hook。Hook 负责读取规则入口并生成注入内容，不保存项目业务源码或运行数据。

## 直接内容

- [hooks.json](./hooks.json)：声明 hook。
- [run-hook.cmd](./run-hook.cmd)：跨平台启动入口。
- [session-start](./session-start)：读取规则并生成注入结果。
