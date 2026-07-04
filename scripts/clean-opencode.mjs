#!/usr/bin/env node
/**
 * clean-opencode.mjs —— 清 opencode 插件缓存里的杂物（agent 或人都能一键跑）。
 *
 * 为什么需要它：opencode 用 bun 按 git 依赖拉「整个仓库」到缓存，bun 默认又不跑
 * postinstall，所以杂物没法在拉包时清掉，只能「拉下来之后」补清。
 *
 * 本脚本按白名单清：opencode 实际只加载 package.json（main 指向）、
 * .opencode/plugins/superagents.mjs（插件入口）、skills/（总纲正文），其余（别家清单、
 * docs、.claude/ThirdParty 第三方 skill 等）一律删。
 *
 * 什么时候跑：opencode「首次运行拉包之后」。人手动、agent 照 README、或 sync.mjs 自动，都行。
 * 安全性：只动 opencode 自己的缓存包，不碰仓库、不碰别家。杂物本就不被 opencode 加载，
 *        清掉只为省磁盘 + 整洁，清早清晚都不影响功能。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOME = os.homedir();
const PLUGIN = 'superagents';
const OC_KEEP = ['package.json', '.opencode', 'skills'];   // opencode 真正加载的就这几样

// 在 opencode 包缓存里递归找 node_modules/superagents 包根
function findPkg() {
  const base = path.join(HOME, '.cache', 'opencode', 'packages');
  if (!fs.existsSync(base)) return null;
  const roots = fs.readdirSync(base).filter(d => d.startsWith(`${PLUGIN}@git`)).map(d => path.join(base, d));
  const walk = (dir, depth = 0) => {
    if (depth > 7) return null;
    try {
      if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, '.opencode'))) return dir;
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

const pkg = findPkg();
if (!pkg) {
  console.log('opencode 包还没拉下来（先跑一次 opencode 触发拉包），本次跳过。');
  process.exit(0);
}
const removed = [];
for (const name of fs.readdirSync(pkg)) {
  if (OC_KEEP.includes(name)) continue;
  fs.rmSync(path.join(pkg, name), { recursive: true, force: true });
  removed.push(name);
}
console.log(`opencode 包已清理：${pkg.replace(HOME, '~')}`);
console.log(`  删掉杂物：${removed.join(', ') || '(无，已经是干净的)'}`);
console.log(`  保留：${OC_KEEP.join(', ')}`);
