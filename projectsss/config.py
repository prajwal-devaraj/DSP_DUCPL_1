import os
from dotenv import load_dotenv
load_dotenv()
class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "sechealthdb")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    HMAC_KEY = bytes.fromhex(os.getenv("HMAC_KEY", "00"*32))
    AES_KEY = bytes.fromhex(os.getenv("AES_KEY", "11"*32))
    PORT = int(os.getenv("PORT", "5000"))
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    ALLOW_ORIGIN = os.getenv("ALLOW_ORIGIN", "*")
    SEED_ON_START = os.getenv("SEED_ON_START", "true").lower() == "true"
