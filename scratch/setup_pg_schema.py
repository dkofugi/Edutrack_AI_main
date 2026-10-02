import sqlite3
import psycopg2

print("[+] Iniciando migração e sincronização do esquema/dados...")

# 1. Conectar ao Postgres no database edutrack
pg_conn = psycopg2.connect(dbname='edutrack', user='postgres', password='postgres', host='localhost', port='5432')
pg_cur = pg_conn.cursor()

# 2. Executar o schema_usuarios.sql
with open('spec/schema_usuarios.sql', 'r', encoding='utf-8') as f:
    schema_sql = f.read()

pg_cur.execute(schema_sql)
pg_conn.commit()

# Adicionar coluna 'nome' caso não exista no schema_usuarios.sql (para manter compatibilidade completa)
pg_cur.execute("""
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome VARCHAR(120);
""")
pg_conn.commit()

print("[+] Tabela 'usuarios' e índices criados com sucesso no PostgreSQL!")

# 3. Ler dados do SQLite se existir
sqlite_path = 'backend/usuarios.db'
try:
    sq_conn = sqlite3.connect(sqlite_path)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()
    sq_cur.execute("SELECT * FROM usuarios;")
    rows = sq_cur.fetchall()
    
    migrated_count = 0
    for r in rows:
        login = r["login"]
        senha_hash = r["senha_hash"]
        situacao = r["situacao"] if "situacao" in r.keys() and r["situacao"] else "ativo"
        created_at = r["created_at"] if "created_at" in r.keys() else None
        updated_at = r["updated_at"] if "updated_at" in r.keys() else None
        recovery_token = r["recovery_token"] if "recovery_token" in r.keys() else None
        recovery_expires = r["recovery_expires"] if "recovery_expires" in r.keys() else None
        nome = r["nome"] if "nome" in r.keys() else None

        # Insere se não existir
        pg_cur.execute("SELECT id FROM usuarios WHERE LOWER(login) = LOWER(%s);", (login,))
        if not pg_cur.fetchone():
            pg_cur.execute("""
                INSERT INTO usuarios (login, senha_hash, situacao, created_at, updated_at, recovery_token, recovery_expires, nome)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (login, senha_hash, situacao, created_at, updated_at, recovery_token, recovery_expires, nome))
            migrated_count += 1

    pg_conn.commit()
    sq_conn.close()
    print(f"[+] Migração concluída: {migrated_count} registros migrados do SQLite para o PostgreSQL.")

except Exception as e:
    print(f"[!] Erro ou arquivo SQLite ausente/incompatível durante migração: {e}")

pg_cur.close()
pg_conn.close()
