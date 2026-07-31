/**
 * superagents Pi 扩展测试 —— 用 fake pi.on() 注册表加载扩展,
 * 断言事件注册齐全、bootstrap 注入位置/角色、去重、agent_end 重置、compact 重注入。
 * 跑法:node --test tests/pi/test-pi-extension.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const packageJsonPath = resolve(repoRoot, 'package.json');
const extensionPath = resolve(repoRoot, '.pi/extensions/superagents.ts');
const constitutionPath = resolve(repoRoot, 'skills/constitution/SKILL.md');

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'));
}

async function loadExtension() {
  const handlers = new Map();
  const pi = {
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(handler);
    },
  };
  const mod = await import(pathToFileURL(extensionPath).href + `?cachebust=${Date.now()}-${Math.random()}`);
  mod.default(pi);
  return { handlers };
}

function firstHandler(handlers, event) {
  const eventHandlers = handlers.get(event) ?? [];
  assert.equal(eventHandlers.length, 1, `expected one ${event} handler`);
  return eventHandlers[0];
}

function textOf(message) {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

test('package.json 声明了 pi 包(extensions + skills)', async () => {
  const pkg = await readPackageJson();
  assert.ok(pkg.keywords.includes('pi-package'));
  assert.deepEqual(pkg.pi.skills, ['./skills']);
  assert.deepEqual(pkg.pi.extensions, ['./.pi/extensions/superagents.ts']);
});

test('扩展注册了 5 个生命周期事件', async () => {
  const { handlers } = await loadExtension();
  for (const event of ['resources_discover', 'session_start', 'session_compact', 'context', 'agent_end']) {
    assert.equal((handlers.get(event) ?? []).length, 1, `missing ${event} handler`);
  }
  assert.equal((handlers.get('session_before_compact') ?? []).length, 0);
});

test('resources_discover 贡献 skills 目录', async () => {
  const { handlers } = await loadExtension();
  const discover = firstHandler(handlers, 'resources_discover');
  const result = await discover({ type: 'resources_discover', cwd: repoRoot, reason: 'startup' }, {});
  assert.deepEqual(result.skillPaths, [resolve(repoRoot, 'skills')]);
});

test('context 注入 bootstrap 为一条 user 消息,agent_end 后不再注入,已注入不重复', async () => {
  const { handlers } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const context = firstHandler(handlers, 'context');
  const agentEnd = firstHandler(handlers, 'agent_end');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});

  const originalMessages = [
    { role: 'user', content: [{ type: 'text', text: '帮我写个脚本' }], timestamp: 1 },
  ];
  const result = await context({ type: 'context', messages: originalMessages }, {});

  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].role, 'user');
  assert.match(textOf(result.messages[0]), /全局规则总纲 constitution/);
  assert.match(textOf(result.messages[0]), /Pi 适配说明/);
  assert.equal(result.messages[1], originalMessages[0]);

  // 已注入过 → 不再重复
  const alreadyInjected = await context({ type: 'context', messages: result.messages }, {});
  assert.equal(alreadyInjected, undefined, 'bootstrap 不应重复注入');

  // agent_end 后 → 停止注入
  await agentEnd({ type: 'agent_end', messages: [] }, {});
  const afterEnd = await context({ type: 'context', messages: originalMessages }, {});
  assert.equal(afterEnd, undefined, 'agent_end 后不应再注入');
});

test('session_compact 后重新注入,且插在 compaction summary 之后', async () => {
  const { handlers } = await loadExtension();
  const sessionCompact = firstHandler(handlers, 'session_compact');
  const context = firstHandler(handlers, 'context');

  await sessionCompact({ type: 'session_compact', compactionEntry: {}, fromExtension: false }, {});

  const summary = { role: 'compactionSummary', summary: '之前的对话摘要', tokensBefore: 123, timestamp: 1 };
  const user = { role: 'user', content: [{ type: 'text', text: '继续' }], timestamp: 2 };
  const result = await context({ type: 'context', messages: [summary, user] }, {});

  assert.equal(result.messages.length, 3);
  assert.equal(result.messages[0], summary);
  assert.equal(result.messages[1].role, 'user');
  assert.match(textOf(result.messages[1]), /全局规则总纲 constitution/);
  assert.equal(result.messages[2], user);
});

test('bootstrap 正文来自 constitution SKILL.md(剥 frontmatter 后不残留 YAML)', async () => {
  const { handlers } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const context = firstHandler(handlers, 'context');
  const constitutionText = await readFile(constitutionPath, 'utf8');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});
  const result = await context(
    { type: 'context', messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1 }] },
    {}
  );

  const bootstrap = textOf(result.messages[0]);
  // 总纲正文进来了
  assert.ok(bootstrap.includes('语言规范'));
  // frontmatter 剥干净了
  assert.ok(!bootstrap.includes('name: constitution'));
  // 且正文来自正稿本身(抽查一句)
  assert.ok(constitutionText.includes('你的职责是提供准确、诚实的判断'));
  assert.ok(bootstrap.includes('你的职责是提供准确、诚实的判断'));
});
