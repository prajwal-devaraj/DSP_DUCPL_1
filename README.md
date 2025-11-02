# SecHealthDB – Complete (Flask + MongoDB + 180 records)
Team: **Amitha**, **Mounika**, **Prajwal**

## Run
### Backend
```
cd backend
cp .env.sample .env   # paste your MongoDB URI (MONGO_URI=...)
pip install -r requirements.txt
python seed.py        # adds users + 180 synthetic records
python app.py         # runs on http://localhost:5000
```
### Frontend
```
cd ../frontend
python -m http.server 8080
# open http://localhost:8080/login.html
```
Demo users: `haripriya/pass` (H), `mounika/pass` (R), `prajwal/pass` (H)

## Features
- AES‑GCM for Gender & Age (confidentiality), HMAC per row (integrity), Merkle snapshot (completeness).
- Weight range query; OPE hook described in `backend/EXTRA_OPE_README.md`.
