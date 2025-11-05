import base64, hmac, hashlib, json, os
from typing import List
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
def a256gcm_encrypt(aes_key: bytes, plaintext: bytes, aad: bytes = b"") -> dict:
    nonce = os.urandom(12); aead = AESGCM(aes_key); ct = aead.encrypt(nonce, plaintext, aad)
    return {"nonce": base64.b64encode(nonce).decode(), "ct": base64.b64encode(ct).decode()}
def a256gcm_decrypt(aes_key: bytes, enc: dict, aad: bytes = b"") -> bytes:
    nonce = base64.b64decode(enc["nonce"]); ct = base64.b64decode(enc["ct"]); aead = AESGCM(aes_key); return aead.decrypt(nonce, ct, aad)
def canonical_json(obj) -> bytes: return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()
def row_hmac(hmac_key: bytes, row_obj: dict) -> str:
    obj = {k: v for k, v in row_obj.items() if k != "hmac"}
    return hmac.new(hmac_key, canonical_json(obj), hashlib.sha256).hexdigest()
def merkle_tree(leaves: List[bytes]):
    if not leaves:
        h = hashlib.sha256(b"").digest(); return h, [[h]]
    level = [hashlib.sha256(x).digest() for x in leaves]; levels = [level]
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            a = level[i]; b = level[i+1] if i+1 < len(level) else a
            nxt.append(hashlib.sha256(a + b).digest())
        levels.append(nxt); level = nxt
    return level[0], levels
def verify_merkle(root: bytes, leaf: bytes, proof):
    h = hashlib.sha256(leaf).digest()
    for item in proof:
        sib = base64.b64decode(item["sib"]); pos = item["pos"]
        h = hashlib.sha256((sib + h) if pos == "L" else (h + sib)).digest()
    return h == root
