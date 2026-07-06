/* ============================================================
   [MZ] ADMIN DASHBOARD — JavaScript
   Carica data.json via API, popola i form, salva e pubblica.
   ============================================================ */

'use strict';

// ─── Logout ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      window.location.replace('/admin');
    });
  }
});

// ─── 401 interceptor: sessione scaduta → redirect login ───────
const _fetch = window.fetch;
window.fetch = async function (...args) {
  const res = await _fetch(...args);
  if (res.status === 401) {
    // Clone per non consumare il body
    const cloned = res.clone();
    window.location.replace('/admin');
    return cloned;
  }
  return res;
};

// ─── State ────────────────────────────────────────────────────

let currentData = null;

// ─── DOM refs ─────────────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const panelTitle    = document.getElementById('panelTitle');
const toast         = document.getElementById('toast');
const publishModal  = document.getElementById('publishModal');

// ─── SIDEBAR TOGGLE ───────────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ─── TAB NAVIGATION ───────────────────────────────────────────
const NAV_LABELS = {
  profile: 'Profilo', about: 'About', links: 'Link Hub',
  skills: 'Skills', timeline: 'Timeline', contact: 'Contatti',
};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.panel;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${target}`).classList.add('active');
    panelTitle.textContent = NAV_LABELS[target] || target;
  });
});

// ─── TOAST ────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'success') {
  const iconMap = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  toast.className = `toast ${type} show`;
  toast.querySelector('.toast-icon').className = `toast-icon fa-solid ${iconMap[type] || 'fa-circle-info'}`;
  toast.querySelector('.toast-msg').textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
}

// ─── INIT: load data from API ─────────────────────────────────
async function loadData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentData = await res.json();
    populateAll(currentData);
    loadGitStatus();
  } catch (e) {
    showToast('Impossibile caricare data.json: ' + e.message, 'error');
  }
}

async function loadGitStatus() {
  try {
    const res = await fetch('/api/git-status');
    const d = await res.json();
    if (d.ok) {
      document.getElementById('gitBranch').textContent = d.branch;
      document.getElementById('pi-branch').textContent = d.branch;
      document.getElementById('pi-commit').textContent = d.lastCommit;
      document.getElementById('pi-remote').textContent = d.remote;
    } else {
      document.getElementById('gitBranch').textContent = 'git non configurato';
    }
  } catch { /* silent */ }
}

// ─── POPULATE ALL FORMS ───────────────────────────────────────
function populateAll(d) {
  populateProfile(d.profile);
  populateAbout(d.about);
  populateLinks(d.links);
  populateSkills(d.skills);
  populateTimeline(d.timeline);
  populateContact(d.contact);
}

// ── PROFILE ──────────────────────────────────────────────────
function populateProfile(p) {
  setVal('p-name', p.name);
  setVal('p-birthday', p.birthday);
  setVal('p-location', p.location);
  setVal('p-nationality', p.nationality);
  setVal('p-focus', p.focus);
  setVal('p-languages', p.languages);
  setChecked('p-available', p.available);
  setVal('p-availableText', p.availableText);

  // Avatar preview
  document.getElementById('avatarPreview').src = '/site/' + (p.avatar || 'avatar.png') + '?v=' + Date.now();

  // Taglines
  renderTaglinesList(p.taglines || []);
}

function renderTaglinesList(taglines) {
  const container = document.getElementById('taglinesList');
  container.innerHTML = '';
  taglines.forEach((t, i) => {
    const row = makeListItem(t, () => {
      taglines.splice(i, 1);
      renderTaglinesList(taglines);
    });
    container.appendChild(row);
  });
}

document.getElementById('addTaglineBtn').addEventListener('click', () => {
  const taglines = gatherTaglines();
  taglines.push('Nuova frase...');
  renderTaglinesList(taglines);
});

function gatherTaglines() {
  return [...document.querySelectorAll('#taglinesList .list-item input')].map(i => i.value.trim()).filter(Boolean);
}

// ── ABOUT ─────────────────────────────────────────────────────
function populateAbout(a) {
  setVal('a-intro', a.intro);
  setVal('a-body', a.body);
  setVal('a-extra', a.extra);
  setVal('a-projects', a.stats.projects);
  setVal('a-years', a.stats.years);
  setVal('a-tech', a.stats.technologies);
}

// ── LINKS ─────────────────────────────────────────────────────
const LINK_COLOR_CLASSES = [
  'link-linkedin','link-github','link-email','link-twitter',
  'link-telegram','link-cv','link-discord','link-instagram',
  'link-youtube','link-tiktok',
];

function populateLinks(links) {
  const container = document.getElementById('linksList');
  container.innerHTML = '';
  links.forEach((link, i) => container.appendChild(makeLinkCard(link, i, links)));
}

function makeLinkCard(link, index, allLinks) {
  const div = document.createElement('div');
  div.className = 'link-editor-card';
  div.innerHTML = `
    <div class="link-editor-header" onclick="this.nextElementSibling.classList.toggle('open')">
      <div class="link-editor-icon"><i class="${link.icon || 'fa-solid fa-link'}"></i></div>
      <span class="link-editor-name">${link.name || 'Nuovo link'}</span>
      <span class="link-editor-url">${link.url || ''}</span>
      <button class="btn btn-xs btn-danger" onclick="event.stopPropagation(); this.closest('.link-editor-card').remove()">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
    <div class="link-editor-body">
      <div class="link-form-grid">
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input type="text" class="form-input lnk-name" value="${esc(link.name)}" placeholder="LinkedIn" />
        </div>
        <div class="form-group">
          <label class="form-label">Descrizione</label>
          <input type="text" class="form-input lnk-desc" value="${esc(link.desc)}" placeholder="Profilo professionale" />
        </div>
        <div class="form-group">
          <label class="form-label">URL</label>
          <input type="text" class="form-input lnk-url" value="${esc(link.url)}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Icona Font Awesome</label>
          <input type="text" class="form-input lnk-icon" value="${esc(link.icon)}" placeholder="fa-brands fa-linkedin" />
        </div>
        <div class="form-group">
          <label class="form-label">Classe colore CSS</label>
          <select class="form-input lnk-color">
            ${LINK_COLOR_CLASSES.map(c => `<option value="${c}" ${c===link.colorClass?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ID univoco</label>
          <input type="text" class="form-input lnk-id" value="${esc(link.id)}" placeholder="linkedin" />
        </div>
      </div>
      <label class="toggle-row" style="cursor:pointer">
        <span class="form-label" style="margin:0">Link esterno (apre in nuova tab)</span>
        <label class="toggle">
          <input type="checkbox" class="lnk-external" ${link.external?'checked':''} />
          <span class="toggle-slider"></span>
        </label>
      </label>
    </div>
  `;

  // Live update header
  div.querySelector('.lnk-name').addEventListener('input', e => {
    div.querySelector('.link-editor-name').textContent = e.target.value || 'Nuovo link';
  });
  div.querySelector('.lnk-url').addEventListener('input', e => {
    div.querySelector('.link-editor-url').textContent = e.target.value;
  });
  div.querySelector('.lnk-icon').addEventListener('input', e => {
    div.querySelector('.link-editor-icon i').className = e.target.value || 'fa-solid fa-link';
  });

  return div;
}

document.getElementById('addLinkBtn').addEventListener('click', () => {
  const newLink = { id: 'new', name: 'Nuovo link', desc: 'Descrizione', url: '#', icon: 'fa-solid fa-link', colorClass: 'link-github', external: true };
  const container = document.getElementById('linksList');
  const card = makeLinkCard(newLink, container.children.length, []);
  container.appendChild(card);
  card.querySelector('.link-editor-body').classList.add('open');
});

function gatherLinks() {
  return [...document.querySelectorAll('#linksList .link-editor-card')].map(card => ({
    id: card.querySelector('.lnk-id').value.trim() || 'link',
    name: card.querySelector('.lnk-name').value.trim(),
    desc: card.querySelector('.lnk-desc').value.trim(),
    url: card.querySelector('.lnk-url').value.trim(),
    icon: card.querySelector('.lnk-icon').value.trim(),
    colorClass: card.querySelector('.lnk-color').value,
    external: card.querySelector('.lnk-external').checked,
  }));
}

// ── SKILLS ────────────────────────────────────────────────────
function populateSkills(sk) {
  // Bars
  const barsContainer = document.getElementById('skillBarsList');
  barsContainer.innerHTML = '';
  sk.bars.forEach(bar => barsContainer.appendChild(makeSkillBarEditor(bar)));

  // Tags
  const tagsContainer = document.getElementById('tagsEditor');
  tagsContainer.innerHTML = '';
  sk.tags.forEach(t => tagsContainer.appendChild(makeTagItem(t)));

  // Learning
  const learningContainer = document.getElementById('learningList');
  learningContainer.innerHTML = '';
  sk.learning.forEach(l => {
    learningContainer.appendChild(makeListItem(l, () => learningContainer.removeChild(div)));
  });
  // Re-render learning with proper delete
  learningContainer.innerHTML = '';
  sk.learning.forEach(l => {
    const row = makeListItem(l, null);
    row.querySelector('.btn-danger').addEventListener('click', () => row.remove());
    learningContainer.appendChild(row);
  });
}

function makeSkillBarEditor(bar) {
  const div = document.createElement('div');
  div.className = 'skill-bar-editor';
  div.innerHTML = `
    <div class="skill-bar-row">
      <input type="text" class="form-input sk-name" value="${esc(bar.name)}" placeholder="Nome skill" />
      <input type="text" class="form-input sk-icon" value="${esc(bar.icon)}" placeholder="fa-brands fa-html5" />
      <div class="skill-level-wrap">
        <input type="range" class="sk-level" min="0" max="100" value="${bar.level}" />
        <span class="skill-pct-display">${bar.level}%</span>
      </div>
      <button class="btn btn-xs btn-danger" onclick="this.closest('.skill-bar-editor').remove()">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;
  const range = div.querySelector('.sk-level');
  const display = div.querySelector('.skill-pct-display');
  range.addEventListener('input', () => display.textContent = range.value + '%');
  return div;
}

function makeTagItem(t) {
  const TAG_COLORS = ['tag-blue','tag-cyan','tag-purple','tag-green','tag-orange'];
  const div = document.createElement('div');
  div.className = 'tag-item';
  div.innerHTML = `
    <input class="tag-name-input" type="text" value="${esc(t.name)}" placeholder="React" />
    <select class="form-input" style="padding:2px 4px;width:auto;font-size:.72rem">
      ${TAG_COLORS.map(c => `<option value="${c}" ${c===t.color?'selected':''}>${c.replace('tag-','')}</option>`).join('')}
    </select>
    <button class="remove-tag" onclick="this.closest('.tag-item').remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  return div;
}

document.getElementById('addSkillBarBtn').addEventListener('click', () => {
  document.getElementById('skillBarsList').appendChild(makeSkillBarEditor({ name: '', icon: 'fa-solid fa-code', level: 50 }));
});

document.getElementById('addTagBtn').addEventListener('click', () => {
  document.getElementById('tagsEditor').appendChild(makeTagItem({ name: '', color: 'tag-blue' }));
});

document.getElementById('addLearningBtn').addEventListener('click', () => {
  const container = document.getElementById('learningList');
  const row = makeListItem('', null);
  row.querySelector('.btn-danger').addEventListener('click', () => row.remove());
  container.appendChild(row);
});

function gatherSkills() {
  const bars = [...document.querySelectorAll('#skillBarsList .skill-bar-editor')].map(div => ({
    name: div.querySelector('.sk-name').value.trim(),
    icon: div.querySelector('.sk-icon').value.trim(),
    level: parseInt(div.querySelector('.sk-level').value),
  }));
  const tags = [...document.querySelectorAll('#tagsEditor .tag-item')].map(div => ({
    name: div.querySelector('.tag-name-input').value.trim(),
    color: div.querySelector('select').value,
  }));
  const learning = [...document.querySelectorAll('#learningList .list-item input')].map(i => i.value.trim()).filter(Boolean);
  return { bars, tags, learning };
}

// ── TIMELINE ──────────────────────────────────────────────────
function populateTimeline(items) {
  const container = document.getElementById('timelineList');
  container.innerHTML = '';
  items.forEach(item => container.appendChild(makeTimelineCard(item)));
}

function makeTimelineCard(item) {
  const div = document.createElement('div');
  div.className = 'timeline-editor-card';
  const tagsJson = JSON.stringify(item.tags || []).replace(/"/g, '&quot;');
  div.innerHTML = `
    <div class="timeline-editor-header" onclick="this.nextElementSibling.classList.toggle('open')">
      <span class="tl-date">${item.date || 'Data'}</span>
      <span class="tl-title">${item.title || 'Titolo'}</span>
      <button class="btn btn-xs btn-danger" onclick="event.stopPropagation(); this.closest('.timeline-editor-card').remove()">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
    <div class="timeline-editor-body">
      <div class="link-form-grid">
        <div class="form-group">
          <label class="form-label">Data / Periodo</label>
          <input type="text" class="form-input tl-date-input" value="${esc(item.date)}" placeholder="2024 — Presente" />
        </div>
        <div class="form-group">
          <label class="form-label">Titolo</label>
          <input type="text" class="form-input tl-title-input" value="${esc(item.title)}" placeholder="Titolo voce" />
        </div>
        <div class="form-group">
          <label class="form-label">Icona Font Awesome</label>
          <input type="text" class="form-input tl-icon" value="${esc(item.icon)}" placeholder="fa-solid fa-code" />
        </div>
        <div class="form-group">
          <label class="form-label">Tag (separati da virgola)</label>
          <input type="text" class="form-input tl-tags" value="${item.tags ? item.tags.map(t=>t.name).join(', ') : ''}" placeholder="HTML, CSS, JS" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrizione</label>
        <textarea class="form-input form-textarea tl-desc" rows="3" placeholder="Descrizione...">${esc(item.desc)}</textarea>
      </div>
    </div>
  `;

  // Live update header
  div.querySelector('.tl-date-input').addEventListener('input', e => div.querySelector('.tl-date').textContent = e.target.value);
  div.querySelector('.tl-title-input').addEventListener('input', e => div.querySelector('.tl-title').textContent = e.target.value);

  return div;
}

document.getElementById('addTimelineBtn').addEventListener('click', () => {
  const item = { id: 'new', date: 'Anno', title: 'Nuova voce', desc: '', icon: 'fa-solid fa-star', tags: [] };
  const container = document.getElementById('timelineList');
  const card = makeTimelineCard(item);
  container.insertBefore(card, container.firstChild);
  card.querySelector('.timeline-editor-body').classList.add('open');
});

function gatherTimeline() {
  return [...document.querySelectorAll('#timelineList .timeline-editor-card')].map((card, i) => {
    const tagsRaw = card.querySelector('.tl-tags').value;
    const tagNames = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
    const TAG_COLORS = ['tag-blue','tag-cyan','tag-purple','tag-green','tag-orange'];
    const tags = tagNames.map((name, j) => ({ name, color: TAG_COLORS[j % TAG_COLORS.length] }));
    return {
      id: `t${i+1}`,
      date: card.querySelector('.tl-date-input').value.trim(),
      title: card.querySelector('.tl-title-input').value.trim(),
      desc: card.querySelector('.tl-desc').value.trim(),
      icon: card.querySelector('.tl-icon').value.trim() || 'fa-solid fa-star',
      tags,
    };
  });
}

// ── CONTACT ───────────────────────────────────────────────────
function populateContact(c) {
  setVal('c-email', c.email);
  setVal('c-telegram', c.telegram);
  setVal('c-telegramUrl', c.telegramUrl);
  setVal('c-linkedin', c.linkedin);
  setVal('c-linkedinUrl', c.linkedinUrl);
}

// ─── GATHER ALL DATA ──────────────────────────────────────────
function gatherAll() {
  return {
    profile: {
      name: getVal('p-name'),
      birthday: getVal('p-birthday'),
      location: getVal('p-location'),
      nationality: getVal('p-nationality'),
      focus: getVal('p-focus'),
      languages: getVal('p-languages'),
      available: getChecked('p-available'),
      availableText: getVal('p-availableText'),
      taglines: gatherTaglines(),
      avatar: currentData?.profile?.avatar || 'avatar.png',
    },
    about: {
      intro: getVal('a-intro'),
      body: getVal('a-body'),
      extra: getVal('a-extra'),
      stats: {
        projects: parseInt(getVal('a-projects')) || 0,
        years: parseInt(getVal('a-years')) || 0,
        technologies: parseInt(getVal('a-tech')) || 0,
      },
    },
    links: gatherLinks(),
    skills: gatherSkills(),
    timeline: gatherTimeline(),
    contact: {
      email: getVal('c-email'),
      telegram: getVal('c-telegram'),
      telegramUrl: getVal('c-telegramUrl'),
      linkedin: getVal('c-linkedin'),
      linkedinUrl: getVal('c-linkedinUrl'),
    },
  };
}

// ─── SAVE ─────────────────────────────────────────────────────
async function saveData() {
  const saveBtn = document.getElementById('saveBtn');
  setLoading(saveBtn, true);
  try {
    const data = gatherAll();
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    currentData = data;
    showToast('✅ Dati salvati in data.json!', 'success');
  } catch (e) {
    showToast('Errore salvataggio: ' + e.message, 'error');
  } finally {
    setLoading(saveBtn, false);
  }
}

document.getElementById('saveBtn').addEventListener('click', saveData);

// ─── PUBLISH ──────────────────────────────────────────────────
function openPublishModal() {
  const msg = document.getElementById('commitMessage').value.trim();
  document.getElementById('modalCommitMsg').value = msg || 'update: site content via dashboard';
  publishModal.classList.add('open');
}

document.getElementById('publishBtn').addEventListener('click', openPublishModal);
document.getElementById('publishBtn2').addEventListener('click', openPublishModal);
document.getElementById('modalCancel').addEventListener('click', () => publishModal.classList.remove('open'));
publishModal.addEventListener('click', e => { if (e.target === publishModal) publishModal.classList.remove('open'); });

document.getElementById('modalConfirm').addEventListener('click', async () => {
  const confirmBtn = document.getElementById('modalConfirm');
  const msg = document.getElementById('modalCommitMsg').value.trim() || 'update: site content via dashboard';

  setLoading(confirmBtn, true);
  publishModal.classList.remove('open');

  showToast('⏳ Salvataggio in corso...', 'info');

  try {
    // 1. Save first
    const data = gatherAll();
    const saveRes = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!saveRes.ok) throw new Error((await saveRes.json()).error);
    currentData = data;

    // 2. Publish
    showToast('⏳ Push su GitHub in corso...', 'info');
    const pubRes = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    const pubJson = await pubRes.json();
    if (!pubRes.ok) throw new Error(pubJson.error);

    showToast(pubJson.message || '🚀 Pubblicato!', 'success');
    loadGitStatus();
  } catch (e) {
    showToast('Errore pubblicazione: ' + e.message, 'error');
  } finally {
    setLoading(confirmBtn, false);
  }
});

// ─── AVATAR UPLOAD ────────────────────────────────────────────
document.getElementById('avatarInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Preview immediato
  const reader = new FileReader();
  reader.onload = ev => document.getElementById('avatarPreview').src = ev.target.result;
  reader.readAsDataURL(file);

  // Upload
  showToast('⏳ Caricamento avatar...', 'info');
  const form = new FormData();
  form.append('avatar', file);

  try {
    const res = await fetch('/api/avatar', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    if (currentData) currentData.profile.avatar = 'avatar.png';
    showToast('✅ Avatar aggiornato! Ricorda di pubblicare.', 'success');
  } catch (e) {
    showToast('Errore upload avatar: ' + e.message, 'error');
  }
});

document.getElementById('avatarDropzone').addEventListener('click', () => {
  document.getElementById('avatarInput').click();
});

// ─── HELPERS ──────────────────────────────────────────────────
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function setChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}
function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setLoading(btn, loading) {
  btn.disabled = loading;
  const icon = btn.querySelector('i');
  if (icon) icon.className = loading ? 'fa-solid fa-spinner fa-spin' : btn.dataset.icon || icon.className;
}
function makeListItem(value, onDelete) {
  const row = document.createElement('div');
  row.className = 'list-item';
  row.innerHTML = `
    <input type="text" class="form-input" value="${esc(value)}" placeholder="Inserisci valore..." />
    <button class="btn btn-xs btn-danger"><i class="fa-solid fa-trash"></i></button>
  `;
  const deleteBtn = row.querySelector('.btn-danger');
  if (onDelete) {
    deleteBtn.addEventListener('click', onDelete);
  } else {
    deleteBtn.addEventListener('click', () => row.remove());
  }
  return row;
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveData();
  }
});

// ─── BOOT ─────────────────────────────────────────────────────
loadData();
