"""
Repositório de Tarefas Acadêmicas (PostgreSQL & Persistência Local)
Gerencia o armazenamento e CRUD das tarefas na tabela `tarefas`.
"""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any


class TarefaRepository:
    def __init__(self, db_path: Optional[str] = None):
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
                except Exception:
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
                except Exception:
                    self.use_postgres = False
        except ImportError:
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
        """Cria a tabela tarefas caso não exista."""
        if self.use_postgres:
            with self._connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS tarefas (
                            id SERIAL PRIMARY KEY,
                            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                            disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
                            titulo VARCHAR(200) NOT NULL,
                            descricao TEXT,
                            prazo VARCHAR(50),
                            status VARCHAR(20) DEFAULT 'pending',
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas(usuario_id);
                        CREATE INDEX IF NOT EXISTS idx_tarefas_disciplina_id ON tarefas(disciplina_id);
                    """)
                conn.commit()
        else:
            with self._connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS tarefas (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        usuario_id INTEGER NOT NULL,
                        disciplina_id INTEGER NOT NULL,
                        titulo TEXT NOT NULL,
                        descricao TEXT,
                        prazo TEXT,
                        status TEXT DEFAULT 'pending',
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas(usuario_id);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_tarefas_disciplina_id ON tarefas(disciplina_id);")
                conn.commit()

    def listar_por_usuario(self, usuario_id: int) -> List[Dict[str, Any]]:
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, usuario_id, disciplina_id, titulo, descricao, prazo, status, created_at
                        FROM tarefas
                        WHERE usuario_id = %s
                        ORDER BY id ASC;
                    """, (usuario_id,))
                    rows = cur.fetchall()
                    result = []
                    for r in rows:
                        created_at_str = r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7]) if r[7] else ""
                        result.append({
                            "id": r[0],
                            "user_id": r[1],
                            "usuario_id": r[1],
                            "subject_id": r[2],
                            "disciplina_id": r[2],
                            "title": r[3],
                            "titulo": r[3],
                            "description": r[4] or "",
                            "descricao": r[4] or "",
                            "due_date": r[5] or "",
                            "prazo": r[5] or "",
                            "status": r[6] or "pending",
                            "created_at": created_at_str
                        })
                    return result
            else:
                cur = conn.execute("""
                    SELECT id, usuario_id, disciplina_id, titulo, descricao, prazo, status, created_at
                    FROM tarefas
                    WHERE usuario_id = ?
                    ORDER BY id ASC;
                """, (usuario_id,))
                rows = cur.fetchall()
                result = []
                for r in rows:
                    result.append({
                        "id": r["id"],
                        "user_id": r["usuario_id"],
                        "usuario_id": r["usuario_id"],
                        "subject_id": r["disciplina_id"],
                        "disciplina_id": r["disciplina_id"],
                        "title": r["titulo"],
                        "titulo": r["titulo"],
                        "description": r["descricao"] or "",
                        "descricao": r["descricao"] or "",
                        "due_date": r["prazo"] or "",
                        "prazo": r["prazo"] or "",
                        "status": r["status"] or "pending",
                        "created_at": r["created_at"] or ""
                    })
                return result

    def criar(self, usuario_id: int, disciplina_id: int, titulo: str, descricao: str = "",
              prazo: str = "", status: str = "pending") -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO tarefas (usuario_id, disciplina_id, titulo, descricao, prazo, status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, created_at;
                    """, (usuario_id, disciplina_id, titulo, descricao, prazo, status, now, now))
                    row = cur.fetchone()
                    conn.commit()
                    created_at_str = row[1].isoformat() if hasattr(row[1], "isoformat") else str(row[1])
                    return {
                        "id": row[0],
                        "user_id": usuario_id,
                        "usuario_id": usuario_id,
                        "subject_id": disciplina_id,
                        "disciplina_id": disciplina_id,
                        "title": titulo,
                        "titulo": titulo,
                        "description": descricao,
                        "descricao": descricao,
                        "due_date": prazo,
                        "prazo": prazo,
                        "status": status,
                        "created_at": created_at_str
                    }
            else:
                cur = conn.execute("""
                    INSERT INTO tarefas (usuario_id, disciplina_id, titulo, descricao, prazo, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (usuario_id, disciplina_id, titulo, descricao, prazo, status, now, now))
                t_id = cur.lastrowid
                conn.commit()
                return {
                    "id": t_id,
                    "user_id": usuario_id,
                    "usuario_id": usuario_id,
                    "subject_id": disciplina_id,
                    "disciplina_id": disciplina_id,
                    "title": titulo,
                    "titulo": titulo,
                    "description": descricao,
                    "descricao": descricao,
                    "due_date": prazo,
                    "prazo": prazo,
                    "status": status,
                    "created_at": now
                }

    def atualizar(self, id: int, usuario_id: int, titulo: str, descricao: str = "",
                  prazo: str = "", status: str = "pending") -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE tarefas
                        SET titulo = %s, descricao = %s, prazo = %s, status = %s, updated_at = %s
                        WHERE id = %s AND usuario_id = %s;
                    """, (titulo, descricao, prazo, status, now, id, usuario_id))
                    conn.commit()
                    if cur.rowcount == 0:
                        return None
                    return {
                        "id": id,
                        "user_id": usuario_id,
                        "usuario_id": usuario_id,
                        "title": titulo,
                        "titulo": titulo,
                        "description": descricao,
                        "descricao": descricao,
                        "due_date": prazo,
                        "prazo": prazo,
                        "status": status
                    }
            else:
                cur = conn.execute("""
                    UPDATE tarefas
                    SET titulo = ?, descricao = ?, prazo = ?, status = ?, updated_at = ?
                    WHERE id = ? AND usuario_id = ?;
                """, (titulo, descricao, prazo, status, now, id, usuario_id))
                conn.commit()
                if cur.rowcount == 0:
                    return None
                return {
                    "id": id,
                    "user_id": usuario_id,
                    "usuario_id": usuario_id,
                    "title": titulo,
                    "titulo": titulo,
                    "description": descricao,
                    "descricao": descricao,
                    "due_date": prazo,
                    "prazo": prazo,
                    "status": status
                }

    def marcar_concluida(self, id: int, usuario_id: int) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE tarefas
                        SET status = 'completed', updated_at = %s
                        WHERE id = %s AND usuario_id = %s
                        RETURNING id, disciplina_id, titulo, status;
                    """, (now, id, usuario_id))
                    row = cur.fetchone()
                    conn.commit()
                    if not row:
                        return None
                    return {
                        "id": row[0],
                        "subject_id": row[1],
                        "disciplina_id": row[1],
                        "title": row[2],
                        "titulo": row[2],
                        "status": row[3]
                    }
            else:
                cur = conn.execute("""
                    UPDATE tarefas
                    SET status = 'completed', updated_at = ?
                    WHERE id = ? AND usuario_id = ?;
                """, (now, id, usuario_id))
                conn.commit()
                if cur.rowcount == 0:
                    return None
                return {"id": id, "status": "completed"}

    def excluir(self, id: int, usuario_id: int) -> bool:
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM tarefas WHERE id = %s AND usuario_id = %s;", (id, usuario_id))
                    conn.commit()
                    return cur.rowcount > 0
            else:
                cur = conn.execute("DELETE FROM tarefas WHERE id = ? AND usuario_id = ?;", (id, usuario_id))
                conn.commit()
                return cur.rowcount > 0
