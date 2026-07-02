# 视频录制

将浏览器自动化会话捕获为视频，用于调试、文档或验证。输出 WebM（VP8/VP9 编解码器）。

## 基本录制

```bash
# 先打开浏览器
playwright-cli open --headed

# 开始录制
playwright-cli video-start demo.webm

# 为章节过渡添加章节标记
playwright-cli video-chapter "开始上手" --description="打开首页" --duration=2000

# 导航并执行操作
playwright-cli goto https://example.com
playwright-cli snapshot
playwright-cli click e1

# 添加另一个章节
playwright-cli video-chapter "填写表单" --description="输入测试数据" --duration=2000
playwright-cli fill e2 "test input"

# 停止并保存
playwright-cli video-stop
```

## 最佳实践

### 1. 使用描述性文件名

```bash
# 在文件名中包含上下文
playwright-cli video-start recordings/login-flow-2024-01-15.webm
playwright-cli video-start recordings/checkout-test-run-42.webm
```

### 2. 录制完整的关键脚本

为用户录制视频或作为工作证据时，最好使用 `run-code` 创建代码片段执行。这样可以合理安排操作间的暂停并给视频添加标注。Playwright 有相应的新 API。

1) 使用 CLI 执行场景，记录所有定位器和操作。稍后需要这些定位器来获取边界框以进行高亮标注。
2) 创建包含视频脚本的文件（如下所示）。使用 `pressSequentially` + delay 实现优雅的打字效果，设置合理的暂停。
3) 使用 `playwright-cli run-code --filename your-script.js`

**重要**：叠加层（overlays）是 `pointer-events: none`——它们不会干扰页面交互。在点击、填充或执行任何页面操作时，可以安全地保持粘性叠加层可见。

```js
async page => {
  await page.screencast.start({ path: 'video.webm', size: { width: 1280, height: 800 } });
  await page.goto('https://demo.playwright.dev/todomvc');

  // 显示章节卡片——模糊背景并显示对话框。
  // 阻塞直到 duration 到期，然后自动移除。
  // 用于简单场景，但始终可以自由定制精美的叠加层。
  await page.screencast.showChapter('添加待办事项', {
    description: '我们将添加几项待办事项。',
    duration: 2000,
  });

  // 执行操作
  await page.getByRole('textbox', { name: '还有什么要做？' }).pressSequentially('遛狗', { delay: 60 });
  await page.getByRole('textbox', { name: '还有什么要做？' }).press('Enter');
  await page.waitForTimeout(1000);

  // 显示下一个章节
  await page.screencast.showChapter('验证结果', {
    description: '检查项目是否出现在列表中。',
    duration: 2000,
  });

  // 添加一个粘性标注，在执行操作期间保持可见。
  // 叠加层是 pointer-events: none，不会阻止点击。
  const annotation = await page.screencast.showOverlay(`
    <div style="position: absolute; top: 8px; right: 8px;
      padding: 6px 12px; background: rgba(0,0,0,0.7);
      border-radius: 8px; font-size: 13px; color: white;">
      ✓ 项目添加成功
    </div>
  `);

  // 在标注可见时执行更多操作
  await page.getByRole('textbox', { name: '还有什么要做？' }).pressSequentially('购买食品', { delay: 60 });
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await page.waitForTimeout(1500);

  // 完成后移除标注
  await annotation.dispose();

  // 你也可以高亮相关定位器并提供上下文标注。
  const bounds = await page.getByText('遛狗').boundingBox();
  await page.screencast.showOverlay(`
    <div style="position: absolute;
      top: ${bounds.y}px;
      left: ${bounds.x}px;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      border: 1px solid red;">
    </div>
    <div style="position: absolute;
      top: ${bounds.y + bounds.height + 5}px;
      left: ${bounds.x + bounds.width / 2}px;
      transform: translateX(-50%);
      padding: 6px;
      background: #808080;
      border-radius: 10px;
      font-size: 14px;
      color: white;">看这里，就在这段文字的正上方
    </div>
  `, { duration: 2000 });

  await page.screencast.stop();
}
```

尽情发挥创意，叠加层非常强大。

### Overlay API 摘要

| 方法 | 使用场景 |
|--------|----------|
| `page.screencast.showChapter(title, { description?, duration?, styleSheet? })` | 全屏章节卡片（带模糊背景）——适合章节过渡 |
| `page.screencast.showOverlay(html, { duration? })` | 自定义 HTML 叠加层——用于标注、标签、高亮 |
| `disposable.dispose()` | 移除未设置 duration 的粘性叠加层 |
| `page.screencast.hideOverlays()` / `page.screencast.showOverlays()` | 临时隐藏/显示所有叠加层 |

## 追踪 vs 视频

| 特性 | 视频 | 追踪 |
|---------|-------|---------|
| 输出 | WebM 文件 | Trace 文件（可在 Trace Viewer 中查看） |
| 展示 | 视觉录制 | DOM 快照、网络、控制台、操作 |
| 使用场景 | 演示、文档 | 调试、分析 |
| 大小 | 较大 | 较小 |

## 限制

- 录制会增加自动化的轻微开销
- 大型录制可能占用大量磁盘空间
