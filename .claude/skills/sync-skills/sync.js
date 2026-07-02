#!/usr/bin/env node
// skill 下发脚本(跨平台)
// 把项目 skills/ 下的正稿 skill 复制到各 agent 的 skill 目录,供新开会话测试改动效果。
//
// 用法:
//   node sync.js              下发全部 skill
//   node sync.js dz-skills    只下发指定的 skill
//   node sync.js --clean      只清理过期备份,不下发
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const HOME = os.homedir();
const PLATFORM = process.platform; // 'darwin' | 'win32' | 'linux'

// 项目根:本脚本在 <项目根>/.claude/skills/sync-skills/sync.js,上溯三级自动定位,不用写死
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC_ROOT = path.join(PROJECT_ROOT, 'skills'); // 正稿 skill 都放 skills/ 下

// 各 agent 的 skill 目录:每个系统一份;换新机器照着加一份即可
const TARGETS_BY_PLATFORM = {
  darwin: {
    'Claude Code': path.join(HOME, '.claude', 'skills'),
    opencode: path.join(HOME, '.config', 'opencode', 'skills'),
    codex: path.join(HOME, '.codex', 'skills'),
  },
  linux: {
    'Claude Code': path.join(HOME, '.claude', 'skills'),
    opencode: path.join(HOME, '.config', 'opencode', 'skills'),
    codex: path.join(HOME, '.codex', 'skills'),
  },
  win32: {
    // 占位:等在 Windows 机器上核实 opencode / codex 实际位置后再改准
    'Claude Code': path.join(HOME, '.claude', 'skills'),
    opencode: path.join(HOME, '.config', 'opencode', 'skills'),
    codex: path.join(HOME, '.codex', 'skills'),
  },
};

// 备份目录根,以及保留天数:超过这么多天的备份自动删
const BACKUP_BASE = path.join(HOME, '.skill-sync-backups');
const BACKUP_TTL_DAYS = 7;

// 排除:草稿/手记和系统垃圾,不下发,目标里有也不删
const EXCLUDE_EXACT = new Set(['.DS_Store', '.git']);
const EXCLUDE_PATTERNS = [/草稿/, /-claude/, /手记/];
function isExcluded(name) {
  return EXCLUDE_EXACT.has(name) || EXCLUDE_PATTERNS.some((re) => re.test(name));
}

// 在 root 下递归找含 SKILL.md 的目录,每个算一个 skill
function listSkillDirs(root) {
  const found = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((e) => e.isFile() && e.name === 'SKILL.md')) {
      found.push(dir);
      return; // 找到 skill 就不再往里钻嵌套
    }
    for (const e of entries) {
      if (e.isDirectory() && !isExcluded(e.name)) walk(path.join(dir, e.name));
    }
  }
  walk(root);
  return found;
}

// 递归复制 src 到 dst,跳过排除项;返回复制的相对文件清单
function copyTree(src, dst) {
  const copied = [];
  fs.mkdirSync(dst, { recursive: true });
  (function walk(s, d, rel) {
    for (const e of fs.readdirSync(s, { withFileTypes: true })) {
      if (isExcluded(e.name)) continue;
      const sp = path.join(s, e.name);
      const dp = path.join(d, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) {
        fs.mkdirSync(dp, { recursive: true });
        walk(sp, dp, r);
      } else if (e.isFile()) {
        fs.copyFileSync(sp, dp);
        copied.push(r);
      }
    }
  })(src, dst, '');
  return copied;
}

// 删掉 dst 里源没有、又不属于排除项的东西(镜像);草稿/垃圾保留
function prune(src, dst) {
  const removed = [];
  if (!fs.existsSync(dst)) return removed;
  (function walk(s, d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (isExcluded(e.name)) continue; // 草稿/垃圾不动
      const sp = path.join(s, e.name);
      const dp = path.join(d, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) {
        if (fs.existsSync(sp) && fs.statSync(sp).isDirectory()) walk(sp, dp, r);
        else {
          fs.rmSync(dp, { recursive: true, force: true });
          removed.push(r + '/');
        }
      } else if (!fs.existsSync(sp)) {
        fs.rmSync(dp, { force: true });
        removed.push(r);
      }
    }
  })(src, dst, '');
  return removed;
}

function hashFile(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

// 收集 dir 下非排除文件的 相对路径 -> hash
function fileMap(dir) {
  const map = {};
  (function walk(d, rel) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (isExcluded(e.name)) continue;
      const p = path.join(d, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(p, r);
      else if (e.isFile()) map[r] = hashFile(p);
    }
  })(dir, '');
  return map;
}

