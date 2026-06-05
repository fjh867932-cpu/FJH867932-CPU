/* ==========================================
   huiwu.com — SPA 路由 + 便签墙 (Supabase)
   ========================================== */

// ─── Supabase 配置 ─────────────────────────────
const SUPABASE_URL = 'https://wwqqvfnuxpddhgwuwiut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JlVVDqSKs7RHM6VMldBIYA_CsLWihKo';

// ─── API 封装 ──────────────────────────────────
async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
  if (!res.ok) {
    console.error(`API ${method} ${path} failed:`, res.status);
    return null;
  }
  // 204 No Content（DELETE 等）
  if (res.status === 204) return null;
  return res.json();
}

// ─── DOM 引用 ──────────────────────────────────
const view      = document.getElementById('view');
const navTitle  = document.getElementById('nav-title');
const navBack   = document.getElementById('nav-back');
const tplWall   = document.getElementById('tpl-wall');

// ─── 工具函数 ──────────────────────────────────
const $ = (sel, ctx) => (ctx || document).querySelector(sel);

// ─── 路由表 ────────────────────────────────────
const routes = {
  '':             renderHome,
  'info':         renderInfo,
  'info/notes':   renderWall,
  'info/reply':   () => renderPlaceholder('信息回复',
                    '解答你的学习疑问，知识触手可及。', '💬'),
  'info/collect': () => renderPlaceholder('信息收集',
                    '搜集、整理、归纳，构建你的知识库。', '🔍'),
  'history':      () => renderPlaceholder('历史记录',
                    '记录读过的书、走过的路，每一天都值得被记住。', '📖'),
};

// ─── 导航栏 ────────────────────────────────────
const navbarTitles = {
  '':             'huiwu.com',
  'info':         '信息板块',
  'info/notes':   '信息记载',
  'info/reply':   '信息回复',
  'info/collect': '信息收集',
  'history':      '历史记录',
};

function updateNavbar(route) {
  const title = navbarTitles[route] || 'huiwu.com';
  navTitle.textContent = title;
  navBack.classList.toggle('hidden', route === '');
}

function goBack() {
  const current = getRoute();
  navigateTo(current.startsWith('info/') ? 'info' : '');
}

// ─── 路由核心 ──────────────────────────────────
function getRoute() {
  return window.location.hash.replace(/^#\/?/, '');
}

function navigateTo(route) {
  window.location.hash = '#/' + route;
}

function handleRoute() {
  const route = getRoute();
  updateNavbar(route);
  const renderer = routes[route];
  view.innerHTML = '';
  if (renderer) renderer(); else navigateTo('');
}

window.addEventListener('hashchange', handleRoute);
navBack.addEventListener('click', goBack);

// ─── 页面：主页 ────────────────────────────────
function renderHome() {
  view.innerHTML = `
    <div class="page-home">
      <div class="home-hero">
        <h1>huiwu.com</h1>
        <p>记录碎片灵感 · 解答学习困惑 · 收集万千信息</p>
      </div>
      <div class="home-cards">
        <div class="home-card" data-nav="info">
          <div class="home-card-icon info">📋</div>
          <div class="home-card-body">
            <h3>信息板块</h3>
            <p>便签记载 · 学习回复 · 信息收集</p>
          </div>
          <span class="home-card-arrow">›</span>
        </div>
        <div class="home-card" data-nav="history">
          <div class="home-card-icon history">📜</div>
          <div class="home-card-body">
            <h3>历史记录</h3>
            <p>书籍阅读 · 日常记录 · 时间线回顾</p>
          </div>
          <span class="home-card-arrow">›</span>
        </div>
      </div>
    </div>
  `;
  view.querySelectorAll('.home-card').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.nav));
  });
}

// ─── 页面：信息板块 ────────────────────────────
function renderInfo() {
  view.innerHTML = `
    <div class="page-info">
      <p class="section-title">选择功能</p>
      <div class="info-cards">
        <div class="info-card" data-nav="info/notes">
          <div class="info-card-dot notes"></div>
          <div class="info-card-body">
            <h4>信息记载</h4>
            <p>便签墙 — 像在墙上贴便签一样记录碎片想法</p>
          </div>
          <span class="info-card-arrow">›</span>
        </div>
        <div class="info-card" data-nav="info/reply">
          <div class="info-card-dot reply"></div>
          <div class="info-card-body">
            <h4>信息回复</h4>
            <p>解答学习中的疑问，获取即时帮助</p>
          </div>
          <span class="info-card-arrow">›</span>
        </div>
        <div class="info-card" data-nav="info/collect">
          <div class="info-card-dot collect"></div>
          <div class="info-card-body">
            <h4>信息收集</h4>
            <p>搜集、整理外部信息，构建知识体系</p>
          </div>
          <span class="info-card-arrow">›</span>
        </div>
      </div>
    </div>
  `;
  view.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.nav));
  });
}

