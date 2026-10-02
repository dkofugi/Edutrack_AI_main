"""
Repositório de Disciplinas (PostgreSQL & Persistência Local)
Gerencia o armazenamento e CRUD das disciplinas na tabela `disciplinas`.
"""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any


class DisciplinaRepository:
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
                except Exception as exc:
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
        """Cria a tabela disciplinas caso não exista."""
        if self.use_postgres:
            with self._connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS disciplinas (
                            id SERIAL PRIMARY KEY,
                            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                            nome VARCHAR(150) NOT NULL,
                            professor VARCHAR(120),
                            carga_horaria INTEGER DEFAULT 0,
                            descricao TEXT,
                            data_inicio VARCHAR(50),
                            data_fim VARCHAR(50),
                            cor VARCHAR(20) DEFAULT '#10b981',
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS idx_disciplinas_usuario_id ON disciplinas(usuario_id);
                    """)
                conn.commit()
        else:
            with self._connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS disciplinas (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        usuario_id INTEGER NOT NULL,
                        nome TEXT NOT NULL,
                        professor TEXT,
                        carga_horaria INTEGER DEFAULT 0,
                        descricao TEXT,
                        data_inicio TEXT,
                        data_fim TEXT,
                        cor TEXT DEFAULT '#10b981',
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_disciplinas_usuario_id ON disciplinas(usuario_id);")
                conn.commit()

    def listar_por_usuario(self, usuario_id: int) -> List[Dict[str, Any]]:
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, usuario_id, nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, created_at
                        FROM disciplinas
                        WHERE usuario_id = %s
                        ORDER BY id ASC;
                    """, (usuario_id,))
                    rows = cur.fetchall()
                    result = []
                    for r in rows:
                        created_at_str = r[9].isoformat() if hasattr(r[9], "isoformat") else str(r[9]) if r[9] else ""
                        result.append({
                            "id": r[0],
                            "user_id": r[1],
                            "usuario_id": r[1],
                            "name": r[2],
                            "nome": r[2],
                            "professor": r[3] or "",
                            "workload_hours": r[4] or 0,
                            "carga_horaria": r[4] or 0,
                            "description": r[5] or "",
                            "start_date": r[6] or "",
                            "end_date": r[7] or "",
                            "color": r[8] or "#10b981",
                            "created_at": created_at_str
                        })
                    return result
            else:
                cur = conn.execute("""
                    SELECT id, usuario_id, nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, created_at
                    FROM disciplinas
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
                        "name": r["nome"],
                        "nome": r["nome"],
                        "professor": r["professor"] or "",
                        "workload_hours": r["carga_horaria"] or 0,
                        "carga_horaria": r["carga_horaria"] or 0,
                        "description": r["descricao"] or "",
                        "start_date": r["data_inicio"] or "",
                        "end_date": r["data_fim"] or "",
                        "color": r["cor"] or "#10b981",
                        "created_at": r["created_at"] or ""
                    })
                return result

    def criar(self, usuario_id: int, nome: str, professor: str = "", carga_horaria: int = 0,
              descricao: str = "", data_inicio: str = "", data_fim: str = "", cor: str = "#10b981") -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO disciplinas (usuario_id, nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, created_at;
                    """, (usuario_id, nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, now, now))
                    row = cur.fetchone()
                    conn.commit()
                    created_at_str = row[1].isoformat() if hasattr(row[1], "isoformat") else str(row[1])
                    return {
                        "id": row[0],
                        "user_id": usuario_id,
                        "usuario_id": usuario_id,
                        "name": nome,
                        "nome": nome,
                        "professor": professor,
                        "workload_hours": carga_horaria,
                        "carga_horaria": carga_horaria,
                        "description": descricao,
                        "start_date": data_inicio,
                        "end_date": data_fim,
                        "color": cor,
                        "created_at": created_at_str
                    }
            else:
                cur = conn.execute("""
                    INSERT INTO disciplinas (usuario_id, nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (usuario_id, nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, now, now))
                d_id = cur.lastrowid
                conn.commit()
                return {
                    "id": d_id,
                    "user_id": usuario_id,
                    "usuario_id": usuario_id,
                    "name": nome,
                    "nome": nome,
                    "professor": professor,
                    "workload_hours": carga_horaria,
                    "carga_horaria": carga_horaria,
                    "description": descricao,
                    "start_date": data_inicio,
                    "end_date": data_fim,
                    "color": cor,
                    "created_at": now
                }

    def atualizar(self, id: int, usuario_id: int, nome: str, professor: str = "", carga_horaria: int = 0,
                  descricao: str = "", data_inicio: str = "", data_fim: str = "", cor: str = "#10b981") -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE disciplinas
                        SET nome = %s, professor = %s, carga_horaria = %s, descricao = %s, data_inicio = %s, data_fim = %s, cor = %s, updated_at = %s
                        WHERE id = %s AND usuario_id = %s;
                    """, (nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, now, id, usuario_id))
                    conn.commit()
                    if cur.rowcount == 0:
                        return None
                    return {
                        "id": id,
                        "user_id": usuario_id,
                        "usuario_id": usuario_id,
                        "name": nome,
                        "nome": nome,
                        "professor": professor,
                        "workload_hours": carga_horaria,
                        "carga_horaria": carga_horaria,
                        "description": descricao,
                        "start_date": data_inicio,
                        "end_date": data_fim,
                        "color": cor
                    }
            else:
                cur = conn.execute("""
                    UPDATE disciplinas
                    SET nome = ?, professor = ?, carga_horaria = ?, descricao = ?, data_inicio = ?, data_fim = ?, cor = ?, updated_at = ?
                    WHERE id = ? AND usuario_id = ?;
                """, (nome, professor, carga_horaria, descricao, data_inicio, data_fim, cor, now, id, usuario_id))
                conn.commit()
                if cur.rowcount == 0:
                    return None
                return {
                    "id": id,
                    "user_id": usuario_id,
                    "usuario_id": usuario_id,
                    "name": nome,
                    "nome": nome,
                    "professor": professor,
                    "workload_hours": carga_horaria,
                    "carga_horaria": carga_horaria,
                    "description": descricao,
                    "start_date": data_inicio,
                    "end_date": data_fim,
                    "color": cor
                }

    def excluir(self, id: int, usuario_id: int) -> bool:
        with self._connection() as conn:
            if self.use_postgres:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM disciplinas WHERE id = %s AND usuario_id = %s;", (id, usuario_id))
                    conn.commit()
                    return cur.rowcount > 0
            else:
                cur = conn.execute("DELETE FROM disciplinas WHERE id = ? AND usuario_id = ?;", (id, usuario_id))
                conn.commit()
                return cur.rowcount > 0
