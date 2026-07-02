# 运行 Playwright 测试

使用 `npx playwright test` 命令或包管理脚本运行 Playwright 测试。为避免打开交互式 HTML 报告，请使用 `PLAYWRIGHT_HTML_OPEN=never` 环境变量。

```bash
# 运行所有测试
PLAYWRIGHT_HTML_OPEN=never npx playwright test

# 通过自定义 npm 脚本运行所有测试
PLAYWRIGHT_HTML_OPEN=never npm run special-test-command
```

# 调试 Playwright 测试

要调试失败的 Playwright 测试，使用 `--debug=cli` 选项运行。此命令会在测试开始时暂停并打印调试说明。

**重要**：在后台运行该命令，并检查输出直到打印出 "Debugging Instructions"。

一旦打印出包含会话名称的说明，使用 `playwright-cli` 附加会话并探索页面。

```bash
# 运行测试
PLAYWRIGHT_HTML_OPEN=never npx playwright test --debug=cli
# ...
# ... "tw-abcdef" 会话的调试说明 ...
# ...

# 附加到测试
playwright-cli attach tw-abcdef
```

让测试在后台保持运行，同时你探索并寻找修复方案。测试在开始时暂停，你应该单步跳过或在最可能出问题的位置暂停。

使用 `playwright-cli` 执行的每个操作都会生成对应的 Playwright TypeScript 代码。这些代码出现在输出中，可以直接复制到测试中。大多数情况下，需要更新特定的定位器或断言，但也可能是应用本身的 bug。请自行判断。

修复测试后，停止后台的测试运行。重新运行以验证测试通过。
