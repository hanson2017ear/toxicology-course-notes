(() => {
  'use strict';
  const data = window.COURSE, $ = id => document.getElementById(id);
  if (!data || !Array.isArray(data.units)) { $('article').textContent = '未能载入笔记，请刷新页面，或在 GitHub 仓库的 notes 目录阅读。'; return; }
  const storage = {get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const units = data.units;
  const feature = data.feature?.html ? {id:'bpa-review',...data.feature} : null;
  const evidence = data.evidence?.html ? {id:'evidence',title:'研究证据索引',...data.evidence} : null;
  const resources = [...units,...(feature?[feature]:[]),...(evidence?[evidence]:[])];
  let active='overview',query='',view='read',searchTimer,sectionObserver,assessments={};
  try { assessments=JSON.parse(storage.get('toxicology-assessments')||'{}'); } catch {}
  if(!assessments||Array.isArray(assessments)||typeof assessments!=='object')assessments={};
  function applyTheme(theme){document.documentElement.dataset.theme=theme;storage.set('toxicology-theme',theme);$('theme-toggle').textContent=theme==='dark'?'浅色阅读':'深色阅读';$('mobile-theme').textContent=theme==='dark'?'浅色':'深色';}
  applyTheme(storage.get('toxicology-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
  const toggleTheme=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
  $('theme-toggle').addEventListener('click',toggleTheme);$('mobile-theme').addEventListener('click',toggleTheme);
  function openMenu(){$('sidebar').classList.add('open');$('menu-toggle').setAttribute('aria-expanded','true');$('backdrop').hidden=false;}
  function closeMenu(){$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');$('backdrop').hidden=true;}
  $('menu-toggle').addEventListener('click',()=>$('sidebar').classList.contains('open')?closeMenu():openMenu());$('backdrop').addEventListener('click',closeMenu);
  $('print').addEventListener('click',()=>window.print());
  let printedDetails=[];
  window.addEventListener('beforeprint',()=>{printedDetails=[...document.querySelectorAll('.guide-section')].map(d=>({element:d,open:d.open}));printedDetails.forEach(d=>d.element.open=true);});
  window.addEventListener('afterprint',()=>{printedDetails.forEach(d=>d.element.open=d.open);printedDetails=[];});
  document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();$('main').focus();scrollTo(0,0);});
  function applyFont(big){document.body.classList.toggle('large-type',big);$('font-toggle').setAttribute('aria-pressed',String(big));storage.set('toxicology-large',String(big));}
  applyFont(storage.get('toxicology-large')==='true');$('font-toggle').addEventListener('click',()=>applyFont(!document.body.classList.contains('large-type')));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();if(innerWidth<=780)openMenu();$('search').focus();}if(e.key==='Escape'){if(query){query='';$('search').value='';render();}closeMenu();}});

  // Study excerpts and questions are extracted from the existing source notes.
  function inspect(unit){
    const doc=new DOMParser().parseFromString(unit.html,'text/html'),headings=[...doc.querySelectorAll('h2,h3')];
    headings.forEach((h,i)=>{if(!h.id)h.id='section-'+i;});
    const sections=headings.filter(h=>h.tagName==='H2').map(h=>{const nodes=[];let n=h.nextElementSibling;while(n&&!/^H[12]$/.test(n.tagName)){nodes.push(n);n=n.nextElementSibling;}return{id:h.id,title:h.textContent.trim(),nodes};});
    const questions=sections.filter(s=>/自测/.test(s.title)).flatMap(s=>s.nodes.flatMap(n=>n.matches('ol,ul')?[...n.querySelectorAll(':scope > li')].map(li=>li.textContent.trim()):[]));
    const guide=sections.filter(s=>!/自测|参考文献/.test(s.title)).map(s=>{const text=s.nodes.find(n=>n.tagName==='P')?.textContent.trim().replace(/\s+/g,' ')||'';return{...s,excerpt:text.length>132?text.slice(0,132)+'…':text};});
    return{html:doc.body.innerHTML,guide,questions};
  }
  const inspected=new Map(units.map(u=>[u.id,inspect(u)]));
  function assessmentKey(id,text){let hash=0;for(const c of text)hash=Math.imul(31,hash)+c.codePointAt(0)|0;return id+':'+hash;}
  function assessmentCount(unit){const qs=inspected.get(unit.id).questions;return{done:qs.filter(q=>assessments[assessmentKey(unit.id,q)]).length,total:qs.length};}
  function navLink(id,title,subtitle,number){return`<a class="nav-link" href="#${id}" ${active===id&&!query?'aria-current="page"':''}><span class="nav-number">${esc(number)}</span><span class="nav-copy">${esc(title)}<small>${esc(subtitle)}</small></span></a>`;}
  function nav(){
    const q=query.toLocaleLowerCase(),filtered=units.filter(u=>!q||(u.title+' '+u.plain).toLocaleLowerCase().includes(q));
    $('unit-count').textContent=units.length+' 单元';
    let html=navLink('overview','课程总览','学习路径与材料范围','—')+filtered.map(u=>navLink(u.id,u.title,'原 PDF '+u.pages+' 页',u.number)).join('');
    if(feature&&(!q||(feature.title+' '+feature.plain).toLocaleLowerCase().includes(q)))html+='<div class="nav-divider">专题阅读</div>'+navLink(feature.id,feature.title,'机制与研究比较','研');
    if(evidence&&(!q||(evidence.title+' '+evidence.plain).toLocaleLowerCase().includes(q)))html+=navLink(evidence.id,evidence.title,'研究对象 · 观察 · 解释','证');
    $('course-nav').innerHTML=html+'<div class="nav-divider">资料说明</div>'+navLink('about','来源与勘误','页码索引与关键修正','↗');
    const matches=resources.filter(u=>(u.title+' '+u.plain).toLocaleLowerCase().includes(q));
    $('search-status').textContent=q?`${matches.length} 处资料包含“${query}”`:'按 / 搜索全部内容';
  }
  function overview(){
    const last=units.find(u=>u.id===storage.get('toxicology-last'));
    return`<div class="about-label">课程阅读室 <span aria-hidden="true">/</span> TOXICOLOGY</div><h1>毒理学课程笔记</h1><p class="intro-lead">从接触什么、如何作用，到证据能够说明什么。沿着课件读懂概念，也把不同研究放在一起比较。</p><div class="collection-meta"><span><strong>${units.length}</strong> 个课件单元</span><span><strong>${esc(data.source.pageCount)}</strong> 页来源索引</span><span>更新于 ${esc(data.updated)}</span></div>
    ${last?`<a class="resume-link" href="#${last.id}"><span>继续上次阅读</span><strong>${esc(last.title)}</strong><span aria-hidden="true">→</span></a>`:''}
    <h2 id="learning-path">建议的学习路径</h2><ol class="learning-path"><li><span class="path-index">01—02</span><div><a href="#unit-02">先建立判断框架</a><p>区分毒性、暴露与剂量，理解实验指标能回答的问题。</p></div></li><li><span class="path-index">03—06</span><div><a href="#unit-03">再用案例定位靶点</a><p>从职业调查和金属中毒，连接暴露来源、体内过程与损伤。</p></div></li><li><span class="path-index">07—08</span><div><a href="#unit-07">最后比较证据与风险</a><p>把食品安全、生殖毒理中的机制、人群观察和外推条件分开读。</p></div></li></ol>
    <div class="section-heading"><h2 id="units">逐单元阅读</h2><span>按原课件顺序</span></div><div class="overview-list">${units.map(u=>{const c=assessmentCount(u);return`<a class="overview-row" href="#${u.id}"><span class="row-number">${esc(u.number)}</span><div><div class="row-title">${esc(u.title)}</div><div class="row-description">${esc(u.summary)}</div><div class="row-meta">原 PDF ${esc(u.pages)} 页${c.done?` <span class="study-status">· 自测 ${c.done}/${c.total} 已记录</span>`:''}</div></div><span class="row-arrow" aria-hidden="true">→</span></a>`;}).join('')}</div>
    ${feature?`<section class="feature-entry"><div class="about-label">专题综述</div><h2><a href="#${feature.id}">${esc(feature.title)}</a></h2><p>${esc(feature.summary||'从实验机制到人体观察，比较研究对象、关键发现与证据边界。')}</p><div class="feature-links"><a href="#${feature.id}">阅读全文 →</a>${evidence?`<a href="#${evidence.id}">对照研究证据 →</a>`:''}</div></section>`:''}
    <h2 id="reading-guide">怎样读这份材料</h2><p>每个单元都可切换“阅读全文”和“复习提纲”。复习提纲保留分节导读、原文回看入口与课件自测；自测勾选只记录你自己的复习进度，保存在当前浏览器。</p><p class="source-note">原件没有连续授课日期，因此使用“课件单元”编排。页码指原 PDF 的文件页序，投影片缺页、重复页、旧标准与无法辨认的内容均有说明。<a href="#about">查看材料覆盖与勘误 →</a></p>`;
  }
  function unitHeader(u){return`<div class="about-label">课件单元 <span>${esc(u.number)}</span></div><h1>${esc(u.title)}</h1><p class="unit-lead">${esc(u.summary)}</p><div class="unit-meta"><span class="source-tag">原 PDF ${esc(u.pages)} 页</span><span>${view==='review'?'复习提纲':'完整学习笔记'}</span><a href="#about">来源与勘误 ↗</a></div><div class="reading-controls"><div class="view-switch" aria-label="阅读方式"><button type="button" data-view="read" aria-pressed="${view==='read'}">阅读全文</button><button type="button" data-view="review" aria-pressed="${view==='review'}">复习提纲</button></div><span class="reading-hint">${view==='review'?'提取自本节笔记，不另设标准答案':'保留课件内容与原页定位'}</span></div>`;}
  function review(u){
    const{guide,questions}=inspected.get(u.id),c=assessmentCount(u);
    return`<section class="review-guide"><h2 id="review-guide">分节导读</h2><p class="review-explanation">以下内容摘自各节开头，帮助定位回看；完整条件、图表与限制请进入对应原文。</p><div class="guide-list">${guide.map((s,i)=>`<details class="guide-section"><summary><span class="guide-index">${String(i+1).padStart(2,'0')}</span><span>${esc(s.title)}</span><span class="detail-toggle" aria-hidden="true">+</span></summary><div class="guide-body">${s.excerpt?`<p>${esc(s.excerpt)}</p>`:'<p>本节包含表格或图示说明，请回原文阅读。</p>'}<a href="#${u.id}/${s.id}">回到这节原文 →</a></div></details>`).join('')}</div></section><section class="self-assessment"><div class="section-heading"><h2 id="review-questions">本单元自测</h2><span id="assessment-count">${c.done}/${c.total} 已记录</span></div><p class="review-explanation">合上正文后尝试独立回答。能说明依据和适用条件时，再勾选“已能独立回答”。</p>${questions.length?`<ol class="question-list">${questions.map(q=>{const key=assessmentKey(u.id,q);return`<li><p>${esc(q)}</p><label class="self-check"><input type="checkbox" data-assessment="${esc(key)}" ${assessments[key]?'checked':''}><span>已能独立回答</span></label></li>`;}).join('')}</ol>`:'<p>当前笔记没有单独列出自测题，可沿分节导读回顾。</p>'}<p class="local-record">记录仅保存在当前浏览器。<button type="button" id="reset-assessment">清除此单元记录</button></p></section>`;
  }
  function resourceHeader(r,label){return`<div class="about-label">${esc(label)}</div><h1>${esc(r.title)}</h1>${r.summary?`<p class="unit-lead">${esc(r.summary)}</p>`:''}<div class="unit-meta"><span class="source-tag">专题研究阅读</span>${r.updated?`<span>更新于 ${esc(r.updated)}</span>`:''}<a href="#about">来源与整理说明 ↗</a></div>`;}
  function pager(u){const i=units.indexOf(u),p=units[i-1],n=units[i+1];return`<div><a class="pager-link" href="#${p?.id||'overview'}"><small>← ${p?'上一单元':'返回总览'}</small>${esc(p?.title||'课程学习路径')}</a></div><div class="pager-next"><a class="pager-link" href="#${n?.id||feature?.id||'about'}"><small>${n?'下一单元':feature?'专题阅读':'继续阅读'} →</small>${esc(n?.title||feature?.title||'来源与整理说明')}</a></div>`;}
  function outline(){
    sectionObserver?.disconnect();const hs=[...$('article').querySelectorAll('h2,h3')];
    $('outline').innerHTML=hs.map((h,i)=>{if(!h.id)h.id='section-'+i;return`<a class="${h.tagName==='H3'?'level-3':''}" href="#${active}/${view==='review'&&units.some(u=>u.id===active)?'review/':''}${h.id}">${esc(h.textContent)}</a>`;}).join('')||'<span class="source-note">本页没有分节目录</span>';
    if('IntersectionObserver'in window){sectionObserver=new IntersectionObserver(es=>{const e=es.find(x=>x.isIntersecting);if(e)$('outline').querySelectorAll('a').forEach(a=>a.classList.toggle('current-section',a.hash.endsWith('/'+e.target.id)));},{rootMargin:'-10% 0px -70% 0px'});hs.forEach(h=>sectionObserver.observe(h));}
  }
  function snippet(u,q){const s=String(u.plain||'').replace(/\s+/g,' '),at=s.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()),start=Math.max(0,at-30);return(start?'…':'')+s.slice(start,start+155)+(s.length>start+155?'…':'');}
  function highlight(s,q){if(!q)return esc(s);let start=0,html='',at;const lower=s.toLocaleLowerCase(),find=q.toLocaleLowerCase();while((at=lower.indexOf(find,start))!==-1){html+=esc(s.slice(start,at))+'<mark>'+esc(s.slice(at,at+q.length))+'</mark>';start=at+q.length;}return html+esc(s.slice(start));}
  function results(){const matches=resources.filter(u=>(u.title+' '+u.plain).toLocaleLowerCase().includes(query.toLocaleLowerCase()));return`<div class="about-label">全文检索</div><h1>搜索笔记与专题</h1><p class="search-summary">${matches.length} 处资料包含“${esc(query)}”</p>`+(matches.length?matches.map(u=>`<a class="search-result" href="#${u.id}"><div class="row-meta">${u.number?`课件单元 ${esc(u.number)} · PDF ${esc(u.pages)} 页`:'专题研究资料'}</div><h2>${highlight(u.title,query)}</h2><p>${highlight(snippet(u,query),query)}</p><span class="result-open">打开全文 →</span></a>`).join(''):'<div class="empty-state"><h2>没有找到匹配内容</h2><p>试试更短的词，例如“剂量”“铅”或“内分泌”。</p><button id="clear-search" type="button">清除搜索</button></div>');}
  function render(){
    nav();sectionObserver?.disconnect();
    if(query){$('article').innerHTML=results();$('breadcrumb').textContent='全文搜索';$('outline').innerHTML='';$('chapter-pager').innerHTML='';$('clear-search')?.addEventListener('click',()=>{query='';$('search').value='';render();});updateProgress();return;}
    const u=units.find(x=>x.id===active);document.body.classList.toggle('review-mode',!!u&&view==='review');
    if(u){$('article').innerHTML=unitHeader(u)+(view==='review'?review(u):`<div class="source-content">${inspected.get(u.id).html}</div><p class="source-footnote">本单元依据原 PDF ${esc(u.pages)} 页整理。页码为文件页序；旧标准及研究条件请结合正文限定阅读。<a href="#about">查看来源与勘误</a></p>`);$('breadcrumb').textContent='毒理学 / '+u.title;document.title=u.title+' · 毒理学笔记';storage.set('toxicology-last',active);$('chapter-pager').innerHTML=pager(u);}
    else if(feature&&active===feature.id){$('article').innerHTML=resourceHeader(feature,'专题综述')+`<div class="source-content feature-content">${feature.html}</div>`;$('breadcrumb').textContent='毒理学 / 专题综述';document.title=feature.title+' · 毒理学笔记';$('chapter-pager').innerHTML=`<div><a class="pager-link" href="#unit-08"><small>← 对应课程</small>生殖毒理学</a></div><div class="pager-next"><a class="pager-link" href="#${evidence?.id||'about'}"><small>比较证据 →</small>${esc(evidence?.title||'来源与整理说明')}</a></div>`;}
    else if(evidence&&active===evidence.id){$('article').innerHTML=resourceHeader(evidence,'证据对照')+`<div class="source-content evidence-content">${evidence.html}</div>`;$('breadcrumb').textContent='毒理学 / 研究证据';document.title=evidence.title+' · 毒理学笔记';$('chapter-pager').innerHTML=feature?`<div><a class="pager-link" href="#${feature.id}"><small>← 返回专题</small>${esc(feature.title)}</a></div><div class="pager-next"><a class="pager-link" href="#about"><small>继续阅读 →</small>来源与整理说明</a></div>`:'';}
    else{$('article').innerHTML=active==='about'?(data.aboutHtml||'<h1>来源与整理说明</h1>'):overview();$('breadcrumb').textContent=active==='about'?'来源与整理说明':'课程总览';document.title='毒理学 · 课程阅读室';$('chapter-pager').innerHTML='';}
    $('article').querySelectorAll('table').forEach(t=>{const w=document.createElement('div');w.className='table-scroll';w.setAttribute('tabindex','0');w.setAttribute('role','region');w.setAttribute('aria-label','可横向滚动的比较表');t.before(w);w.append(t);});
    $('article').querySelectorAll('a[href^="http"]').forEach(a=>a.rel='noopener noreferrer');outline();updateProgress();
  }
  function updateProgress(){const a=$('article'),height=Math.max(1,a.offsetHeight-innerHeight+100),ratio=Math.max(0,Math.min(1,(scrollY-a.offsetTop+70)/height));$('reading-progress').style.transform=`scaleX(${ratio})`;}
  let scrollFrame;window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{updateProgress();scrollFrame=null;});},{passive:true});
  function route(){let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash='overview';}const[id,part,nested]=hash.split('/');active=['overview','about',...resources.map(u=>u.id)].includes(id)?id:'overview';view=part==='review'?'review':'read';query='';$('search').value='';render();closeMenu();const section=part==='review'?nested:part;if(section){const t=document.getElementById(section);if(t)scrollTo(0,t.getBoundingClientRect().top+scrollY-(innerWidth<=780?78:30));}else scrollTo(0,0);}
  $('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=$('search').value.trim();render();scrollTo(0,0);},120);});
  function resetQueryForLink(e){const a=e.target.closest('a[href^="#"]');if(!a)return;if(query){query='';$('search').value='';}if(a.hash===location.hash){e.preventDefault();route();}}
  $('course-nav').addEventListener('click',resetQueryForLink);
  document.querySelector('.brand').addEventListener('click',resetQueryForLink);
  document.querySelector('.footer').addEventListener('click',resetQueryForLink);
  $('article').addEventListener('click',e=>{const mode=e.target.closest('[data-view]');if(mode){const url='#'+active+(mode.dataset.view==='review'?'/review':'');if(location.hash!==url)location.hash=url;return;}if(e.target.closest('#reset-assessment')){const u=units.find(u=>u.id===active);if(u){inspected.get(u.id).questions.forEach(q=>delete assessments[assessmentKey(u.id,q)]);storage.set('toxicology-assessments',JSON.stringify(assessments));render();}return;}resetQueryForLink(e);});
  $('article').addEventListener('change',e=>{const c=e.target.closest('[data-assessment]');if(!c)return;if(c.checked)assessments[c.dataset.assessment]=true;else delete assessments[c.dataset.assessment];storage.set('toxicology-assessments',JSON.stringify(assessments));const n=assessmentCount(units.find(u=>u.id===active));$('assessment-count').textContent=`${n.done}/${n.total} 已记录`;});
  $('back-top').addEventListener('click',e=>{e.preventDefault();scrollTo(0,0);});
  if(data.repositoryUrl){$('repo-link').href=data.repositoryUrl;$('repo-link').textContent='GitHub 仓库 ↗';$('repo-link').target='_blank';$('repo-link').rel='noopener noreferrer';}
  window.addEventListener('hashchange',route);if(!location.hash){const last=storage.get('toxicology-last');if(last&&units.some(u=>u.id===last))history.replaceState(null,'','#'+last);}route();
})();
