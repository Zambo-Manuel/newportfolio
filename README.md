# 🚀 Manuel Zambelli — Personal Page

Pagina personale di **Manuel Zambelli** — stile futuristico/tech.
Completamente statica, hostabile su **GitHub Pages** o Vercel.
I contenuti si aggiornano via dashboard locale + `git push`.

---

## ✨ Features

- 🌙 Dark / Light Mode
- ✨ Particelle canvas animate (hero)
- ⌨️ Typewriter effect
- 📊 Barre skill animate al scroll
- 🔢 Contatori animati
- 📋 Timeline percorso
- 📬 Contact form con validazione
- 📱 Mobile responsive
- 🛠️ **Dashboard admin locale** per aggiornare i contenuti
- 🚀 **Deploy automatico** su GitHub Pages / Vercel con un click

---

## 📁 Struttura

```
Semi-portfolio/
├── index.html          ← Sito pubblico
├── style.css           ← Stili
├── script.js           ← Logica (legge data.json)
├── data.json           ← 📌 UNICA FONTE DI VERITÀ (contenuti)
├── avatar.png          ← Foto profilo
├── hero_bg.png         ← Sfondo hero
├── .gitignore
├── package.json
├── README.md
│
└── admin/              ← Dashboard locale (NON serve per il sito)
    ├── server.js       ← Server Express (porta 3001)
    ├── dashboard.html  ← UI della dashboard
    ├── dashboard.css
    ├── dashboard.js
    └── package.json
```

> **Come funziona:** `data.json` viene committato su GitHub.
> GitHub Pages lo serve come file statico. Il sito lo legge via `fetch()`.
> La dashboard locale lo modifica e fa `git push` per aggiornare il sito.

---

## 🌐 Deploy su GitHub Pages

### 1. Crea il repository su GitHub

```bash
git init
git add .
git commit -m "initial commit: Manuel Zambelli personal page"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/TUO-REPO.git
git push -u origin main
```

### 2. Attiva GitHub Pages

1. Vai su **GitHub → Repository → Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → Folder: `/ (root)`
4. Clicca **Save**

Il sito sarà live su: `https://TUO-USERNAME.github.io/TUO-REPO/`

> ℹ️ Se il repo si chiama `TUO-USERNAME.github.io` il sito sarà all'URL root.

---

## 🛠️ Dashboard Admin (aggiornamento contenuti)

### Avvia la dashboard

```bash
cd admin
node server.js
```

Si apre su → **http://localhost:3001**

### Flusso di lavoro

1. Avvia la dashboard con `node server.js`
2. Modifica i contenuti (profilo, link, skills, timeline, ecc.)
3. Clicca **"Salva"** (oppure `Ctrl+S`) per salvare `data.json`
4. Clicca **"Pubblica"** per fare `git commit + push`
5. GitHub Pages si aggiorna in ~30 secondi ✅
6. Chiudi il terminale — il sito continua a funzionare

> La dashboard **non deve essere online** per far funzionare il sito.
> È un tool locale, usalo solo quando vuoi aggiornare qualcosa.

---

## 🖥️ Avviare il sito in locale (senza dashboard)

```bash
# Opzione 1: live-server (con auto-reload)
npx -y live-server . --port=3000

# Opzione 2: via dashboard admin (serve anche il sito)
# Apri http://localhost:3001/site/index.html
cd admin && node server.js
```

---

## 🎨 Personalizzazione rapida

| Cosa cambiare | Dove |
|---|---|
| Tutti i contenuti | Dashboard admin → **Pubblica** |
| Colori tema | `style.css` → variabili `:root` |
| Frasi typewriter | Dashboard → Profilo → Taglines |
| Link social | Dashboard → Link Hub |
| Skills | Dashboard → Skills |

---

## ⌨️ Comandi Admin

| Comando | Descrizione |
|---|---|
| `Ctrl+S` | Salva data.json (senza push) |
| Click **Salva** | Salva data.json localmente |
| Click **Pubblica** | Salva + git push → deploy automatico |

---

## 👤 Autore

**Manuel Zambelli**
- 💼 LinkedIn: [linkedin.com/in/manuelzambelli](https://linkedin.com/in/manuelzambelli)
- 🐙 GitHub: [github.com/manuelzambelli](https://github.com/manuelzambelli)

---

© 2026 Manuel Zambelli. Built with ❤️ & code.
