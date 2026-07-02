# 链路追踪

捕获详细的执行 trace 用于调试和分析。Trace 包含 DOM 快照、截图、网络活动和控制台日志。

## 基本用法

```bash
# 开始 trace 录制
playwright-cli tracing-start

# 执行操作
playwright-cli open --headed https://example.com
playwright-cli click e1
playwright-cli fill e2 "test"

# 停止 trace 录制
playwright-cli tracing-stop
```

## Trace 输出文件

启动追踪时，Playwright 会创建一个 `traces/` 目录，包含多个文件：

### `trace-{timestamp}.trace`

**操作日志** - 主 trace 文件包含：
- 执行的每个操作（点击、填充、导航）
- 每个操作前后的 DOM 快照
- 每个步骤的截图
- 时间信息
- 控制台消息
- 源代码位置

### `trace-{timestamp}.network`

**网络日志** - 完整的网络活动：
- 所有 HTTP 请求和响应
- 请求头和请求体
- 响应头和响应体
- 时序（DNS、连接、TLS、TTFB、下载）
- 资源大小
- 失败的请求和错误

### `resources/`

**资源目录** - 缓存的资源：
- 图片、字体、样式表、脚本
- 用于回放的响应体
- 重建页面状态所需的资源

## Trace 捕获内容

| 类别 | 详情 |
|----------|---------|
| **操作** | 点击、填充、悬停、键盘输入、导航 |
| **DOM** | 每个操作前后的完整 DOM 快照 |
| **截图** | 每个步骤的视觉状态 |
| **网络** | 所有请求、响应、请求头、响应体、时序 |
| **控制台** | 所有 console.log、warn、error 消息 |
| **时序** | 每个操作的精确时间 |

## 使用场景

### 调试失败的操作

```bash
playwright-cli tracing-start
playwright-cli open --headed https://app.example.com

# 这次点击失败了——为什么？
playwright-cli click e5

playwright-cli tracing-stop
# 打开 trace 查看点击尝试时的 DOM 状态
```

### 分析性能

```bash
playwright-cli tracing-start
playwright-cli open --headed https://slow-site.com
playwright-cli tracing-stop

# 查看网络瀑布以识别慢速资源
```

### 捕获证据

```bash
# 录制完整用户流程用于文档
playwright-cli tracing-start

playwright-cli open --headed https://app.example.com/checkout
playwright-cli fill e1 "4111111111111111"
playwright-cli fill e2 "12/25"
playwright-cli fill e3 "123"
playwright-cli click e4

playwright-cli tracing-stop
# Trace 显示精确的事件序列
```

## Trace vs 视频 vs 截图

| 特性 | Trace | 视频 | 截图 |
|---------|-------|-------|------------|
| **格式** | .trace 文件 | .webm 视频 | .png/.jpeg 图片 |
| **DOM 检查** | 是 | 否 | 否 |
| **网络详情** | 是 | 否 | 否 |
| **逐步回放** | 是 | 连续 | 单帧 |
| **文件大小** | 中 | 大 | 小 |
| **最适合** | 调试 | 演示 | 快速捕获 |

## 最佳实践

### 1. 在问题发生前开始追踪

```bash
# 追踪整个流程，而不仅仅是失败的步骤
playwright-cli tracing-start
playwright-cli open --headed https://example.com
# ... 导致问题的所有步骤 ...
playwright-cli tracing-stop
```

### 2. 清理旧 Trace

Trace 可能占用大量磁盘空间。建议先预览再删除：

```bash
# 先查看 7 天前的 trace 文件
find .playwright-cli/traces -mtime +7 -print

# 确认无误后手动删除（需确认后再执行）
find .playwright-cli/traces -mtime +7 -delete
```

> ⚠️ `-delete` 会直接删除文件，执行前务必先用 `-print` 预览确认。

## 限制

- Trace 会增加自动化的开销
- 大型 Trace 可能占用大量磁盘空间
- 某些动态内容可能无法完美回放
