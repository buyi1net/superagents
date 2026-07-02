# Domain Docs

工程类 skills 应按以下规则读取当前仓库的领域文档。

## 探索前先读取

- 仓库根目录的 **`CONTEXT.md`**；或
- 仓库根目录的 **`CONTEXT-MAP.md`**，如果它存在。它会指向每个 context 对应的 `CONTEXT.md`，读取与当前主题相关的那些。
- **`docs/adr/`**：读取与即将处理的区域相关的 ADRs。在 multi-context 仓库中，也检查 `src/<context>/docs/adr/` 中针对具体 context 的决策。

如果这些文件不存在，**静默继续**。不要特别指出它们缺失，也不要一开始就建议创建它们。当术语或 ADR 确实被澄清后，先向用户展示草稿并确认，再按需创建 CONTEXT.md 或 ADR。

## 文件结构

Single-context 仓库（大多数仓库）：

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context 仓库（根目录存在 `CONTEXT-MAP.md`）：

```text
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表（glossary）中的词汇

当输出中需要命名领域概念时，例如 issue title、refactor proposal、hypothesis、test name，使用 `CONTEXT.md` 中定义的术语。不要改用术语表明确避免的同义词。

如果需要的概念还不在术语表中，这是一个信号：要么你正在发明项目没有使用的语言，需要重新考虑；要么这里确实有空缺，应该记下来，先向用户展示草稿并确认，再更新 CONTEXT.md。

## 标出 ADR 冲突

如果你的输出和已有 ADR 冲突，明确指出，不要静默覆盖：

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_