#!/usr/bin/env node
/**
 * sync.mjs —— 本机开发用:把本仓库的 superagents 插件正稿一键刷到本机已装的三家 plugin。
 *
 * 跟 install.mjs 的分工:
 *   - install.mjs 管「从 github 装」(换机 / 发布)
 *   - sync.mjs    管「本机改了正稿、一键刷到本机已装的三家」(开发迭代,不经 github)
 *
 * 做法:直接覆盖各家 cache 里的内容文件,秒级生效,免去 marketplace 重装。
 * 用法:node scripts/sync.mjs [--cc|--codex|--opencode]   (不带参数=同步三家)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');            // scripts/ 的上级 = 仓库根
const HOME = os.homedir();
const MARKET = 'superagents-dz', PLUGIN = 'superagents';

// 正稿源
const SRC_SKILL = path.join(REPO, 'skills', 'constitution');
const SRC_HOOKS = path.join(REPO, 'hooks');
const SRC_OCPLUGIN = path.join(REPO, '.opencode', 'plugins', 'superagents.mjs');

const log = (m) => console.log(m);
const exists = (p) => fs.existsSync(p);

// 镜像覆盖(先删目标再整体拷,避免删掉的旧文件在目标残留)
function mirror(src, dst) {
  if (!exists(src)) { log(`    ✗ 源缺失: ${src}`); return false; }
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
  return true;
}

// 在 <base>/<market>/<plugin>/ 下找版本目录(取最新)
function findCache(base) {
  const dir = path.join(base, MARKET, PLUGIN);
  if (!exists(dir)) return null;
  const subs = fs.readdirSync(dir).filter(d => { try { return fs.statSync(path.join(dir, d)).isDirectory(); } catch { return false; } });
  return subs.length ? path.join(dir, subs.sort().pop()) : null;
}

// opencode 包缓存路径较深,递归找含 package.json + .opencode 的 superagents 包根
function findOpencodePkg() {
  const base = path.join(HOME, '.cache', 'opencode', 'packages');
  if (!exists(base)) return null;
  const roots = fs.readdirSync(base).filter(d => d.startsWith(`${PLUGIN}@git`)).map(d => path.join(base, d));
  const walk = (dir, depth = 0) => {
    if (depth > 7) return null;
    try {
      if (exists(path.join(dir, 'package.json')) && exists(path.join(dir, '.opencode'))) return dir;
      for (const e of fs.readdirSync(dir)) {
        const sub = path.join(dir, e);
        if (fs.statSync(sub).isDirectory()) { const f = walk(sub, depth + 1); if (f) return f; }
      }
    } catch {}
    return null;
  };
  for (const r of roots) { const f = walk(r); if (f) return f; }
  return null;
}

function syncCC() {
  log('Claude Code:');
  const cache = findCache(path.join(HOME, '.claude', 'plugins', 'cache'));
  if (!cache) { log('  未装,跳过'); return; }
  mirror(SRC_SKILL, path.join(cache, 'skills', 'constitution'));   // 总纲正文
  mirror(SRC_HOOKS, path.join(cache, 'hooks'));                    // hook(Claude Code 走 hook)
  log(`  ✓ skills + hooks 已同步`);
}

function syncCodex() {
  log('codex:');
  const cache = findCache(path.join(HOME, '.codex', 'plugins', 'cache'));
  if (!cache) { log('  未装,跳过'); return; }
  mirror(SRC_SKILL, path.join(cache, 'skills', 'constitution'));   // 走引用,只需 skill
  log(`  ✓ skills 已同步`);
}

function syncOpencode() {
  log('opencode:');
  const pkg = findOpencodePkg();
  if (!pkg) { log('  未装/未拉包,跳过'); return; }
  mirror(SRC_SKILL, path.join(pkg, 'skills', 'constitution'));
  fs.mkdirSync(path.join(pkg, '.opencode', 'plugins'), { recursive: true });
  fs.cpSync(SRC_OCPLUGIN, path.join(pkg, '.opencode', 'plugins', 'superagents.mjs'));
  // 顺手按白名单清包内杂物（跟 clean-opencode.mjs 一致：opencode 只加载这三样）
  const OC_KEEP = ['package.json', '.opencode', 'skills'];
  const cleaned = [];
  for (const name of fs.readdirSync(pkg)) {
    if (OC_KEEP.includes(name)) continue;
    fs.rmSync(path.join(pkg, name), { recursive: true, force: true });
    cleaned.push(name);
  }
  log(`  ✓ skills + 插件已同步${cleaned.length ? `；清掉 ${cleaned.length} 项杂物` : ''}`);
}

const args = process.argv.slice(2);
const all = !args.some(a => ['--cc', '--codex', '--opencode'].includes(a));
log(`superagents 本机同步  (源: ${REPO})`);
if (all || args.includes('--cc')) syncCC();
if (all || args.includes('--codex')) syncCodex();
if (all || args.includes('--opencode')) syncOpencode();
log('完成。');
