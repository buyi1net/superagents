/**
 * superagents 的 Pi 扩展 —— 开场把 constitution 全局规则总纲注入每个 Pi 会话。
 *
 * 机制照 superpowers 的 .pi/extensions/superpowers.ts 移植,关键点:
 *   - resources_discover 注册 skills/ 为 Pi 原生 skills(Pi 无 Claude Code 的 Skill 工具,
 *     skill 靠原生机制 / 直接 read 加载,不需要兼容层)
 *   - context 事件每次 LLM 调用前触发:把 SKILL.md(剥 frontmatter)包装成
 *     <EXTREMELY_IMPORTANT> 引导,作为一条 user 消息插到消息列表开头(compaction summary 之后)
 *   - 用 user 消息而非 system:system 每轮重复膨胀 token,多 system 消息破坏部分模型
 *   - 生命周期标志:session_start / session_compact 置位(会话开始、压缩后都要重注入),
 *     agent_end 清位(agent run 结束停止注入,防止后续 turn 重复注入)
 *   - 注入前查 marker 去重;SKILL.md 模块级缓存,不每次读盘
 *
 * 靠 import.meta 相对定位扩展内 SKILL.md,不写死绝对路径 —— 换机随包走。
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "superagents:constitution bootstrap for pi";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "../..");
const skillsDir = resolve(packageRoot, "skills");
const constitutionSkillPath = resolve(skillsDir, "constitution", "SKILL.md");

let cachedBootstrap: string | null | undefined;

export default function superagentsPiExtension(pi: ExtensionAPI) {
	let injectBootstrap = true;

	pi.on("resources_discover", async () => ({
		skillPaths: [skillsDir],
	}));

	pi.on("session_start", async () => {
		injectBootstrap = true;
	});

	pi.on("session_compact", async () => {
		injectBootstrap = true;
	});

	pi.on("agent_end", async () => {
		injectBootstrap = false;
	});

	pi.on("context", async (event) => {
		if (!injectBootstrap) return;
		if (event.messages.some(messageContainsBootstrap)) return;

		const bootstrap = getBootstrapContent();
		if (!bootstrap) return;

		const bootstrapMessage = {
			role: "user" as const,
			content: [{ type: "text" as const, text: bootstrap }],
			timestamp: Date.now(),
		};

		const insertAt = firstNonCompactionSummaryIndex(event.messages);
		return {
			messages: [
				...event.messages.slice(0, insertAt),
				bootstrapMessage,
				...event.messages.slice(insertAt),
			],
		};
	});
}

function getBootstrapContent(): string | null {
	if (cachedBootstrap !== undefined) return cachedBootstrap;

	try {
		const skillContent = readFileSync(constitutionSkillPath, "utf8");
		const body = stripFrontmatter(skillContent);
		cachedBootstrap = `${EXTREMELY_IMPORTANT_MARKER}
${BOOTSTRAP_MARKER}

以下是你的全局规则总纲 constitution,本对话全程必须遵守;其中每处「详见 modules/X」都是强制读取,不是可选参考。总纲正文已在下方给出,不必再重复加载 constitution。

${body}

## Pi 适配说明

Pi 没有 Claude Code 的 Skill 工具,也不存在"调用 skill"这个动作:总纲里提到的「modules/X」文件直接用 read 读取;constitution 已注册为 Pi 原生 skill,也可用 /skill:constitution 手动加载。

</EXTREMELY_IMPORTANT>`;
		return cachedBootstrap;
	} catch {
		cachedBootstrap = null;
		return null;
	}
}

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
	return (match ? match[1] : content).trim();
}

function messageContainsBootstrap(message: unknown): boolean {
	const content = (message as { content?: unknown }).content;
	if (typeof content === "string") return content.includes(BOOTSTRAP_MARKER);
	if (!Array.isArray(content)) return false;
	return content.some((part) => {
		return (
			part &&
			typeof part === "object" &&
			(part as { type?: unknown }).type === "text" &&
			typeof (part as { text?: unknown }).text === "string" &&
			(part as { text: string }).text.includes(BOOTSTRAP_MARKER)
		);
	});
}

function firstNonCompactionSummaryIndex(messages: unknown[]): number {
	let index = 0;
	while ((messages[index] as { role?: unknown } | undefined)?.role === "compactionSummary") {
		index += 1;
	}
	return index;
}
