#!/usr/bin/env node
/**
 * superagents 跨 agent 一键安装器（跨平台：Windows / macOS / Linux）
 *
 * 把 superagents plugin（规则总纲 constitution + 配套 skill）装到 Claude Code / Codex / OpenCode，并保证
 * 每家装完的 cache 都干净（不含别家清单、docs、.claude 这些杂物）。
 * github 仓库保持全量，干净靠两条路：
 *   - Claude Code：marketplace add --sparse，装时只拉自己的目录
 *   - Codex：plugin add 会二次完整 clone，不能 sparse（partial clone 缺 blob 会失败），
 *            只能整仓装 + 装完 post-clean 删 cache 杂物
 *   - OpenCode：npm 式 git 依赖只能整仓，杂物留缓存但不加载
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

// Claude Code sparse 只拉这几个目录（.claude-plugin 里同时含 marketplace.json + plugin.json）
const CC_SPARSE = ['.claude-plugin', 'hooks', 'skills'];
// post-clean 白名单：各家 cache 只保留这些，其余（仓库杂物 + 别家清单）一律删——比黑名单稳，仓库以后加新根文件也不漏
const CC_KEEP = ['.claude-plugin', 'hooks', 'skills', '.in_use'];   // .in_use 是 Claude Code 装插件的内部标记
const CODEX_KEEP = ['.codex-plugin', 'skills'];

const log = (m) => console.log(m);
const sh = (cmd) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
const shLoud = (cmd) => { log('  $ ' + cmd); return execSync(cmd, { stdio: 'inherit' }); };
const tryQuiet = (cmd) => { try { sh(cmd); return true; } catch { return false; } };
const has = (bin) => { try { sh(isWin ? `where ${bin}` : `command -v ${bin}`); return true; } catch { return false; } };

// 删目录（可传多个），不存在就跳过——plugin uninstall / marketplace remove 都不清 cache 实际文件，卸载后残留一份，靠它手动清
function rmDir(...dirs) {
  for (const d of dirs) { if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true }); }
}

// 白名单清理：cache 目录下只留 keepList 里的，其余全删（仓库杂物、别家清单一律清掉）
function keepOnly(cacheDir, keepList) {
  if (!cacheDir || !fs.existsSync(cacheDir)) return [];
  const removed = [];
  for (const name of fs.readdirSync(cacheDir)) {
    if (keepList.includes(name)) continue;
    fs.rmSync(path.join(cacheDir, name), { recursive: true, force: true });
    removed.push(name);
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
  shLoud(`claude plugin marketplace add ${GIT_URL} --sparse ${CC_SPARSE.join(' ')}`);   // 用完整 HTTPS URL：短格式在某些机器会被 claude 当 SSH 解析、新机器缺 host key/key 会失败
  shLoud(`claude plugin install ${PLUGIN}@${MARKET}`);
  const ccBase = path.join(HOME, '.claude', 'plugins', 'cache');
  const cache = findPluginCache(ccBase);
  const rm = keepOnly(cache, CC_KEEP);                              // 白名单清理：只留自己需要的
  const pruned = pruneOldVersions(ccBase);                          // 删老版本目录，只留刚装的
  log(`  ✓ Claude Code 装好${rm.length ? '（清理：' + rm.join(', ') + '）' : ''}${pruned.length ? '（删老版本：' + pruned.join(', ') + '）' : ''}；plugin 自带 hooks.json，新会话自动注入`);
}

// ---------- Codex ----------
function installCodex() {
  log('\n=== Codex ===');
  if (!has('codex')) { log('  跳过：未找到 codex CLI'); return; }
  tryQuiet(`codex plugin marketplace remove ${MARKET}`);            // 幂等
  shLoud(`codex plugin marketplace add ${REPO}`);                   // 整仓（不能 sparse）
  shLoud(`codex plugin add ${PLUGIN}@${MARKET}`);
  const cxBase = path.join(HOME, '.codex', 'plugins', 'cache');
  const cache = findPluginCache(cxBase);
  if (!cache) { log('  ✗ 没找到 Codex plugin cache'); return; }
  const rm = keepOnly(cache, CODEX_KEEP);                           // 白名单清理：只留自己需要的
  const pruned = pruneOldVersions(cxBase);                          // 删老版本目录，只留刚装的
  cleanCodexHook();                                                 // 走 skill 引用，清掉之前配过的 hook
  log(`  ✓ Codex 装好并清理（${rm.join(', ')}${pruned.length ? '；删老版本：' + pruned.join(', ') : ''}）；走 skill 引用：开场露 description、按需调用加载全文`);
}

// Codex 走 skill 引用、不用 hook（exec 不触发 SessionStart、交互全靠模型自觉调）：
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

// ---------- OpenCode ----------
function installOpencode() {
  log('\n=== OpenCode ===');
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
  log('  ⚠ OpenCode 首次运行时才拉包（整仓、带杂物）。用一次后跑清理：node scripts/clean-opencode.mjs');
}

// ---------- 卸载 ----------
function uninstallAll() {
  log('\n=== 卸载 ===');
  if (has('claude')) {
    tryQuiet(`claude plugin uninstall ${PLUGIN}@${MARKET}`);
    tryQuiet(`claude plugin marketplace remove ${MARKET}`);
    rmDir(path.join(HOME, '.claude', 'plugins', 'cache', MARKET),
          path.join(HOME, '.claude', 'plugins', 'marketplaces', MARKET));   // uninstall/remove 不清实际文件，手动删残留
    log('  Claude Code 已卸');
  }
  if (has('codex')) {
    tryQuiet(`codex plugin remove ${PLUGIN}@${MARKET}`);
    tryQuiet(`codex plugin marketplace remove ${MARKET}`);
    rmDir(path.join(HOME, '.codex', 'plugins', 'cache', MARKET),
          path.join(HOME, '.codex', '.tmp', 'marketplaces', MARKET));       // 同上
    log('  Codex 已卸');
  }
  // Codex hooks.json 去掉 constitution 那条
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
  log('  OpenCode 已从 opencode.json 移除');
}

// ---------- main ----------
const args = process.argv.slice(2);
if (args.includes('--uninstall')) { uninstallAll(); log('\n完成。'); process.exit(0); }
const all = !args.some(a => ['--cc', '--codex', '--opencode'].includes(a));
log(`superagents 跨 agent 安装器  (平台: ${os.platform()})`);
if (all || args.includes('--cc'))       { try { installCC(); }       catch (e) { log('  Claude Code 出错: ' + e.message); } }
if (all || args.includes('--codex'))    { try { installCodex(); }    catch (e) { log('  Codex 出错: ' + e.message); } }
if (all || args.includes('--opencode')) { try { installOpencode(); } catch (e) { log('  OpenCode 出错: ' + e.message); } }
log('\n完成。三家里 Claude Code/Codex 装完 cache 已清干净，OpenCode 杂物在缓存但不加载。');
