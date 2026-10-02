# EduTrack AI — Migração Fase 2: Sessões de Estudo (localStorage → PostgreSQL)

Este documento especifica a **Fase 2 da migração de dados** do EduTrack AI, migrando o histórico de sessões de estudo (`sessoes_estudo`) do `localStorage` do navegador para o servidor **PostgreSQL**.

---

## 1. Visão Geral

Na Fase 1, as tabelas `disciplinas` e `tarefas` foram migradas para o PostgreSQL. Nesta Fase 2:
- O histórico de sessões de estudo finalizadas pelo cronômetro (`sessoes_estudo`) passa a ser persistido na base **PostgreSQL**.
- O estado temporário do cronômetro em andamento (`ACTIVE_TIMER_KEY`) continua em `localStorage` para garantir a contagem e sobrevivência a F5/navegações sem overhead desnecessário de rede.
- O arquivo `spec/database_schema.sql` (que continha tabelas em inglês nunca executadas em produção) é explicitamente desconsiderado/obsoleto em favor da nomenclatura oficial em português (`usuarios`, `disciplinas`, `tarefas`, `sessoes_estudo`).

---

## 2. Esquema do Banco de Dados (PostgreSQL)

Criação da tabela `sessoes_estudo`:

```sql
CREATE TABLE IF NOT EXISTS sessoes_estudo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    tarefa_id INTEGER REFERENCES tarefas(id) ON DELETE SET NULL,
    titulo_licao VARCHAR(200) NOT NULL,
    duracao_segundos INTEGER NOT NULL CHECK (duracao_segundos > 0),
    iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    finalizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes_estudo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina_id ON sessoes_estudo(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_created_at ON sessoes_estudo(created_at DESC);
```

---

## 3. Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-MIG2-01** | Repositório de sessões | Criar `backend/sessao_repository.py` com suporte dual-backend (PostgreSQL/SQLite) implementando `listar_por_usuario` e `criar`. Sessões concluídas são imutáveis. |
| **RF-MIG2-02** | Endpoint de criação | `POST /api/sessoes` aceita `{ "usuario_id", "disciplina_id", "tarefa_id", "titulo_licao", "duracao_segundos", "iniciado_em", "finalizado_em" }`. |
| **RF-MIG2-03** | Endpoint de listagem | `GET /api/sessoes?usuario_id={id}&disciplina_id={id opcional}`. |
| **RF-MIG2-04** | Isolamento por usuário | Toda consulta ou inserção SQL filtra obrigatoriamente por `usuario_id`. |
| **RF-MIG2-05** | Atualizar `js/store.js` | Tornar `getStudySessions()` e `addStudySession()` assíncronos, consumindo a API REST via `_fetchJson`. |
| **RF-MIG2-06** | Ajustar chamador em `js/timer.js` | Atualizar `finishLesson()` para utilizar `await store.addStudySession(...)`, garantindo que os toasts e confirmações aguardem a resposta do backend. |
| **RF-MIG2-07** | Atualizar `syncWithBackend()` | Incluir `/api/sessoes` no `Promise.all` inicial do `store.js` para popular `this.data.study_sessions` ao carregar a aplicação. |

---

## 4. Contratos de API REST

### 4.1 Sessões de Estudo (`/api/sessoes`)
- `GET /api/sessoes?usuario_id={id}&disciplina_id={id opcional}`: Lista as sessões do usuário.
- `POST /api/sessoes`: Registra uma nova sessão concluída.

---

## 5. Nota sobre Descontinuação de `spec/database_schema.sql`
O arquivo `spec/database_schema.sql` com nomenclaturas em inglês (`users`, `subjects`, `academic_tasks`, `study_sessions`) está obsoleto e foi substituído pelo padrão produtivo em português (`usuarios`, `disciplinas`, `tarefas`, `sessoes_estudo`).
