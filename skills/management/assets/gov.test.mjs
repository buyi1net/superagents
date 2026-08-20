#!/usr/bin/env node
// gov.mjs 自检：在 .selftest/ 工作区内搭建夹具项目，验证 check 的关键规则。
// 运行: node --test gov.test.mjs（需 git；夹具自动清理）

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOV = path.join(HERE, 'gov.mjs');
const WS = path.join(HERE, '.selftest');
const SRC = path.join(HERE, '.selftest-src');
const run = (args, cwd) => spawnSync(process.execPath, ['gov.mjs', ...args], { cwd, encoding: 'utf8' });
const runInit = (args, cwd) => spawnSync(process.execPath, [GOV, ...args], { cwd, encoding: 'utf8' });
const w = (p, t) => fs.writeFileSync(path.join(WS, p), t, 'utf8');
const r = (p) => fs.readFileSync(path.join(WS, p), 'utf8');

before(() => {});
after(() => { fs.rmSync(WS, { recursive: true, force: true }); fs.rmSync(SRC, { recursive: true, force: true }); });

// 每个用例都从干净夹具开始，避免状态互串
function freshInit() {
  fs.rmSync(WS, { recursive: true, force: true });
  fs.mkdirSync(WS, { recursive: true });
  const p = runInit(['init', 'demo'], WS);
  assert.equal(p.status, 0, p.stdout + p.stderr);
}

// 夹具：一个可作为 add-reference 来源的本地 git 仓库
function makeSrcRepo() {
  // 源仓库建在被测项目之外，避免被当成未声明目录
  const src = path.join(SRC, 'srcrepo');
  fs.rmSync(src, { recursive: true, force: true });
  fs.mkdirSync(src, { recursive: true });
  fs.writeFileSync(path.join(src, 'tool.md'), '# tool\n示例参考项目\n');
  fs.writeFileSync(path.join(src, 'LICENSE'), 'The MIT License\n');
  const g = (a) => execFileSync('git', ['-c', 'safe.directory=*', '-C', src, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  g(['init', '-q']);
  g(['add', '.']);
  execFileSync('git', ['-C', src, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], { stdio: 'ignore' });
  return src;
}

test('init 后 check 全绿', () => {
  freshInit();
  const c = run(['check'], WS);
  assert.equal(c.status, 0, c.stdout);
  assert.match(c.stdout, /治理一致/);
  assert.ok(fs.existsSync(path.join(WS, 'gov.mjs')), 'init 应把 gov.mjs 复制进项目');
  assert.match(r('CLAUDE.md'), /AGENTS\.md/);
});

test('check 抓住根入口缺失与 CLAUDE.md 污染', () => {
  freshInit();
  fs.rmSync(path.join(WS, 'AGENTS.md'));
  assert.match(run(['check'], WS).stdout, /AGENTS\.md/);
  w('CLAUDE.md', '一堆不该写进来的正文内容\n'.repeat(10));
  const out = run(['check'], WS).stdout;
  assert.match(out, /CLAUDE\.md/);
});

test('check 抓住未声明的顶层目录', () => {
  freshInit();
  fs.mkdirSync(path.join(WS, 'mystery'));
  const out = run(['check'], WS).stdout;
  assert.match(out, /顶层目录未声明：mystery/, out);
});

test('add-reference 全链路：克隆、登记、忽略、生成、check 绿', () => {
  freshInit();
  const src = makeSrcRepo();
  const p = run(['add-reference', src, '--category', '同类项目', '--note', '方案输入'], WS);
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.ok(fs.existsSync(path.join(WS, 'reference/同类项目/srcrepo/.git')), '应完成克隆');
  const m = JSON.parse(r('manifest.json'));
  const it = m.reference.items[0];
  assert.equal(it.license, 'MIT');
  assert.match(it.snapshot, /^[0-9a-f]{40}$/);
  assert.match(r('.gitignore'), /reference\/同类项目\/srcrepo\//);
  assert.ok(fs.existsSync(path.join(WS, 'reference/同类项目/srcrepo/参考说明.md')));
  assert.match(r('reference/README.md'), /srcrepo/);
  assert.equal(run(['check'], WS).status, 0, run(['check'], WS).stdout);
});

test('参考说明漂移：check 红 → sync 修复 → check 绿', () => {
  freshInit();
  const src = makeSrcRepo();
  run(['add-reference', src], WS);
  const note = 'reference/未分类/srcrepo/参考说明.md';
  w(note, r(note) + '\n手改的内容\n');
  assert.match(run(['check'], WS).stdout, /不一致/);
  run(['sync'], WS);
  assert.equal(run(['check'], WS).status, 0, run(['check'], WS).stdout);
});

test('TODO 字段与磁盘未登记参考项都会亮红灯', () => {
  freshInit();
  const src = makeSrcRepo();
  run(['add-reference', src], WS);
  const m = JSON.parse(r('manifest.json'));
  m.reference.items[0].source = 'TODO';
  w('manifest.json', JSON.stringify(m, null, 2));
  assert.match(run(['check'], WS).stdout, /字段未填：source/);
  fs.mkdirSync(path.join(WS, 'reference/未分类/野项'), { recursive: true });
  assert.match(run(['check'], WS).stdout, /野项/);
});

test('docs 未索引文档亮红灯，登记后转绿', () => {
  freshInit();
  fs.mkdirSync(path.join(WS, 'docs'), { recursive: true });
  w('docs/方案.md', '# 方案\n正文\n');
  const out = run(['check'], WS).stdout;
  assert.match(out, /顶层目录未声明：docs/, out);
  const m = JSON.parse(r('manifest.json'));
  m.directories.push({ path: 'docs', role: 'docs' });
  w('manifest.json', JSON.stringify(m, null, 2));
  assert.match(run(['check'], WS).stdout, /未索引的文档：docs\/方案\.md/);
  m.docs.items.push({ file: 'docs/方案.md', title: '方案', note: '' });
  w('manifest.json', JSON.stringify(m, null, 2));
  run(['sync'], WS);
  assert.equal(run(['check'], WS).status, 0, run(['check'], WS).stdout);
});
