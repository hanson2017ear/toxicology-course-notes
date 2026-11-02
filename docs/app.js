(() => {
  'use strict';
  const data = window.COURSE;
  const $ = id => document.getElementById(id);
  if (!data || !Array.isArray(data.units)) { $('article').textContent = '笔记内容尚未载入，请检查 content.js 文件。'; return; }
  const storage = {get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let active = 'overview', query = '', searchTimer;
  const units = data.units;
  function applyTheme(theme){document.documentElement.dataset.theme=theme;storage.set('toxicology-theme',theme);$('theme-toggle').textContent=theme==='dark'?'切换浅色':'切换深色';}
  applyTheme(storage.get('toxicology-theme') || (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
  function toggleTheme(){applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')}
  $('theme-toggle').addEventListener('click',toggleTheme);$('mobile-theme').addEventListener('click',toggleTheme);
  function closeMenu(){ $('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');$('backdrop').hidden=true; }
  $('menu-toggle').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));$('backdrop').hidden=!open;});
  $('backdrop').addEventListener('click',closeMenu);
  $('print').addEventListener('click',()=>window.print());
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();$('main').focus();window.scrollTo(0,0);});
  $('font-toggle').addEventListener('click',()=>{const big=document.body.classList.toggle('large-type');$('font-toggle').setAttribute('aria-pressed',String(big));storage.set('toxicology-large',String(big));});
  if(storage.get('toxicology-large')==='true'){document.body.classList.add('large-type');$('font-toggle').setAttribute('aria-pressed','true');}
  document.addEventListener('keydown',event=>{if(event.key==='/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)){event.preventDefault();if(innerWidth<=760){$('sidebar').classList.add('open');$('menu-toggle').setAttribute('aria-expanded','true');$('backdrop').hidden=false;}$('search').focus();}if(event.key==='Escape'){if(query){$('search').value='';query='';render();}closeMenu();}});
  function nav(){
    const q=query.toLocaleLowerCase();
    const filtered=units.filter(u=>!q || (u.title+' '+u.plain).toLocaleLowerCase().includes(q));
    $('unit-count').textContent=units.length+' 单元';
    $('course-nav').innerHTML=`<a class="nav-link" href="#overview" ${active==='overview'&&!query?'aria-current="page"':''}><span class="nav-number">—</span><span class="nav-copy">课程总览<small>来源、覆盖与阅读方式</small></span></a>`+filtered.map(u=>`<a class="nav-link" href="#${u.id}" ${u.id===active&&!query?'aria-current="page"':''}><span class="nav-number">${esc(u.number)}</span><span class="nav-copy">${esc(u.title)}<small>PDF ${esc(u.pages)} 页</small></span></a>`).join('')+(filtered.length?'':'<p class="nav-empty">没有匹配的单元</p>');
    $('search-status').textContent=q?`${filtered.length} 个单元包含“${query}”`:'按 / 快速搜索';
  }
  function overview(){
    return `<div class="about-label">TOXICOLOGY / STUDY NOTES</div><h1>毒理学课程笔记</h1><p class="intro-lead">按课件顺序整理，保留定义、机制、历史案例和复习问题。读概念时，随时可以回到原页核对。</p><div class="unit-meta"><span class="source-tag">${esc(data.source.pageCount)} 页原始材料</span><span>${units.length} 个课件单元</span><span>整理于 ${esc(data.updated)}</span></div><p class="source-note">原件没有连续的授课日期，以下按可核实的课件单元编排，并不声称每个单元恰好对应一次课。目录页列出的其他课程主题，若未出现在现有材料中，不补写成已上课程。</p><div class="overview-list">${units.map(u=>`<a class="overview-row" href="#${u.id}"><span class="row-number">${esc(u.number)}</span><div><div class="row-title">${esc(u.title)}</div><div class="row-description">${esc(u.summary)}</div><div class="row-meta">原 PDF ${esc(u.pages)} 页 · ${esc(u.sourceLabel||'学习单元')}</div></div><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><h2 id="reading-guide">怎样使用这份笔记</h2><p>先读每个单元的主线，再用末尾的问题自测。正文括号中的页码指原 PDF 的文件页序，不是投影片内部页码。图表用文字解释主要关系；无法辨认的数据、重复页和缺失投影片会单独说明。</p><p>涉及旧诊断标准、治疗方案、食品限量和历史统计的部分保留原课件语境。已经查到的关键修正见“来源与勘误”，不能把课堂照片中的旧数值当作现行操作规范。</p><p><a href="#about">查看来源、勘误与完整页码索引 →</a></p>`;
  }
  function about(){return data.aboutHtml || '<h1>来源与整理说明</h1><p>以本地课程材料为主要来源。</p>';}
  function renderOutline(){const headings=[...$('article').querySelectorAll('h2,h3')];$('outline').innerHTML=headings.map((h,i)=>{if(!h.id)h.id='section-'+i;return `<a class="${h.tagName==='H3'?'level-3':''}" href="#${active}/${h.id}">${esc(h.textContent)}</a>`}).join('') || '<span class="source-note">本页没有分节目录</span>';}
  function snippet(u,q){const s=u.plain.replace(/\s+/g,' '),at=s.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()),start=Math.max(0,at-30);return (start?'…':'')+s.slice(start,start+155)+(s.length>start+155?'…':'');}
  function highlighted(s,q){if(!q)return esc(s);let start=0,html='',at;const lower=s.toLocaleLowerCase(),find=q.toLocaleLowerCase();while((at=lower.indexOf(find,start))!==-1){html+=esc(s.slice(start,at))+'<mark>'+esc(s.slice(at,at+q.length))+'</mark>';start=at+q.length;}return html+esc(s.slice(start));}
  function results(){const matches=units.filter(u=>(u.title+' '+u.plain).toLocaleLowerCase().includes(query.toLocaleLowerCase()));return `<h1>搜索笔记</h1><p class="search-summary">${matches.length} 个单元包含“${esc(query)}”</p>`+(matches.length?matches.map(u=>`<a class="search-result" href="#${u.id}"><h2>${highlighted(u.title,query)}</h2><div class="row-meta">PDF ${esc(u.pages)} 页</div><p>${highlighted(snippet(u,query),query)}</p></a>`).join(''):'<div class="empty-state"><h2>没有找到匹配内容</h2><p>试试更短的词，例如“剂量”“铅”或“内分泌”。</p><button id="clear-search" type="button">清除搜索</button></div>');}
  function render(){
    nav();
    if(query){$('article').innerHTML=results();$('breadcrumb').textContent='全文搜索';$('outline').innerHTML='';$('chapter-pager').innerHTML='';$('clear-search')?.addEventListener('click',()=>{$('search').value='';query='';render();});return;}
    const unit=units.find(u=>u.id===active);
    if(unit){$('article').innerHTML=`<div class="about-label">课件单元 ${esc(unit.number)}</div><h1>${esc(unit.title)}</h1><div class="unit-meta"><span class="source-tag">PDF ${esc(unit.pages)} 页</span><span>简体中文学习笔记</span></div>${unit.html}`;$('breadcrumb').textContent=`毒理学 / ${unit.title}`;document.title=unit.title+' · 毒理学笔记';storage.set('toxicology-last',active);const index=units.indexOf(unit);$('chapter-pager').innerHTML=`<div>${index?`<a class="pager-link" href="#${units[index-1].id}"><small>← 上一单元</small>${esc(units[index-1].title)}</a>`:'<a class="pager-link" href="#overview"><small>← 返回</small>课程总览</a>'}</div><div class="pager-next">${index<units.length-1?`<a class="pager-link" href="#${units[index+1].id}"><small>下一单元 →</small>${esc(units[index+1].title)}</a>`:'<a class="pager-link" href="#about"><small>继续阅读 →</small>来源与整理说明</a>'}</div>`;}
    else{$('article').innerHTML=active==='about'?about():overview();$('breadcrumb').textContent=active==='about'?'来源与整理说明':'课程总览';document.title='毒理学 · 课程笔记';$('chapter-pager').innerHTML='';}
    $('article').querySelectorAll('table').forEach(t=>{const wrap=document.createElement('div');wrap.className='table-scroll';wrap.setAttribute('tabindex','0');t.before(wrap);wrap.append(t);});renderOutline();
  }
  function route(){let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash='overview';}const [id,section]=hash.split('/');const valid=id==='about'||id==='overview'||units.some(u=>u.id===id);active=valid?id:'overview';query='';$('search').value='';render();closeMenu();if(section){const target=document.getElementById(section);if(target)window.scrollTo(0,target.getBoundingClientRect().top+window.scrollY-75);}else{window.scrollTo(0,0);}}
  $('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=$('search').value.trim();render();window.scrollTo(0,0);},100);});
  $('course-nav').addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;if(query){query='';$('search').value='';if(a.hash===location.hash){render();closeMenu();}}});
  $('article').addEventListener('click',event=>{const a=event.target.closest('.search-result');if(a){query='';$('search').value='';if(a.hash===location.hash){event.preventDefault();render();closeMenu();window.scrollTo(0,0);}}});
  $('back-top').addEventListener('click',event=>{event.preventDefault();window.scrollTo(0,0);});
  if(data.repositoryUrl){$('repo-link').href=data.repositoryUrl;$('repo-link').textContent='GitHub 仓库';$('repo-link').target='_blank';$('repo-link').rel='noopener noreferrer';}
  window.addEventListener('hashchange',route);
  if(!location.hash){const last=storage.get('toxicology-last');if(last&&units.some(u=>u.id===last))history.replaceState(null,'','#'+last);}
  route();
})();
