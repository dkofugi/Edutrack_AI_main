import psycopg2

conn = psycopg2.connect(dbname='edutrack', user='postgres', password='postgres', host='localhost', port='5432')
cur = conn.cursor()
cur.execute("SELECT id, login, situacao, created_at FROM usuarios WHERE login = 'teste_pg_final@edutrack.ai';")
row = cur.fetchone()
print("PostgreSQL direct query result:", row)
cur.close()
conn.close()
