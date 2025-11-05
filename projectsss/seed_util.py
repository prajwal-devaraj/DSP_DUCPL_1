from faker import Faker
from pymongo import MongoClient
import bcrypt, random
from config import Config
from crypto_utils import a256gcm_encrypt, row_hmac
cfg = Config()
client = MongoClient(cfg.MONGO_URI)
db = client[cfg.DB_NAME]
users = db["users"]
records = db["records"]
fake = Faker()
def pack_enc(val: str):
    return {"__enc": True, **a256gcm_encrypt(cfg.AES_KEY, str(val).encode())}
def compute_row_hmac(obj: dict) -> str:
    core = {"first": obj.get("first"), "last": obj.get("last"), "gender": obj.get("gender"), "age": obj.get("age"), "weight": obj.get("weight"), "height": obj.get("height"), "history": obj.get("history")}
    return row_hmac(cfg.HMAC_KEY, core)
def seed_users():
    demo = [("amitha","pass","H"), ("mounika","pass","R"), ("prajwal","pass","H")]
    for u,p,r in demo:
        if not users.find_one({"username": u}):
            users.insert_one({"username": u, "pw": bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode(), "role": r})
    return True
def seed_records(n=180):
    if records.estimated_document_count() >= n: return False
    genders = ["M","F"]
    from random import randint, uniform, choice
    for _ in range(n):
        first = fake.first_name(); last = fake.last_name()
        g = choice(genders); age = randint(18, 89)
        weight = round(uniform(45, 110), 1); height = round(uniform(145, 200), 1)
        history = fake.sentence(nb_words=10)
        doc = {"first": first, "last": last, "gender": pack_enc(g), "age": pack_enc(age), "weight": weight, "height": height, "history": history}
        doc["hmac"] = compute_row_hmac(doc); records.insert_one(doc)
    return True
