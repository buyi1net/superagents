#!/usr/bin/env node
/**
 * superagents 跨 agent 一键安装器（跨平台：Windows / macOS / Linux）
 *
 * 把 superagents plugin（规则总纲 constitution + 配套 skill）装到 Claude Code / codex / opencode，并保证
 * 每家装完的 cache 都干净（不含别家清单、docs、.claude 这些杂物）。
 * github 仓库保持全量，干净靠两条路：
 *   - CC   ：marketplace add --sparse，装时只拉自己的目录
 *   - codex：plugin add 会二次完整 clone，不能 sparse（partial clone 缺 blob 会失败），
 *            只能整仓装 + 装完 post-clean 删 cache 杂物
 *   - opencode：npm 式 git 依赖只能整仓，杂物留缓存但不加载
 *
 * 用法：
 *   node install.mjs                装三家
 *   node install.mjs --cc|--codex|--opencode   只装指定家（可组合）
 *   node install.mjs --uninstall    三家卸载
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = 'buyi1net/superagents';
const GIT_URL = 'https://github.com/buyi1net/superagents.git';
const MARKET = 'superagents-dz';
const PLUGIN = 'superagents';
const HOME = os.homedir();
const isWin = os.platform() === 'win32';

// CC sparse 只拉这几个目录（.claude-plugin 里同时含 marketplace.json + plugin.json）
const CC_SPARSE = ['.claude-plugin', 'hooks', 'skills'];
// post-clean 各家 cache 里要删掉的杂物（黑名单，只删明确的，不碰 hooks/skills/自己清单/内部标记）
const CC_JUNK = ['.codex-plugin', '.opencode', '.agents', 'docs', '.claude', '.git', 'AGENTS.md', 'CLAUDE.md', 'package.json'];
const CODEX_JUNK = ['.claude-plugin', '.opencode', '.agents', 'docs', '.claude', '.git', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'hooks'];

const log = (m) => console.log(m);
const sh = (cmd) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
const shLoud = (cmd) => { log('  $ ' + cmd); return execSync(cmd, { stdio: 'inherit' }); };
const tryQuiet = (cmd) => { try { sh(cmd); return true; } catch { return false; } };
const has = (bin) => { try { sh(isWin ? `where ${bin}` : `command -v ${bin}`); return true; } catch { return false; } };

// 删 cache 里指定的杂物（不存在就跳过）
function cleanCache(cacheDir, junkList) {
  if (!cacheDir || !fs.existsSync(cacheDir)) return [];
  const removed = [];
  for (const name of junkList) {
    const p = path.join(cacheDir, name);
    if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); removed.push(name); }
  }
  return removed;
}

// 在 <base>/<market>/<plugin>/ 下找版本目录，返回最新一个的完整路径
function findPluginCache(base) {
  const dir = path.join(base, MARKET, PLUGIN);
  if (!fs.existsSync(dir)) return null;
  const subs = fs.readdirSync(dir).filter(d => {
    try { return fs.statSync(path.join(dir, d)).isDirectory(); } catch { return false; }
  });
  return subs.length ? path.join(dir, subs.sort().pop()) : null;
}

// 装新删老：同插件下只留 mtime 最新的版本目录，其余删掉（不依赖版本号解析，稳）
function pruneOldVersions(base) {
  const dir = path.join(base, MARKET, PLUGIN);
  if (!fs.existsSync(dir)) return [];
  const subs = fs.readdirSync(dir)
    .map(d => path.join(dir, d))
    .filter(p => { try { return fs.statSync(p).isDirectory(); } catch { return false; } })
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const removed = [];
  for (const p of subs.slice(1)) { fs.rmSync(p, { recursive: true, force: true }); removed.push(path.basename(p)); }
  return removed;
}

// ---------- Claude Code ----------
function installCC() {
  log('\n=== Claude Code ===');
  if (!has('claude')) { log('  跳过：未找到 claude CLI'); return; }
  tryQuiet(`claude plugin marketplace remove ${MARKET}`);           // 幂等：先清旧的
  shLoud(`claude plugin marketplace add ${REPO} --sparse ${CC_SPARSE.join(' ')}`);
  shLoud(`claude plugin install ${PLUGIN}@${MARKET}`);
  const ccBase = path.join(HOME, '.claude', 'plugins', 'cache');
  const cache = findPluginCache(ccBase);
  const rm = cleanCache(cache, CC_JUNK);                            // 顺手剔掉根文件残留
  const pruned = pruneOldVersions(ccBase);                          // 删老版本目录，只留刚装的
  log(`  ✓ CC 装好${rm.length ? '（清理：' + rm.join(', ') + '）' : ''}${pruned.length ? '（删老版本：' + pruned.join(', ') + '）' : ''}；plugin 自带 hooks.json，新会话自动注入`);
}

// ---------- codex ----------
function installCodex() {
  log('\n=== codex ===');
  if (!has('codex')) { log('  跳过：未找到 codex CLI'); return; }
  tryQuiet(`codex plugin marketplace remove ${MARKET}`);            // 幂等
  shLoud(`codex plugin marketplace add ${REPO}`);                   // 整仓（不能 sparse）
  shLoud(`codex plugin add ${PLUGIN}@${MARKET}`);
  const cxBase = path.join(HOME, '.codex', 'plugins', 'cache');
  const cache = findPluginCache(cxBase);
  if (!cache) { log('  ✗ 没找到 codex plugin cache'); return; }
  const rm = cleanCache(cache, CODEX_JUNK);                         // 装完删杂物
  const pruned = pruneOldVersions(cxBase);                          // 删老版本目录，只留刚装的
  cleanCodexHook();                                                 // 走 skill 引用，清掉之前配过的 hook
  log(`  ✓ codex 装好并清理（${rm.join(', ')}${pruned.length ? '；删老版本：' + pruned.join(', ') : ''}）；走 skill 引用：开场露 description、按需调用加载全文`);
}

// codex 走 skill 引用、不用 hook（exec 不触发 SessionStart、交互全靠模型自觉调）：
// 把本 plugin 之前配过的 hook 清掉，不动别人的 hook。
function cleanCodexHook() {
  const hooksJson = path.join(HOME, '.codex', 'hooks.json');
  if (!fs.existsSync(hooksJson)) return;
  try {
    const cfg = JSON.parse(fs.readFileSync(hooksJson, 'utf8'));
    if (!cfg.hooks?.SessionStart) return;
    const isOurs = (e) => /session-start|规则总纲|constitution/.test(JSON.stringify(e));
    cfg.hooks.SessionStart = cfg.hooks.SessionStart.filter(e => !isOurs(e));
    if (!cfg.hooks.SessionStart.length) delete cfg.hooks.SessionStart;
    if (cfg.hooks && !Object.keys(cfg.hooks).length) delete cfg.hooks;
    fs.writeFileSync(hooksJson, JSON.stringify(cfg, null, 2));
  } catch {}
}

// ---------- opencode ----------
function installOpencode() {
  log('\n=== opencode ===');
  const ocDir = path.join(HOME, '.config', 'opencode');
  const ocJson = path.join(ocDir, 'opencode.json');
  const spec = `${PLUGIN}@git+${GIT_URL}`;
  let cfg = {};
  if (fs.existsSync(ocJson)) { try { cfg = JSON.parse(fs.readFileSync(ocJson, 'utf8')); } catch {} }
  else if (!fs.existsSync(ocDir)) fs.mkdirSync(ocDir, { recursive: true });
  cfg.plugin = Array.isArray(cfg.plugin) ? cfg.plugin : [];
  if (!cfg.plugin.some(p => typeof p === 'string' && p.startsWith(`${PLUGIN}@git+`))) cfg.plugin.push(spec);
  fs.writeFileSync(ocJson, JSON.stringify(cfg, null, 2));           // 保留原有配置（含 key）
  log('  ✓ 已把 plugin 写进 opencode.json（保留你原有配置）');
  log('  注：opencode 只能整仓拉，杂物会在缓存里但不加载、不影响功能');
}

// ---------- 卸载 ----------
function uninstallAll() {
  log('\n=== 卸载 ===');
  if (has('claude')) { tryQuiet(`claude plugin uninstall ${PLUGIN}@${MARKET}`); tryQuiet(`claude plugin marketplace remove ${MARKET}`); log('  CC 已卸'); }
  if (has('codex'))  { tryQuiet(`codex plugin remove ${PLUGIN}@${MARKET}`); tryQuiet(`codex plugin marketplace remove ${MARKET}`); log('  codex 已卸'); }
  // codex hooks.json 去掉 constitution 那条
  const hooksJson = path.join(HOME, '.codex', 'hooks.json');
  if (fs.existsSync(hooksJson)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(hooksJson, 'utf8'));
      if (cfg.hooks?.SessionStart) {
        cfg.hooks.SessionStart = cfg.hooks.SessionStart.filter(e => !JSON.stringify(e).includes('constitution'));
        fs.writeFileSync(hooksJson, JSON.stringify(cfg, null, 2));
      }
    } catch {}
  }
  // opencode.json 去掉 spec
  const ocJson = path.join(HOME, '.config', 'opencode', 'opencode.json');
  if (fs.existsSync(ocJson)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(ocJson, 'utf8'));
      if (Array.isArray(cfg.plugin)) {
        cfg.plugin = cfg.plugin.filter(p => !(typeof p === 'string' && p.startsWith(`${PLUGIN}@git+`)));
        fs.writeFileSync(ocJson, JSON.stringify(cfg, null, 2));
      }
    } catch {}
  }
  log('  opencode 已从 opencode.json 移除');
}

// ---------- main ----------
const args = process.argv.slice(2);
if (args.includes('--uninstall')) { uninstallAll(); log('\n完成。'); process.exit(0); }
const all = !args.some(a => ['--cc', '--codex', '--opencode'].includes(a));
log(`superagents 跨 agent 安装器  (平台: ${os.platform()})`);
if (all || args.includes('--cc'))       { try { installCC(); }       catch (e) { log('  CC 出错: ' + e.message); } }
if (all || args.includes('--codex'))    { try { installCodex(); }    catch (e) { log('  codex 出错: ' + e.message); } }
if (all || args.includes('--opencode')) { try { installOpencode(); } catch (e) { log('  opencode 出错: ' + e.message); } }
log('\n完成。三家里 CC/codex 装完 cache 已清干净，opencode 杂物在缓存但不加载。');
