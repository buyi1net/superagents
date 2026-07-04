# 工作流类 skills 收集

记录大佬推荐的几个 skill，都是把开发者日常高频工作流封装成 agent skill 的项目，供以后逐个学习、对照。

地址来自网络搜索，未逐一打开核验。标"待核对"的，是搜到多个同名项目、或没搜到确切项目，需要进一步确认。

## 共性

这几个项目（连同图片 / PDF / Excel 处理）是同一个套路：把一类专业工作流封进 skill，让 AI 用它本来就学过的中间表示去操作。hyperframes 把视频表示成 HTML，Slidev 把演示表示成 Markdown，Taste 把设计品味表示成 SKILL.md 规则。专业工具的时间轴、图层 AI 用不转，换成它熟的文本表示就转了，这是这类 skill 能成立的根。

## design taste（UI 设计）

给 AI coding agent 注入设计品味、对抗千篇一律的 "AI slop" 界面。兼容 Claude Code / Cursor / Codex 等。

搜到几个同名相似项目，待核对是哪个：

- Taste Skill — https://www.tasteskill.dev/ （设计品味 skill，较主流的一个）
- UI Craft — https://skills.smoothui.dev/ （同类，号称带 23 个领域参考、4 种模式、anti-slop 检测）
- 另有 app / 浏览器扩展形态的同名项目（buildwithtaste.com 的 Taste app、"AI Design Taste" Chrome 扩展），不是 skill 形态

## hyperframes（视频剪辑）

HeyGen 开源。让 agent 写 HTML / CSS / JS 来定义视频场景、时间轴、动画，再用 headless Chrome 抓帧加 FFmpeg 渲染成 MP4，不用碰传统剪辑软件的时间轴。Apache 2.0，2026 年 4 月发布。

- GitHub — https://github.com/heygen-com/hyperframes
- 官网 — https://hyperframes.heygen.com/

## web video presentation（网页演示）

没搜到确切叫这名字的项目，是一类用 HTML 做网页演示的 skill，待老大给准确名字或链接。候选：

- Slidev — Markdown 加 Vue 写网页幻灯，适合带实时代码演示的技术分享
- frontend-slides — https://github.com/zarazhangrui/frontend-slides
- html-slides / reveal.js 系 — reveal.js 封装的演示 skill

## 待补方向

老大关注、但大佬没给具体项目、我也还没找的工作流，留位以后补：

- 图片处理类
- PDF 处理类
- Excel 处理类
