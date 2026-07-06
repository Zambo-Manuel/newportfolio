/* ============================================================
   MANUEL ZAMBELLI — script.js
   Data-driven: carica data.json e popola il DOM.
   Il sito funziona senza la dashboard (legge solo data.json).
   ============================================================ */

'use strict';

// ── THEME TOGGLE ──────────────────────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('mz-theme', theme);
  themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

const savedTheme = localStorage.getItem('mz-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// ── MOBILE MENU ───────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

document.querySelectorAll('.mob-link').forEach(l => l.addEventListener('click', closeMenu));

// ── STICKY NAVBAR ─────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── ACTIVE NAV ────────────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    if (section.offsetTop <= scrollY && section.offsetTop + section.offsetHeight > scrollY) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${section.id}`);
      });
    }
  });
});

// ── PARTICLES ─────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.parentElement.offsetHeight;
  }

  function Particle() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r = Math.random() * 2 + 0.5;
    this.alpha = Math.random() * 0.5 + 0.1;
  }

  Particle.prototype.update = function () {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
    if (this.y < 0) this.y = H; if (this.y > H) this.y = 0;
  };

  function spawnParticles() {
    particles = [];
    const count = Math.min(Math.floor((W * H) / 12000), 80);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isDark = html.getAttribute('data-theme') === 'dark';
    const color = isDark ? '0, 212, 255' : '59, 130, 246';
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${color}, ${(1 - dist / 120) * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => {
      p.update();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); spawnParticles(); }, 200);
  });

  resize(); spawnParticles(); draw();
})();

// ── TYPEWRITER ────────────────────────────────────────────────
let typewriterPhrases = ['Developer & Tech Enthusiast', 'Web Developer', 'Open Source Lover', 'Problem Solver'];

function initTypewriter(phrases) {
  const el = document.getElementById('typewriter');
  if (!el) return;
  let phraseIdx = 0, charIdx = 0, deleting = false;
  function type() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) { deleting = true; setTimeout(type, 2000); return; }
    } else {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; }
    }
    setTimeout(type, deleting ? 50 : 80);
  }
  setTimeout(type, 1000);
}

// ── REVEAL ON SCROLL ──────────────────────────────────────────
function initReveal() {
  const targets = document.querySelectorAll(
    '.section-header, .about-text, .about-info, .link-card, .skill-item, .timeline-item, .contact-info, .contact-form-wrapper, .stat-card, .footer-brand, .footer-links, .footer-social'
  );
  targets.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );
  targets.forEach(el => observer.observe(el));
}

// ── SKILLS BARS ───────────────────────────────────────────────
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('animated'), 200); observer.unobserve(e.target); } }),
    { threshold: 0.5 }
  );
  fills.forEach(f => observer.observe(f));
}

// ── COUNTERS ──────────────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.target);
          let current = 0;
          const step = target / (1500 / 16);
          const interval = setInterval(() => {
            current = Math.min(current + step, target);
            entry.target.textContent = Math.floor(current) + (target >= 10 ? '+' : '');
            if (current >= target) clearInterval(interval);
          }, 16);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(c => observer.observe(c));
}

// ── PRIVACY & COOKIE POLICY DIALOGS ────────────────────────────
function initPrivacyAndCookies() {
  const privacyModal = document.getElementById('privacyModal');
  const openPrivacyBtn = document.getElementById('openPrivacyBtn');
  const footerPrivacyLink = document.getElementById('footerPrivacyLink');
  const closePrivacyBtn = document.getElementById('closePrivacyBtn');
  const acceptPrivacyBtn = document.getElementById('acceptPrivacyBtn');

  // Gestione modali
  const openModal = (e) => {
    if (e) e.preventDefault();
    if (privacyModal) privacyModal.classList.add('open');
  };
  const closeModal = () => {
    if (privacyModal) privacyModal.classList.remove('open');
  };

  if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', openModal);
  if (footerPrivacyLink) footerPrivacyLink.addEventListener('click', openModal);
  if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closeModal);
  if (acceptPrivacyBtn) {
    acceptPrivacyBtn.addEventListener('click', () => {
      closeModal();
      const checkbox = document.getElementById('cf-privacy');
      if (checkbox) checkbox.checked = true;
    });
  }

  // Chiusura al click esterno
  if (privacyModal) {
    privacyModal.addEventListener('click', (e) => {
      if (e.target === privacyModal) closeModal();
    });
  }
}

// ── CONTACT FORM ──────────────────────────────────────────────
let targetFormEmail = 'manuel.zambelli@email.com';

