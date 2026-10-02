"""
Testes Automatizados do Fluxo de Autenticação & API
Verifica:
1. Login com senha correta -> sucesso (autentica).
2. Login com senha incorreta / arbitrária -> falha obrigatória (corrige brecha de aceitar qualquer senha).
3. Login com usuário inexistente -> falha com mesma mensagem genérica (anti-enumeração).
4. Usuário inativo / bloqueado -> falha de autenticação.
5. Armazenamento de senha -> somente como hash seguro bcrypt, nunca texto puro.
6. Novo cadastro -> persiste login, senha_hash e situação no banco.
7. Recuperação de senha -> consulta banco, gera token e redefine senha com hash bcrypt.
8. Endpoints da API HTTP -> verificação de que TODAS as rotas /api/* retornam Content-Type application/json
   e NUNCA HTML (diagnóstico e prevenção do erro Unexpected token).
"""
import json
import os
import tempfile
import threading
import urllib.error
import urllib.request
import unittest

from backend.security import gerar_senha_hash, verificar_senha, gerar_token_recuperacao
from backend.repository import UsuarioRepository
from backend.auth_service import AuthService, MENSAGEM_ERRO_GENERICA
from server import AppHandler
import socketserver


class TestAutenticacaoSegura(unittest.TestCase):
    def setUp(self):
        # Banco temporário isolado para cada execução de teste
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.repo = UsuarioRepository(db_path=self.temp_db.name)
        if self.repo.use_postgres:
            self.repo.limpar_tabela()
        self.auth_service = AuthService(repository=self.repo)

        self.login_teste = "aluno@edutrack.ai"
        self.senha_correta = "123456"
        self.senha_incorreta = "senha_errada_999"

        self.auth_service.cadastrar(login=self.login_teste, senha=self.senha_correta, situacao="ativo")

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            try:
                os.remove(self.temp_db.name)
            except OSError:
                pass

    def test_login_com_senha_correta_sucesso(self):
        """Garante que o login com login e senha corretos funciona e autentica o usuário."""
        sucesso, usuario, mensagem = self.auth_service.autenticar(self.login_teste, self.senha_correta)
        self.assertTrue(sucesso, "O login com senha correta deveria ter sucesso.")
        self.assertIsNotNone(usuario)
        self.assertEqual(usuario["login"], self.login_teste)
        self.assertEqual(usuario["situacao"], "ativo")
        self.assertEqual(mensagem, "Autenticado com sucesso")

    def test_login_com_senha_incorreta_falha_obrigatoriamente(self):
        """
        Garante que o login com senha incorreta falha obrigatoriamente.
        Resolve a falha de segurança em que o sistema aceitava senhas arbitrárias.
        """
        senhas_invalidas = [
            "senha_errada",
            "1234567",
            "12345",
            " ",
            "admin",
            "qualquer_coisa"
        ]
        for senha_falsa in senhas_invalidas:
            sucesso, usuario, mensagem = self.auth_service.autenticar(self.login_teste, senha_falsa)
            self.assertFalse(sucesso, f"O login com a senha incorreta '{senha_falsa}' NUNCA deve autenticar.")
            self.assertIsNone(usuario, "Nenhum dado de usuário deve ser retornado.")
            self.assertEqual(mensagem, MENSAGEM_ERRO_GENERICA)

    def test_login_com_campos_vazios_rejeita(self):
        """Garante que tentativa de login vazia ou nula é rejeitada."""
        sucesso, usuario, _ = self.auth_service.autenticar("", "")
        self.assertFalse(sucesso)
        sucesso, usuario, _ = self.auth_service.autenticar(self.login_teste, "")
        self.assertFalse(sucesso)

    def test_login_usuario_inexistente_retorna_mesma_mensagem_generica(self):
        """Garante que usuário inexistente receba a MESMA mensagem genérica sem indicar qual campo errou."""
        sucesso, usuario, mensagem = self.auth_service.autenticar("nao_existe@edutrack.ai", "qualquer_senha")
        self.assertFalse(sucesso)
        self.assertIsNone(usuario)
        self.assertEqual(mensagem, MENSAGEM_ERRO_GENERICA)

    def test_usuario_inativo_falha(self):
        """Garante que usuário inativo ou bloqueado não consiga autenticar."""
        login_inativo = "inativo@edutrack.ai"
        self.auth_service.cadastrar(login=login_inativo, senha="senha123456", situacao="inativo")

        sucesso, usuario, mensagem = self.auth_service.autenticar(login_inativo, "senha123456")
        self.assertFalse(sucesso, "Usuário inativo não deve conseguir logar.")
        self.assertIsNone(usuario)
        self.assertEqual(mensagem, MENSAGEM_ERRO_GENERICA)

    def test_senha_armazenada_apenas_como_hash_bcrypt(self):
        """Garante que a senha é armazenada no banco como hash bcrypt e nunca em texto puro."""
        usuario_salvo = self.repo.buscar_por_login(self.login_teste)
        self.assertIsNotNone(usuario_salvo)
        
        senha_hash = usuario_salvo["senha_hash"]
        self.assertTrue(senha_hash.startswith(("$2a$", "$2b$", "$2y$")), "O hash deve possuir prefixo bcrypt.")
        self.assertNotEqual(senha_hash, self.senha_correta, "A senha nunca pode ser igual ao texto puro.")
        self.assertNotIn(self.senha_correta, senha_hash, "A senha em texto puro não deve estar contida no hash.")

    def test_novo_cadastro_persiste_campos_obrigatorios(self):
        """Garante que o novo cadastro persiste login, senha_hash e situacao."""
        novo_login = "estudante_novo@edutrack.ai"
        nova_senha = "MinhaSenhaForte@2026"
        sucesso, usuario, msg = self.auth_service.cadastrar(novo_login, nova_senha, "ativo")

        self.assertTrue(sucesso)
        self.assertEqual(usuario["login"], novo_login)
        self.assertEqual(usuario["situacao"], "ativo")

        # Verifica no banco
        registro = self.repo.buscar_por_login(novo_login)
        self.assertIsNotNone(registro)
        self.assertEqual(registro["situacao"], "ativo")
        self.assertTrue(verificar_senha(nova_senha, registro["senha_hash"]))

    def test_cadastro_rejeita_login_duplicado_ou_senha_curta(self):
        """Garante validação de duplicidade e tamanho mínimo de senha."""
        sucesso, _, msg = self.auth_service.cadastrar(self.login_teste, "outrasenha123")
        self.assertFalse(sucesso)
        self.assertIn("já está cadastrado", msg)

        sucesso, _, msg = self.auth_service.cadastrar("novo@edutrack.ai", "123")
        self.assertFalse(sucesso)
        self.assertIn("mínimo 6 caracteres", msg)

    def test_fluxo_recuperacao_e_redefinicao_de_senha(self):
        """
        Valida o fluxo completo de 'esqueci minha senha' consultando e atualizando o banco:
        1. Solicitação de recuperação gera token temporário no banco.
        2. Redefinição de senha valida token e atualiza senha_hash no banco.
        3. Antiga senha é invalidada; nova senha passa a autenticar.
        """
        # 1. Solicita recuperação
        sucesso, token, msg = self.auth_service.solicitar_recuperacao(self.login_teste)
        self.assertTrue(sucesso)
        self.assertIsNotNone(token)

        # Checa se o token foi gravado no repositório
        usuario = self.repo.buscar_por_login(self.login_teste)
        self.assertEqual(usuario["recovery_token"], token)
        self.assertIsNotNone(usuario["recovery_expires"])

        # 2. Redefine a senha com token
        nova_senha = "NovaSenhaSegura@2026"
        sucesso_redef, msg_redef = self.auth_service.redefinir_senha(
            login=self.login_teste,
            nova_senha=nova_senha,
            token=token
        )
        self.assertTrue(sucesso_redef)

        # 3. Verifica invalidação do token e atualização do hash
        usuario_pos = self.repo.buscar_por_login(self.login_teste)
        self.assertIsNone(usuario_pos["recovery_token"])

        # 4. Antiga senha DEVE falhar
        sucesso_antiga, _, _ = self.auth_service.autenticar(self.login_teste, self.senha_correta)
        self.assertFalse(sucesso_antiga, "A senha antiga não pode mais autenticar.")

        # 5. Nova senha DEVE ter sucesso
        sucesso_nova, usuario_novo, _ = self.auth_service.autenticar(self.login_teste, nova_senha)
        self.assertTrue(sucesso_nova, "A nova senha deve autenticar com sucesso.")
        self.assertEqual(usuario_novo["login"], self.login_teste)


