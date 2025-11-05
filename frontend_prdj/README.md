# SecHealthDB Frontend (Static)

A clean, responsive static frontend for the **Secure Healthcare DBaaS** course project. This repo ships as pure HTML/CSS/JS so you can host it on GitHub Pages or any static host.

> ⚠️ **Do not embed secrets.** Never put database URIs or API keys into client-side code.

## Pages
- `index.html` – Sign in
- `register.html` – Create account (choose Group **H** or **R**)
- `dashboard.html` – Overview and quick actions
- `query.html` – Simple filters for Age/Gender/Weight/Height
- `add.html` – Add record (visible only to Group **H**)
- `access-denied.html` – Shown if a user without permission tries to access Add

## Mock Mode
This frontend includes a **mock mode** so teammates can click around without a backend.
- Append `?mock=1` to any page, or just open the files from disk.
- Click **Try Demo (Mock)** on the sign‑in screen.
- Demo data lives in `sample-data.json`.

## Wiring to Your Flask Backend
Set your API base URL (once your Flask app is running) by opening the browser console and running:
```js
localStorage.setItem('SEC_API_BASE', 'http://localhost:5000');
```
Then reload the page and make sure CORS is enabled server‑side. Expected endpoints:
- `POST /auth/register` → `{username, password, group}`
- `POST /auth/login` → `{username, password}` returns `{ token, user: {username, group} }`
- `GET /records/search?ageMin=&ageMax=&gender=&weightMin=&weightMax=&heightMin=` → array of rows
- `POST /records` → create a new row

> Server MUST enforce: bcrypt password hashing, group-based access (H vs R), AES‑GCM for sensitive fields, HMAC/Merkle proofs (as per your project). Client-side checks here are only for UX.

## Local Use
Just open `index.html` in your browser. For GitHub Pages, push this folder to a repo and enable Pages.

## License
MIT
