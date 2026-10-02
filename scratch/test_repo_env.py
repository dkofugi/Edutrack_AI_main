import sys
import os
import subprocess
from dotenv import load_dotenv

load_dotenv()

print("--- DIAGNOSTICO DE AMBIENTE ---")
print("Python executable:", sys.executable)
print("Current Working Directory:", os.getcwd())
print("DATABASE_URL:", os.getenv("DATABASE_URL"))
print("PGHOST:", os.getenv("PGHOST"))

from backend.repository import UsuarioRepository

repo = UsuarioRepository()
print("UsuarioRepository.use_postgres:", repo.use_postgres)
