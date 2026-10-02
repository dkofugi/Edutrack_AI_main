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

# Checagem estrita de inicialização: aborta se cair em fallback SQLite quando DATABASE_URL/PG* estiverem configuradas
if not REPO.use_postgres and (os.getenv("DATABASE_URL") or os.getenv("PGHOST")):
    sys.exit("[ERRO CRÍTICO] A conexão com o PostgreSQL falhou e o servidor recusou continuar em modo fallback SQLite.")

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


from backend.disciplina_repository import DisciplinaRepository
from backend.tarefa_repository import TarefaRepository
from backend.sessao_repository import SessaoRepository

DISCIPLINA_REPO = DisciplinaRepository()
TAREFA_REPO = TarefaRepository()
SESSAO_REPO = SessaoRepository()


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
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _get_user_id(self, data=None):
        """Extrai o ID do usuário de headers ou corpo da requisição."""
        header_val = self.headers.get("X-User-Id")
        if header_val and header_val.isdigit():
            return int(header_val)
        if data and isinstance(data, dict):
            u_id = data.get("usuario_id") or data.get("user_id")
            if u_id:
                return int(u_id)
        return None

    def do_GET(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        try:
            if clean_path == "/api/disciplinas":
                self.handle_get_disciplinas()
            elif clean_path == "/api/tarefas":
                self.handle_get_tarefas()
            elif clean_path == "/api/sessoes":
                self.handle_get_sessoes()
            elif clean_path.startswith("/api/"):
                self._send_json_response(404, {
                    "sucesso": False,
                    "mensagem": "Endpoint não encontrado"
                })
            else:
                super().do_GET()
        except Exception as exc:
            self._send_json_response(500, {
                "sucesso": False,
                "mensagem": f"Erro interno do servidor: {str(exc)}"
            })

    def do_POST(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        try:
            if clean_path == "/api/login":
                self.handle_login()
            elif clean_path == "/api/register":
                self.handle_register()
            elif clean_path == "/api/disciplinas":
                self.handle_post_disciplinas()
            elif clean_path == "/api/tarefas":
                self.handle_post_tarefas()
            elif clean_path == "/api/sessoes":
                self.handle_post_sessoes()
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
            elif clean_path == "/api/disciplinas" or clean_path.startswith("/api/disciplinas/"):
                self.handle_put_disciplinas()
            elif clean_path == "/api/tarefas" or clean_path.startswith("/api/tarefas/"):
                self.handle_put_tarefas()
            else:
                self.send_error(404, "Endpoint não encontrado")
        except Exception as exc:
            self._send_json_response(500, {
                "sucesso": False,
                "mensagem": f"Erro interno do servidor: {str(exc)}"
            })

    def do_DELETE(self):
        clean_path = self.path.split("?")[0].rstrip("/")
        try:
            if clean_path == "/api/disciplinas" or clean_path.startswith("/api/disciplinas/"):
                self.handle_delete_disciplinas()
            elif clean_path == "/api/tarefas" or clean_path.startswith("/api/tarefas/"):
                self.handle_delete_tarefas()
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

    
    def handle_get_disciplinas(self):
        query_params = {}
        if "?" in self.path:
            from urllib.parse import parse_qs
            query_params = parse_qs(self.path.split("?")[1])
        u_id = query_params.get("usuario_id", [None])[0] or query_params.get("user_id", [None])[0] or self._get_user_id()
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        
        disciplinas = DISCIPLINA_REPO.listar_por_usuario(int(u_id))
        self._send_json_response(200, {"sucesso": True, "disciplinas": disciplinas, "subjects": disciplinas})

    def handle_post_disciplinas(self):
        data = self._read_json_body()
        u_id = self._get_user_id(data)
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        nome = data.get("nome") or data.get("name") or ""
        if not nome.strip():
            return self._send_json_response(400, {"sucesso": False, "mensagem": "Nome da disciplina é obrigatório."})
        
        disciplina = DISCIPLINA_REPO.criar(
            usuario_id=int(u_id),
            nome=nome.strip(),
            professor=data.get("professor", ""),
            carga_horaria=int(data.get("carga_horaria") or data.get("workload_hours") or 0),
            descricao=data.get("descricao") or data.get("description") or "",
            data_inicio=data.get("data_inicio") or data.get("start_date") or "",
            data_fim=data.get("data_fim") or data.get("end_date") or "",
            cor=data.get("cor") or data.get("color") or "#10b981"
        )
        self._send_json_response(201, {"sucesso": True, "disciplina": disciplina, "subject": disciplina})

    def handle_put_disciplinas(self):
        data = self._read_json_body()
        u_id = self._get_user_id(data)
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        d_id = data.get("id")
        if not d_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "ID da disciplina é obrigatório."})
        
        nome = data.get("nome") or data.get("name") or ""
        disciplina = DISCIPLINA_REPO.atualizar(
            id=int(d_id),
            usuario_id=int(u_id),
            nome=nome.strip(),
            professor=data.get("professor", ""),
            carga_horaria=int(data.get("carga_horaria") or data.get("workload_hours") or 0),
            descricao=data.get("descricao") or data.get("description") or "",
            data_inicio=data.get("data_inicio") or data.get("start_date") or "",
            data_fim=data.get("data_fim") or data.get("end_date") or "",
            cor=data.get("cor") or data.get("color") or "#10b981"
        )
        if not disciplina:
            return self._send_json_response(404, {"sucesso": False, "mensagem": "Disciplina não encontrada."})
        self._send_json_response(200, {"sucesso": True, "disciplina": disciplina, "subject": disciplina})

    def handle_delete_disciplinas(self):
        query_params = {}
        if "?" in self.path:
            from urllib.parse import parse_qs
            query_params = parse_qs(self.path.split("?")[1])
        u_id = query_params.get("usuario_id", [None])[0] or query_params.get("user_id", [None])[0] or self._get_user_id()
        d_id = query_params.get("id", [None])[0]
        if not u_id or not d_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "id e usuario_id são obrigatórios."})
        
        sucesso = DISCIPLINA_REPO.excluir(int(d_id), int(u_id))
        if sucesso:
            self._send_json_response(200, {"sucesso": True, "mensagem": "Disciplina excluída com sucesso."})
        else:
            self._send_json_response(404, {"sucesso": False, "mensagem": "Disciplina não encontrada."})

    def handle_get_tarefas(self):
        query_params = {}
        if "?" in self.path:
            from urllib.parse import parse_qs
            query_params = parse_qs(self.path.split("?")[1])
        u_id = query_params.get("usuario_id", [None])[0] or query_params.get("user_id", [None])[0] or self._get_user_id()
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        
        tarefas = TAREFA_REPO.listar_por_usuario(int(u_id))
        self._send_json_response(200, {"sucesso": True, "tarefas": tarefas, "academic_tasks": tarefas})

    def handle_post_tarefas(self):
        data = self._read_json_body()
        u_id = self._get_user_id(data)
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        d_id = data.get("disciplina_id") or data.get("subject_id")
        titulo = data.get("titulo") or data.get("title") or ""
        if not d_id or not titulo.strip():
            return self._send_json_response(400, {"sucesso": False, "mensagem": "disciplina_id e titulo são obrigatórios."})
        
        tarefa = TAREFA_REPO.criar(
            usuario_id=int(u_id),
            disciplina_id=int(d_id),
            titulo=titulo.strip(),
            descricao=data.get("descricao") or data.get("description") or "",
            prazo=data.get("prazo") or data.get("due_date") or "",
            status=data.get("status", "pending")
        )
        self._send_json_response(201, {"sucesso": True, "tarefa": tarefa, "task": tarefa})

    def handle_put_tarefas(self):
        data = self._read_json_body()
        u_id = self._get_user_id(data)
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        t_id = data.get("id")
        if not t_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "ID da tarefa é obrigatório."})
        
        titulo = data.get("titulo") or data.get("title") or ""
        tarefa = TAREFA_REPO.atualizar(
            id=int(t_id),
            usuario_id=int(u_id),
            titulo=titulo.strip(),
            descricao=data.get("descricao") or data.get("description") or "",
            prazo=data.get("prazo") or data.get("due_date") or "",
            status=data.get("status", "pending")
        )
        if not tarefa:
            return self._send_json_response(404, {"sucesso": False, "mensagem": "Tarefa não encontrada."})
        self._send_json_response(200, {"sucesso": True, "tarefa": tarefa, "task": tarefa})

    def handle_delete_tarefas(self):
        query_params = {}
        if "?" in self.path:
            from urllib.parse import parse_qs
            query_params = parse_qs(self.path.split("?")[1])
        u_id = query_params.get("usuario_id", [None])[0] or query_params.get("user_id", [None])[0] or self._get_user_id()
        t_id = query_params.get("id", [None])[0]
        if not u_id or not t_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "id e usuario_id são obrigatórios."})
        
        sucesso = TAREFA_REPO.excluir(int(t_id), int(u_id))
        if sucesso:
            self._send_json_response(200, {"sucesso": True, "mensagem": "Tarefa excluída com sucesso."})
        else:
            self._send_json_response(404, {"sucesso": False, "mensagem": "Tarefa não encontrada."})

    def handle_get_sessoes(self):
        query_params = {}
        if "?" in self.path:
            from urllib.parse import parse_qs
            query_params = parse_qs(self.path.split("?")[1])
        u_id = query_params.get("usuario_id", [None])[0] or query_params.get("user_id", [None])[0] or self._get_user_id()
        d_id = query_params.get("disciplina_id", [None])[0] or query_params.get("subject_id", [None])[0]
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        
        disc_id = int(d_id) if d_id else None
        sessoes = SESSAO_REPO.listar_por_usuario(int(u_id), disc_id)
        self._send_json_response(200, {"sucesso": True, "sessoes": sessoes, "study_sessions": sessoes})

    def handle_post_sessoes(self):
        data = self._read_json_body()
        u_id = self._get_user_id(data)
        if not u_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "usuario_id é obrigatório."})
        
        d_id = data.get("disciplina_id") or data.get("subject_id")
        if not d_id:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "disciplina_id é obrigatório."})
        
        t_id = data.get("tarefa_id") or data.get("task_id")
        titulo = data.get("titulo_licao") or data.get("lesson_title") or "Sessão de Estudos"
        duracao = int(data.get("duracao_segundos") or data.get("duration_seconds") or 0)
        if duracao <= 0:
            return self._send_json_response(400, {"sucesso": False, "mensagem": "duracao_segundos deve ser maior que 0."})
        
        iniciado_em = data.get("iniciado_em") or data.get("started_at") or datetime.now(timezone.utc).isoformat()
        finalizado_em = data.get("finalizado_em") or data.get("ended_at") or datetime.now(timezone.utc).isoformat()

        sessao = SESSAO_REPO.criar(
            usuario_id=int(u_id),
            disciplina_id=int(d_id),
            tarefa_id=int(t_id) if t_id else None,
            titulo_licao=titulo.strip(),
            duracao_segundos=duracao,
            iniciado_em=iniciado_em,
            finalizado_em=finalizado_em
        )
        self._send_json_response(201, {"sucesso": True, "sessao": sessao, "study_session": sessao})

    def handle_advanced_metrics(self):
        data = self._read_json_body()
        disciplinas = data.get("disciplinas", [])
        tarefas_concluidas = data.get("tarefas_concluidas", 0)
        dias_estudados = data.get("dias_estudados", 0)
        tarefas_pendentes = data.get("tarefas_pendentes", 0)

        progresso_ponderado = calcular_progresso_ponderado(disciplinas)
        dias_estimados = estimar_conclusao(tarefas_concluidas, dias_estudados, tarefas_pendentes)

        carga_total = sum(d.get("workload_hours", 0) for d in disciplinas)
        pesos = {}
        if carga_total > 0:
            for d in disciplinas:
                ident = d.get("id")
                if ident is not None:
                    pesos[ident] = round((d.get("workload_hours", 0) / carga_total) * 100, 2)

        self._send_json_response(200, {
            "sucesso": True,
            "progresso_ponderado": progresso_ponderado,
            "dias_estimados": dias_estimados,
            "pesos_disciplinas": pesos
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
