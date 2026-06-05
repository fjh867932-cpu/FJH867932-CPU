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
const tplWall      = document.getElementById('tpl-wall');
const tplBookshelf = document.getElementById('tpl-bookshelf');

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
  'history':      renderBookshelf,
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
  const toolbar    = $('.toolbar', view);
  const toolbarPin = $('.toolbar-pin', view);

  let notes       = [];
  let editingId   = null;
  let bgDataUrl   = null;
  let zoomLevel   = 1;
  let createLocked = false;

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

  // ── 碰撞检测 ──────────────────────────────
  const OVERLAP_X = 28; // % 宽度，便签大约占这么多
  const OVERLAP_Y = 24; // % 高度

  function hasOverlap(x, y, excludeId) {
    for (const n of notes) {
      if (n.id === excludeId || n.rolled) continue;
      if (Math.abs(n.x - x) < OVERLAP_X && Math.abs(n.y - y) < OVERLAP_Y) return n;
    }
    return null;
  }

  function findFreeSpot(baseX, baseY) {
    // 从基点螺旋搜索空位
    const steps = [0, 30, 60, -30, -60, 90, -90, 120, -120, 45, -45, 75, -75];
    for (const step of steps) {
      const tx = clamp(baseX + step * 0.6, 5, 95);
      const ty = clamp(baseY + step * 0.4, 5, 90);
      if (!hasOverlap(tx, ty, null)) return { x: tx, y: ty };
    }
    return { x: clamp(baseX, 5, 95), y: clamp(baseY, 5, 90) };
  }

  // ── 创建便签 ────────────────────────────────
  async function createNote(clientX, clientY) {
    if (createLocked) return;
    createLocked = true;
    setTimeout(() => { createLocked = false; }, 500);

    // 卷起其他展开的便签
    notes.forEach(n => {
      if (!n.rolled && n.id !== editingId) {
        n.rolled = true;
        saveNote(n);
      }
    });

    const rect = wall.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // 碰撞检测，找空位
    if (hasOverlap(x, y, null)) {
      const spot = findFreeSpot(x, y);
      x = spot.x; y = spot.y;
    }

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

    // 拖拽结束后检测重叠，弹到空位
    if (hasOverlap(note.x, note.y, note.id)) {
      const spot = findFreeSpot(note.x, note.y);
      note.x = spot.x;
      note.y = spot.y;
      const el = notesLayer.querySelector(`[data-id="${note.id}"]`);
      if (el) { el.style.left = note.x + '%'; el.style.top = note.y + '%'; }
    }
    saveNote(note);
  }

  // ── 工具栏圆钉切换 ──────────────────────────
  toolbarPin.addEventListener('click', (e) => {
    e.stopPropagation();
    toolbar.classList.remove('collapsed');
    toolbarPin.classList.add('hidden');
  });

  function collapseToolbar() {
    if (!toolbar.classList.contains('collapsed')) {
      toolbar.classList.add('collapsed');
      toolbarPin.classList.remove('hidden');
    }
  }

  // ── 墙面点击 ────────────────────────────────
  wall.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.toolbar')) return;
    if (e.target.closest('.toolbar-pin')) return;
    if (e.target.closest('.note')) return;

    collapseToolbar();

    if (editingId) {
      rollUpNote(editingId);
      return;
    }

    createNote(e.clientX, e.clientY);
  });

  // ── 双击缩放 ────────────────────────────────
  wall.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (e.target.closest('.note')) return;  // 便签上双击不缩放
    zoomLevel = zoomLevel === 1 ? 1.5 : 1;
    wall.style.setProperty('--zoom', zoomLevel);
    wall.classList.toggle('zoomed', zoomLevel > 1);
  });

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

// ══════════════════════════════════════════════
//  书籍记录模块（星空书架）
// ══════════════════════════════════════════════

