# EduTrack AI — Especificação Técnica de Backend & Banco de Dados (OpenSpec)

Este documento define os contratos de dados, regras de negócio e estrutura de banco de dados para o desenvolvimento guiado por especificação (**Spec-Driven Development**) do **EduTrack AI**.

---

## 1. Arquitetura do Backend Recomendada

- **Linguagem / Framework**: Python 3.11+ com **FastAPI**
- **ORM / Validação**: SQLAlchemy 2.0 + Pydantic v2
- **Banco de Dados**: **PostgreSQL 15+** (Principal) com fallback automático para **SQLite local** (`backend/usuarios.db`)
- **Autenticação**: OAuth2 Password Bearer com tokens **JWT** (JSON Web Tokens) ou sessão bcrypt
- **Documentação de API**: Swagger UI / OpenAPI 3.1 gerado automaticamente em `/docs`

### 1.1 Configuração de Conexão e Fallback do Banco de Dados

1. **Variáveis de Ambiente (`.env`)**:
   - As conexões são configuradas via `python-dotenv` no início do servidor e repositório.
   - Suporta `DATABASE_URL` (URL completa de conexão `postgresql://...`) ou variáveis individuais (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
   - Um arquivo `.env.example` serve de modelo documentado no projeto.

2. **Gerenciamento de Driver & Resiliência**:
   - Exige o driver `psycopg2-binary` (especificado em `requirements.txt`).
   - Se o driver estiver ausente, se nenhuma variável de conexão estiver setada, ou se a tentativa de conexão ao PostgreSQL falhar (timeout, credencial incorreta, host inacessível):
     - A exceção real (tipo e mensagem) é **registrada explicitamente nos logs do console**.
     - O repositório realiza **fallback automático para o SQLite local** mantendo a integridade dos dados e o funcionamento continuo da aplicação.

---

## 2. Esquema do Banco de Dados (PostgreSQL)

Convenção estrita: **snake_case** para tabelas e colunas, com chaves estrangeiras (`ON DELETE CASCADE`) e índices para consultas por usuário.

```sql
-- Extensão para UUIDs (opcional, ou utilizar SERIAL/BIGSERIAL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Tabela: subjects (Disciplinas)
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    professor VARCHAR(120) NOT NULL,
    workload_hours INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    start_date DATE,
    end_date DATE,
    color VARCHAR(20) DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_user_id ON subjects(user_id);

-- 3. Tabela: academic_tasks (Tarefas Acadêmicas)
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE academic_tasks (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_tasks_user_id ON academic_tasks(user_id);
CREATE INDEX idx_academic_tasks_subject_id ON academic_tasks(subject_id);
CREATE INDEX idx_academic_tasks_status ON academic_tasks(status);
```

---

## 3. Endpoints da API REST (OpenSpec)

Todas as rotas privadas exigem o header `Authorization: Bearer <jwt_token>`.

### 3.1 Autenticação (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Cadastro de novo usuário (`name`, `email`, `password`).
- `POST /api/v1/auth/login`: Autenticação e emissão de JWT (`username` [email], `password`).
- `POST /api/v1/auth/forgot-password`: Solicitação de recuperação de senha por e-mail.
- `GET /api/v1/auth/me`: Dados do usuário logado.

### 3.2 Disciplinas (`/api/v1/subjects`)
- `GET /api/v1/subjects`: Lista todas as disciplinas do usuário autenticado (com progresso calculado).
- `POST /api/v1/subjects`: Cria nova disciplina.
- `GET /api/v1/subjects/{subject_id}`: Detalha disciplina específica e suas tarefas.
- `PUT /api/v1/subjects/{subject_id}`: Atualiza dados da disciplina.
- `DELETE /api/v1/subjects/{subject_id}`: Remove disciplina e tarefas associadas.

### 3.3 Tarefas (`/api/v1/tasks`)
- `GET /api/v1/tasks?subject_id={id}&status={status}`: Lista tarefas filtradas.
- `POST /api/v1/tasks`: Cria nova tarefa associada a uma disciplina.
- `GET /api/v1/tasks/{task_id}`: Detalha uma tarefa específica.
- `PUT /api/v1/tasks/{task_id}`: Atualiza dados da tarefa.
- `PATCH /api/v1/tasks/{task_id}/status`: Atualização rápida de status (`pending`, `in_progress`, `completed`).
- `DELETE /api/v1/tasks/{task_id}`: Remove tarefa.

### 3.4 Dashboard & Estatísticas (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/metrics`: Retorna resumo de tarefas (totais, pendentes, concluídas) e distribuição de tempo/carga horária por disciplina.

### 3.5 Atualização de Perfil (/api/v1/profile)
- PUT /api/v1/profile: Endpoint para atualização de dados do usuário como nome.

## 4. Métricas e Cálculos Avançados (Python)
Um script independente (ackend/advanced_metrics.py) deve fornecer:
- **Progresso ponderado**: Calcula o progresso global com base no progresso de cada disciplina, ponderado pela respectiva carga horária.
- **Previsão de conclusão**: Baseando-se na velocidade atual de finalização de tarefas (tarefas/tempo), estima a data de conclusão para as pendências.
