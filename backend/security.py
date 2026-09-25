"""
Módulo de Segurança e Criptografia de Senhas com Bcrypt
Garante que nenhuma senha seja persistida em texto puro.
"""
import secrets
import bcrypt


def gerar_token_recuperacao(tamanho: int = 32) -> str:
    """Gera um token criptograficamente seguro e aleatório para recuperação de senha."""
    return secrets.token_urlsafe(tamanho)


def gerar_senha_hash(senha: str) -> str:
    """
    Gera um hash seguro da senha utilizando o algoritmo bcrypt com salt aleatório.
    
    Args:
        senha: Senha em texto puro.
        
    Returns:
        String contendo o hash bcrypt formatado.
    """
    if not isinstance(senha, str) or not senha:
        raise ValueError("A senha deve ser uma string não vazia.")
        
    senha_bytes = senha.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    return hash_bytes.decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """
    Compara de forma segura a senha informada com o hash bcrypt salvo.
    Usa tempo constante para mitigar ataques de temporização (timing attacks).
    
    Args:
        senha: Senha informada na tentativa de login.
        senha_hash: Hash bcrypt previamente armazenado no banco.
        
    Returns:
        True se a senha corresponder exatamente ao hash; False caso contrário.
    """
    if not senha or not senha_hash:
        return False
        
    try:
        senha_bytes = senha.encode("utf-8")
        hash_bytes = senha_hash.encode("utf-8")
        return bcrypt.checkpw(senha_bytes, hash_bytes)
    except Exception:
        return False
