# 毒理学课程笔记

一份按课件顺序整理的毒理学笔记。从水和盐的剂量讲起，再读砷、汞、铅和镉，最后看食品安全与生殖毒理。目录和正文标了原 PDF 页码，方便翻回课件。

**[打开阅读网站](https://hanson2017ear.github.io/toxicology-course-notes/)** · [来源与勘误](sources/corrections.md) · [316页处置索引](sources/page-index.csv)

想复习某一章，点“复习”就能先看到自测，下面的小节可以跳回正文。另有一篇从课件的双酚 A 案例读到原始研究的专题。[双酚 A 专题](https://hanson2017ear.github.io/toxicology-course-notes/#bpa-review) · [原始研究索引](sources/bpa-evidence.md) · [生殖毒理自测](https://hanson2017ear.github.io/toxicology-course-notes/#unit-08/review)

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

原件没有连续的授课日期，单元与真实课次无法逐一对应。课程目录列出的反应停、生化核武器、慢性病、癌症等其他主题，现有材料没有独立完整内容，未据目录补写。

## 阅读方式

手机点页首的“目录”换章，点放大镜查术语。电脑按 `/` 可以直接搜索。大字、明暗和自测勾选保存在当前浏览器，首页可接着读上次打开的一章。也可下载后直接打开 `docs/index.html`，或在 GitHub 读上表的 Markdown。

页码指文件的物理页序，不是投影片内部页码。第3页名单未公开，第84和181页为空白分隔，重复与遮挡材料另有说明。索引覆盖316页，并不表示316页都含有可读正文，也不代表已经获得每套PPT的全部投影片。详见[覆盖说明](sources/coverage-report.md)。

这是非官方学习整理，经过AI辅助识读、写作及核对，仍可能存在识读或解释错误。旧诊疗标准、实验条件、历史数值和法规摘录保留其教学语境；已核实的关键更新单独列出。思考题的“参考分析”不是教师标准答案。

## 更新笔记与构建

修改 `notes/*.md` 和 `sources/course.json` 后，在Node.js 20或更新版本运行：

```sh
npm install
npm run build
npm run verify
```

构建只需要固定版本的 `marked`。如运行环境已提供该依赖，可把 `NOTES_NODE_MODULES` 设为该环境的模块目录，省去安装。生成的 `docs/content.js` 随仓库保存，阅读网站无需安装任何依赖。

GitHub Pages发布源为 `main` 分支的 `/docs`。笔记与网页的来源边界、隐私排除和使用条件见[NOTICE](NOTICE.md)，实际使用的Skills见[整理方法](SKILLS.md)。