class TestAPIHttpEndpoints(unittest.TestCase):
    """
    Testes de integração HTTP para garantir que endpoints da API retornem Content-Type application/json
    e payloads válidos, eliminando qualquer ocorrência de HTML / 'Unexpected token'.
    """
    @classmethod
    def setUpClass(cls):
        socketserver.TCPServer.allow_reuse_address = True
        cls.server = socketserver.TCPServer(("127.0.0.1", 0), AppHandler)
        cls.port = cls.server.server_address[1]
        cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.server_thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.port}"

        # Garante a existência do usuário para os testes HTTP
        from server import AUTH_SERVICE, REPO
        if not REPO.buscar_por_login("aluno@edutrack.ai"):
            AUTH_SERVICE.cadastrar("aluno@edutrack.ai", "123456", "ativo")

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def _post(self, path, payload):
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                status = resp.getcode()
                content_type = resp.headers.get("Content-Type", "")
                data = json.loads(resp.read().decode("utf-8"))
                return status, content_type, data
        except urllib.error.HTTPError as err:
            status = err.code
            content_type = err.headers.get("Content-Type", "")
            data = json.loads(err.read().decode("utf-8"))
            return status, content_type, data

    def test_http_login_sucesso_retorna_json(self):
        status, content_type, data = self._post("/api/login", {
            "login": "aluno@edutrack.ai",
            "senha": "123456"
        })
        self.assertEqual(status, 200)
        self.assertIn("application/json", content_type)
        self.assertTrue(data["sucesso"])
        self.assertEqual(data["usuario"]["login"], "aluno@edutrack.ai")

    def test_http_login_senha_errada_retorna_json_401_nao_html(self):
        status, content_type, data = self._post("/api/login", {
            "login": "aluno@edutrack.ai",
            "senha": "senha_totalmente_errada"
        })
        self.assertEqual(status, 401)
        self.assertIn("application/json", content_type)
        self.assertFalse(data["sucesso"])
        self.assertEqual(data["mensagem"], "Usuário ou senha inválidos")

    def test_http_login_com_barra_final_retorna_json(self):
        """Verifica normalização de rotas com trailing slash."""
        status, content_type, data = self._post("/api/login/", {
            "login": "aluno@edutrack.ai",
            "senha": "123456"
        })
        self.assertEqual(status, 200)
        self.assertIn("application/json", content_type)
        self.assertTrue(data["sucesso"])

    def test_http_recuperacao_senha_retorna_json(self):
        status, content_type, data = self._post("/api/forgot-password", {
            "login": "aluno@edutrack.ai"
        })
        self.assertEqual(status, 200)
        self.assertIn("application/json", content_type)
        self.assertTrue(data["sucesso"])

    def test_http_rota_inexistente_retorna_404_json_e_nao_html(self):
        """
        Diagnóstico crucial: antes, rotas desconhecidas retornavam HTML com <!DOCTYPE HTML...
        que quebrava o JSON.parse no frontend gerando 'Unexpected token <'.
        Agora deve retornar JSON válido com erro 404.
        """
        status, content_type, data = self._post("/api/rota_desconhecida", {})
        self.assertEqual(status, 404)
        self.assertIn("application/json", content_type)
        self.assertFalse(data["sucesso"])
        self.assertEqual(data["mensagem"], "Endpoint não encontrado")

    def test_http_options_preflight_cors(self):
        req = urllib.request.Request(f"{self.base_url}/api/login", method="OPTIONS")
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.getcode(), 200)
            self.assertIn("Access-Control-Allow-Origin", resp.headers)


