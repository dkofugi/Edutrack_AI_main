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

print("[1] Criando disciplina para teste de sessão...")
_, d = req("/api/disciplinas", "POST", {"usuario_id": 1, "nome": "Cálculo II"})
disc_id = d["disciplina"]["id"]

print("\n[2] Criando nova sessão de estudo via POST /api/sessoes...")
s, sess = req("/api/sessoes", "POST", {
    "usuario_id": 1,
    "disciplina_id": disc_id,
    "titulo_licao": "Revisão de Derivadas Parciais",
    "duracao_segundos": 1800,
    "iniciado_em": "2026-10-02T10:00:00Z",
    "finalizado_em": "2026-10-02T10:30:00Z"
})
print("Status:", s, "Sessão criada:", sess["sessao"])

print("\n[3] Listando sessões de estudo do Usuário 1 via GET /api/sessoes...")
s, list_sess = req("/api/sessoes?usuario_id=1")
print("Status:", s, "Total sessões encontradas:", len(list_sess["sessoes"]))
print("Última sessão:", list_sess["sessoes"][0])

print("\n[4] Testando isolamento: buscando sessões do Usuário 2 (deve retornar vazio)...")
s, list_u2 = req("/api/sessoes?usuario_id=2")
print("Status:", s, "Sessões Usuário 2:", list_u2["sessoes"])
