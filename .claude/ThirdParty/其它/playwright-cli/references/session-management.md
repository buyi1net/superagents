# 浏览器会话管理

并行运行多个隔离的浏览器会话并持久化状态。

## 命名浏览器会话

使用 `-s` 标志隔离浏览器上下文：

```bash
# 浏览器 1：认证流程
playwright-cli -s=auth open --headed https://app.example.com/login

# 浏览器 2：公开浏览（独立的 cookies、storage）
playwright-cli -s=public open --headed https://example.com

# 命令按浏览器会话隔离
playwright-cli -s=auth fill e1 "user@example.com"
playwright-cli -s=public snapshot
```

## 浏览器会话隔离属性

每个浏览器会话各自独立拥有：
- Cookies
- LocalStorage / SessionStorage
- IndexedDB
- Cache
- 浏览历史
- 打开的标签页

## 浏览器会话命令

```bash
# 列出所有浏览器会话
playwright-cli list

# 停止浏览器会话（关闭浏览器）
playwright-cli close                # 停止默认浏览器
playwright-cli -s=mysession close   # 停止指定名称的浏览器

# 停止所有浏览器会话（需确认后再执行）
playwright-cli close-all

# 强制终止所有守护进程（用于僵尸进程，需确认后再执行）
playwright-cli kill-all

# 删除浏览器会话用户数据（配置文件目录，需确认后再执行）
playwright-cli delete-data                # 删除默认浏览器数据
playwright-cli -s=mysession delete-data   # 删除指定浏览器的数据
```

## 环境变量

通过环境变量设置默认浏览器会话名称：

```bash
export PLAYWRIGHT_CLI_SESSION="mysession"
playwright-cli open --headed example.com  # 自动使用 "mysession"
```

## 常见模式

### 并发抓取

```bash
#!/bin/bash
# 并发抓取多个站点

# 启动所有浏览器
playwright-cli -s=site1 open --headed https://site1.com &
playwright-cli -s=site2 open --headed https://site2.com &
playwright-cli -s=site3 open --headed https://site3.com &
wait

# 从每个浏览器获取快照
playwright-cli -s=site1 snapshot
playwright-cli -s=site2 snapshot
playwright-cli -s=site3 snapshot

# 清理
playwright-cli close-all
```

### A/B 测试会话

```bash
# 测试不同的用户体验
playwright-cli -s=variant-a open --headed "https://app.com?variant=a"
playwright-cli -s=variant-b open --headed "https://app.com?variant=b"

# 对比
playwright-cli -s=variant-a screenshot
playwright-cli -s=variant-b screenshot
```

### 持久化配置文件

默认情况下，浏览器配置文件仅保存在内存中。使用 `open` 的 `--persistent` 标志将浏览器配置文件持久化到磁盘：

```bash
# 使用持久化配置文件（自动生成位置）
playwright-cli open --headed https://example.com --persistent

# 使用持久化配置文件并指定自定义目录
playwright-cli open --headed https://example.com --profile=/path/to/profile
```

## 附加到正在运行的浏览器

使用 `attach` 连接到已在运行的浏览器，而非启动新的浏览器。

### 按通道名附加

通过通道名连接到正在运行的 Chrome 或 Edge 实例。浏览器必须已启用远程调试——在目标浏览器中导航到 `chrome://inspect/#remote-debugging` 并勾选 "Allow remote debugging for this browser instance"。

```bash
# 附加到 Chrome
playwright-cli attach --cdp=chrome

# 附加到 Chrome Canary
playwright-cli attach --cdp=chrome-canary

# 附加到 Microsoft Edge
playwright-cli attach --cdp=msedge

# 附加到 Edge Dev
playwright-cli attach --cdp=msedge-dev
```

支持的通道：`chrome`、`chrome-beta`、`chrome-dev`、`chrome-canary`、`msedge`、`msedge-beta`、`msedge-dev`、`msedge-canary`。

### 通过 CDP 端点附加

连接到暴露了 Chrome DevTools Protocol 端点的浏览器：

```bash
playwright-cli attach --cdp=http://localhost:9222
```

### 通过浏览器扩展附加

连接到已安装 Playwright 扩展的浏览器：

```bash
playwright-cli attach --extension
```

## 默认浏览器会话

省略 `-s` 时，命令使用默认浏览器会话：

```bash
# 以下使用同一个默认浏览器会话
playwright-cli open --headed https://example.com
playwright-cli snapshot
playwright-cli close  # 停止默认浏览器
```

## 浏览器会话配置

在打开时为浏览器会话配置特定设置：

```bash
# 使用配置文件打开
playwright-cli open --headed https://example.com --config=.playwright/my-cli.json

# 使用指定浏览器打开
playwright-cli open --headed https://example.com --browser=firefox

# 以有头模式打开
playwright-cli open --headed https://example.com

# 使用持久化配置文件打开
playwright-cli open --headed https://example.com --persistent
```

## 最佳实践

### 1. 语义化命名浏览器会话

```bash
# 好：用途明确
playwright-cli -s=github-auth open --headed https://github.com
playwright-cli -s=docs-scrape open --headed https://docs.example.com

# 避免：通用名称
playwright-cli -s=s1 open --headed https://github.com
```

### 2. 始终清理

```bash
# 完成后停止浏览器
playwright-cli -s=auth close
playwright-cli -s=scrape close

# 或一次性停止所有
playwright-cli close-all

# 如果浏览器无响应或有残留的僵尸进程（需确认后再执行）
playwright-cli kill-all
```

### 3. 删除过期的浏览器数据

```bash
# 删除旧浏览器数据以释放磁盘空间（需确认后再执行）
playwright-cli -s=oldsession delete-data
```
