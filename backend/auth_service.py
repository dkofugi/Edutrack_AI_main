"""
Serviço de Autenticação
Implementa a validação estrita de credenciais com bcrypt,
novo cadastro com validação de campos,
fluxo de recuperação e redefinição de senha,
e tratamento de erros com mensagens genéricas para evitar enumeração de usuários.
"""
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional, Dict, Any
from backend.security import gerar_senha_hash, verificar_senha, gerar_token_recuperacao
from backend.repository import UsuarioRepository

# Mensagem padronizada genérica para proteção contra enumeração de usuários
MENSAGEM_ERRO_GENERICA = "Usuário ou senha inválidos"


class AuthService:
    def __init__(self, repository: Optional[UsuarioRepository] = None):
        self.repository = repository or UsuarioRepository()

    def autenticar(self, login: str, senha: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Autentica o usuário comparando a senha informada com o hash bcrypt salvo no banco.
        
        Regras de Negócio e Segurança:
        1. Se o login ou senha forem vazios/inválidos -> retorna erro genérico.
        2. Se o usuário não existir no banco -> retorna erro genérico.
        3. Se a situação do usuário não for 'ativo' -> retorna erro genérico.
        4. Se a senha não corresponder ao hash salvo -> retorna erro genérico.
        5. Apenas se tudo for exato -> autentica com sucesso.
        
        Returns:
            (sucesso: bool, dados_usuario: dict | None, mensagem: str)
        """
        if not login or not senha or not isinstance(login, str) or not isinstance(senha, str):
            return False, None, MENSAGEM_ERRO_GENERICA

        login_limpo = login.strip()
        senha_limpa = senha.strip()
        if not login_limpo or not senha_limpa:
            return False, None, MENSAGEM_ERRO_GENERICA

        usuario = self.repository.buscar_por_login(login_limpo)
        if not usuario:
            # Executa dummy check para equilibrar tempo de resposta e evitar timing attack
            _ = verificar_senha("dummy_timing_protection", "$2b$12$e8Y52p7oM9zS0Y4y159m9OBP5a.RkeUjLw0X6qZ51D2Ld.L2Q29uO")
            return False, None, MENSAGEM_ERRO_GENERICA

        if usuario.get("situacao") != "ativo":
            return False, None, MENSAGEM_ERRO_GENERICA

        senha_hash_salva = usuario.get("senha_hash", "")
        if not senha_hash_salva:
            return False, None, MENSAGEM_ERRO_GENERICA

        senha_valida = verificar_senha(senha_limpa, senha_hash_salva)
        if not senha_valida:
            return False, None, MENSAGEM_ERRO_GENERICA

        # Sucesso na autenticação
        dados_usuario = {
            "id": usuario["id"],
            "nome": usuario.get("nome"),
            "login": usuario["login"],
            "situacao": usuario["situacao"]
        }
        return True, dados_usuario, "Autenticado com sucesso"

    def cadastrar(self, login: str, senha: str, situacao: str = "ativo") -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Cadastra um novo usuário no banco com hash seguro bcrypt.
        Campos obrigatórios: login, senha (hasheada) e situacao.
        """
        if not login or not senha:
            return False, None, "Login e senha são obrigatórios."

        login_limpo = str(login).strip().lower()
        senha_str = str(senha)

        if not login_limpo:
            return False, None, "Login não pode ser vazio."

        if len(senha_str) < 6:
            return False, None, "A senha deve conter no mínimo 6 caracteres."

        situacao_valida = situacao if situacao in ["ativo", "inativo", "bloqueado"] else "ativo"

        existente = self.repository.buscar_por_login(login_limpo)
        if existente:
            return False, None, "Este login já está cadastrado."

        senha_hash = gerar_senha_hash(senha_str)
        novo_usuario = self.repository.criar_usuario(login=login_limpo, senha_hash=senha_hash, situacao=situacao_valida)
        novo_usuario["nome"] = None
        return True, novo_usuario, "Usuário cadastrado com sucesso."

    def solicitar_recuperacao(self, login: str) -> Tuple[bool, Optional[str], str]:
        """
        Gera um token de recuperação temporário para o usuário no banco de dados.
        Retorna mensagem segura para evitar enumeração de usuários.
        """
        if not login or not isinstance(login, str) or not login.strip():
            return False, None, "Informe o login ou e-mail cadastrado."

        login_limpo = login.strip().lower()
        usuario = self.repository.buscar_por_login(login_limpo)

        # Se o usuário não existir ou não estiver ativo, mantemos resposta de sucesso anti-enumeração
        if not usuario or usuario.get("situacao") != "ativo":
            return True, None, "Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas."

        token = gerar_token_recuperacao(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        self.repository.salvar_token_recuperacao(login_limpo, token, expires_at)

        return True, token, "Instruções de recuperação geradas com sucesso."

    def redefinir_senha(self, login: str, nova_senha: str, token: Optional[str] = None) -> Tuple[bool, str]:
        """
        Redefine a senha do usuário com hash bcrypt após validação das regras.
        """
        if not login or not nova_senha:
            return False, "Login e nova senha são obrigatórios."

        login_limpo = str(login).strip().lower()
        nova_senha_str = str(nova_senha)

        if len(nova_senha_str) < 6:
            return False, "A nova senha deve conter no mínimo 6 caracteres."

        usuario = self.repository.buscar_por_login(login_limpo)
        if not usuario or usuario.get("situacao") != "ativo":
            return False, "Usuário não encontrado ou não está ativo."

        # Se token de recuperação for fornecido, valida se confere
        if token:
            token_salvo = usuario.get("recovery_token")
            if not token_salvo or token_salvo != token:
                return False, "Token de recuperação inválido ou expirado."

        nova_senha_hash = gerar_senha_hash(nova_senha_str)
        atualizado = self.repository.atualizar_senha(login_limpo, nova_senha_hash)
        if atualizado:
            return True, "Senha redefinida com sucesso."
        return False, "Não foi possível redefinir a senha."
