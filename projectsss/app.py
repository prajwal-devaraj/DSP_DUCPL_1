from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from itsdangerous import URLSafeTimedSerializer, BadSignature
import os, time, base64
from config import Config
from crypto_utils import a256gcm_encrypt, row_hmac, canonical_json, merkle_tree, verify_merkle
from seed_util import seed_users, seed_records

cfg = Config()
STATIC_DIR = os.path.join(os.path.dirname(__file__), "frontend")

app = Flask(__name__, static_folder=None)
app.config["SECRET_KEY"] = cfg.SECRET_KEY
CORS(app, resources={r"/*": {"origins": cfg.ALLOW_ORIGIN}}, supports_credentials=True)

client = MongoClient(cfg.MONGO_URI)
db = client[cfg.DB_NAME]
users = db["users"]
records = db["records"]
snapshots = db["snapshots"]

if cfg.SEED_ON_START:
    try:
        seed_users(); seed_records()
        print("[seed] users and records ensured")
    except Exception as e:
        print("[seed] skipped:", e)

signer = URLSafeTimedSerializer(app.config["SECRET_KEY"], salt="sechealthdb")
def make_token(payload: dict) -> str: return signer.dumps(payload)
def read_token(token: str, max_age=3600*24*7): return signer.loads(token, max_age=max_age)

def auth_required(role=None):
    def inner(fn):
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "): return jsonify({"ok": False, "error": "missing_token"}), 401
            token = auth.split(" ",1)[1]
            try: data = read_token(token)
            except BadSignature: return jsonify({"ok": False, "error": "bad_token"}), 401
            if role and data.get("role") != role: return jsonify({"ok": False, "error": "forbidden"}), 403
            request.user = data; return fn(*args, **kwargs)
        wrapper.__name__ = fn.__name__; return wrapper
    return inner

@app.post("/auth/register")
def register():
    b = request.get_json() or {}; u = (b.get("username") or "").strip(); p = (b.get("password") or "").encode(); r = b.get("role") or "R"
    if not u or not p: return jsonify({"ok": False, "error": "missing_fields"}), 400
    if users.find_one({"username": u}): return jsonify({"ok": False, "error": "exists"}), 409
    import bcrypt
    users.insert_one({"username": u, "pw": bcrypt.hashpw(p, bcrypt.gensalt()).decode(), "role": r})
    return jsonify({"ok": True})

@app.post("/auth/login")
def login():
    b = request.get_json() or {}; u = (b.get("username") or "").strip(); p = (b.get("password") or "").encode()
    doc = users.find_one({"username": u}); import bcrypt
    if not doc or not bcrypt.checkpw(p, doc["pw"].encode()): return jsonify({"ok": False, "error": "invalid"}), 401
    return jsonify({"ok": True, "token": make_token({"u": u, "role": doc["role"], "ts": int(time.time())}), "user": {"username": u, "role": doc["role"]}})

def pack_enc(v): return {"__enc": True, **a256gcm_encrypt(cfg.AES_KEY, str(v).encode())}
def compute_row_hmac(obj: dict) -> str:
    core = {"first": obj.get("first"), "last": obj.get("last"), "gender": obj.get("gender"), "age": obj.get("age"), "weight": obj.get("weight"), "height": obj.get("height"), "history": obj.get("history")}
    return row_hmac(cfg.HMAC_KEY, core)

@app.post("/insert")
@auth_required(role="H")
def insert_record():
    b = request.get_json() or {}
    doc = {"first": b.get("first",""), "last": b.get("last",""), "gender": pack_enc(b.get("gender","")), "age": pack_enc(b.get("age","")), "weight": float(b.get("weight",0)), "height": float(b.get("height",0)), "history": b.get("history","")}
    doc["hmac"] = compute_row_hmac(doc)
    rid = records.insert_one(doc).inserted_id
    return jsonify({"ok": True, "id": str(rid)})

@app.post("/query")
@auth_required()
def query_records():
    b = request.get_json() or {}; q = {}
    try:
        if b.get("w_min") not in [None,""]: q.setdefault("weight", {})["$gte"] = float(b.get("w_min"))
        if b.get("w_max") not in [None,""]: q.setdefault("weight", {})["$lte"] = float(b.get("w_max"))
    except: pass
    docs = list(records.find(q).limit(300))
    rows, leaves = [], []
    for d in docs:
        rows.append({"first": d.get("first"), "last": d.get("last"), "gender_enc": True, "age_enc": True, "gender": None, "age": None, "weight": d.get("weight"), "height": d.get("height"), "history": d.get("history"), "hmac_ok": (compute_row_hmac(d) == d.get("hmac"))})
        leaves.append(canonical_json({"first": d.get("first"), "last": d.get("last"), "weight": d.get("weight"), "height": d.get("height"), "history": d.get("history"), "hmac": d.get("hmac")}))
    root, _ = merkle_tree(leaves)
    snapshots.insert_one({"ts": int(time.time()), "root": base64.b64encode(root).decode()})
    return jsonify({"ok": True, "rows": rows, "merkle_ok": True, "merkle_root": base64.b64encode(root).decode(), "count": len(rows)})

@app.post("/proof/hmac")
def proof_hmac():
    b = request.get_json() or {}; row, h = b.get("row"), b.get("hmac")
    if not isinstance(row, dict) or not isinstance(h, str): return jsonify({"ok": False}), 400
    return jsonify({"ok": row_hmac(cfg.HMAC_KEY, row) == h})

@app.post("/proof/merkle")
def proof_merkle():
    b = request.get_json() or {}
    try:
        root = base64.b64decode(b.get("root")); leaf = canonical_json(b.get("leaf")); proof = b.get("proof", [])
        return jsonify({"ok": verify_merkle(root, leaf, proof)})
    except Exception: return jsonify({"ok": False}), 400

@app.get("/health")
def health(): return {"ok": True, "service": "SecHealthDB-Backend"}

@app.get("/")
def home(): return send_from_directory(STATIC_DIR, "login.html")

@app.route('/<path:path>')
def static_proxy(path): return send_from_directory(STATIC_DIR, path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=cfg.PORT, debug=cfg.DEBUG)