function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = contactForm.querySelectorAll('[required]');
    let valid = true;

    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        const wrapper = input.closest('.checkbox-wrapper');
        if (!input.checked) {
          if (wrapper) wrapper.style.color = '#ef4444';
          valid = false;
        } else {
          if (wrapper) wrapper.style.color = '';
        }
      } else {
        input.style.borderColor = '';
        if (!input.value.trim()) { input.style.borderColor = 'rgba(239,68,68,0.7)'; valid = false; }
        if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
          input.style.borderColor = 'rgba(239,68,68,0.7)'; valid = false;
        }
      }
    });

    if (!valid) return;

    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('i');
    btnText.textContent = 'Invio in corso...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin';
    submitBtn.disabled = true;

    // Raccoglie i dati inseriti
    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const subject = document.getElementById('cf-subject').value.trim();
    const message = document.getElementById('cf-message').value.trim();

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${targetFormEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message
        })
      });

      const json = await res.json();
      if (!res.ok || json.success === 'false') {
        throw new Error((json && json.message) || 'Errore server');
      }

      contactForm.reset();
      formSuccess.style.color = 'var(--accent-green)';
      formSuccess.style.background = 'rgba(16, 185, 129, 0.1)';
      formSuccess.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      formSuccess.innerHTML = '<i class="fa-solid fa-circle-check"></i> Messaggio inviato! Ti risponderò al più presto.';
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 6000);

    } catch (err) {
      console.error(err);
      formSuccess.style.color = '#ef4444';
      formSuccess.style.background = 'rgba(239, 68, 68, 0.1)';
      formSuccess.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      formSuccess.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Errore nell'invio: ${err.message || 'Riprova più tardi.'}`;
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 6000);
    } finally {
      btnText.textContent = 'Invia messaggio';
      btnIcon.className = 'fa-solid fa-paper-plane';
      submitBtn.disabled = false;
    }
  });

  contactForm.querySelectorAll('.form-input').forEach(i => {
    i.addEventListener('input', () => { i.style.borderColor = ''; });
  });

  const privacyCheckbox = document.getElementById('cf-privacy');
  if (privacyCheckbox) {
    privacyCheckbox.addEventListener('change', () => {
      const wrapper = privacyCheckbox.closest('.checkbox-wrapper');
      if (wrapper) wrapper.style.color = '';
    });
  }
}

// ── DOM POPULATION HELPERS ────────────────────────────────────

