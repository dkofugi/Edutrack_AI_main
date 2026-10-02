import urllib.request
import json

base_url = "http://localhost:8000"

def req(url, method="GET", body=None, headers={}):
    h = {"Content-Type": "application/json"}
    h.update(headers)
    data = json.dumps(body).encode("utf-8") if body else None
    r = urllib.request.Request(f"{base_url}{url}", data=data, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

print("[1] Testando criação de disciplina para Usuário 1...")
s, d1 = req("/api/disciplinas", "POST", {"usuario_id": 1, "nome": "Engenharia de Software", "professor": "Prof. Alan", "carga_horaria": 80})
print("Status:", s, "Disciplina criada:", d1["disciplina"])

print("\n[2] Testando criação de tarefa para Usuário 1...")
sub_id = d1["disciplina"]["id"]
s, t1 = req("/api/tarefas", "POST", {"usuario_id": 1, "disciplina_id": sub_id, "titulo": "Entrega do Diagrama UML", "prazo": "2026-10-15"})
print("Status:", s, "Tarefa criada:", t1["tarefa"])

print("\n[3] Testando isolamento: buscando disciplinas do Usuário 2 (deve estar vazio ou sem as disciplinas do User 1)...")
s, list_u2 = req("/api/disciplinas?usuario_id=2")
print("Status:", s, "Disciplinas User 2:", list_u2["disciplinas"])

print("\n[4] Listando disciplinas do Usuário 1 (deve conter Engenharia de Software)...")
s, list_u1 = req("/api/disciplinas?usuario_id=1")
print("Status:", s, "Disciplinas User 1:", list_u1["disciplinas"])
