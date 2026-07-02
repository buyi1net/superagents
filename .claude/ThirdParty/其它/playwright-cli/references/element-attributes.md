# 元素属性检查

当快照不显示某个元素的 `id`、`class`、`data-*` 属性或其他 DOM 属性时，使用 `eval` 来检查它们。

## 示例

```bash
playwright-cli snapshot
# 快照显示 e7 为按钮，但不显示其 id 或 data 属性

# 获取元素的 id
playwright-cli eval "el => el.id" e7

# 获取所有 CSS class
playwright-cli eval "el => el.className" e7

# 获取特定属性
playwright-cli eval "el => el.getAttribute('data-testid')" e7
playwright-cli eval "el => el.getAttribute('aria-label')" e7

# 获取计算后的样式属性
playwright-cli eval "el => getComputedStyle(el).display" e7
```
