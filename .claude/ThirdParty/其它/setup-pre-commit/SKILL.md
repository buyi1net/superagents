---
name: setup-pre-commit
description: 在当前仓库设置 Husky pre-commit hooks，集成 lint-staged、Prettier、type checking 和 tests。用户想添加 pre-commit hooks、设置 Husky、配置 lint-staged，或在 commit 阶段运行格式化、类型检查、测试时使用。
disable-model-invocation: true
---

# 设置 Pre-Commit Hooks

为当前仓库设置提交前质量门禁：先格式化暂存区文件，再按项目已有脚本运行 typecheck 和 tests。目标是减少低级格式问题、类型错误和明显测试失败进入提交。

## 会设置什么

- **Husky** pre-commit hook。
- **lint-staged**：只对暂存区文件运行 Prettier。
- **Prettier** 配置：仅在项目缺失时创建。
- **typecheck** 和 **test**：仅在 `package.json` 已存在对应 scripts 时加入 pre-commit。

## 执行原则

- 先检查现有项目结构，不要盲目覆盖配置。
- 优先沿用项目已有 package manager、Prettier 配置和 scripts。
- 只创建缺失文件；已有文件要合并或让用户确认。
- 不要绕过 hooks；如果新 hook 失败，修配置或提示用户，而不是跳过。
- 安装依赖、修改 `package.json`、创建 hook 文件前，先说明将修改哪些文件。

## 步骤

### 1. 检测 package manager

检查锁文件：

- `package-lock.json` -> npm
- `pnpm-lock.yaml` -> pnpm
- `yarn.lock` -> yarn
- `bun.lockb` 或 `bun.lock` -> bun

如果多个锁文件同时存在，停下来询问用户。不要猜。

如果没有锁文件，默认建议 npm，但在安装前告知用户。

### 2. 检查现有配置

先检查：

- `package.json`
- `.husky/`
- `.lintstagedrc`、`lint-staged.config.*` 或 `package.json` 中的 `lint-staged`
- `.prettierrc`、`prettier.config.*` 或 `package.json` 中的 `prettier`
- `typecheck`、`test` scripts

如果已存在等价配置，不要重复创建。

### 3. 安装依赖

如果国内网络访问 npm registry 较慢或超时，先按团队规范配置 registry、nrm 或代理；不要在未确认的情况下替用户修改全局 npm 配置。

安装为开发依赖（devDependencies）：

```text
husky lint-staged prettier
```

按检测到的 package manager 选择命令：

```bash
npm install -D husky lint-staged prettier
pnpm add -D husky lint-staged prettier
yarn add -D husky lint-staged prettier
bun add -d husky lint-staged prettier
```

只运行匹配当前项目的命令。

### 4. 初始化 Husky

```bash
npx husky init
```

这会创建 `.husky/` 目录，并在 `package.json` 中加入：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

如果 `prepare` 已存在，不要直接覆盖；先合并或询问用户。

### 5. 创建或更新 `.husky/pre-commit`

Husky v9+ 不需要 shebang。

以 npm 为例的基础内容：

```bash
npx lint-staged
npm run typecheck
npm run test
```

按 package manager 替换命令：

- npm：`npm run typecheck`、`npm run test`
- pnpm：`pnpm typecheck`、`pnpm test`
- yarn：`yarn typecheck`、`yarn test`
- bun：`bun run typecheck`、`bun test`

如果 `package.json` 没有 `typecheck` 或 `test` script，省略对应行，并告诉用户。

### 6. 创建或合并 lint-staged 配置

如果没有现有 lint-staged 配置，创建 `.lintstagedrc`：

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

如果已有配置，优先合并，不要覆盖用户规则。

### 7. 创建 Prettier 配置（仅缺失时）

只有找不到任何 Prettier 配置时，才创建 `.prettierrc`：

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

如果项目已有 Prettier 配置，不要修改。

### 8. 验证

检查：

- [ ] `.husky/pre-commit` 存在。
- [ ] `.lintstagedrc` 或等价 lint-staged 配置存在。
- [ ] `package.json` 中存在 `prepare: "husky"`，或等价 Husky 初始化方式。
- [ ] Prettier 配置存在，或项目已有格式化规范。
- [ ] pre-commit 中只包含项目实际存在的 scripts。

运行验证命令前先说明目的。优先运行：

```bash
npx lint-staged
```

如果用户同意，再运行对应 package manager 的 typecheck 和 tests。

## 提交

不要自动提交，除非用户明确要求。

如果用户要求提交，提交前先展示将提交的文件，并使用合适的提交信息，例如：

```text
Add pre-commit hooks
```

新的 pre-commit hook 会在提交时运行，这是一次冒烟测试（smoke test）。如果失败，修复配置或报告失败原因，不要跳过 hook。

## 注意事项

- Husky v9+ hook 文件不需要 shebang。
- `prettier --ignore-unknown` 会跳过 Prettier 无法解析的文件，例如图片。
- `lint-staged` 只处理暂存区文件，速度快；typecheck 和 tests 通常会检查更大范围。
- 在大型项目中，完整 test 可能太慢；如果用户希望快速提交，可以只保留 typecheck 或指定轻量 test，但要明确取舍。