// 验收:比对源和目标的非排除文件,返回总数和问题清单
function verify(src, dst) {
  const a = fileMap(src);
  const b = fileMap(dst);
  const problems = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) problems.push(`缺失:${k}`);
    else if (a[k] !== b[k]) problems.push(`内容不一致:${k}`);
  }
  return { count: Object.keys(a).length, problems };
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// 清理:删掉超过 BACKUP_TTL_DAYS 天的备份目录,返回删掉的清单
function cleanupBackups() {
  if (!fs.existsSync(BACKUP_BASE)) return [];
  const ttlMs = BACKUP_TTL_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const removed = [];
  for (const e of fs.readdirSync(BACKUP_BASE, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(BACKUP_BASE, e.name);
    if (now - fs.statSync(p).mtimeMs > ttlMs) {
      fs.rmSync(p, { recursive: true, force: true });
      removed.push(e.name);
    }
  }
  return removed;
}

function runClean() {
  const removed = cleanupBackups();
  if (removed.length) {
    console.log(`已清理 ${removed.length} 份超过 ${BACKUP_TTL_DAYS} 天的备份:`);
    removed.forEach((d) => console.log(`  ${d}`));
  } else {
    console.log(`没有超过 ${BACKUP_TTL_DAYS} 天的备份,无需清理。`);
  }
}

function main() {
  const arg = process.argv[2];

  // 只清理模式
  if (arg === '--clean' || arg === 'clean') {
    runClean();
    process.exit(0);
  }

  const targets = TARGETS_BY_PLATFORM[PLATFORM];
  if (!targets) {
    console.error(`当前系统(${PLATFORM})没配置路径,去 sync.js 的 TARGETS_BY_PLATFORM 里加一份。`);
    process.exit(1);
  }
  if (!fs.existsSync(SRC_ROOT)) {
    console.error(`源 skill 根目录不存在,中止:${SRC_ROOT}`);
    process.exit(1);
  }

  const wanted = arg; // 可选:只下发某个 skill
  let skillDirs = listSkillDirs(SRC_ROOT);
  if (wanted) {
    skillDirs = skillDirs.filter((d) => path.basename(d) === wanted);
    if (skillDirs.length === 0) {
      console.error(`没找到名为 ${wanted} 的 skill(在 ${SRC_ROOT} 下)。`);
      process.exit(1);
    }
  }
  if (skillDirs.length === 0) {
    console.error(`${SRC_ROOT} 下没有任何含 SKILL.md 的 skill。`);
    process.exit(1);
  }

  const stamp = timestamp();
  const backupRoot = path.join(BACKUP_BASE, stamp);
  let allOk = true;

  console.log(`系统:${PLATFORM}`);
  console.log(`源:${SRC_ROOT}`);
  console.log(`下发:${skillDirs.map((d) => path.basename(d)).join(', ')}`);
  console.log('');

  for (const srcSkill of skillDirs) {
    const name = path.basename(srcSkill);
    for (const [agent, baseDir] of Object.entries(targets)) {
      const dstSkill = path.join(baseDir, name);
      console.log(`=== ${name} → ${agent}(${dstSkill}) ===`);

      if (fs.existsSync(dstSkill)) {
        const bk = path.join(backupRoot, agent, name);
        fs.mkdirSync(path.dirname(bk), { recursive: true });
        fs.cpSync(dstSkill, bk, { recursive: true }); // 原样备份,含草稿全留底
        console.log(`  已备份旧副本到 ${bk}`);
      }

      const copied = copyTree(srcSkill, dstSkill);
      const removed = prune(srcSkill, dstSkill);
      console.log(`  下发 ${copied.length} 个文件${removed.length ? `,清理多余 ${removed.length} 个` : ''}`);

      const { count, problems } = verify(srcSkill, dstSkill);
      if (problems.length === 0) {
        console.log(`  验收通过:${count} 个文件与源一致`);
      } else {
        allOk = false;
        console.log(`  验收不通过(${problems.length} 处):`);
        problems.forEach((pb) => console.log(`    - ${pb}`));
      }
      console.log('');
    }
  }

  console.log(allOk ? '全部验收通过。' : '有验收未通过项,见上。');
  if (fs.existsSync(backupRoot)) console.log(`备份目录:${backupRoot}`);

  // 顺带清理超过 7 天的旧备份
  const cleaned = cleanupBackups();
  if (cleaned.length) console.log(`顺带清理 ${cleaned.length} 份超过 ${BACKUP_TTL_DAYS} 天的旧备份`);

  process.exit(allOk ? 0 : 1);
}

main();