function renderHero(d) {
  const p = d.profile;

  // Avatar
  const avatarImg = document.getElementById('avatarImg');
  if (avatarImg && p.avatar) avatarImg.src = p.avatar;

  // Badge disponibilità
  const badge = document.getElementById('heroBadge');
  if (badge) {
    badge.style.display = p.available ? '' : 'none';
    const badgeText = badge.querySelector('.badge-text');
    if (badgeText) badgeText.textContent = p.availableText || 'Disponibile per nuove opportunità';
  }

  // Nome
  const nameEl = document.getElementById('heroName');
  if (nameEl) {
    const parts = p.name.split(' ');
    if (parts.length >= 2) {
      nameEl.innerHTML = `${parts[0]} <span class="gradient-text">${parts.slice(1).join(' ')}</span>`;
    } else {
      nameEl.innerHTML = `<span class="gradient-text">${p.name}</span>`;
    }
  }

  // Typewriter
  if (p.taglines && p.taglines.length) {
    typewriterPhrases = p.taglines;
  }
  initTypewriter(typewriterPhrases);

  // Meta (birthday, location)
  const metaEl = document.getElementById('heroMeta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span><i class="fa-solid fa-calendar-days"></i> Nato il ${p.birthday}</span>
      <span><i class="fa-solid fa-location-dot"></i> ${p.location}</span>
    `;
  }
}

function renderAbout(d) {
  const a = d.about;
  const introEl = document.getElementById('aboutIntro');
  if (introEl) introEl.innerHTML = a.intro;
  const bodyEl = document.getElementById('aboutBody');
  if (bodyEl) bodyEl.textContent = a.body;
  const extraEl = document.getElementById('aboutExtra');
  if (extraEl) extraEl.textContent = a.extra;

  // Stats
  const statsMap = { 'stat-projects': a.stats.projects, 'stat-years': a.stats.years, 'stat-tech': a.stats.technologies };
  Object.entries(statsMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) { el.dataset.target = val; el.textContent = '0'; }
  });

  // Info card
  const p = d.profile;
  const infoMap = {
    'info-name': p.name,
    'info-birthday': p.birthday,
    'info-nationality': p.nationality,
    'info-focus': p.focus,
    'info-languages': p.languages,
  };
  Object.entries(infoMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // Status
  const statusEl = document.getElementById('info-status');
  if (statusEl) {
    statusEl.innerHTML = p.available
      ? `<span class="pulse-dot small"></span> Disponibile`
      : `<span style="color:var(--accent-orange)">Non disponibile</span>`;
    statusEl.className = p.available ? 'info-val status-green' : 'info-val';
  }
}

function renderLinks(d) {
  const container = document.getElementById('linksGrid');
  if (!container) return;
  container.innerHTML = '';
  d.links.forEach((link, i) => {
    const a = document.createElement('a');
    a.href = link.url;
    a.className = `link-card ${link.colorClass}`;
    a.id = `link-${link.id}`;
    if (link.external) { a.target = '_blank'; a.rel = 'noopener'; }
    a.style.transitionDelay = `${i * 60}ms`;
    a.innerHTML = `
      <div class="link-icon"><i class="${link.icon}"></i></div>
      <div class="link-info">
        <span class="link-name">${link.name}</span>
        <span class="link-desc">${link.desc}</span>
      </div>
      <i class="fa-solid fa-arrow-up-right-from-square link-arrow"></i>
    `;
    container.appendChild(a);
  });
}

function renderSkills(d) {
  const sk = d.skills;

  // Bars
  const barsContainer = document.getElementById('skillsBars');
  if (barsContainer) {
    barsContainer.innerHTML = '';
    sk.bars.forEach(s => {
      const div = document.createElement('div');
      div.className = 'skill-item';
      div.dataset.level = s.level;
      div.innerHTML = `
        <div class="skill-header">
          <span class="skill-name"><i class="${s.icon}"></i> ${s.name}</span>
          <span class="skill-pct">${s.level}%</span>
        </div>
        <div class="skill-bar">
          <div class="skill-fill" style="--target: ${s.level}%"></div>
        </div>
      `;
      barsContainer.appendChild(div);
    });
  }

  // Tags
  const tagsContainer = document.getElementById('skillsTags');
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
    sk.tags.forEach(t => {
      const span = document.createElement('span');
      span.className = `tag ${t.color}`;
      span.textContent = t.name;
      tagsContainer.appendChild(span);
    });
  }

  // Learning
  const learningContainer = document.getElementById('skillsLearning');
  if (learningContainer) {
    learningContainer.innerHTML = '';
    sk.learning.forEach(l => {
      const span = document.createElement('span');
      span.className = 'tag tag-glow';
      span.textContent = l;
      learningContainer.appendChild(span);
    });
  }
}

function renderTimeline(d) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  container.innerHTML = '';
  d.timeline.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.style.transitionDelay = `${i * 100}ms`;
    div.innerHTML = `
      <div class="timeline-dot"><i class="${item.icon}"></i></div>
      <div class="timeline-content">
        <span class="timeline-date">${item.date}</span>
        <h3 class="timeline-title">${item.title}</h3>
        <p class="timeline-desc">${item.desc}</p>
        <div class="timeline-tags">
          ${item.tags.map(t => `<span class="tag tag-small ${t.color}">${t.name}</span>`).join('')}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderContact(d) {
  const c = d.contact;
  const emailLink = document.getElementById('contact-email-link');
  if (emailLink) { emailLink.href = `mailto:${c.email}`; emailLink.textContent = c.email; }
  const telegramLink = document.getElementById('contact-telegram-link');
  if (telegramLink) { telegramLink.href = c.telegramUrl; telegramLink.textContent = c.telegram; }
  const linkedinLink = document.getElementById('contact-linkedin-link');
  if (linkedinLink) { linkedinLink.href = c.linkedinUrl; linkedinLink.textContent = c.linkedin; }
}

function renderFooter(d) {
  const p = d.profile;
  const c = d.contact;

  // Social links in footer
  const socialMap = {
    'footer-linkedin': d.links.find(l => l.id === 'linkedin')?.url,
    'footer-github': d.links.find(l => l.id === 'github')?.url,
    'footer-twitter': d.links.find(l => l.id === 'twitter')?.url,
    'footer-telegram': d.links.find(l => l.id === 'telegram')?.url,
    'footer-instagram': d.links.find(l => l.id === 'instagram')?.url,
  };
  Object.entries(socialMap).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el && url) el.href = url;
  });
}

// ── MAIN DATA LOADER ──────────────────────────────────────────
async function loadData() {
  try {
    // Try fetching fresh data.json
    const res = await fetch(`data.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();

    if (data.contact) {
      targetFormEmail = data.contact.formEmail || data.contact.email || targetFormEmail;
    }

    renderHero(data);
    renderAbout(data);
    renderLinks(data);
    renderSkills(data);
    renderTimeline(data);
    renderContact(data);
    renderFooter(data);

  } catch (err) {
    // Fallback: use static HTML content already in the page
    console.warn('[MZ] data.json not available, using static fallback.', err.message);
    initTypewriter(typewriterPhrases);
  }

  // Always initialize UI behaviors after data load
  initReveal();
  initSkillBars();
  initCounters();
  initPrivacyAndCookies();
  initContactForm();

  // Stagger reveals
  document.querySelectorAll('.link-card').forEach((card, i) => { card.style.transitionDelay = `${i * 60}ms`; });
  document.querySelectorAll('.timeline-item').forEach((item, i) => { item.style.transitionDelay = `${i * 100}ms`; });
}

// Boot
document.addEventListener('DOMContentLoaded', loadData);
