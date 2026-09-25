-- ==============================================================================
-- EduTrack AI — Esquema Consolidado de Banco de Dados Relacional (PostgreSQL 15+)
-- Especificação Técnica: spec/database_schema.sql (OpenSpec)
-- ==============================================================================

-- 0. Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação dos tipos enumerados
DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('ativo', 'inativo', 'bloqueado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Tabela: users (Usuários e Autenticação com Bcrypt)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    status user_status_enum DEFAULT 'ativo',
    recovery_token VARCHAR(100),
    recovery_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_recovery_token ON users(recovery_token);

-- ------------------------------------------------------------------------------
-- 3. Tabela: subjects (Disciplinas Acadêmicas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    professor VARCHAR(120) NOT NULL,
    workload_hours INTEGER NOT NULL DEFAULT 0 CHECK (workload_hours >= 0),
    description TEXT,
    start_date DATE,
    end_date DATE,
    color VARCHAR(20) DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

-- ------------------------------------------------------------------------------
-- 4. Tabela: academic_tasks (Tarefas e Atividades Acadêmicas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_tasks (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    status task_status_enum DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_academic_tasks_user_id ON academic_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_tasks_subject_id ON academic_tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_academic_tasks_status ON academic_tasks(status);
CREATE INDEX IF NOT EXISTS idx_academic_tasks_due_date ON academic_tasks(due_date);

-- ------------------------------------------------------------------------------
-- 5. Tabela: study_sessions (Sessões de Estudo & Cronômetro de Lição)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES academic_tasks(id) ON DELETE SET NULL,
    lesson_title VARCHAR(200) NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_task_id ON study_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Trigger e Função para Atualização Automática de updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER trg_update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_update_subjects_timestamp
    BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_update_tasks_timestamp
    BEFORE UPDATE ON academic_tasks
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 7. Dados Iniciais de Demonstração (Seed Data)
-- ------------------------------------------------------------------------------
-- Usuário padrão: aluno@edutrack.ai (Senha: 123456)
INSERT INTO users (id, name, email, hashed_password, status)
VALUES (
    1,
    'Ana Clara Silva',
    'aluno@edutrack.ai',
    '$2b$12$e8p2uX47rOqQ5i1E77zJkeZz7.Gg2sHh4sQ.e8X4m1H4sQe8X4m1H', -- Hash demonstrativo bcrypt
    'ativo'
)
ON CONFLICT (email) DO NOTHING;

-- Disciplinas de Exemplo
INSERT INTO subjects (id, user_id, name, professor, workload_hours, description, start_date, end_date, color)
VALUES 
    (1, 1, 'Cálculo Diferencial e Integral I', 'Prof. Dr. Ricardo Santos', 80, 'Limites, derivadas e integrais.', '2026-08-10', '2026-12-15', '#10b981'),
    (2, 1, 'Algoritmos e Estruturas de Dados', 'Profa. Camila Duarte', 72, 'Listas, árvores binárias e grafos.', '2026-08-12', '2026-12-18', '#059669'),
    (3, 1, 'Inteligência Artificial e Machine Learning', 'Prof. Marcos Lima', 60, 'Modelos supervisionados e deep learning.', '2026-08-15', '2026-12-20', '#34d399'),
    (4, 1, 'Banco de Dados e Engenharia de Dados', 'Profa. Juliana Melo', 64, 'Modelagem relacional e SQL avançado.', '2026-08-11', '2026-12-14', '#0ea5e9')
ON CONFLICT (id) DO NOTHING;

-- Reset da sequência de IDs
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('subjects', 'id'), coalesce(max(id), 1)) FROM subjects;