class TestPostgresRepositoryBranch(unittest.TestCase):
    """
    Testes específicos para verificar a geração de SQL e manipulação de cursores
    quando a conexão PostgreSQL ativa (psycopg2) é utilizada.
    """
    def setUp(self):
        from unittest.mock import MagicMock
        self.mock_cursor = MagicMock()
        self.mock_conn = MagicMock()
        self.mock_conn.cursor.return_value.__enter__.return_value = self.mock_cursor

        self.repo = UsuarioRepository.__new__(UsuarioRepository)
        self.repo.use_postgres = True
        self.repo.pg_url = "postgresql://user:pass@localhost:5432/edutrack"
        self.repo.pg_module = MagicMock()
        self.repo.pg_module.connect.return_value = self.mock_conn

    def test_postgres_buscar_por_login(self):
        self.mock_cursor.fetchone.return_value = (
            1, None, "aluno@edutrack.ai", "$2b$12$hash", "ativo", "token123", "2026-09-22T00:00:00Z", "2026-08-01", "2026-08-01"
        )
        res = self.repo.buscar_por_login("aluno@edutrack.ai")
        self.assertIsNotNone(res)
        self.assertEqual(res["login"], "aluno@edutrack.ai")
        self.assertEqual(res["senha_hash"], "$2b$12$hash")
        self.assertEqual(res["recovery_token"], "token123")
        # Garante uso de sintaxe PostgreSQL %s
        sql = self.mock_cursor.execute.call_args[0][0]
        self.assertIn("%s", sql)
        self.assertNotIn("?", sql)

    def test_postgres_criar_usuario(self):
        self.mock_cursor.fetchone.return_value = (
            10, "novo@edutrack.ai", "ativo", "2026-09-22T00:00:00Z"
        )
        res = self.repo.criar_usuario("novo@edutrack.ai", "$2b$12$novohash", "ativo")
        self.assertEqual(res["id"], 10)
        self.assertEqual(res["login"], "novo@edutrack.ai")
        sql = self.mock_cursor.execute.call_args[0][0]
        self.assertIn("RETURNING id, login, situacao, created_at", sql)
        self.assertIn("%s", sql)

    def test_postgres_salvar_token_recuperacao(self):
        self.mock_cursor.rowcount = 1
        sucesso = self.repo.salvar_token_recuperacao("aluno@edutrack.ai", "token_abc", "2026-09-22T01:00:00Z")
        self.assertTrue(sucesso)
        sql = self.mock_cursor.execute.call_args[0][0]
        self.assertIn("recovery_token = %s", sql)

    def test_postgres_atualizar_senha(self):
        self.mock_cursor.rowcount = 1
        sucesso = self.repo.atualizar_senha("aluno@edutrack.ai", "$2b$12$novasenha")
        self.assertTrue(sucesso)
        sql = self.mock_cursor.execute.call_args[0][0]
        self.assertIn("recovery_token = NULL", sql)
        self.assertIn("senha_hash = %s", sql)


if __name__ == "__main__":
    unittest.main()

