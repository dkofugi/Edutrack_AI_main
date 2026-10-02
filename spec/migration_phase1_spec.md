# EduTrack AI — Migração Fase 1: Disciplinas e Tarefas (localStorage → PostgreSQL)

Este documento especifica a **Fase 1 da migração de dados** do EduTrack AI, migrando a persistência de disciplinas (`disciplinas`) e tarefas acadêmicas (`tarefas`) do `localStorage` do navegador para o servidor **PostgreSQL**.

---

## 1. Visão Geral

Atualmente, o cadastro de disciplinas e tarefas fica armazenado localmente em `localStorage` no arquivo `js/store.js`. Nesta Fase 1:
- As disciplinas (`disciplinas`) e tarefas (`tarefas`) passam a ser persistidas na base **PostgreSQL**.
- A identificação do usuário em cada requisição é feita enviando o `usuario_id` (obtido durante o login no `AUTH_SERVICE.autenticar`) através dos headers/payloads HTTP.
- Toda consulta e alteração no banco filtra estritamente por `usuario_id`, garantindo o isolamento multi-tenant entre diferentes contas de usuário.

---

## 2. Esquema do Banco de Dados (PostgreSQL)

Extensão e criação das tabelas `disciplinas` e `tarefas`:

```sql
CREATE TABLE IF NOT EXISTS disciplinas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    professor VARCHAR(120),
    carga_horaria INTEGER DEFAULT 0,
    descricao TEXT,
    data_inicio DATE,
    data_fim DATE,
    cor VARCHAR(20) DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    prazo DATE,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_usuario_id ON disciplinas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_disciplina_id ON tarefas(disciplina_id);
```

---

## 3. Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-MIG-01** | Repositório de disciplinas | Criar `backend/disciplina_repository.py` com conexão ao PostgreSQL/SQLite (métodos: `listar_por_usuario`, `criar`, `atualizar`, `excluir`). |
| **RF-MIG-02** | Repositório de tarefas | Criar `backend/tarefa_repository.py` com conexão ao PostgreSQL/SQLite (métodos: `listar_por_usuario`, `criar`, `atualizar`, `excluir`, `marcar_concluida`). |
| **RF-MIG-03** | Endpoints de disciplinas | `GET /api/disciplinas`, `POST /api/disciplinas`, `PUT /api/disciplinas/{id}`, `DELETE /api/disciplinas/{id}` em `server.py`. Exigem `usuario_id`. |
| **RF-MIG-04** | Endpoints de tarefas | `GET /api/tarefas`, `POST /api/tarefas`, `PUT /api/tarefas/{id}`, `DELETE /api/tarefas/{id}` em `server.py`. Exigem `usuario_id`. |
| **RF-MIG-05** | Isolamento por usuário | Toda consulta ou mutação SQL filtra obrigatoriamente por `usuario_id`. |
| **RF-MIG-06** | Atualizar `js/store.js` | Substituir lógica de `localStorage` para disciplinas e tarefas por chamadas assíncronas `fetch` à API REST, mantendo a interface pública de funções para compatibilidade com `js/app.js`. |
| **RF-MIG-07** | Estado de carregamento e erro | Exibir indicação visual simples durante o carregamento de dados do servidor e mensagens de erro tratadas em falhas de rede. |

---

## 4. Contratos de API REST

### 4.1 Disciplinas (`/api/disciplinas`)
- `GET /api/disciplinas?usuario_id={id}`: Retorna disciplinas do usuário.
- `POST /api/disciplinas`: Cria disciplina `{ "usuario_id": 1, "nome": "Cálculo", ... }`.
- `PUT /api/disciplinas`: Atualiza disciplina `{ "id": 5, "usuario_id": 1, ... }`.
- `DELETE /api/disciplinas?id={id}&usuario_id={usuario_id}`: Remove disciplina.

### 4.2 Tarefas (`/api/tarefas`)
- `GET /api/tarefas?usuario_id={id}`: Retorna tarefas do usuário.
- `POST /api/tarefas`: Cria tarefa `{ "usuario_id": 1, "disciplina_id": 5, "titulo": "Lista 1", ... }`.
- `PUT /api/tarefas`: Atualiza tarefa `{ "id": 10, "usuario_id": 1, ... }`.
- `DELETE /api/tarefas?id={id}&usuario_id={usuario_id}`: Remove tarefa.

---

## 5. Fora de Escopo
- Migração de sessões do cronômetro (`study_sessions` — reservada para a Fase 2).
- Autenticação JWT avançada (identificação efetuada por `usuario_id`).
