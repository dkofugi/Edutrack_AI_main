"""
Repositório de Sessões de Estudo (PostgreSQL & Persistência Local)
Gerencia o armazenamento das sessões na tabela `sessoes_estudo`.
"""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any


class SessaoRepository:
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
        """Cria a tabela sessoes_estudo caso não exista."""
        if self.use_postgres:
            with self._connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS sessoes_estudo (
                            id SERIAL PRIMARY KEY,
                            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                            disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
                            tarefa_id INTEGER REFERENCES tarefas(id) ON DELETE SET NULL,
                            titulo_licao VARCHAR(200) NOT NULL,
                            duracao_segundos INTEGER NOT NULL CHECK (duracao_segundos > 0),
                            iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL,
                            finalizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes_estudo(usuario_id);
                        CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina_id ON sessoes_estudo(disciplina_id);
                        CREATE INDEX IF NOT EXISTS idx_sessoes_created_at ON sessoes_estudo(created_at DESC);
                    """)
                conn.commit()
        else:
            with self._connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS sessoes_estudo (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        usuario_id INTEGER NOT NULL,
                        disciplina_id INTEGER NOT NULL,
                        tarefa_id INTEGER,
                        titulo_licao TEXT NOT NULL,
                        duracao_segundos INTEGER NOT NULL,
                        iniciado_em TEXT NOT NULL,
                        finalizado_em TEXT NOT NULL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes_estudo(usuario_id);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina_id ON sessoes_estudo(disciplina_id);")
                conn.commit()

    def listar_por_usuario(self, usuario_id: int, disciplina_id: Optional[int] = None) -> List[Dict[str, Any]]:
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    if disciplina_id:
                        cur.execute("""
                            SELECT id, usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, created_at
                            FROM sessoes_estudo
                            WHERE usuario_id = %s AND disciplina_id = %s
                            ORDER BY created_at DESC;
                        """, (usuario_id, disciplina_id))
                    else:
                        cur.execute("""
                            SELECT id, usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, created_at
                            FROM sessoes_estudo
                            WHERE usuario_id = %s
                            ORDER BY created_at DESC;
                        """, (usuario_id,))
                    rows = cur.fetchall()
                    result = []
                    for r in rows:
                        inc_str = r[6].isoformat() if hasattr(r[6], "isoformat") else str(r[6]) if r[6] else ""
                        fin_str = r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7]) if r[7] else ""
                        cre_str = r[8].isoformat() if hasattr(r[8], "isoformat") else str(r[8]) if r[8] else ""
                        result.append({
                            "id": r[0],
                            "user_id": r[1],
                            "usuario_id": r[1],
                            "subject_id": r[2],
                            "disciplina_id": r[2],
                            "task_id": r[3],
                            "tarefa_id": r[3],
                            "lesson_title": r[4],
                            "titulo_licao": r[4],
                            "duration_seconds": r[5],
                            "duracao_segundos": r[5],
                            "started_at": inc_str,
                            "iniciado_em": inc_str,
                            "ended_at": fin_str,
                            "finalizado_em": fin_str,
                            "created_at": cre_str
                        })
                    return result
            else:
                if disciplina_id:
                    cur = conn.execute("""
                        SELECT id, usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, created_at
                        FROM sessoes_estudo
                        WHERE usuario_id = ? AND disciplina_id = ?
                        ORDER BY created_at DESC;
                    """, (usuario_id, disciplina_id))
                else:
                    cur = conn.execute("""
                        SELECT id, usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, created_at
                        FROM sessoes_estudo
                        WHERE usuario_id = ?
                        ORDER BY created_at DESC;
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
                        "task_id": r["tarefa_id"],
                        "tarefa_id": r["tarefa_id"],
                        "lesson_title": r["titulo_licao"],
                        "titulo_licao": r["titulo_licao"],
                        "duration_seconds": r["duracao_segundos"],
                        "duracao_segundos": r["duracao_segundos"],
                        "started_at": r["iniciado_em"],
                        "iniciado_em": r["iniciado_em"],
                        "ended_at": r["finalizado_em"],
                        "finalizado_em": r["finalizado_em"],
                        "created_at": r["created_at"]
                    })
                return result

    def criar(self, usuario_id: int, disciplina_id: int, titulo_licao: str, duracao_segundos: int,
              iniciado_em: str, finalizado_em: str, tarefa_id: Optional[int] = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO sessoes_estudo (usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, created_at;
                    """, (usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, now))
                    row = cur.fetchone()
                    conn.commit()
                    cre_str = row[1].isoformat() if hasattr(row[1], "isoformat") else str(row[1])
                    return {
                        "id": row[0],
                        "user_id": usuario_id,
                        "usuario_id": usuario_id,
                        "subject_id": disciplina_id,
                        "disciplina_id": disciplina_id,
                        "task_id": tarefa_id,
                        "tarefa_id": tarefa_id,
                        "lesson_title": titulo_licao,
                        "titulo_licao": titulo_licao,
                        "duration_seconds": duracao_segundos,
                        "duracao_segundos": duracao_segundos,
                        "started_at": iniciado_em,
                        "iniciado_em": iniciado_em,
                        "ended_at": finalizado_em,
                        "finalizado_em": finalizado_em,
                        "created_at": cre_str
                    }
            else:
                cur = conn.execute("""
                    INSERT INTO sessoes_estudo (usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (usuario_id, disciplina_id, tarefa_id, titulo_licao, duracao_segundos, iniciado_em, finalizado_em, now))
                s_id = cur.lastrowid
                conn.commit()
                return {
                    "id": s_id,
                    "user_id": usuario_id,
                    "usuario_id": usuario_id,
                    "subject_id": disciplina_id,
                    "disciplina_id": disciplina_id,
                    "task_id": tarefa_id,
                    "tarefa_id": tarefa_id,
                    "lesson_title": titulo_licao,
                    "titulo_licao": titulo_licao,
                    "duration_seconds": duracao_segundos,
                    "duracao_segundos": duracao_segundos,
                    "started_at": iniciado_em,
                    "iniciado_em": iniciado_em,
                    "ended_at": finalizado_em,
                    "finalizado_em": finalizado_em,
                    "created_at": now
                }
