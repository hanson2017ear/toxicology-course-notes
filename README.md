# 毒理学课程笔记

一份按课件顺序整理的毒理学笔记。从水和盐的剂量讲起，再读砷、汞、铅和镉，最后看食品安全与生殖毒理。目录和正文标了原 PDF 页码，方便翻回课件。

**[打开阅读网站](https://hanson2017ear.github.io/toxicology-course-notes/)** · [来源与勘误](sources/corrections.md) · [316页处置索引](sources/page-index.csv)

想复习某一章，点“复习”就能先看到自测，下面的小节可以跳回正文。另外有一篇双酚 A 专题，从课件里的案例出发，对回八篇原始研究。[双酚 A 专题](https://hanson2017ear.github.io/toxicology-course-notes/#bpa-review) · [原始研究索引](sources/bpa-evidence.md) · [生殖毒理自测](https://hanson2017ear.github.io/toxicology-course-notes/#unit-08/review)

## 学习目录

| 单元 | 内容 | 原PDF页序 |
| --- | --- | --- |
| 01 | [绪论与课程安排](notes/01.md) | 1—4 |
| 02 | [毒理学基本概念](notes/02.md) | 5—38 |
| 03 | [爱莉丝与工业毒理学](notes/03.md) | 39—83 |
| 04 | [拿破仑死亡之谜、砷与汞](notes/04.md) | 85—128 |
| 05 | [帝国灭亡与铅毒理](notes/05.md) | 129—170 |
| 06 | [镉与金属毒理总结](notes/06.md) | 171—180 |
| 07 | [舌尖上的食品安全](notes/07.md) | 182—248 |
| 08 | [使女的故事和生殖毒理学](notes/08.md) | 249—316 |

笔记按课件主题分章。原件缺少连续的授课日期。课程目录还列了反应停、生化核武器、慢性病、癌症等主题，手上的照片缺少这些专题的完整课件。

## 阅读方式

手机点页首的“目录”换章，点放大镜查术语。电脑按 `/` 可以直接搜索。大字、明暗和自测勾选保存在当前浏览器，首页可接着读上次打开的一章。也可下载后直接打开 `docs/index.html`，或在 GitHub 读上表的 Markdown。

页码按 PDF 文件里的顺序数。索引记录这 316 页里哪些为空白、重复或有遮挡。第3页是名单，仅保存在本机。第84和181页是空白分隔。课件里缺失的投影片另见[覆盖说明](sources/coverage-report.md)。

这些是个人学习笔记，识读、写作和核对用过 AI 辅助。课件里的旧诊疗标准、实验条件、历史数值和法规摘录按原页整理，核实过的更新另列在勘误里。思考题附有复习用的参考分析。

## 更新笔记与构建

修改 `notes/*.md` 和 `sources/course.json` 后，在Node.js 20或更新版本运行：

```sh
npm install
npm run build
npm run verify
```

构建只需要固定版本的 `marked`。如运行环境已提供该依赖，可把 `NOTES_NODE_MODULES` 设为该环境的模块目录，省去安装。生成的 `docs/content.js` 随仓库保存，阅读网站无需安装任何依赖。

GitHub Pages发布源为 `main` 分支的 `/docs`。笔记与网页的来源边界、隐私排除和使用条件见[NOTICE](NOTICE.md)，实际使用的Skills见[整理方法](SKILLS.md)。
