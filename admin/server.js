'use strict';

const express          = require('express');
const multer           = require('multer');
const path             = require('path');
const fs               = require('fs');
const { execSync }     = require('child_process');

const app  = express();
const PORT = 3001;

// Paths
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data.json');

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));       // serve dashboard UI
app.use('/site', express.static(ROOT));   // preview del sito pubblico

// ── API: leggi data.json ──────────────────────────────────────
app.get('/api/data', (_req, res) => {
  try {
    const raw = fs.readFileSync(DATA, 'utf8');
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ error: 'Impossibile leggere data.json: ' + e.message });
  }
});

// ── API: salva data.json ──────────────────────────────────────
app.post('/api/data', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Payload non valido' });
    }
    fs.writeFileSync(DATA, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: 'Impossibile scrivere data.json: ' + e.message });
  }
});

// ── API: upload avatar ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: ROOT,
  filename: (_req, _file, cb) => cb(null, 'avatar.png'),
});
const fileFilter = (_req, file, cb) => {
  const ok = /image\/(png|jpeg|jpg|webp)/.test(file.mimetype);
  cb(ok ? null : new Error('Solo immagini PNG, JPEG o WebP'), ok);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessuna immagine valida ricevuta' });
  res.json({ ok: true, filename: 'avatar.png' });
});

// ── API: pubblica su GitHub → Vercel auto-deploy ──────────────
app.post('/api/publish', (req, res) => {
  const message = ((req.body && req.body.message) || 'update: site content via dashboard')
    .replace(/"/g, "'").replace(/\n/g, ' ');

  try {
    // 1. Verifica che git sia inizializzato
    try {
      execSync('git rev-parse --git-dir', { cwd: ROOT, stdio: 'pipe' });
    } catch {
      return res.status(500).json({
        error: 'Il repository git non è inizializzato. Esegui "git init" e configura il remote prima di usare Pubblica.',
      });
    }

    // 2. Stage dei file di contenuto
    execSync('git add data.json avatar.png', { cwd: ROOT, stdio: 'pipe' });

    // 3. Controlla se ci sono modifiche da committare
    const status = execSync('git status --porcelain data.json avatar.png', {
      cwd: ROOT, stdio: 'pipe',
    }).toString().trim();

    if (!status) {
      return res.json({ ok: true, message: '✅ Nessuna modifica da pubblicare — il sito è già aggiornato.' });
    }

    // 4. Commit
    execSync(`git commit -m "${message}"`, { cwd: ROOT, stdio: 'pipe' });

    // 5. Push
    execSync('git push', { cwd: ROOT, stdio: 'pipe' });

    res.json({
      ok: true,
      message: '🚀 Pubblicato! Vercel sta distribuendo il sito — pronto in ~30 secondi.',
    });

  } catch (e) {
    const stderr = (e.stderr || Buffer.alloc(0)).toString().trim();
    const stdout = (e.stdout || Buffer.alloc(0)).toString().trim();
    const detail = stderr || stdout || e.message;
    res.status(500).json({ error: 'Errore git: ' + detail });
  }
});

// ── API: stato git (info utile nella dashboard) ───────────────
app.get('/api/git-status', (_req, res) => {
  try {
    const branch   = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    const lastLog  = execSync('git log -1 --format="%h — %s (%cr)" --', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    const remote   = execSync('git remote get-url origin', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    res.json({ ok: true, branch, lastCommit: lastLog, remote });
  } catch {
    res.json({ ok: false, message: 'Git non configurato o nessun commit ancora.' });
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   [MZ] Admin Dashboard                      ║');
  console.log(`  ║   http://localhost:${PORT}                      ║`);
  console.log('  ║                                              ║');
  console.log('  ║   Modifica i contenuti e usa "Pubblica"     ║');
  console.log('  ║   per aggiornare il sito su Vercel.         ║');
  console.log('  ║   Ctrl+C per spegnere.                      ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
