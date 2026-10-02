import psycopg2

conn = psycopg2.connect(dbname='edutrack', user='postgres', password='postgres', host='localhost', port='5432')
cur = conn.cursor()

cur.execute("SELECT datname FROM pg_database;")
dbs = cur.fetchall()
print("Bancos de dados no servidor PostgreSQL:", [d[0] for d in dbs])

cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")
tables = cur.fetchall()
print("Tabelas no banco edutrack (schema public):", tables)

cur.execute("SELECT count(*) FROM usuarios;")
count = cur.fetchone()
print("Total de usuários na tabela usuarios do database edutrack:", count[0])

cur.close()
conn.close()
