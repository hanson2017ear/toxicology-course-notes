# 毒理学课程笔记

毒理学课堂笔记。老师先用水和盐讲剂量，接着讲砷、汞、铅和镉，最后讲食品安全与生殖毒理。

**[打开阅读网站](https://hanson2017ear.github.io/toxicology-course-notes/)**

有自测的章节可点“复习”，下面的小节链接能跳回正文。另外有一篇双酚 A 专题，从课件里的案例出发，对回八篇原始研究。[双酚 A 专题](https://hanson2017ear.github.io/toxicology-course-notes/#bpa-review) · [原始研究索引](sources/bpa-evidence.md) · [生殖毒理自测](https://hanson2017ear.github.io/toxicology-course-notes/#unit-08/review)

## 学习目录

1. [绪论与课程安排](notes/01.md)
2. [毒理学基本概念](notes/02.md)
3. [爱莉丝与工业毒理学](notes/03.md)
4. [拿破仑死亡之谜、砷与汞](notes/04.md)
5. [帝国灭亡与铅毒理](notes/05.md)
6. [镉与金属毒理总结](notes/06.md)
7. [舌尖上的食品安全](notes/07.md)
8. [使女的故事和生殖毒理学](notes/08.md)

## 阅读方式

手机点页首的“目录”换章，点放大镜查术语。电脑按 `/` 可以直接搜索。大字、明暗和自测勾选保存在当前浏览器，首页可接着读上次打开的一章。下载后也可直接打开 `docs/index.html`。

## 更新笔记与构建

修改 `notes/*.md` 和 `sources/course.json` 后，在Node.js 20或更新版本运行：

```sh
npm install
npm run build
npm run verify
```

构建只需要固定版本的 `marked`。如运行环境已提供该依赖，可把 `NOTES_NODE_MODULES` 设为该环境的模块目录，省去安装。生成的 `docs/content.js` 随仓库保存，阅读网站无需安装任何依赖。

GitHub Pages 从 `main` 分支的 `/docs` 发布。[来源与使用说明](NOTICE.md) · [整理方法](SKILLS.md)
