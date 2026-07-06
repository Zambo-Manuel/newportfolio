'use strict';

const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const { execSync } = require('child_process');
const bcrypt       = require('bcrypt');
const session      = require('express-session');

const app  = express();
const PORT = 3001;

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data.json');

// ── Credenziali (hash bcrypt, 12 rounds — irreversibile) ──────
// Username: Manuel Zambelli
// Password: [hashed — non recuperabile da questo valore]
const VALID_USERNAME = 'Manuel Zambelli';
const PASSWORD_HASH  = '$2b$12$elvnAwhrxS9Zn6Ur6fKfieHtnsoSCa5PtB1kjXT4XkXU7e0BNPj.y';

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

app.use(session({
  secret: 'mz-dash-7f3k9p2xq8w1v5n4j6r0t',   // fisso: invalida sessioni al restart (ok per uso locale)
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,          // non accessibile da JS client
    sameSite: 'strict',      // blocca CSRF
    secure: false,           // localhost (non HTTPS)
    maxAge: 8 * 60 * 60 * 1000,  // 8 ore
  },
}));

// ── Auth guard ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Non autenticato. Effettua il login.' });
}

// ── File statici: solo login accessibile senza auth ──────────
// Serve login.html pubblicamente
app.use('/login.html',   express.static(path.join(__dirname, 'login.html')));
app.use('/login.css',    express.static(path.join(__dirname, 'login.css')));

// Dashboard e assets: protetti
app.use('/dashboard.html', requireAuth, express.static(path.join(__dirname, 'dashboard.html')));
app.use('/dashboard.css',  requireAuth, express.static(path.join(__dirname, 'dashboard.css')));
app.use('/dashboard.js',   requireAuth, express.static(path.join(__dirname, 'dashboard.js')));

// Preview sito pubblico: accessibile (è già pubblico su GitHub Pages)
app.use('/site', express.static(ROOT));

// ── API: Login ────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  // Rate limiting basilare: piccolo delay su ogni tentativo
  await new Promise(r => setTimeout(r, 300));

  if (!username || !password) {
    return res.status(400).json({ error: 'Credenziali mancanti.' });
  }

  // Username check (case-insensitive)
  if (username.trim().toLowerCase() !== VALID_USERNAME.toLowerCase()) {
    return res.status(401).json({ error: 'Credenziali non valide.' });
  }

  // Password check con bcrypt (timing-safe)
  const valid = await bcrypt.compare(password, PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({ error: 'Credenziali non valide.' });
  }

  // Rigenera la sessione per prevenire session fixation
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Errore sessione.' });
    req.session.authenticated = true;
    req.session.username = VALID_USERNAME;
    res.json({ ok: true });
  });
});

// ── API: Logout ───────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── API: Stato autenticazione ─────────────────────────────────
app.get('/api/auth-check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// ── API: Leggi data.json ──────────────────────────────────────
app.get('/api/data', requireAuth, (_req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(DATA, 'utf8')));
  } catch (e) {
    res.status(500).json({ error: 'Impossibile leggere data.json: ' + e.message });
  }
});

// ── API: Salva data.json ──────────────────────────────────────
app.post('/api/data', requireAuth, (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Payload non valido.' });
    }
    fs.writeFileSync(DATA, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: 'Impossibile scrivere data.json: ' + e.message });
  }
});

// ── API: Upload avatar ────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: ROOT,
    filename: (_req, _file, cb) => cb(null, 'avatar.png'),
  }),
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpeg|jpg|webp)/.test(file.mimetype);
    cb(ok ? null : new Error('Solo PNG, JPEG o WebP'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post('/api/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessuna immagine valida.' });
  res.json({ ok: true });
});

// ── API: Pubblica su GitHub → Vercel/GitHub Pages ─────────────
app.post('/api/publish', requireAuth, (req, res) => {
  const message = ((req.body && req.body.message) || 'update: site content via dashboard')
    .replace(/"/g, "'").replace(/\n/g, ' ');

  try {
    execSync('git rev-parse --git-dir', { cwd: ROOT, stdio: 'pipe' });
  } catch {
    return res.status(500).json({
      error: 'Repository git non inizializzato. Configura il remote prima di pubblicare.',
    });
  }

  try {
    execSync('git add data.json avatar.png', { cwd: ROOT, stdio: 'pipe' });

    const status = execSync('git status --porcelain data.json avatar.png', {
      cwd: ROOT, stdio: 'pipe',
    }).toString().trim();

    if (!status) {
      return res.json({ ok: true, message: '✅ Nessuna modifica — il sito è già aggiornato.' });
    }

    execSync(`git commit -m "${message}"`, { cwd: ROOT, stdio: 'pipe' });
    execSync('git push', { cwd: ROOT, stdio: 'pipe' });

    res.json({ ok: true, message: '🚀 Pubblicato! GitHub Pages aggiornerà il sito in ~30 secondi.' });
  } catch (e) {
    const detail = (e.stderr || Buffer.alloc(0)).toString().trim() || e.message;
    res.status(500).json({ error: 'Errore git: ' + detail });
  }
});

// ── API: Stato git ────────────────────────────────────────────
app.get('/api/git-status', requireAuth, (_req, res) => {
  try {
    const branch  = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    const lastLog = execSync('git log -1 --format="%h — %s (%cr)"', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    const remote  = execSync('git remote get-url origin', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    res.json({ ok: true, branch, lastCommit: lastLog, remote });
  } catch {
    res.json({ ok: false, message: 'Git non configurato o nessun commit.' });
  }
});

// ── Root: redirect a login o dashboard ───────────────────────
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.redirect('/dashboard.html');
  } else {
    res.redirect('/login.html');
  }
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   [MZ] Admin Dashboard  — PROTETTO          ║');
  console.log(`  ║   http://localhost:${PORT}                      ║`);
  console.log('  ║                                              ║');
  console.log('  ║   Login richiesto per accedere              ║');
  console.log('  ║   Ctrl+C per spegnere                       ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
