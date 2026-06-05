/* ==========================================
   huiwu.com — SPA 路由 + 便签墙模块
   ========================================== */

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

  if (route === '') {
    navBack.classList.add('hidden');
  } else {
    navBack.classList.remove('hidden');
  }
}

function goBack() {
  const current = getRoute();
  // 子路由回退到父级
  if (current.startsWith('info/')) {
    navigateTo('info');
  } else {
    navigateTo('');
  }
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
  if (renderer) {
    view.innerHTML = '';
    renderer();
  } else {
    // 未知路由 → 回主页
    navigateTo('');
  }
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

  // 卡片点击导航
  view.querySelectorAll('.home-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo(card.dataset.nav);
    });
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
    card.addEventListener('click', () => {
      navigateTo(card.dataset.nav);
    });
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
//  便签墙模块
// ══════════════════════════════════════════════

function renderWall() {
  // 从模板克隆 DOM
  const clone = tplWall.content.cloneNode(true);
  view.appendChild(clone);

  // DOM 引用（从克隆体中查找）
  const wall       = $('.wall', view);
  const wallBg     = $('.wall-bg', view);
  const notesLayer = $('.notes-layer', view);
  const bgInput    = $('.bg-input', view);
  const hint       = $('.create-hint', view);
  const noteCount  = $('.tool-note-count', view);

  // 状态
  const STORAGE_KEY = 'sticky-wall-notes';
  const BG_KEY      = 'sticky-wall-bg';

  let notes     = [];
  let editingId = null;
  let bgDataUrl = null;

  // 工具
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // 持久化
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      if (bgDataUrl) localStorage.setItem(BG_KEY, bgDataUrl);
    } catch (_) {}
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) notes = JSON.parse(saved);
      const bg = localStorage.getItem(BG_KEY);
      if (bg) {
        bgDataUrl = bg;
        wallBg.style.backgroundImage = `url(${bg})`;
      }
    } catch (_) { notes = []; }
  }

  // 背景上传
  bgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      bgDataUrl = reader.result;
      wallBg.style.backgroundImage = `url(${bgDataUrl})`;
      saveState();
    };
    reader.readAsDataURL(file);
    bgInput.value = '';
  });

  // 渲染
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

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

    const textarea = el.querySelector('.note-body');
    const deleteBtn = el.querySelector('.note-delete');

    textarea.addEventListener('input', () => {
      note.text = textarea.value;
      el.querySelector('.note-preview').textContent = note.text || '空白便签';
      autoResize(textarea);
      debounceSave();
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

  // 创建便签
  function createNote(clientX, clientY) {
    notes.forEach(n => {
      if (!n.rolled && n.id !== editingId) n.rolled = true;
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
      createdAt: Date.now(),
    };

    notes.push(note);
    editingId = note.id;

    notesLayer.innerHTML = '';
    notes.forEach(n => renderNote(n));
    updateCount();
    updateHint();

    requestAnimationFrame(() => {
      const nel = notesLayer.querySelector(`[data-id="${note.id}"]`);
      if (nel) { const ta = nel.querySelector('.note-body'); if (ta) ta.focus(); }
    });

    saveState();
  }

  // 删除
  function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    if (editingId === id) editingId = null;
    notesLayer.innerHTML = '';
    notes.forEach(n => renderNote(n));
    updateCount();
    updateHint();
    saveState();
  }

  // 卷起
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
    saveState();
  }

  // 展开
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
    saveState();
  }

  // 拖拽
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
    el.onpointerup = endDrag;
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
    dragState.el.onpointerup = null;
    dragState.el.onpointercancel = null;
    dragState = null;
    debounceSave();
  }

  // 墙面点击
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

  // 防抖保存
  let saveTimer = null;
  function debounceSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 400);
  }

  // 启动便签墙
  loadState();
  renderAllNotes();
}

// ─── 启动应用 ──────────────────────────────────
// 如果直接访问无 hash，自动加上
if (!window.location.hash) {
  window.location.hash = '#/';
} else {
  handleRoute();
}
