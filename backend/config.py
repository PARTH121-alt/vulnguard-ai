import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "vulnguard-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vulnguard.db")
MODEL_PATH = os.getenv("MODEL_PATH", "./ml/models")
MAX_CODE_LENGTH = int(os.getenv("MAX_CODE_LENGTH", "10000"))
