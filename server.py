"""
EduTrack AI — Servidor Web & API de Autenticação Segura (PostgreSQL / Bcrypt)
Integra o frontend (HTML/CSS/JS) com os endpoints de autenticação:
- POST /api/login: Validação segura de senha com hash bcrypt no banco.
- POST /api/register: Cadastro seguro com login, senha hasheada e situação.
- POST /api/forgot-password: Solicitação de recuperação de senha integrada ao banco.
- POST /api/reset-password: Redefinição de senha com hash bcrypt.
Garante que TODAS as rotas /api/* retornem Content-Type: application/json; charset=utf-8,
evitando erros de 'Unexpected token' no frontend.
"""
import http.server
import json
import os
import sys
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env caso exista
load_dotenv()

from backend.auth_service import AuthService
from backend.repository import UsuarioRepository
from backend.advanced_metrics import calcular_progresso_ponderado, estimar_conclusao


PORT = 8000
REPO = UsuarioRepository()
AUTH_SERVICE = AuthService(repository=REPO)

# Garante a existência de um usuário inicial de teste com hash bcrypt
def seed_usuario_inicial():
    usuario_padrao = REPO.buscar_por_login("aluno@edutrack.ai")
    if not usuario_padrao:
        AUTH_SERVICE.cadastrar(
            login="aluno@edutrack.ai",
            senha="123456",
            situacao="ativo"
        )
        print("[+] Usuário inicial semeado com hash bcrypt: aluno@edutrack.ai")

seed_usuario_inicial()


class AppHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        root_dir = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=root_dir, **kwargs)

    def send_error(self, code, message=None, explain=None):
        """
        Sobrescreve send_error para garantir que rotas /api/ NUNCA retornem HTML.
        Garante que qualquer erro em rota de API seja entregue em JSON válido.
        """
        if self.path.startswith("/api/"):
            msg = message or "Erro na requisição"
            self._send_json_response(code, {
                "sucesso": False,
                "mensagem": msg
            })
        else:
            super().send_error(code, message, explain)

    def do_OPTIONS(self):
        """Trata requisições preflight CORS enviadas pelos navegadores."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        # Normaliza caminho removendo query string e barras finais
        clean_path = self.path.split("?")[0].rstrip("/")
        try:
            if clean_path == "/api/login":
                self.handle_login()
            elif clean_path == "/api/register":
                self.handle_register()
            elif clean_path == "/api/v1/metrics/advanced":
                self.handle_advanced_metrics()

            elif clean_path in ["/api/forgot-password", "/api/recover-password"]:
                self.handle_forgot_password()
            elif clean_path == "/api/reset-password":
                self.handle_reset_password()
            elif clean_path.startswith("/api/"):
                self._send_json_response(404, {
                    "sucesso": False,
                    "mensagem": "Endpoint não encontrado"
                })
            else:
                self.send_error(404, "Endpoint não encontrado")
        except Exception as exc:
            self._send_json_response(500, {
                "sucesso": False,
                "mensagem": f"Erro interno do servidor: {str(exc)}"
            })

    def do_PUT(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        try:
            if clean_path == "/api/profile":
                self.handle_profile_update()
            else:
                self.send_error(404, "Endpoint não encontrado")
        except Exception as exc:
            self._send_json_response(500, {
                "sucesso": False,
                "mensagem": f"Erro interno do servidor: {str(exc)}"
            })

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}

    def _send_json_response(self, status_code: int, data: dict):
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response_bytes)

    def handle_login(self):
        data = self._read_json_body()
        login = data.get("login") or data.get("email") or ""
        senha = data.get("senha") or data.get("password") or ""

        sucesso, usuario, mensagem = AUTH_SERVICE.autenticar(login, senha)

        if sucesso:
            self._send_json_response(200, {
                "sucesso": True,
                "mensagem": mensagem,
                "usuario": usuario
            })
        else:
            self._send_json_response(401, {
                "sucesso": False,
                "mensagem": mensagem
            })

    def handle_register(self):
        data = self._read_json_body()
        login = data.get("login") or data.get("email") or ""
        senha = data.get("senha") or data.get("password") or ""
        situacao = data.get("situacao") or "ativo"

        sucesso, usuario, mensagem = AUTH_SERVICE.cadastrar(login, senha, situacao)

        if sucesso:
            self._send_json_response(201, {
                "sucesso": True,
                "mensagem": mensagem,
                "usuario": usuario
            })
        else:
            self._send_json_response(400, {
                "sucesso": False,
                "mensagem": mensagem
            })

    def handle_forgot_password(self):
        data = self._read_json_body()
        login = data.get("login") or data.get("email") or ""

        sucesso, token, mensagem = AUTH_SERVICE.solicitar_recuperacao(login)

        if sucesso:
            resp = {
                "sucesso": True,
                "mensagem": mensagem
            }
            if token:
                resp["token"] = token
            self._send_json_response(200, resp)
        else:
            self._send_json_response(400, {
                "sucesso": False,
                "mensagem": mensagem
            })

    def handle_reset_password(self):
        data = self._read_json_body()
        login = data.get("login") or data.get("email") or ""
        nova_senha = data.get("nova_senha") or data.get("senha") or data.get("password") or ""
        token = data.get("token") or None

        sucesso, mensagem = AUTH_SERVICE.redefinir_senha(login, nova_senha, token)

        if sucesso:
            self._send_json_response(200, {
                "sucesso": True,
                "mensagem": mensagem
            })
        else:
            self._send_json_response(400, {
                "sucesso": False,
                "mensagem": mensagem
            })

    def handle_profile_update(self):
        data = self._read_json_body()
        login = data.get("login") or data.get("email") or ""
        nome = data.get("nome") or ""

        sucesso = REPO.atualizar_perfil(login, nome)
        if sucesso:
            self._send_json_response(200, {
                "sucesso": True,
                "mensagem": "Perfil atualizado com sucesso",
                "nome": nome
            })
        else:
            self._send_json_response(400, {
                "sucesso": False,
                "mensagem": "Não foi possível atualizar o perfil"
            })

    
    def handle_advanced_metrics(self):
        data = self._read_json_body()
        disciplinas = data.get('disciplinas', [])
        tarefas_concluidas = data.get('tarefas_concluidas', 0)
        dias_estudados = data.get('dias_estudados', 0)
        tarefas_pendentes = data.get('tarefas_pendentes', 0)

        progresso_ponderado = calcular_progresso_ponderado(disciplinas)
        dias_estimados = estimar_conclusao(tarefas_concluidas, dias_estudados, tarefas_pendentes)

        carga_total = sum(d.get('workload_hours', 0) for d in disciplinas)
        pesos = {}
        if carga_total > 0:
            for d in disciplinas:
                ident = d.get('id')
                if ident is not None:
                    pesos[ident] = round((d.get('workload_hours', 0) / carga_total) * 100, 2)

        self._send_json_response(200, {
            'sucesso': True,
            'progresso_ponderado': progresso_ponderado,
            'dias_estimados': dias_estimados,
            'pesos_disciplinas': pesos
        })

    def log_message(self, format, *args):
        sys.stdout.write(f"[HTTP] {self.address_string()} - {format % args}\n")


def run():
    import socketserver
    url = f"http://localhost:{PORT}"
    db_engine = "PostgreSQL" if REPO.use_postgres else "SQLite (Local Fallback)"
    print("=" * 60)
    print("  EduTrack AI — Servidor Web & API de Autenticação")
    print(f"  Banco de Dados: {db_engine}")
    print("=" * 60)
    print(f"  [+] Acesse a aplicação em: {url}")
    print(f"  [+] Endpoint de Login: {url}/api/login")
    print(f"  [+] Endpoint de Cadastro: {url}/api/register")
    print(f"  [+] Endpoint de Recuperação: {url}/api/forgot-password")
    print(f"  [+] Pressione Ctrl+C para encerrar.")
    print("=" * 60)

    # Permite reuso rápido do socket ao reiniciar o servidor
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AppHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[+] Servidor encerrado.")


if __name__ == "__main__":
    run()