function renderBookshelf() {
  const clone = tplBookshelf.content.cloneNode(true);
  view.appendChild(clone);

  const booksGrid   = document.getElementById('booksGrid');
  const booksOverlay = document.getElementById('booksOverlay');
  const bookDetail  = document.getElementById('bookDetail');
  const bookCoverArea = document.getElementById('bookCoverArea');
  const bookCoverImg = document.getElementById('bookCoverImg');
  const bookCoverEmpty = document.getElementById('bookCoverEmpty');
  const bookTitleInp = document.getElementById('bookTitleInp');
  const bookCoverBtn = document.getElementById('bookCoverBtn');
  const bookCoverFile = document.getElementById('bookCoverFile');
  const bookNotepad  = document.getElementById('bookNotepad');
  const bookReviewTa = document.getElementById('bookReviewTa');
  const bookDeleteBtn = document.getElementById('bookDeleteBtn');
  const bookDoneBtn  = document.getElementById('bookDoneBtn');
  const addBookBtn   = document.getElementById('addBookBtn');
  const timeline     = document.getElementById('timeline');

  let books      = [];
  let focusedId  = null;
  let hasMoved   = false;

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const BOOK_COLORS = [
    '#6b3a3a','#3a5c6b','#4a6b3a','#6b5a3a','#5a3a6b',
    '#3a6b5a','#6b4a3a','#4a3a6b','#3a6b6b','#6b6b3a',
    '#8b4513','#2e4057','#5d4e37','#3d5c5c','#7b3f3f',
  ];

  function randomColor() {
    return BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
  }

  // ── API ────────────────────────────────────
  function mapBook(row) {
    return {
      id: row.id,
      title: row.title || '',
      coverUrl: row.cover_url || '',
      review: row.review || '',
      color: row.color || '',
      posX: Number(row.pos_x),
      posY: Number(row.pos_y),
      createdAt: row.created_at,
    };
  }

  function toBookRow(book) {
    return {
      id: book.id,
      title: book.title,
      cover_url: book.coverUrl,
      review: book.review,
      color: book.color,
      pos_x: book.posX,
      pos_y: book.posY,
    };
  }

  async function loadBooks() {
    const data = await api('/books?select=*&order=created_at.asc');
    if (data) books = data.map(mapBook);
  }

  async function saveBook(book) {
    await api(`/books?id=eq.${book.id}`, {
      method: 'PATCH',
      body: toBookRow(book),
      headers: { 'Prefer': 'return=minimal' },
    });
  }

  async function createBookAPI(book) {
    await api('/books', {
      method: 'POST',
      body: { ...toBookRow(book), created_at: new Date().toISOString() },
      headers: { 'Prefer': 'return=minimal' },
    });
  }

  async function deleteBookAPI(id) {
    await api(`/books?id=eq.${id}`, { method: 'DELETE' });
  }

  // ── 渲染 ────────────────────────────────────
  function renderTimeline() {
    timeline.innerHTML = '';
    if (books.length === 0) return;

    const now = Date.now();
    const first = new Date(books[0].createdAt).getTime();
    const last = new Date(books[books.length - 1].createdAt).getTime();
    const span = Math.max(last - first, 1);

    books.forEach((book, i) => {
      const node = document.createElement('div');
      node.className = 'timeline-node' + (book.id === focusedId ? ' active' : '');
      node.title = book.title || '未命名';
      node.addEventListener('click', () => focusBook(book.id));
      timeline.appendChild(node);

      if (i < books.length - 1) {
        const gap = document.createElement('div');
        gap.className = 'timeline-gap';
        const nextTime = new Date(books[i + 1].createdAt).getTime();
        const ratio = Math.max((nextTime - new Date(book.createdAt).getTime()) / span, 0.02);
        gap.style.width = Math.round(ratio * 120) + 'px';
        timeline.appendChild(gap);
      }
    });
  }

  function renderBooks() {
    booksGrid.innerHTML = '';
    books.forEach(book => {
      const el = document.createElement('div');
      el.className = 'book-spine';
      if (book.coverUrl) el.classList.add('has-cover');
      if (book.id === focusedId) el.classList.add('focused');
      el.dataset.id = book.id;
      if (book.coverUrl) {
        el.style.backgroundImage = `url(${book.coverUrl})`;
      } else {
        el.style.background = book.color;
      }
      if (!book.coverUrl) {
        const titleEl = document.createElement('span');
        titleEl.className = 'book-spine-title';
        titleEl.textContent = book.title || '新书';
        el.appendChild(titleEl);
      }
      el.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.book-detail')) return;
        bookPointerDown(e, book);
      });
      booksGrid.appendChild(el);
    });
  }

  function refreshAll() {
    renderTimeline();
    renderBooks();
    if (focusedId) {
      booksGrid.classList.add('blurred');
      booksOverlay.classList.add('active');
    } else {
      booksGrid.classList.remove('blurred');
      booksOverlay.classList.remove('active');
    }
  }

  // ── 交互 ────────────────────────────────────
  function bookPointerDown(e, book) {
    const sx = e.clientX, sy = e.clientY;
    hasMoved = false;

    function onMove(ev) {
      if (Math.abs(ev.clientX - sx) > 5 || Math.abs(ev.clientY - sy) > 5) {
        hasMoved = true;
      }
    }

    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (hasMoved) return;

      if (focusedId === book.id) {
        // 已选中 → 打开编辑
        openEditor(book);
      } else {
        focusBook(book.id);
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  function focusBook(id) {
    focusedId = id;
    const book = books.find(b => b.id === id);
    if (book) {
      openEditor(book);
    }
    refreshAll();
  }

  function unfocus() {
    focusedId = null;
    bookDetail.classList.remove('active');
    bookNotepad.classList.remove('open');
    saveCurrentBook();
    refreshAll();
  }

  // ── 编辑弹层 ────────────────────────────────
  function openEditor(book) {
    bookTitleInp.value = book.title;
    bookReviewTa.value = book.review;
    if (book.coverUrl) {
      bookCoverImg.src = book.coverUrl;
      bookCoverArea.classList.add('has-cover');
    } else {
      bookCoverImg.src = '';
      bookCoverArea.classList.remove('has-cover');
    }
    // 有封面才允许打开记事本
    if (book.coverUrl) {
      bookNotepad.classList.toggle('open', !!book.review);
    } else {
      bookNotepad.classList.remove('open');
    }
    bookDetail.classList.add('active');
  }

  function saveCurrentBook() {
    if (!focusedId) return;
    const book = books.find(b => b.id === focusedId);
    if (!book) return;
    book.title = bookTitleInp.value.trim();
    book.review = bookReviewTa.value.trim();
    saveBook(book);
  }

  // 封面区域双击 → 切换记事本（需有封面）
  bookCoverArea.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!focusedId) return;
    const book = books.find(b => b.id === focusedId);
    if (!book || !book.coverUrl) return;  // 无封面不响应
    bookNotepad.classList.toggle('open');
  });

  // 标题输入
  bookTitleInp.addEventListener('input', () => {
    if (!focusedId) return;
    const book = books.find(b => b.id === focusedId);
    if (book) book.title = bookTitleInp.value.trim();
  });

  // 观后感输入
  bookReviewTa.addEventListener('input', () => {
    if (!focusedId) return;
    const book = books.find(b => b.id === focusedId);
    if (book) book.review = bookReviewTa.value.trim();
  });

  // 封面选择
  bookCoverBtn.addEventListener('click', () => bookCoverFile.click());
  bookCoverArea.addEventListener('click', () => bookCoverFile.click());

  bookCoverFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !focusedId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const book = books.find(b => b.id === focusedId);
      if (book) {
        book.coverUrl = reader.result;
        bookCoverImg.src = reader.result;
        bookCoverArea.classList.add('has-cover');
        saveBook(book);
        // 刷新书脊
        refreshAll();
      }
    };
    reader.readAsDataURL(file);
    bookCoverFile.value = '';
  });

  // 完成按钮
  bookDoneBtn.addEventListener('click', () => {
    saveCurrentBook();
    unfocus();
    refreshAll();
  });

  // 删除按钮
  bookDeleteBtn.addEventListener('click', async () => {
    if (!focusedId) return;
    const id = focusedId;
    focusedId = null;
    bookDetail.classList.remove('active');
    books = books.filter(b => b.id !== id);
    deleteBookAPI(id);
    refreshAll();
  });

  // 点击覆盖层取消选中
  booksOverlay.addEventListener('pointerdown', () => {
    unfocus();
  });

  // 添加书籍
  addBookBtn.addEventListener('click', async () => {
    const book = {
      id: uid(),
      title: '',
      coverUrl: '',
      review: '',
      color: randomColor(),
      posX: 50,
      posY: 50,
      createdAt: new Date().toISOString(),
    };
    books.push(book);
    await createBookAPI(book);
    focusBook(book.id);
  });

  // ── 启动 ────────────────────────────────────
  async function init() {
    await loadBooks();
    refreshAll();
  }

  init();
}

// ─── 启动应用 ──────────────────────────────────
if (!window.location.hash) {
  window.location.hash = '#/';
} else {
  handleRoute();
}
