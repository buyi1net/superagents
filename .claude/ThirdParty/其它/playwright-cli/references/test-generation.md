# 测试代码生成

在你与浏览器交互时自动生成 Playwright 测试代码。

## 工作原理

使用 `playwright-cli` 执行的每个操作都会生成对应的 Playwright TypeScript 代码。这些代码出现在输出中，可以直接复制到你的测试文件中。

## 示例工作流

```bash
# 启动会话
playwright-cli open --headed https://example.com/login

# 获取快照查看元素
playwright-cli snapshot
# 输出显示：e1 [textbox "Email"], e2 [textbox "Password"], e3 [button "Sign In"]

# 填写表单字段——自动生成代码
playwright-cli fill e1 "user@example.com"
# 已运行的 Playwright 代码：
# await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

playwright-cli fill e2 "password123"
# 已运行的 Playwright 代码：
# await page.getByRole('textbox', { name: 'Password' }).fill('password123');

playwright-cli click e3
# 已运行的 Playwright 代码：
# await page.getByRole('button', { name: 'Sign In' }).click();
```

## 构建测试文件

将生成的代码收集到 Playwright 测试中：

```typescript
import { test, expect } from '@playwright/test';

test('登录流程', async ({ page }) => {
  // 来自 playwright-cli 会话的生成代码：
  await page.goto('https://example.com/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // 添加断言
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## 最佳实践

### 1. 使用语义化定位器

生成的代码在可能时使用基于角色的定位器，这些定位器更具弹性：

```typescript
// 生成（好——语义化）
await page.getByRole('button', { name: 'Submit' }).click();

// 避免（脆弱——CSS 选择器）
await page.locator('#submit-btn').click();
```

### 2. 录制前先探索

录制操作前先获取快照以了解页面结构：

```bash
playwright-cli open --headed https://example.com
playwright-cli snapshot
# 查看元素结构
playwright-cli click e5
```

### 3. 手动添加断言

生成的代码仅捕获操作而非断言。在测试中添加预期检查：

```typescript
// 生成的操作
await page.getByRole('button', { name: 'Submit' }).click();

// 手动断言
await expect(page.getByText('成功')).toBeVisible();
```
