(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const course = window.COURSE;
  if (!course?.units) {
    $('article').textContent = '笔记没有加载。刷新试试，也可以去 GitHub 读 Markdown。';
    return;
  }

  const units = course.units;
  const resources = [...units, ...[course.feature, course.evidence].filter(Boolean)];
  const byId = new Map(resources.map(r => [r.id, r]));
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  };
  const escaped = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => escaped[char]);
  const article = $('article');
  const search = $('search');
  const menu = $('menu-toggle');
  const smallScreen = matchMedia('(max-width: 1019px)');
  const title = unit => esc(unit.shortTitle || unit.title);
  let active = 'overview';
  let view = 'read';
  let query = '';
  let searchTimer;
  let sectionObserver;
  let assessments = {};
  try { assessments = JSON.parse(storage.get('toxicology-assessments') || '{}'); } catch {}
  if (!assessments || Array.isArray(assessments) || typeof assessments !== 'object') assessments = {};

  // Keep existing section URLs and saved study marks when the layout changes.
  const notes = new Map(units.map(unit => {
    const doc = new DOMParser().parseFromString(unit.html, 'text/html');
    const headings = [...doc.querySelectorAll('h2,h3')];
    headings.forEach((heading, i) => { if (!heading.id) heading.id = `section-${i}`; });
    const sections = headings.filter(h => h.tagName === 'H2').map(h => {
      const siblings = [];
      for (let n = h.nextElementSibling; n && !n.matches('h1,h2'); n = n.nextElementSibling) siblings.push(n);
      return {id:h.id, title:h.textContent.trim(), siblings};
    });
    const questions = sections.filter(s => s.title.includes('自测')).flatMap(s =>
      s.siblings.filter(n => n.matches('ol,ul')).flatMap(n => [...n.querySelectorAll(':scope > li')].map(li => li.textContent.trim())));
    const guide = sections.filter(s => !/自测|参考文献/.test(s.title)).map(s => {
      const lead = s.siblings.find(n => n.tagName === 'P')?.textContent.trim() || '';
      return {...s, excerpt:lead.length > 136 ? lead.slice(0,136) + '…' : lead};
    });
    return [unit.id, {html:doc.body.innerHTML, questions, guide}];
  }));

  function questionKey(id, text) {
    let hash = 0;
    for (const c of text) hash = Math.imul(31, hash) + c.codePointAt(0) | 0;
    return id + ':' + hash;
  }

  function questionCount(id) {
    const keys = notes.get(id).questions.map(q => questionKey(id, q));
    return `${keys.filter(key => assessments[key]).length} / ${keys.length}`;
  }

  function navigation() {
    function item(id, label, number) {
      return `<a class="nav-link" href="#${esc(id)}" ${id === active && !query ? 'aria-current="page"' : ''}>
        ${number ? `<span class="nav-number">${esc(number)}</span>` : ''}<span>${label}</span></a>`;
    }
    $('course-nav').innerHTML = item('overview','首页') + units.map(u => item(u.id,title(u),u.number)).join('')
      + (course.feature ? `<div class="nav-extra">${item(course.feature.id,'双酚 A 专题')}${course.evidence ? item(course.evidence.id,'原始研究') : ''}</div>` : '');
  }

  function home() {
    const last = byId.get(storage.get('toxicology-last'));
    return `<div class="home-intro">
      <h1>毒理学笔记</h1>
      <p>课上从水和盐讲剂量，再用拿破仑的死因、水俣病和食品安全几个案例讨论证据。笔记按课件顺序排，右边的数字是原 PDF 页码。</p>
      ${last?.number ? `<p class="resume"><a href="#${last.id}">接着看《${title(last)}》</a></p>` : ''}
    </div>
    <div class="home-columns">
      <section aria-labelledby="chapters">
        <div class="contents-head"><h2 id="chapters">课件目录</h2><span>原 PDF 页码</span></div>
        <ol class="contents-list">${units.map(u => `<li><a href="#${u.id}" class="chapter-entry">
          <span class="chapter-number">${esc(u.number)}</span>
          <span class="chapter-description"><strong>${title(u)}</strong><span>${esc(u.summary)}</span></span>
          <span class="chapter-pages">${esc(u.pages)}</span>
        </a></li>`).join('')}</ol>
      </section>
      <aside class="study-margin" aria-labelledby="reading-guide">
        <h2 id="reading-guide">复习时翻这几处</h2>
        <ul>
          <li><a href="#unit-02/section-0">水和食盐也能讨论毒性？</a><span>第 7–14 页</span></li>
          <li><a href="#unit-04/section-0">头发里测到砷，能说明什么？</a><span>第 85–90 页</span></li>
          <li><a href="#unit-08/review">孕期接触和成年后接触，差在哪？</a><span>生殖毒理自测</span></li>
        </ul>
        ${course.feature ? `<div class="margin-feature"><h2>课外多读一点</h2><a href="#${course.feature.id}">双酚 A 与男性生殖毒性</a><p>把课上两条机制和四项人体研究放在一起读。配图和论文都可以点开。</p></div>` : ''}
      </aside>
    </div>
    <p class="home-footnote">课件有些页没有拍到，所以这里按照片中的主题分章。<a href="#about">页码、缺页和勘误</a></p>`;
  }

  function unitHeader(unit) {
    const viewLink = (mode, label) => `<a href="#${unit.id}${mode === 'review' ? '/review' : ''}" ${view === mode ? 'aria-current="page"' : ''}>${label}</a>`;
    return `<div class="chapter-heading">
      <p class="page-label">第 ${Number(unit.number)} 章 <span>PDF ${esc(unit.pages)} 页</span></p>
      <h1>${title(unit)}</h1>
      <div class="reader-tools">
        <nav class="view-switch" aria-label="阅读方式">${viewLink('read','笔记')}${viewLink('review','复习')}</nav>
        <div class="tool-buttons"><button id="font-toggle" class="quiet-button" type="button">大字</button><button id="print" class="quiet-button" type="button">打印</button></div>
      </div></div>`;
  }

  function review(unit) {
    const {guide, questions} = notes.get(unit.id);
    return `<section class="self-assessment">
      <div class="section-heading"><h2 id="review-questions">先做几道题</h2><span id="assessment-count" aria-live="polite">${questionCount(unit.id)}</span></div>
      <p>先试着回答。有把握了就打勾。</p>
      <ol class="question-list">${questions.map(q => {
        const key = questionKey(unit.id,q);
        return `<li><label><input type="checkbox" data-assessment="${esc(key)}" ${assessments[key] ? 'checked' : ''}><span>${esc(q)}</span></label></li>`;
      }).join('')}</ol>
      <div class="record"><span>勾选只存在这台设备的当前浏览器。</span><button type="button" class="quiet-button" id="reset-assessment">清除勾选</button></div>
    </section>
    <section class="review-guide"><h2 id="review-guide">按小节回看</h2>
      ${guide.map(s => `<details class="guide-section"><summary>${esc(s.title)}</summary>
        <div>${s.excerpt ? `<p>${esc(s.excerpt)}</p>` : ''}<a href="#${unit.id}/${s.id}">读这一节</a></div></details>`).join('')}
    </section>`;
  }

  function renderResource(resource) {
    const noteText = resource.id === 'bpa-review' ? '生殖毒理学的课外阅读' : '双酚 A 专题所用文献';
    const related = resource.id === 'bpa-review' ? 'evidence' : 'bpa-review';
    return `<header class="resource-heading"><p class="page-label">${noteText}</p><h1>${title(resource)}</h1>
      <p class="resource-links"><a href="#unit-08">回到生殖毒理笔记</a><a href="#${related}">${related === 'evidence' ? '查原始研究' : '回到双酚 A 专题'}</a></p>
      </header><div class="source-content resource-content">${resource.html}</div>`;
  }

  function setPager(unit) {
    const pager = $('chapter-pager');
    pager.hidden = !unit?.number || Boolean(query);
    if (pager.hidden) return;
    const i = units.indexOf(unit);
    const prev = units[i-1];
    const next = units[i+1] || course.feature;
    pager.innerHTML = `<a href="#${prev?.id || 'overview'}"><small>${prev ? '上一章' : '返回'}</small>${prev ? title(prev) : '课件目录'}</a>
      ${next ? `<a href="#${next.id}"><small>${next.number ? '下一章' : '课外阅读'}</small>${title(next)}</a>` : ''}`;
  }

  function renderOutline() {
    sectionObserver?.disconnect();
    const headings = [...article.querySelectorAll('h2,h3')];
    const outline = $('outline');
    $('outline-shell').hidden = Boolean(query) || active === 'overview' || headings.length < 2;
    if ($('outline-shell').hidden) return;
    const sectionHref = h => `#${active}/${view === 'review' ? 'review/' : ''}${h.id}`;
    headings.forEach((h,i) => { if (!h.id) h.id = `section-${i}`; });
    const linkList = headings.map(h => {
      const description = h.textContent.trim().replace(/\s*[（(](?:PDF\s*第?\s*)?\d+[^）)]*页[）)]$/, '');
      return `<a class="${h.tagName === 'H3' ? 'subsection' : ''}" href="${sectionHref(h)}">${esc(description)}</a>`;
    }).join('');
    outline.innerHTML = linkList;
    if (byId.get(active)?.number) {
      const inline = document.createElement('details');
      inline.className = 'inline-outline';
      inline.innerHTML = `<summary>本章小节</summary><nav aria-label="本章小节">${linkList}</nav>`;
      article.querySelector('.chapter-heading').after(inline);
    }
    if ('IntersectionObserver' in window) {
      sectionObserver = new IntersectionObserver(entries => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) outline.querySelectorAll('a').forEach(a => {
          if (a.hash === sectionHref(visible.target)) a.setAttribute('aria-current','location');
          else a.removeAttribute('aria-current');
        });
      }, {rootMargin:'-15% 0px -73% 0px'});
      headings.forEach(h => sectionObserver.observe(h));
    }
  }

  const folded = value => value.normalize('NFKC').toLocaleLowerCase();
  function highlight(value) {
    const needle = folded(query);
    const lower = folded(value);
    const start = lower.indexOf(needle);
    if (start < 0 || lower.length !== value.length) return esc(value);
    return esc(value.slice(0,start)) + '<mark>' + esc(value.slice(start,start+needle.length)) + '</mark>' + esc(value.slice(start+needle.length));
  }

  function results() {
    const needle = folded(query);
    const matches = resources.filter(r => folded(r.title + ' ' + r.plain).includes(needle));
    return `<h1>搜索结果</h1><p class="result-meta" role="status">“${esc(query)}”${matches.length ? `找到 ${matches.length} 篇` : '没有找到'}</p>
      ${matches.length ? `<ul class="results">${matches.map(r => {
        const text = r.plain.replace(/\s+/g,' ');
        const match = folded(text).indexOf(needle);
        const from = Math.max(0,match-27);
        return `<li><a href="#${r.id}"><h2>${highlight(r.shortTitle || r.title)}</h2>${r.number ? `<span class="result-meta">PDF ${esc(r.pages)} 页</span>` : ''}
          <p>${from ? '…' : ''}${highlight(text.slice(from,from+143))}${text.length > from+143 ? '…' : ''}</p></a></li>`;
      }).join('')}</ul>` : '<p>试试一个更短的词，比如“铅”或“剂量”。</p><button type="button" class="quiet-button" id="clear-search">清空搜索</button>'}`;
  }

  function render() {
    const resource = byId.get(active);
    document.body.dataset.page = query ? 'search' : active === 'overview' ? 'home' : 'read';
    navigation();
    if (query) article.innerHTML = results();
    else if (resource?.number) {
      article.innerHTML = unitHeader(resource) + (view === 'review' ? review(resource) : `<div class="source-content">${notes.get(active).html}</div>`);
      storage.set('toxicology-last',active);
    } else if (resource) article.innerHTML = renderResource(resource);
    else article.innerHTML = active === 'about' ? course.aboutHtml : home();
    document.title = query ? '搜索 · 毒理学笔记' : resource ? `${resource.title} · 毒理学笔记` : '毒理学笔记';
    article.querySelectorAll('table').forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role','region');
      wrapper.setAttribute('aria-label','表格，可向右滚动');
      table.before(wrapper);
      wrapper.append(table);
    });
    article.querySelectorAll('img[src^="assets/"]').forEach(img => {
      const caption = img.parentElement.nextElementSibling;
      if (!caption?.matches('p') || !/^图\s*\d/.test(caption.textContent)) return;
      caption.classList.add('figure-caption');
      const original = img.getAttribute('src');
      const link = [...caption.querySelectorAll('a')].find(a => a.getAttribute('href') === original);
      img.src = original + '?v=notebook';
      if (link) link.href = img.src;
    });
    setPager(resource);
    applyFont(storage.get('toxicology-large') === 'true');
    renderOutline();
  }

  function closeMenu(restore = false) {
    const wasOpen = $('sidebar').classList.contains('open');
    $('sidebar').classList.remove('open');
    $('backdrop').hidden = true;
    menu.setAttribute('aria-expanded','false');
    if (restore && wasOpen) menu.focus();
  }

  function openMenu() {
    $('sidebar').classList.add('open');
    $('backdrop').hidden = false;
    menu.setAttribute('aria-expanded','true');
    ($('course-nav').querySelector('[aria-current="page"]') || $('course-nav').querySelector('a'))?.focus();
  }

  function route() {
    clearTimeout(searchTimer);
    let hash = '';
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch {}
    const [id, part, subpart] = hash.split('/');
    active = id === 'about' || byId.has(id) ? id : 'overview';
    view = part === 'review' && byId.get(active)?.number ? 'review' : 'read';
    query = '';
    search.value = '';
    render();
    closeMenu();
    const section = view === 'review' ? subpart : part;
    const target = section ? document.getElementById(section) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0,0);
  }

  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    storage.set('toxicology-theme', dark ? 'dark' : 'light');
    $('theme-toggle').textContent = dark ? '浅色' : '深色';
    $('theme-toggle').setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
  }

  function applyFont(big) {
    document.body.classList.toggle('large-type',big);
    storage.set('toxicology-large',String(big));
    $('font-toggle')?.setAttribute('aria-pressed',String(big));
  }

  let printedDetails = [];
  window.addEventListener('beforeprint', () => {
    printedDetails = [...article.querySelectorAll('.guide-section:not([open])')];
    printedDetails.forEach(d => d.open = true);
  });
  window.addEventListener('afterprint', () => { printedDetails.forEach(d => d.open = false); printedDetails = []; });

  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { query = search.value.trim(); render(); window.scrollTo(0,0); }, 110);
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === location.hash && (query || $('sidebar').classList.contains('open'))) {
      event.preventDefault();
      route();
    }
  });
  article.addEventListener('click', event => {
    const id = event.target.closest('button')?.id;
    if (id === 'font-toggle') applyFont(!document.body.classList.contains('large-type'));
    if (id === 'print') window.print();
    if (id === 'clear-search') { route(); search.focus(); }
    if (id === 'reset-assessment') {
      notes.get(active).questions.forEach(q => delete assessments[questionKey(active,q)]);
      storage.set('toxicology-assessments',JSON.stringify(assessments));
      article.querySelectorAll('[data-assessment]').forEach(input => input.checked = false);
      $('assessment-count').textContent = questionCount(active);
    }
  });
  article.addEventListener('change', event => {
    const field = event.target.closest('[data-assessment]');
    if (!field) return;
    if (field.checked) assessments[field.dataset.assessment] = true;
    else delete assessments[field.dataset.assessment];
    storage.set('toxicology-assessments',JSON.stringify(assessments));
    $('assessment-count').textContent = questionCount(active);
  });

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.target.matches('input, textarea, select, [contenteditable]') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === 'Escape') {
      if ($('sidebar').classList.contains('open')) closeMenu(true);
      else if (query || search.value) { route(); search.focus(); }
    }
  });
  applyTheme(storage.get('toxicology-theme') === 'dark' || (storage.get('toxicology-theme') === null && matchMedia('(prefers-color-scheme: dark)').matches));
  $('theme-toggle').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme !== 'dark'));
  menu.addEventListener('click', () => $('sidebar').classList.contains('open') ? closeMenu(true) : openMenu());
  $('backdrop').addEventListener('click', () => closeMenu(true));
  smallScreen.addEventListener('change', () => closeMenu());
  $('back-top').addEventListener('click', () => window.scrollTo(0,0));
  document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); $('main').focus(); });
  window.addEventListener('hashchange', route);
  route();
})();