// ─── 页面：占位 ────────────────────────────────
function renderPlaceholder(title, desc, icon) {
  view.innerHTML = `
    <div class="page-placeholder">
      <div class="ph-icon">${icon || '🚧'}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

// ══════════════════════════════════════════════
//  便签墙模块（Supabase 持久化）
// ══════════════════════════════════════════════

function renderWall() {
  const clone = tplWall.content.cloneNode(true);
  view.appendChild(clone);

  const wall       = $('.wall', view);
  const wallBg     = $('.wall-bg', view);
  const notesLayer = $('.notes-layer', view);
  const bgInput    = $('.bg-input', view);
  const hint       = $('.create-hint', view);
  const noteCount  = $('.tool-note-count', view);

  let notes     = [];
  let editingId = null;
  let bgDataUrl = null;

  // ── 工具 ────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  // ── Supabase API ────────────────────────────
  // 行映射：Supabase snake_case → 前端 camelCase
  function mapRow(row) {
    return {
      id: row.id,
      x: Number(row.pos_x),
      y: Number(row.pos_y),
      text: row.content || '',
      rolled: Boolean(row.rolled),
      createdAt: row.created_at,
    };
  }

  // 反向映射：前端 → Supabase
  function toRow(note) {
    return {
      id: note.id,
      pos_x: note.x,
      pos_y: note.y,
      content: note.text,
      rolled: note.rolled,
    };
  }

  async function loadNotes() {
    const data = await api('/notes?select=*&order=created_at.desc');
    if (data) notes = data.map(mapRow);
  }

  async function saveNote(note) {
    await api(`/notes?id=eq.${note.id}`, {
      method: 'PATCH',
      body: toRow(note),
      headers: { 'Prefer': 'return=minimal' },
    });
  }

  async function createNoteAPI(note) {
    await api('/notes', {
      method: 'POST',
      body: { ...toRow(note), created_at: new Date().toISOString() },
      headers: { 'Prefer': 'return=minimal' },
    });
  }

  async function deleteNoteAPI(id) {
    await api(`/notes?id=eq.${id}`, { method: 'DELETE' });
  }

  async function loadBg() {
    const data = await api('/settings?key_name=eq.bg_image&select=value');
    if (data && data.length > 0 && data[0].value) {
      bgDataUrl = data[0].value;
      wallBg.style.backgroundImage = `url(${bgDataUrl})`;
    }
  }

  async function saveBg() {
    await api('/settings', {
      method: 'POST',
      body: { key_name: 'bg_image', value: bgDataUrl || '' },
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
  }

  // ── 背景上传 ────────────────────────────────
  bgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      bgDataUrl = reader.result;
      wallBg.style.backgroundImage = `url(${bgDataUrl})`;
      saveBg();
    };
    reader.readAsDataURL(file);
    bgInput.value = '';
  });

  // ── 渲染 ────────────────────────────────────
  function updateCount() {
    noteCount.textContent = `${notes.length} 张便签`;
  }

  function updateHint() {
    hint.classList.toggle('visible', notes.length === 0);
  }

  function autoResize(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(60, ta.scrollHeight) + 'px';
  }

  function renderAllNotes() {
    notesLayer.innerHTML = '';
    notes.forEach(n => renderNote(n));
    updateCount();
    updateHint();
  }

  function renderNote(note) {
    const el = document.createElement('div');
    el.className = 'note' + (note.rolled ? ' rolled' : ' expanded');
    el.dataset.id = note.id;
    el.style.left = note.x + '%';
    el.style.top  = note.y + '%';
    el.style.transform = 'translate(-50%, -50%)';

    el.innerHTML = `
      <div class="note-inner">
        <div class="note-header">
          <div class="note-pin"></div>
          <span class="note-date">${formatDate(note.createdAt)}</span>
          <button class="note-delete" data-action="delete" title="删除">×</button>
        </div>
        <textarea class="note-body" placeholder="写点什么…">${escapeHTML(note.text)}</textarea>
      </div>
      <div class="note-preview">${escapeHTML(note.text) || '空白便签'}</div>
    `;

    const textarea  = el.querySelector('.note-body');
    const deleteBtn = el.querySelector('.note-delete');

    textarea.addEventListener('input', () => {
      note.text = textarea.value;
      el.querySelector('.note-preview').textContent = note.text || '空白便签';
      autoResize(textarea);
      debounceSaveNote(note);
    });

    textarea.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      editingId = note.id;
    });

    deleteBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteNote(note.id);
    });

    el.addEventListener('pointerdown', (e) => {
      if (e.target.dataset.action === 'delete') return;
      e.stopPropagation();

      if (note.rolled) {
        expandNote(note.id);
        return;
      }

      editingId = note.id;
      startDrag(e, el, note);
    });

    requestAnimationFrame(() => autoResize(textarea));
    notesLayer.appendChild(el);
    return el;
  }

  // ── 创建便签 ────────────────────────────────
  async function createNote(clientX, clientY) {
    // 卷起其他展开的便签（本地 + API）
    notes.forEach(n => {
      if (!n.rolled && n.id !== editingId) {
        n.rolled = true;
        saveNote(n);
      }
    });

    const rect = wall.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const note = {
      id: uid(),
      x: clamp(x, 5, 95),
      y: clamp(y, 5, 90),
      text: '',
      rolled: false,
      createdAt: new Date().toISOString(),
    };

    notes.push(note);
    editingId = note.id;

    // 异步存到 Supabase
    createNoteAPI(note);

    notesLayer.innerHTML = '';
    notes.forEach(n => renderNote(n));
    updateCount();
    updateHint();

    requestAnimationFrame(() => {
      const nel = notesLayer.querySelector(`[data-id="${note.id}"]`);
      if (nel) { const ta = nel.querySelector('.note-body'); if (ta) ta.focus(); }
    });
  }

  // ── 删除 ────────────────────────────────────
  async function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    if (editingId === id) editingId = null;
    notesLayer.innerHTML = '';
    notes.forEach(n => renderNote(n));
    updateCount();
    updateHint();
    deleteNoteAPI(id);
  }

  // ── 卷起 ────────────────────────────────────
  function rollUpNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note || note.rolled) return;
    note.rolled = true;
    editingId = null;

    const el = notesLayer.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.remove('expanded');
      el.classList.add('rolled');
      el.querySelector('.note-preview').textContent = note.text || '空白便签';
    }
    saveNote(note);
  }

  // ── 展开 ────────────────────────────────────
  function expandNote(id) {
    notes.forEach(n => {
      if (n.id !== id && !n.rolled) {
        n.rolled = true;
        const other = notesLayer.querySelector(`[data-id="${n.id}"]`);
        if (other) {
          other.classList.remove('expanded');
          other.classList.add('rolled');
          other.querySelector('.note-preview').textContent = n.text || '空白便签';
        }
        saveNote(n);
      }
    });

    const note = notes.find(n => n.id === id);
    if (!note) return;
    note.rolled = false;
    editingId = id;

    const el = notesLayer.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.remove('rolled');
      el.classList.add('expanded');
      requestAnimationFrame(() => {
        const ta = el.querySelector('.note-body');
        if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
      });
    }
    saveNote(note);
  }

  // ── 拖拽 ────────────────────────────────────
  let dragState = null;

  function startDrag(e, el, note) {
    dragState = {
      note, el,
      startX: e.clientX, startY: e.clientY,
      origLeft: parseFloat(el.style.left) || 0,
      origTop: parseFloat(el.style.top) || 0,
      moved: false,
    };
    el.classList.add('dragging');
    el.setPointerCapture(e.pointerId);
    el.onpointermove = onDrag;
    el.onpointerup   = endDrag;
    el.onpointercancel = endDrag;
  }

  function onDrag(e) {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
    if (!dragState.moved) return;

    const wr = wall.getBoundingClientRect();
    dragState.note.x = clamp(dragState.origLeft + (dx / wr.width) * 100, 3, 97);
    dragState.note.y = clamp(dragState.origTop + (dy / wr.height) * 100, 3, 94);
    dragState.el.style.left = dragState.note.x + '%';
    dragState.el.style.top  = dragState.note.y + '%';
  }

  function endDrag(e) {
    if (!dragState) return;
    dragState.el.classList.remove('dragging');
    dragState.el.onpointermove = null;
    dragState.el.onpointerup   = null;
    dragState.el.onpointercancel = null;
    const note = dragState.note;
    dragState = null;
    saveNote(note);
  }

  // ── 墙面点击 ────────────────────────────────
  wall.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.toolbar')) return;
    if (e.target.closest('.note')) return;

    if (editingId) {
      rollUpNote(editingId);
      return;
    }

    createNote(e.clientX, e.clientY);
  });

  wall.addEventListener('dblclick', (e) => e.preventDefault());

  // ── 防抖保存 ────────────────────────────────
  const saveTimers = {};
  function debounceSaveNote(note) {
    clearTimeout(saveTimers[note.id]);
    saveTimers[note.id] = setTimeout(() => saveNote(note), 600);
  }

  // ── 启动便签墙 ──────────────────────────────
  async function initWall() {
    await loadBg();
    await loadNotes();
    renderAllNotes();
  }

  initWall();
}

// ─── 启动应用 ──────────────────────────────────
if (!window.location.hash) {
  window.location.hash = '#/';
} else {
  handleRoute();
}
