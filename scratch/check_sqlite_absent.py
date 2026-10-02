import sqlite3

conn = sqlite3.connect('backend/usuarios.db')
cur = conn.cursor()
cur.execute("SELECT * FROM usuarios WHERE login = 'teste_final_postgres_online@edutrack.ai';")
row = cur.fetchone()
print("SQLite search result:", row)
conn.close()
