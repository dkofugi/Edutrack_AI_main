"""
Repositório de Usuários (PostgreSQL & Persistência Local)
Gerencia o armazenamento das credenciais na tabela `usuarios`.
Colunas: id, login, senha_hash, situacao, recovery_token, recovery_expires, created_at, updated_at.
"""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional, Dict, Any


class UsuarioRepository:
    def __init__(self, db_path: Optional[str] = None):
        """
        Inicializa o repositório.
        Se houver DATABASE_URL ou variáveis PG definidas e psycopg2 instalado, conecta ao PostgreSQL.
        Caso contrário, utiliza SQLite local mantendo o mesmo esquema e nomes de colunas.
        """
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass

        self.pg_url = os.getenv("DATABASE_URL")
        self.use_postgres = False
        self.pg_module = None

        try:
            import psycopg2
            self.pg_module = psycopg2
            if self.pg_url:
                try:
                    conn = self.pg_module.connect(self.pg_url, connect_timeout=3)
                    conn.close()
                    self.use_postgres = True
                except Exception as exc:
                    print(f"[!] Falha na conexão PostgreSQL (DATABASE_URL): [{type(exc).__name__}] {exc}")
                    print("[!] Ativando fallback para SQLite local.")
                    self.use_postgres = False
            elif os.getenv("PGHOST") and os.getenv("PGDATABASE"):
                try:
                    conn = self.pg_module.connect(
                        host=os.getenv("PGHOST"),
                        port=os.getenv("PGPORT", "5432"),
                        user=os.getenv("PGUSER", "postgres"),
                        password=os.getenv("PGPASSWORD", ""),
                        database=os.getenv("PGDATABASE"),
                        connect_timeout=3
                    )
                    conn.close()
                    self.use_postgres = True
                except Exception as exc:
                    print(f"[!] Falha na conexão PostgreSQL (PGHOST/PGDATABASE): [{type(exc).__name__}] {exc}")
                    print("[!] Ativando fallback para SQLite local.")
                    self.use_postgres = False
            else:
                print("[!] Nenhuma variável de conexão PostgreSQL (DATABASE_URL ou PGHOST/PGDATABASE) configurada no ambiente.")
                print("[!] Ativando fallback para SQLite local.")
        except ImportError as exc:
            print(f"[!] Driver PostgreSQL (psycopg2) não instalado: [{type(exc).__name__}] {exc}")
            print("[!] Ativando fallback para SQLite local.")
            self.use_postgres = False

        self.sqlite_db = db_path or os.path.join(os.path.dirname(__file__), "usuarios.db")
        self.inicializar_tabela()

    def _get_connection(self):
        if self.use_postgres and self.pg_module:
            if self.pg_url:
                return self.pg_module.connect(self.pg_url)
            return self.pg_module.connect(
                host=os.getenv("PGHOST"),
                port=os.getenv("PGPORT", "5432"),
                user=os.getenv("PGUSER", "postgres"),
                password=os.getenv("PGPASSWORD", ""),
                database=os.getenv("PGDATABASE")
            )
        conn = sqlite3.connect(self.sqlite_db)
        conn.row_factory = sqlite3.Row
        return conn

    @contextmanager
    def _connection(self):
        conn = self._get_connection()
        try:
            yield conn
        finally:
            conn.close()

    def inicializar_tabela(self):
        """Cria a tabela usuarios caso não exista com campos de auth e recuperação."""
        if self.use_postgres:
            with self._connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS usuarios (
                            id SERIAL PRIMARY KEY,
                            nome VARCHAR(120),
                            login VARCHAR(150) UNIQUE NOT NULL,
                            senha_hash VARCHAR(255) NOT NULL,
                            situacao VARCHAR(50) NOT NULL DEFAULT 'ativo',
                            recovery_token VARCHAR(255),
                            recovery_expires TIMESTAMP WITH TIME ZONE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(login);
                        CREATE INDEX IF NOT EXISTS idx_usuarios_recovery_token ON usuarios(recovery_token);
                    """)
                conn.commit()
        else:
            with self._connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS usuarios (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome TEXT,
                        login TEXT UNIQUE NOT NULL,
                        senha_hash TEXT NOT NULL,
                        situacao TEXT NOT NULL DEFAULT 'ativo',
                        recovery_token TEXT,
                        recovery_expires TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                # Migra colunas caso a tabela SQLite já existisse sem recovery_token
                cur = conn.cursor()
                cur.execute("PRAGMA table_info(usuarios);")
                colunas = [row[1] for row in cur.fetchall()]
                if "nome" not in colunas:
                    conn.execute("ALTER TABLE usuarios ADD COLUMN nome TEXT;")
                if "recovery_token" not in colunas:
                    conn.execute("ALTER TABLE usuarios ADD COLUMN recovery_token TEXT;")
                if "recovery_expires" not in colunas:
                    conn.execute("ALTER TABLE usuarios ADD COLUMN recovery_expires TEXT;")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(login);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_recovery_token ON usuarios(recovery_token);")
                conn.commit()

    def buscar_por_login(self, login: str) -> Optional[Dict[str, Any]]:
        """
        Busca um usuário pelo login de forma segura e parametrizada.
        """
        if not login:
            return None

        login_normalizado = login.strip().lower()

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, nome, login, senha_hash, situacao, recovery_token, recovery_expires, created_at, updated_at 
                        FROM usuarios 
                        WHERE LOWER(login) = %s;
                    """, (login_normalizado,))
                    row = cur.fetchone()
                    if not row:
                        return None
                    return {
                        "id": row[0],
                        "nome": row[1],
                        "login": row[2],
                        "senha_hash": row[3],
                        "situacao": row[4],
                        "recovery_token": row[5],
                        "recovery_expires": row[6],
                        "created_at": row[7],
                        "updated_at": row[8],
                    }
            else:
                cur = conn.execute("""
                    SELECT id, nome, login, senha_hash, situacao, recovery_token, recovery_expires, created_at, updated_at 
                    FROM usuarios 
                    WHERE LOWER(login) = ?;
                """, (login_normalizado,))
                row = cur.fetchone()
                if not row:
                    return None
                return {
                    "id": row["id"],
                    "nome": row["nome"],
                    "login": row["login"],
                    "senha_hash": row["senha_hash"],
                    "situacao": row["situacao"],
                    "recovery_token": row["recovery_token"],
                    "recovery_expires": row["recovery_expires"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }

    def criar_usuario(self, login: str, senha_hash: str, situacao: str = "ativo") -> Dict[str, Any]:
        """
        Cadastra um novo usuário persistindo apenas o hash bcrypt da senha.
        """
        login_normalizado = login.strip().lower()
        now = datetime.now(timezone.utc).isoformat()

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO usuarios (login, senha_hash, situacao, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, login, situacao, created_at;
                    """, (login_normalizado, senha_hash, situacao, now, now))
                    row = cur.fetchone()
                    conn.commit()
                    return {
                        "id": row[0],
                        "nome": None,
                        "login": row[1],
                        "situacao": row[2],
                        "created_at": row[3],
                    }
            else:
                cur = conn.execute("""
                    INSERT INTO usuarios (login, senha_hash, situacao, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?);
                """, (login_normalizado, senha_hash, situacao, now, now))
                user_id = cur.lastrowid
                conn.commit()
                return {
                    "id": user_id,
                    "login": login_normalizado,
                    "situacao": situacao,
                    "created_at": now,
                }

    def salvar_token_recuperacao(self, login: str, token: str, expires_at: str) -> bool:
        """Salva o token de recuperação de senha temporário para o usuário."""
        login_normalizado = login.strip().lower()
        now = datetime.now(timezone.utc).isoformat()

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE usuarios 
                        SET recovery_token = %s, recovery_expires = %s, updated_at = %s 
                        WHERE LOWER(login) = %s;
                    """, (token, expires_at, now, login_normalizado))
                    conn.commit()
                    return cur.rowcount > 0
            else:
                cur = conn.execute("""
                    UPDATE usuarios 
                    SET recovery_token = ?, recovery_expires = ?, updated_at = ? 
                    WHERE LOWER(login) = ?;
                """, (token, expires_at, now, login_normalizado))
                conn.commit()
                return cur.rowcount > 0

    def buscar_por_token_recuperacao(self, token: str) -> Optional[Dict[str, Any]]:
        """Busca usuário pelo token de recuperação ativo."""
        if not token:
            return None

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, nome, login, senha_hash, situacao, recovery_token, recovery_expires, created_at, updated_at 
                        FROM usuarios 
                        WHERE recovery_token = %s;
                    """, (token,))
                    row = cur.fetchone()
                    if not row:
                        return None
                    return {
                        "id": row[0],
                        "nome": row[1],
                        "login": row[2],
                        "senha_hash": row[3],
                        "situacao": row[4],
                        "recovery_token": row[5],
                        "recovery_expires": row[6],
                        "created_at": row[7],
                        "updated_at": row[8],
                    }
            else:
                cur = conn.execute("""
                    SELECT id, nome, login, senha_hash, situacao, recovery_token, recovery_expires, created_at, updated_at 
                    FROM usuarios 
                    WHERE recovery_token = ?;
                """, (token,))
                row = cur.fetchone()
                if not row:
                    return None
                return {
                    "id": row["id"],
                    "nome": row["nome"],
                    "login": row["login"],
                    "senha_hash": row["senha_hash"],
                    "situacao": row["situacao"],
                    "recovery_token": row["recovery_token"],
                    "recovery_expires": row["recovery_expires"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }

    def atualizar_senha(self, login: str, nova_senha_hash: str) -> bool:
        """Atualiza a senha do usuário e invalida o token de recuperação existente."""
        login_normalizado = login.strip().lower()
        now = datetime.now(timezone.utc).isoformat()

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE usuarios 
                        SET senha_hash = %s, recovery_token = NULL, recovery_expires = NULL, updated_at = %s 
                        WHERE LOWER(login) = %s;
                    """, (nova_senha_hash, now, login_normalizado))
                    conn.commit()
                    return cur.rowcount > 0
            else:
                cur = conn.execute("""
                    UPDATE usuarios 
                    SET senha_hash = ?, recovery_token = NULL, recovery_expires = NULL, updated_at = ? 
                    WHERE LOWER(login) = ?;
                """, (nova_senha_hash, now, login_normalizado))
                conn.commit()
                return cur.rowcount > 0

    def atualizar_situacao(self, login: str, nova_situacao: str) -> bool:
        """Atualiza a situação do usuário (ex: 'ativo', 'inativo', 'bloqueado')."""
        login_normalizado = login.strip().lower()
        now = datetime.now(timezone.utc).isoformat()

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("UPDATE usuarios SET situacao = %s, updated_at = %s WHERE LOWER(login) = %s;", (nova_situacao, now, login_normalizado))
                    conn.commit()
                    return cur.rowcount > 0
            else:
                cur = conn.execute("UPDATE usuarios SET situacao = ?, updated_at = ? WHERE LOWER(login) = ?;", (nova_situacao, now, login_normalizado))
                conn.commit()
                return cur.rowcount > 0


    def atualizar_perfil(self, login: str, nome: str) -> bool:
        """Atualiza o perfil do usuário."""
        login_normalizado = login.strip().lower()
        now = datetime.now(timezone.utc).isoformat()

        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("UPDATE usuarios SET nome = %s, updated_at = %s WHERE LOWER(login) = %s;", (nome, now, login_normalizado))
                    conn.commit()
                    return cur.rowcount > 0
            else:
                cur = conn.execute("UPDATE usuarios SET nome = ?, updated_at = ? WHERE LOWER(login) = ?;", (nome, now, login_normalizado))
                conn.commit()
                return cur.rowcount > 0

    def limpar_tabela(self):
        """Método auxiliar para limpeza em testes."""
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE;")
                conn.commit()
            else:
                conn.execute("DELETE FROM usuarios;")
                conn.commit()
