/* ==========================================
   huiwu.com — SPA + 便签墙 + AI 对话
   ========================================== */

// ─── Supabase 配置 ─────────────────────────────
const SUPABASE_URL = 'https://wwqqvfnuxpddhgwuwiut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JlVVDqSKs7RHM6VMldBIYA_CsLWihKo';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cXF2Zm51eHBkZGhnd3V3aXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzAwNDcsImV4cCI6MjA5NjI0NjA0N30.eCfxc2WeXkpJiMXRCzydwmFE3Z6UMk3aqOdrhdzZbug';
const SUPABASE_FN_URL = `${SUPABASE_URL}/functions/v1/chat`;

const supabaseHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
});

function createSession() {
  const arr = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('') + '.' + Date.now();
}

async function validateAccessKey(key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_access_key`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({ input_key: key }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `请求失败 (${res.status})`);
  return data;
}

// ─── 访问门禁 ──────────────────────────────────
(function checkAuth() {
  const session = localStorage.getItem('huiwu_session');
  if (session) {
    try {
      const { time } = JSON.parse(session);
      if (Date.now() - time < 3 * 24 * 60 * 60 * 1000) return; // 3天有效
    } catch (_) {}
  }
  // 无有效会话，渲染门禁页
  document.body.innerHTML = `
    <div class="gate-page">
      <div class="gate-box">
        <h1>huiwu.com</h1>
        <p>请输入访问密钥</p>
        <input type="password" id="gateKey" placeholder="密钥…" autofocus />
        <button id="gateBtn">进入</button>
        <label><input type="checkbox" id="gateRemember" checked /> 记住 3 天</label>
        <p id="gateErr" style="color:#e05555;display:none"></p>
      </div>
    </div>`;
  document.getElementById('gateBtn').addEventListener('click', async () => {
    const key = document.getElementById('gateKey').value.trim();
    if (!key) return;
    const errEl = document.getElementById('gateErr');
    try {
      const data = await validateAccessKey(key);
      if (data.valid) {
        localStorage.setItem('huiwu_session', JSON.stringify({ session: createSession(), time: Date.now() }));
        location.reload();
      } else if (data.error === 'access_key not configured') {
        errEl.textContent = '服务端未配置密钥，请在 settings 表设置 access_key';
        errEl.style.display = 'block';
      } else {
        errEl.textContent = '密钥错误';
        errEl.style.display = 'block';
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('validate_access_key')) {
        errEl.textContent = '数据库函数未创建，请在 Supabase 执行 fix-migration.sql';
      } else if (msg.includes('PGRST205')) {
        errEl.textContent = '数据表未暴露给 API，请在 Supabase 执行 fix-migration.sql';
      } else {
        errEl.textContent = msg.includes('Failed to fetch') ? '网络错误，请检查网络或 Supabase 配置' : (msg || '网络错误');
      }
      errEl.style.display = 'block';
    }
  });
  throw new Error('GATE'); // 阻止后续 JS 执行
})();

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const opts = { method, headers: { ...supabaseHeaders(), ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
  if (!res.ok) { console.error(`API ${method} ${path} failed:`, res.status); return null; }
  if (res.status === 204) return null;
  return res.json();
}

const view = document.getElementById('view'), navTitle = document.getElementById('nav-title'), navBack = document.getElementById('nav-back');
const tplWall = document.getElementById('tpl-wall'), tplChat = document.getElementById('tpl-chat');
const $ = (sel, ctx) => (ctx || document).querySelector(sel);

const routes = {
  '': renderHome, 'info': renderInfo, 'info/notes': renderWall, 'info/reply': renderChat,
  'info/collect': () => renderPlaceholder('信息收集', '搜集、整理、归纳，构建你的知识库。', '🔍'),
  'history': () => renderPlaceholder('历史记录', '更多记录功能即将上线。', '📜'),
};
const navbarTitles = { '': 'huiwu.com', 'info': '信息板块', 'info/notes': '信息记载', 'info/reply': '信息回复', 'info/collect': '信息收集', 'history': '历史记录' };

function updateNavbar(r) { navTitle.textContent = navbarTitles[r] || 'huiwu.com'; navBack.classList.toggle('hidden', r === ''); }
function goBack() { const c = getRoute(); navigateTo(c.startsWith('info/') ? 'info' : ''); }
function getRoute() { return window.location.hash.replace(/^#\/?/, ''); }
function navigateTo(r) { window.location.hash = '#/' + r; }
function handleRoute() { const r = getRoute(); updateNavbar(r); const fn = routes[r]; view.innerHTML = ''; if (fn) fn(); else navigateTo(''); }
window.addEventListener('hashchange', handleRoute); navBack.addEventListener('click', goBack);

function renderHome() {
  view.innerHTML = `<div class="page-home"><div class="home-hero"><h1>huiwu.com</h1><p>记录碎片灵感 · 解答学习困惑 · 收集万千信息</p></div><div class="home-cards"><div class="home-card" data-nav="info"><div class="home-card-icon info">📋</div><div class="home-card-body"><h3>信息板块</h3><p>便签记载 · AI对话 · 信息收集</p></div><span class="home-card-arrow">›</span></div><div class="home-card" data-nav="history"><div class="home-card-icon history">📜</div><div class="home-card-body"><h3>历史记录</h3><p>书籍阅读 · 日常记录 · 时间线回顾</p></div><span class="home-card-arrow">›</span></div></div></div>`;
  view.querySelectorAll('.home-card').forEach(c => c.addEventListener('click', () => navigateTo(c.dataset.nav)));
}
function renderInfo() {
  view.innerHTML = `<div class="page-info"><p class="section-title">选择功能</p><div class="info-cards"><div class="info-card" data-nav="info/notes"><div class="info-card-dot notes"></div><div class="info-card-body"><h4>信息记载</h4><p>便签墙 — 像在墙上贴便签一样记录碎片想法</p></div><span class="info-card-arrow">›</span></div><div class="info-card" data-nav="info/reply"><div class="info-card-dot reply"></div><div class="info-card-body"><h4>信息回复</h4><p>AI 对话，解答学习疑问</p></div><span class="info-card-arrow">›</span></div><div class="info-card" data-nav="info/collect"><div class="info-card-dot collect"></div><div class="info-card-body"><h4>信息收集</h4><p>搜集、整理外部信息，构建知识体系</p></div><span class="info-card-arrow">›</span></div></div></div>`;
  view.querySelectorAll('.info-card').forEach(c => c.addEventListener('click', () => navigateTo(c.dataset.nav)));
}
function renderPlaceholder(title, desc, icon) { view.innerHTML = `<div class="page-placeholder"><div class="ph-icon">${icon||'🚧'}</div><h3>${title}</h3><p>${desc}</p></div>`; }

// ═══ 便签墙 ═══
function renderWall() {
  const clone = tplWall.content.cloneNode(true); view.appendChild(clone);
  const wall = $('.wall', view), wallBg = $('.wall-bg', view), notesLayer = $('.notes-layer', view);
  const bgInput = $('.bg-input', view), hint = $('.create-hint', view), noteCount = $('.tool-note-count', view);
  const toolbar = $('.toolbar', view);
  const btnPan = $('.float-btn-pan', view), btnAdd = $('.float-btn-add', view), btnTool = $('.float-btn-tool', view);
  let notes = [], editingId = null, bgDataUrl = null, zoomLevel = 1, createLocked = false;

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function fmtDate(v) { if (!v) return ''; const d = new Date(v); return isNaN(d.getTime()) ? '' : `${d.getMonth()+1}月${d.getDate()}日`; }
  function mapRow(r) { return { id: r.id, x: Number(r.pos_x), y: Number(r.pos_y), text: r.content||'', rolled: Boolean(r.rolled), createdAt: r.created_at }; }
  function toRow(n) { return { id: n.id, pos_x: n.x, pos_y: n.y, content: n.text, rolled: n.rolled }; }

  async function loadNotes() { const d = await api('/notes?select=*&order=created_at.desc'); if (d) notes = d.map(mapRow); }
  async function saveNote(n) { await api(`/notes?id=eq.${n.id}`, { method:'PATCH', body:toRow(n), headers:{'Prefer':'return=minimal'} }); }
  async function createNoteAPI(n) { await api('/notes', { method:'POST', body:{...toRow(n), created_at:new Date().toISOString()}, headers:{'Prefer':'return=minimal'} }); }
  async function deleteNoteAPI(id) { await api(`/notes?id=eq.${id}`, { method:'DELETE' }); }
  async function loadBg() { const d = await api('/settings?key_name=eq.bg_image&select=value'); if (d&&d.length>0&&d[0].value) { bgDataUrl=d[0].value; wallBg.style.backgroundImage=`url(${bgDataUrl})`; } }
  async function saveBg() { await api('/settings', { method:'POST', body:{key_name:'bg_image',value:bgDataUrl||''}, headers:{'Prefer':'resolution=merge-duplicates'} }); }

  bgInput.addEventListener('change', e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{bgDataUrl=r.result;wallBg.style.backgroundImage=`url(${bgDataUrl})`;saveBg();}; r.readAsDataURL(f);bgInput.value=''; });
  function updateCount() { noteCount.textContent = `${notes.length} 张便签`; }
  function updateHint() { hint.classList.toggle('visible', notes.length === 0); }
  function autoResize(ta) { ta.style.height='auto'; ta.style.height=Math.max(60,ta.scrollHeight)+'px'; }
  function renderAllNotes() { notesLayer.innerHTML=''; notes.forEach(n=>renderNote(n)); updateCount(); updateHint(); }

  function renderNote(note) {
    const el=document.createElement('div'); el.className='note'+(note.rolled?' rolled':' expanded'); el.dataset.id=note.id;
    el.style.left=note.x+'%'; el.style.top=note.y+'%'; el.style.transform='translate(-50%,-50%)';
    el.innerHTML=`<div class="note-inner"><div class="note-header"><div class="note-pin"></div><span class="note-date">${fmtDate(note.createdAt)}</span><button class="note-delete" data-action="delete">×</button></div><textarea class="note-body" placeholder="写点什么…">${esc(note.text)}</textarea></div><div class="note-preview">${esc(note.text)||'空白便签'}</div>`;
    const ta=el.querySelector('.note-body'), db=el.querySelector('.note-delete');
    ta.addEventListener('input',()=>{note.text=ta.value;el.querySelector('.note-preview').textContent=note.text||'空白便签';autoResize(ta);debounceSaveNote(note);});
    ta.addEventListener('pointerdown',e=>{e.stopPropagation();editingId=note.id;});
    db.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();deleteNote(note.id);});
    el.addEventListener('pointerdown',e=>{if(e.target.dataset.action==='delete')return;e.stopPropagation();if(note.rolled){expandNote(note.id);return;}editingId=note.id;startDrag(e,el,note);});
    requestAnimationFrame(()=>autoResize(ta)); notesLayer.appendChild(el); return el;
  }

  const OVERLAP_X=28,OVERLAP_Y=24;
  function hasOverlap(x,y,exId){for(const n of notes){if(n.id===exId||n.rolled)continue;if(Math.abs(n.x-x)<OVERLAP_X&&Math.abs(n.y-y)<OVERLAP_Y)return n;}return null;}
  function findFreeSpot(bx,by){const st=[0,30,60,-30,-60,90,-90,120,-120,45,-45,75,-75];for(const s of st){const tx=clamp(bx+s*.6,5,95),ty=clamp(by+s*.4,5,90);if(!hasOverlap(tx,ty,null))return{x:tx,y:ty};}return{x:clamp(bx,5,95),y:clamp(by,5,90)};}

  async function createNote(cx,cy){
    if(createLocked)return;createLocked=true;setTimeout(()=>{createLocked=false;},500);
    notes.forEach(n=>{if(!n.rolled&&n.id!==editingId){n.rolled=true;saveNote(n);}});
    const rect=wall.getBoundingClientRect();let x=((cx-rect.left)/rect.width)*100,y=((cy-rect.top)/rect.height)*100;
    if(hasOverlap(x,y,null)){const sp=findFreeSpot(x,y);x=sp.x;y=sp.y;}
    const note={id:uid(),x:clamp(x,5,95),y:clamp(y,5,90),text:'',rolled:false,createdAt:new Date().toISOString()};
    notes.push(note);editingId=note.id;createNoteAPI(note);
    notesLayer.innerHTML='';notes.forEach(n=>renderNote(n));updateCount();updateHint();
    requestAnimationFrame(()=>{const nel=notesLayer.querySelector(`[data-id="${note.id}"]`);if(nel){const ta=nel.querySelector('.note-body');if(ta)ta.focus();}});
  }

  async function deleteNote(id){notes=notes.filter(n=>n.id!==id);if(editingId===id)editingId=null;notesLayer.innerHTML='';notes.forEach(n=>renderNote(n));updateCount();updateHint();deleteNoteAPI(id);}

  function rollUpNote(id){const note=notes.find(n=>n.id===id);if(!note||note.rolled)return;note.rolled=true;editingId=null;const el=notesLayer.querySelector(`[data-id="${id}"]`);if(el){el.classList.remove('expanded');el.classList.add('rolled');el.querySelector('.note-preview').textContent=note.text||'空白便签';}saveNote(note);}

  function expandNote(id){notes.forEach(n=>{if(n.id!==id&&!n.rolled){n.rolled=true;const o=notesLayer.querySelector(`[data-id="${n.id}"]`);if(o){o.classList.remove('expanded');o.classList.add('rolled');o.querySelector('.note-preview').textContent=n.text||'空白便签';}saveNote(n);}});const note=notes.find(n=>n.id===id);if(!note)return;note.rolled=false;editingId=id;const el=notesLayer.querySelector(`[data-id="${id}"]`);if(el){el.classList.remove('rolled');el.classList.add('expanded');requestAnimationFrame(()=>{const ta=el.querySelector('.note-body');if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}});}saveNote(note);}

  let dragState=null;
  function startDrag(e,el,note){dragState={note,el,startX:e.clientX,startY:e.clientY,origLeft:parseFloat(el.style.left)||0,origTop:parseFloat(el.style.top)||0,moved:false};el.classList.add('dragging');el.setPointerCapture(e.pointerId);el.onpointermove=onDrag;el.onpointerup=endDrag;el.onpointercancel=endDrag;}
  function onDrag(e){if(!dragState)return;const dx=e.clientX-dragState.startX,dy=e.clientY-dragState.startY;if(Math.abs(dx)>3||Math.abs(dy)>3)dragState.moved=true;if(!dragState.moved)return;const wr=wall.getBoundingClientRect();dragState.note.x=clamp(dragState.origLeft+(dx/wr.width)*100,3,97);dragState.note.y=clamp(dragState.origTop+(dy/wr.height)*100,3,94);dragState.el.style.left=dragState.note.x+'%';dragState.el.style.top=dragState.note.y+'%';}
  function endDrag(e){if(!dragState)return;dragState.el.classList.remove('dragging');dragState.el.onpointermove=null;dragState.el.onpointerup=null;dragState.el.onpointercancel=null;const note=dragState.note;dragState=null;if(hasOverlap(note.x,note.y,note.id)){const sp=findFreeSpot(note.x,note.y);note.x=sp.x;note.y=sp.y;const el=notesLayer.querySelector(`[data-id="${note.id}"]`);if(el){el.style.left=note.x+'%';el.style.top=note.y+'%';}}saveNote(note);}

  let wallMode='';
  function setMode(m){wallMode=wallMode===m?'':m;btnPan.classList.toggle('active',wallMode==='pan');btnAdd.classList.toggle('active',wallMode==='add');}
  btnPan.addEventListener('click',e=>{e.stopPropagation();setMode('pan');});
  btnAdd.addEventListener('click',e=>{e.stopPropagation();setMode('add');});
  btnTool.addEventListener('click',e=>{e.stopPropagation();toolbar.classList.toggle('collapsed');});
  function collapseToolbar(){if(!toolbar.classList.contains('collapsed'))toolbar.classList.add('collapsed');}

  wall.addEventListener('pointerdown',e=>{if(e.target.closest('.toolbar')||e.target.closest('.float-btns')||e.target.closest('.note'))return;collapseToolbar();if(editingId){rollUpNote(editingId);return;}if(wallMode==='pan')return;createNote(e.clientX,e.clientY);});
  wall.addEventListener('dblclick',e=>{e.preventDefault();if(wallMode==='add'||e.target.closest('.note'))return;zoomLevel=zoomLevel===1?1.5:1;wall.style.setProperty('--zoom',zoomLevel);wall.classList.toggle('zoomed',zoomLevel>1);});

  const saveTimers={};
  function debounceSaveNote(note){clearTimeout(saveTimers[note.id]);saveTimers[note.id]=setTimeout(()=>saveNote(note),600);}

  (async()=>{await loadBg();await loadNotes();renderAllNotes();})();
}

// ═══ AI 对话 ═══
function renderChat() {
  const clone=tplChat.content.cloneNode(true);view.appendChild(clone);
  const chatMessages=document.getElementById('chatMessages'),chatInput=document.getElementById('chatInput');
  const chatSendBtn=document.getElementById('chatSendBtn'),chatStatus=document.getElementById('chatStatus');
  let messages=[],sending=false;

  function addMsg(role,text){const el=document.createElement('div');el.className='chat-msg '+role;el.textContent=text;chatMessages.appendChild(el);chatMessages.scrollTop=chatMessages.scrollHeight;return el;}
  function updateStatus(c,t,r){chatStatus.innerHTML=`<span>本次：${c||'—'}</span><span>今日：${t||'—'}</span><span>剩余：${r||'未知'}</span>`;}

  async function send(){
    const text=chatInput.value.trim();if(!text||sending)return;
    sending=true;chatSendBtn.disabled=true;chatInput.value='';
    const emptyEl=chatMessages.querySelector('.chat-empty');if(emptyEl)emptyEl.remove();
    addMsg('user',text);messages.push({role:'user',content:text});
    const loadingEl=addMsg('ai','思考中…');loadingEl.classList.add('loading');
    try{
      const res=await fetch(SUPABASE_FN_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${SUPABASE_ANON_KEY}`},body:JSON.stringify({messages})});
      const data=await res.json();loadingEl.remove();
      if(data.error){addMsg('ai','⚠️ '+data.error);}
      else{const reply=data.reply||'(无回复)';addMsg('ai',reply);messages.push({role:'assistant',content:reply});}
      updateStatus(data.usage_current,data.usage_today,data.usage_remaining);
    }catch(err){loadingEl.remove();addMsg('ai','⚠️ 网络错误，请重试');}
    sending=false;chatSendBtn.disabled=false;chatInput.focus();
  }
  chatSendBtn.addEventListener('click',send);
  chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
  chatInput.focus();
}

if(!window.location.hash){window.location.hash='#/';}else{handleRoute();}
