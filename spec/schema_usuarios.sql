-- EduTrack AI — Esquema da Tabela de Usuários (PostgreSQL)
-- Armazenamento seguro de credenciais com bcrypt e fluxo de recuperação de senha

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    login VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    situacao VARCHAR(50) NOT NULL DEFAULT 'ativo',
    recovery_token VARCHAR(255),
    recovery_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas rápidas por login e token
CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(login);
CREATE INDEX IF NOT EXISTS idx_usuarios_recovery_token ON usuarios(recovery_token);

-- Comentários das colunas
COMMENT ON TABLE usuarios IS 'Tabela de credenciais e status de usuários autenticados no PostgreSQL';
COMMENT ON COLUMN usuarios.id IS 'Identificador único sequencial';
COMMENT ON COLUMN usuarios.login IS 'Login ou e-mail único do usuário';
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash criptográfico seguro da senha (algoritmo bcrypt)';
COMMENT ON COLUMN usuarios.situacao IS 'Situação da conta: ativo, inativo ou bloqueado';
COMMENT ON COLUMN usuarios.recovery_token IS 'Token temporário seguro para redefinição de senha';
COMMENT ON COLUMN usuarios.recovery_expires IS 'Data e hora limite para expiração do token de recuperação';
