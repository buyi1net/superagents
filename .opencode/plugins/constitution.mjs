/**
 * constitution bootstrap plugin for OpenCode
 *
 * 开场把 constitution 全局规则总纲注入每个会话的第一条 user 消息。
 * 改自 superpowers .opencode/plugins/superpowers.js。
 * 靠 import.meta 相对定位 plugin 内的 SKILL.md,不写死绝对路径 —— 换机随 plugin 走。
 *
 * 只负责"注入总纲",不注册 skills.paths(skill 发现交给 codex-plugin 的 skills 声明 /
 * opencode 原生目录),避免和别处重复触发 duplicate skill 警告。
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .opencode/plugins/ 上溯两级 = plugin root;SKILL.md 在 skills/constitution/
const SKILL_MD = path.resolve(__dirname, '..', '..', 'skills', 'constitution', 'SKILL.md');

// 剥 frontmatter,只留正文
const stripFrontmatter = (content) => {
  const m = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : content;
};

// 模块级缓存:SKILL.md 会话期不变,读一次即可(transform 每步都触发,不能每次读盘)
let _cache; // undefined=未读, null=文件缺失
const getBootstrap = () => {
  if (_cache !== undefined) return _cache;
  if (!fs.existsSync(SKILL_MD)) { _cache = null; return null; }
  const body = stripFrontmatter(fs.readFileSync(SKILL_MD, 'utf8'));
  _cache = `<EXTREMELY_IMPORTANT>
以下是你的全局规则总纲 constitution,本对话全程必须遵守;其中每处「详见 modules/X」都是强制读取,不是可选参考。总纲正文已在下方给出,不必再用 skill 工具重复加载 constitution。

${body}
</EXTREMELY_IMPORTANT>`;
  return _cache;
};

export const ConstitutionPlugin = async ({ client, directory }) => {
  return {
    // 注入总纲到第一条 user 消息:用 user 而非 system,避免每轮重复的 system token 膨胀,
    // 也避免多条 system 破坏部分模型。transform 每个 agent step 都触发,故靠缓存 + 防重复 guard。
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrap();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;
      // 防重复:已注入过就跳过(消息数组可能被再次穿过本钩子)
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('全局规则总纲 constitution'))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};
