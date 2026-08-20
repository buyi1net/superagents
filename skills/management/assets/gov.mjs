#!/usr/bin/env node
/**
 * gov.mjs —— 项目治理工具。
 *
 * 设计目标：让「不乱」成为可机器判定的状态，而不是可请求的行为。
 * - manifest.json 是治理状态的单一事实源（目录职责、参考项、文档索引）；
 * - sync 从 manifest 生成 README 索引段和参考说明，消灭平行维护的散文；
 * - check 校验 manifest ↔ 磁盘 ↔ 索引三方一致，红灯输出即欠账工单，退出码非 0；
 * - add-reference 把「拉取副本」和「登记元数据」绑成同一个原子动作，捕获点在动作内，
 *   不依赖模型事后回忆（对抗「先干活、后忘文档」的惯性）。
 *
 * 用法（在项目根运行）:
 *   node gov.mjs init [项目名]                        初始化新项目治理
 *   node gov.mjs adopt                                扫描既有项目生成 manifest 草稿
 *   node gov.mjs add-reference <git-url> [选项]        登记并克隆参考材料
 *   node gov.mjs sync                                 从 manifest 重新生成索引和参考说明
 *   node gov.mjs check                                校验一致性，输出欠账清单
 *
 * 零依赖，Node >= 16。生成文件一律 UTF-8 + LF（Windows 下也不转 CRLF）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GOV_VERSION = 1;
const MANIFEST = 'manifest.json';
const SELF = 'gov.mjs';

const ROLES = ['reference', 'docs', 'source', 'scripts', 'build', 'temp', 'design', 'tests', 'archive', 'custom'];
// 顶层目录免声明白名单：隐藏目录与依赖目录
const TOP_EXEMPT = (name) => name.startsWith('.') || name === 'node_modules';
// 生成段标记：sync 只重写标记之间的内容，标记外的人类散文不动
const MARK = (key) => ({ start: `<!-- gov:${key}:start -->`, end: `<!-- gov:${key}:end -->` });

const ROLE_LABEL = {
  reference: '外部参考', docs: '项目文档', source: '源码', scripts: '脚本',
  build: '最终交付', temp: '临时区', design: '设计材料', tests: '项目测试',
  archive: '归档', custom: '自定义',
};

// ---------- 基础工具 ----------

const die = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };
const ok = (msg) => console.log(`✓ ${msg}`);
const toPosix = (p) => p.split(/[\\/]+/).filter(Boolean).join('/');
const root = () => process.cwd();
const abs = (p) => path.join(root(), toPosix(p));
const exists = (p) => fs.existsSync(abs(p));
const isDir = (p) => { try { return fs.statSync(abs(p)).isDirectory(); } catch { return false; } };
const read = (p) => { try { return fs.readFileSync(abs(p), 'utf8'); } catch { return null; } };
const write = (p, text) => fs.writeFileSync(abs(p), text, 'utf8');
const today = () => new Date().toISOString().slice(0, 10);

function loadManifest() {
  const raw = read(MANIFEST);
  if (raw === null) die(`缺少 ${MANIFEST}。未治理项目先跑 init（新项目）或 adopt（既有项目）。`);
  let m;
  try { m = JSON.parse(raw); } catch (e) { die(`${MANIFEST} 不是合法 JSON：${e.message}`); }
  if (m.version !== GOV_VERSION) die(`manifest 版本不识别（${m.version}），请用生成它的 gov.mjs 版本处理。`);
  if (!Array.isArray(m.directories)) m.directories = [];
  if (!m.reference) m.reference = { categories: [], items: [] };
  if (!Array.isArray(m.reference.categories)) m.reference.categories = [];
  if (!Array.isArray(m.reference.items)) m.reference.items = [];
  if (!m.docs || !Array.isArray(m.docs.items)) m.docs = { items: [] };
  if (!Array.isArray(m.builds)) m.builds = [];
  if (!m.project) m.project = { name: '', summary: '' };
  return m;
}

function saveManifest(m) { write(MANIFEST, JSON.stringify(m, null, 2) + '\n'); }

function git(args, opts = {}) {
  try {
    return execFileSync('git', ['-c', 'safe.directory=*', ...args], { cwd: abs(opts.cwd || '.'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}

const gitRoot = () => git(['rev-parse', '--show-toplevel']);

// 在标记之间替换生成内容；无标记时在文件末尾追加带标题的新段。返回是否落盘变更。
function applySection(file, key, title, body) {
  const { start, end } = MARK(key);
  const fresh = `${start}\n${body.trimEnd()}\n${end}`;
  let text = read(file);
  if (text === null) {
    text = `# ${title}\n\n`;
  }
  if (text.includes(start) && text.includes(end)) {
    const re = new RegExp(`${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}`);
    const next = text.replace(re, fresh);
    if (next !== text) { write(file, next); return true; }
    return false;
  }
  const next = `${text.trimEnd()}\n\n## ${title}\n\n${fresh}\n`;
  write(file, next);
  return true;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function sectionFresh(file, key, body) {
  const { start, end } = MARK(key);
  const text = read(file);
  if (text === null || !text.includes(start) || !text.includes(end)) return false;
  const m = text.match(new RegExp(`${escapeRe(start)}([\\s\\S]*?)${escapeRe(end)}`));
  return m[1].trim() === body.trim();
}

// ---------- 生成器：manifest → 索引段 / 参考说明 ----------

function refCategoryOf(item) { return item.category || '未分类'; }

function refDir(item) {
  return toPosix(`reference/${refCategoryOf(item)}/${item.name}`);
}

function refReadmePath(m) {
  const entry = (m.directories || []).find((d) => d.role === 'reference');
  return (entry && entry.readme) || 'reference/README.md';
}

function genReferenceIndexBody(m) {
  const cats = [...new Set(m.reference.items.map(refCategoryOf))];
  const blocks = cats.map((cat) => {
    const rows = m.reference.items.filter((i) => refCategoryOf(i) === cat).map((i) => {
      const src = i.source ? `[${i.source.replace(/^https?:\/\//, '').replace(/^git@/, '')}](${i.source})` : 'TODO';
      const entry = i.clone ? `[${i.name}](./${cat}/${i.name}/)` : `${i.name}（仅链接）`;
      return `| ${entry} | ${src} | ${i.snapshot || 'TODO'} | ${i.ref ? `（${i.ref}）` : ''}${i.license || 'TODO'} | ${i.lifecycle || 'TODO'} | ${i.captured || 'TODO'} | ${oneLine(i.note)} |`;
    });
    return `### ${cat}\n\n| 参考项 | 来源 | 快照 | 许可证 | 生命周期 | 获取日期 | 说明 |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}`;
  });
  return blocks.join('\n\n');
}

function genReferenceNote(item) {
  return [
    `# ${item.name} 参考说明`,
    '',
    `> 本文件由 \`gov.mjs sync\` 从 manifest.json 生成；修订请改 manifest 后重新生成。`,
    '',
    `- 来源：${item.source || 'TODO'}`,
    `- 版本或快照：${item.snapshot || 'TODO'}${item.ref ? `（${item.ref}）` : ''}`,
    `- 许可证：${item.license || 'TODO'}`,
    `- 生命周期：${item.lifecycle || 'TODO'}`,
    `- 获取日期：${item.captured || 'TODO'}`,
    `- 本地副本：${item.clone ? refDir(item) + '/' : '无（仅记录链接）'}`,
    '',
    '## 用途说明',
    '',
    oneLine(item.note) || 'TODO：说明本项目参考它的原因和范围。',
    '',
  ].join('\n');
}

function genDocsIndexBody(m) {
  const rows = m.docs.items.map((d) => `| [${d.title || d.file}](${relLink(d.file, 'docs/README.md')}) | ${oneLine(d.note)} |`);
  if (!rows.length) return '（暂无登记文档）';
  return `| 文档 | 说明 |\n|---|---|\n${rows.join('\n')}`;
}

function genRootDirsBody(m) {
  const rows = (m.directories || []).map((d) => {
    const readme = d.readme || ROLE_README[d.role];
    const entry = readme ? `[${d.path}](${relLink(readme, 'README.md')})` : d.path;
    return `| ${entry} | ${ROLE_LABEL[d.role] || d.role} | ${oneLine(d.note)} |`;
  });
  if (!rows.length) return '（暂无声明目录，项目长大后在 manifest.directories 登记）';
  return `| 目录 | 职责 | 说明 |\n|---|---|---|\n${rows.join('\n')}`;
}

const ROLE_README = { reference: 'reference/README.md', docs: 'docs/README.md' };

const oneLine = (s) => (s || '').replace(/\r?\n/g, ' ').trim();
// 链接相对于所在 README 的位置
const relLink = (target, fromFile) => toPosix(path.relative(path.dirname(abs(fromFile)), abs(target)));

// ---------- 命令：init ----------

const TPL_AGENTS = (name) => `# ${name} Agent 入口

- 治理状态由 \`${MANIFEST}\` 描述，\`node ${SELF} check\` 机器校验：开工先跑 check，红灯项就是当次欠账，修到全绿才算完成。
- 新增目录职责、参考材料、文档或交付物时，先登记进 \`${MANIFEST}\`（参考材料用 \`node ${SELF} add-reference\`），再跑 \`node ${SELF} sync\` 刷新索引。
- 目录职责以 manifest.directories 的 role 为准；粒度判断（何时建目录、何时升级局部入口）见生成本项目的管理 skill 的 principles 说明。

## 硬红线

1. 密钥等敏感信息不入库、不写进对外产物。
2. 外部参考仓库副本不提交进本仓库（gov 会维护 .gitignore 排除项）。
3. 删除、覆盖、对外发布前先向用户确认影响范围。
4. 治理状态与磁盘分叉时不掩盖：跑 check 把欠账摆出来，修完再收工。
`;

const TPL_README = (name, summary) => `# ${name}

${summary || '（一句话说明本项目用途）'}

<!-- gov:dirs:start -->
${genRootDirsBody({ directories: [] })}
<!-- gov:dirs:end -->
`;

const TPL_CLAUDE = '读取同级 [AGENTS.md](./AGENTS.md)。禁止在此文件写入内容。\n';

// 把 gov.mjs 自身复制进项目，使未加载管理 skill 的 Agent 也能独立校验
function seedSelf() {
  const selfSrc = fileURLToPath(import.meta.url);
  const selfDst = abs(SELF);
  if (path.resolve(selfSrc) !== path.resolve(selfDst)) {
    fs.copyFileSync(selfSrc, selfDst);
  }
}

function cmdInit(args) {
  if (exists(MANIFEST)) die(`已存在 ${MANIFEST}，init 只用于未治理项目。`);
  const name = args[0] || path.basename(root());
  const m = {
    version: GOV_VERSION,
    project: { name, summary: '' },
    directories: [],
    reference: { categories: [], items: [] },
    docs: { items: [] },
    builds: [],
  };
  saveManifest(m);
  if (!read('AGENTS.md')) write('AGENTS.md', TPL_AGENTS(name));
  if (!read('README.md')) write('README.md', TPL_README(name));
  if (!read('CLAUDE.md')) write('CLAUDE.md', TPL_CLAUDE);
  // 把 gov.mjs 自身复制进项目，使未加载管理 skill 的 Agent 也能独立校验
  seedSelf();
  ok(`项目 ${name} 治理已初始化：${MANIFEST} + AGENTS.md + README.md + CLAUDE.md + ${SELF}`);
  console.log('下一步：创建目录后在 manifest.directories 登记；参考材料用 add-reference；收工前必跑 check。');
}

// ---------- 命令：adopt ----------

const GUESS_ROLE = {
  reference: 'reference', docs: 'docs', doc: 'docs', wiki: 'docs',
  src: 'source', source: 'source', lib: 'source', app: 'source', packages: 'source',
  scripts: 'scripts', tools: 'scripts', build: 'build', dist: 'build', release: 'build',
  temp: 'temp', tmp: 'temp', design: 'design', assets: 'design',
  test: 'tests', tests: 'tests', archive: 'archive', archived: 'archive',
};

function parseRefNote(text) {
  const get = (label) => { const m = text.match(new RegExp(`[-*] *${label}[:：]\\s*(.+)`)); return m ? m[1].trim() : ''; };
  const snapRaw = get('版本或快照');
  return {
    source: get('来源').replace(/^[[(]|[)\]]$/g, ''),
    snapshot: snapRaw.split(/[\s（(]/)[0] || '',
    license: get('许可证'),
    lifecycle: get('生命周期'),
    captured: get('获取日期'),
  };
}

function cmdAdopt() {
  if (exists(MANIFEST)) die(`已存在 ${MANIFEST}。adopt 只用于首次接入；后续调整直接改 manifest。`);
  const gr = gitRoot() || root();
  if (gr !== toPosix(root())) die(`当前目录不是仓库根（${gr}）。请在项目根运行 adopt。`);
  const m = {
    version: GOV_VERSION,
    project: { name: path.basename(gr), summary: '' },
    directories: [],
    reference: { categories: [], items: [] },
    docs: { items: [] },
    builds: [],
  };
  // 顶层目录 → 角色猜测
  for (const name of fs.readdirSync(root())) {
    if (!isDir(name) || TOP_EXEMPT(name)) continue;
    const role = GUESS_ROLE[name.toLowerCase()] || 'custom';
    const entry = { path: name, role };
    if (role === 'custom') entry.note = 'TODO：adopt 猜不出职责，请人工确认 role（' + ROLES.slice(0, -1).join('/') + '）';
    m.directories.push(entry);
  }
  // 参考项：从已有 参考说明.md 反填；无说明的目录记 TODO
  const refRootDir = m.directories.find((d) => d.role === 'reference');
  if (refRootDir && isDir(refRootDir.path)) {
    const catDir = abs(refRootDir.path);
    const cats = fs.readdirSync(catDir).filter((d) => isDir(toPosix(refRootDir.path + '/' + d)));
    if (!cats.length) {
      // 没有分类层：reference/ 下直接是参考项，归入"未分类"
      m.reference.categories.push({ name: '未分类', dir: toPosix(refRootDir.path) });
      adoptItemsIn(m, refRootDir.path, '未分类');
    } else {
      for (const c of cats) {
        const rel = toPosix(refRootDir.path + '/' + c);
        m.reference.categories.push({ name: c, dir: rel });
        adoptItemsIn(m, rel, c);
      }
    }
  }
  // 文档：按文件登记，标题取首个一级标题
  const docsDir = m.directories.find((d) => d.role === 'docs');
  if (docsDir && isDir(docsDir.path)) {
    walkMd(docsDir.path, (f) => {
      if (f === toPosix(docsDir.path + '/README.md')) return;
      const t = read(f)?.match(/^#\s+(.+)$/m);
      m.docs.items.push({ file: f, title: t ? t[1].trim() : path.basename(f), note: '' });
    });
  }
  saveManifest(m);
  syncAll(m, true);
  seedSelf();
  console.log('manifest 草稿已生成（未知字段标 TODO），gov.mjs 已就位。下一步：');
  console.log('  1. 人工补齐 TODO 字段（项目摘要、custom 角色、参考项元数据）');
  console.log('  2. node gov.mjs check 逐项消化欠账');
}

function adoptItemsIn(m, relDir, cat) {
  const dir = abs(relDir);
  for (const name of fs.readdirSync(dir)) {
    if (!isDir(toPosix(relDir + '/' + name))) continue;
    const notePath = toPosix(relDir + '/' + name + '/参考说明.md');
    const note = read(notePath);
    const parsed = note ? parseRefNote(note) : {};
    m.reference.items.push({
      name, category: cat,
      source: parsed.source || 'TODO',
      snapshot: parsed.snapshot || 'TODO',
      license: parsed.license || 'TODO',
      lifecycle: parsed.lifecycle || '使用中',
      captured: parsed.captured || today(),
      note: note ? (note.match(/## 用途说明\s*\n+([\s\S]*)/)?.[1] || '').trim() : 'TODO',
      clone: true,
    });
  }
}

function walkMd(relDir, fn) {
  const stack = [relDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of fs.readdirSync(abs(dir))) {
      const rel = toPosix(dir + '/' + name);
      if (isDir(rel)) stack.push(rel);
      else if (name.endsWith('.md')) fn(rel);
    }
  }
}

// ---------- 命令：add-reference ----------

function cmdAddReference(args) {
  const m = loadManifest();
  let target = null, category = '未分类', name = null, snapshot = null, note = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category') category = args[++i];
    else if (args[i] === '--name') name = args[++i];
    else if (args[i] === '--snapshot') snapshot = args[++i];
    else if (args[i] === '--note') note = args[++i];
    else target = args[i];
  }
  if (!target) die('用法: add-reference <git-url或本地仓库路径> [--category 分类] [--name 名称] [--snapshot 快照] [--note 用途说明]');
  name = name || path.basename(target.replace(/\.git\/?$/, '').replace(/[\\/]+$/, ''));
  const dir = `reference/${category}/${name}`;
  if (m.reference.items.some((it) => it.name === name && refCategoryOf(it) === category)) die(`参考项 ${category}/${name} 已登记。`);
  console.log(`克隆 ${target} → ${dir} …`);
  try {
    execFileSync('git', ['-c', 'safe.directory=*', 'clone', target, abs(dir)], { stdio: ['ignore', 'pipe', 'inherit'] });
  } catch (e) {
    die(`克隆失败：${e.message}`);
  }
  const sha = git(['rev-parse', 'HEAD'], { cwd: dir });
  if (snapshot) execFileSync('git', ['-c', 'safe.directory=*', 'checkout', '--detach', snapshot], { cwd: abs(dir), stdio: ['ignore', 'pipe', 'inherit'] });
  const finalSha = git(['rev-parse', 'HEAD'], { cwd: dir }) || sha;
  const ref = git(['symbolic-ref', '--short', 'HEAD'], { cwd: dir}) || 'HEAD';
  const license = sniffLicense(dir);
  // .gitignore 托管块：排除外部仓库本体
  const line = `${dir}/`;
  let gi = read('.gitignore') || '';
  if (!gi.split(/\r?\n/).some((l) => l.trim() === line)) {
    const block = `# gov:managed-reference（gov.mjs 维护，勿手改）\n${line}\n# /gov:managed-reference`;
    gi = gi.includes('# gov:managed-reference')
      ? gi.replace('# gov:managed-reference\n', `# gov:managed-reference\n${line}\n`)
      : `${gi.trimEnd()}\n\n${block}\n`;
    write('.gitignore', gi);
  }
  m.reference.items.push({
    name, category, source: target, snapshot: finalSha, ref, license,
    lifecycle: '使用中', captured: today(), note, clone: true,
  });
  if (!m.reference.categories.some((c) => c.name === category)) m.reference.categories.push({ name: category, dir: `reference/${category}` });
  if (!m.directories.some((d) => d.role === 'reference')) m.directories.push({ path: 'reference', role: 'reference' });
  saveManifest(m);
  syncAll(m, false);
  ok(`参考项已登记并克隆：${category}/${name} @ ${finalSha?.slice(0, 8)}（${license}）`);
  if (/TODO/.test(license)) console.log('⚠ 许可证未识别，请人工确认 manifest 中该字段。');
}

function sniffLicense(dir) {
  for (const f of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING', 'COPYING.md']) {
    const t = read(toPosix(dir + '/' + f));
    if (!t) continue;
    const head = t.slice(0, 600);
    if (/Apache License/i.test(head)) return 'Apache-2.0';
    if (/GNU Affero General Public License/i.test(head)) return 'AGPL';
    if (/GNU Lesser General Public License/i.test(head)) return 'LGPL';
    if (/GNU General Public License/i.test(head)) return 'GPL';
    if (/Mozilla Public License/i.test(head)) return 'MPL-2.0';
    if (/The MIT License|MIT License/i.test(head)) return 'MIT';
    if (/BSD/i.test(head)) return 'BSD';
    if (/ISC License/i.test(head)) return 'ISC';
    return '未识别';
  }
  return '未识别';
}

// ---------- 命令：sync ----------

function syncAll(m, quiet) {
  const changed = [];
  if (applySection('README.md', 'dirs', '目录结构', genRootDirsBody(m))) changed.push('README.md');
  const hasRef = m.reference.items.length || m.reference.categories.length;
  if (hasRef || m.directories.some((d) => d.role === 'reference')) {
    const rf = refReadmePath(m);
    if (applySection(rf, 'reference-index', '参考索引', genReferenceIndexBody(m))) changed.push(rf);
  }
  if (m.directories.some((d) => d.role === 'docs')) {
    const df = ROLE_README.docs;
    if (applySection(df, 'docs-index', '当前内容', genDocsIndexBody(m))) changed.push(df);
  }
  for (const item of m.reference.items) {
    if (item.clone === false) continue;
    const p = toPosix(refDir(item) + '/参考说明.md');
    const fresh = genReferenceNote(item);
    if (read(p) !== fresh) { write(p, fresh); changed.push(p); }
  }
  if (!quiet) {
    ok(changed.length ? `已同步 ${changed.length} 个生成文件：${changed.join('、')}` : '所有生成内容均已是最新。');
  }
  return changed;
}

const cmdSync = () => { const m = loadManifest(); syncAll(m, false); };

// ---------- 命令：check ----------

function cmdCheck() {
  const m = loadManifest();
  const fails = [], warns = [];
  const fail = (msg, fix) => fails.push({ msg, fix });
  const warn = (msg, fix) => warns.push({ msg, fix });

  // 1. 根入口三件套
  if (!exists('AGENTS.md')) fail('根目录缺少 AGENTS.md', '从管理 skill 模板创建，或 init 重建');
  if (!exists('README.md')) fail('根目录缺少 README.md', '从管理 skill 模板创建');
  const claude = read('CLAUDE.md');
  if (claude !== null && (claude.length > 200 || !/AGENTS\.md/.test(claude))) {
    fail('CLAUDE.md 含有转发之外的内容', 'CLAUDE.md 只保留指向 AGENTS.md 的转发，正文写进 AGENTS.md');
  }
  if (!m.project.name) fail('manifest.project.name 为空', '填写项目名');
  if (/TODO/.test(m.project.summary || '')) warn('project.summary 标有 TODO', '补一句话用途');

  // 2. 声明目录 ↔ 磁盘
  const claimed = new Set();
  for (const d of m.directories) {
    claimed.add(d.path);
    if (!isDir(d.path)) fail(`manifest 声明的目录不存在：${d.path}`, '目录被删或改名后未更新 manifest，二选一：恢复目录 / 改 manifest');
    if (!ROLES.includes(d.role)) fail(`未知角色：${d.path} → ${d.role}`, `role 只允许 ${ROLES.join('/')}`);
    if (/TODO/.test(d.note || '')) fail(`目录 ${d.path} 的 role 未确认（note 标 TODO）`, '人工确认 role 后清掉 TODO');
  }
  const gr = gitRoot();
  if (fs.existsSync(root())) {
    for (const name of fs.readdirSync(root())) {
      if (!isDir(name) || TOP_EXEMPT(name) || claimed.has(name)) continue;
      fail(`顶层目录未声明：${name}/`, `在 manifest.directories 登记（adopt 可猜角色），或删除该目录`);
    }
  }

  // 3. 参考材料
  const catDirs = new Set(m.reference.categories.map((c) => c.dir));
  const diskItems = new Set();
  for (const c of m.reference.categories) {
    if (!isDir(c.dir)) { fail(`参考分类目录不存在：${c.dir}`, '恢复目录或更新 manifest.reference.categories'); continue; }
    for (const sub of fs.readdirSync(abs(c.dir))) {
      if (!isDir(toPosix(c.dir + '/' + sub))) continue;
      diskItems.add(`${c.name}/${sub}`);
    }
  }
  // 无分类层的旧布局：reference/ 下直接是项目夹
  if (!m.reference.categories.length && isDir('reference')) {
    for (const sub of fs.readdirSync(abs('reference'))) {
      if (isDir(`reference/${sub}`)) diskItems.add(`未分类/${sub}`);
    }
  }
  const regItems = new Set(m.reference.items.map((it) => `${refCategoryOf(it)}/${it.name}`));
  for (const k of diskItems) if (!regItems.has(k)) fail(`磁盘上的参考项未登记：${k}`, 'add-reference 登记，或手工补 manifest.reference.items（已废弃则迁移 archive）');
  for (const k of regItems) if (!diskItems.has(k)) fail(`manifest 登记的参考项无实体目录：${k}`, '删除登记或恢复目录');
  const giLines = new Set((read('.gitignore') || '').split(/\r?\n/).map((l) => l.trim()));
  for (const it of m.reference.items) {
    const label = `${refCategoryOf(it)}/${it.name}`;
    for (const f of ['source', 'snapshot', 'license', 'lifecycle', 'captured']) {
      if (!it[f] || /^TODO/.test(it[f])) fail(`参考项 ${label} 字段未填：${f}`, `补 manifest.reference.items 中 ${it.name}.${f}`);
    }
    if (it.clone === false) continue;
    const notePath = toPosix(refDir(it) + '/参考说明.md');
    const fresh = genReferenceNote(it);
    if (read(notePath) === null) fail(`参考项 ${label} 缺少 参考说明.md`, 'node gov.mjs sync 生成');
    else if (read(notePath) !== fresh) fail(`参考说明与 manifest 不一致：${label}`, '手改过生成文件：把内容并入 manifest 后 node gov.mjs sync');
    if (gr && it.clone) {
      const dir = `${refDir(it)}/`;
      if (!giLines.has(dir) && !giLines.has(dir.replace(/\/$/, ''))) {
        fail(`外部仓库副本未被 .gitignore 排除：${dir}`, '在 .gitignore 的 gov:managed-reference 块内补排除行');
      }
    }
  }
  if (m.reference.items.length || m.reference.categories.length) {
    const rf = refReadmePath(m);
    if (!sectionFresh(rf, 'reference-index', genReferenceIndexBody(m))) fail(`参考索引不是最新：${rf}`, 'node gov.mjs sync');
  }

  // 4. 文档
  if (m.directories.some((d) => d.role === 'docs')) {
    const docsDir = m.directories.find((d) => d.role === 'docs').path;
    const listed = new Set(m.docs.items.map((d) => d.file));
    for (const it of m.docs.items) if (!exists(it.file)) fail(`docs 索引指向不存在的文件：${it.file}`, '删除该条目或恢复文件');
    const each = (f) => {
      if (f !== toPosix(docsDir + '/README.md') && !listed.has(f)) {
        fail(`docs/ 下有未索引的文档：${f}`, '补进 manifest.docs.items 后 sync（或移出 docs/）');
      }
    };
    // 一律扫磁盘：未登记的散落文档即使未被 git 跟踪也要暴露，不能依赖版本控制状态
    walkMd(docsDir, each);
    if (!sectionFresh(ROLE_README.docs, 'docs-index', genDocsIndexBody(m))) {
      // docs/README.md 不在声明目录下时的宽容处理：仅当文件存在才校验
      if (exists(ROLE_README.docs)) fail(`docs 索引不是最新：${ROLE_README.docs}`, 'node gov.mjs sync');
    }
  }

  // 5. 交付物（最小终态校验：存在性 + 校验文件覆盖）
  for (const b of m.builds) {
    for (const k of ['dir', 'zip']) if (b[k] && !exists(b[k])) fail(`交付登记无实体：${b.name}.${k} → ${b[k]}`, '恢复交付物或更新 manifest.builds');
    if (b.checksums && exists(b.checksums)) {
      const sums = read(b.checksums) || '';
      if (b.zip && !sums.includes(path.posix.basename(b.zip))) warn(`校验文件未覆盖 ${b.zip}`, '重新生成校验文件');
    } else if (b.checksums && !exists(b.checksums)) {
      fail(`交付校验文件不存在：${b.checksums}`, '恢复或重建');
    }
  }

  // 6. temp 角色：治理三件套之外的入库内容只提醒
  const tempDir = m.directories.find((d) => d.role === 'temp');
  if (tempDir && gr) {
    const out = git(['ls-files', '--', tempDir.path]);
    for (const f of (out || '').split(/\r?\n/)) {
      if (!f) continue;
      const base = path.posix.basename(f);
      if (!['AGENTS.md', 'CLAUDE.md', 'README.md'].includes(base) && !/\/README\.md$/.test(f)) {
        warn(`temp/ 下有被版本控制的主体内容：${f}`, '临时主体应忽略或转正（移入正式目录并登记）');
      }
    }
  }

  // 7. 根 README 目录结构段新鲜度
  if (exists('README.md') && !sectionFresh('README.md', 'dirs', genRootDirsBody(m))) {
    fail('README 目录结构段不是最新', 'node gov.mjs sync');
  }

  // 输出
  for (const w of warns) console.log(`⚠ ${w.msg}\n  → ${w.fix}`);
  for (const f of fails) console.log(`✗ ${f.msg}\n  → ${f.fix}`);
  if (fails.length) {
    console.log(`\n结果：${fails.length} 项欠账（⚠ ${warns.length} 项提醒）。治理未达标，逐项修复后重跑 check。`);
    process.exit(1);
  }
  ok(`治理一致：${warns.length ? `${warns.length} 项提醒见上` : '无欠账'}`);
}

// ---------- 入口 ----------

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'init': cmdInit(rest); break;
  case 'adopt': cmdAdopt(); break;
  case 'add-reference': cmdAddReference(rest); break;
  case 'sync': cmdSync(); break;
  case 'check': cmdCheck(); break;
  default:
    console.error('用法: node gov.mjs <init|adopt|add-reference|sync|check> [参数]\n  init [项目名]   初始化新项目治理\n  adopt            扫描既有项目生成 manifest 草稿\n  add-reference    登记并克隆参考材料（--category --name --snapshot --note）\n  sync             从 manifest 重新生成索引和参考说明\n  check            校验一致性，红灯即欠账');
    process.exit(cmd ? 1 : 0);
}
