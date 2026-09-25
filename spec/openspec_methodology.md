# Metodologia OpenSpec — Desenvolvimento Guiado por Especificação (Spec-Driven Development)

Este documento define as diretrizes, princípios e ciclo de vida da **Metodologia OpenSpec** adotada no projeto **EduTrack AI**.

---

## 1. O que é a Metodologia OpenSpec?

A **Metodologia OpenSpec** é uma abordagem de engenharia de software centrada em contratos claros, declarativos e versionáveis (**Spec-Driven Development — SDD**). Em vez de iniciar o desenvolvimento diretamente pelo código e documentar posteriormente (ou não documentar), o ciclo OpenSpec estabelece que:

> **"A especificação não é um relatório posterior: ela é o contrato formal e a fonte única da verdade (Single Source of Truth) que rege a arquitetura, o banco de dados, os testes e o código."**

---

## 2. Os Cinco Pilares do OpenSpec

```text
┌─────────────────────────────────────────────────────────────┐
│                 PILAR 1: SPEC-FIRST                         │
│   Nenhum recurso é implementado sem antes estar previsto    │
│            em uma especificação técnica formal.             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             PILAR 2: CONTRATOS DECLARATIVOS                 │
│    Esquemas de dados, endpoints REST e eventos possuem      │
│      formatos estritos (OpenAPI, JSON Schema, SQL DDL).     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             PILAR 3: RASTREABILIDADE TOTAL                  │
│    Cada regra de negócio (RF) possui correspondência        │
│   direta no banco de dados, na rota da API e nos testes.    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         PILAR 4: VERIFICAÇÃO ORIENTADA A TESTES             │
│    Os testes unitários e de integração validam se o código   │
│         cumpre rigorosamente o contrato da especificação.   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          PILAR 5: GOVERNANÇA E EVOLUÇÃO CONTÍNUA            │
│   Alterações nos requisitos exigem atualização prévia da    │
│    especificação antes da refatoração da base de código.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Ciclo de Vida de uma Mudança no OpenSpec

O fluxo de desenvolvimento de novas funcionalidades no EduTrack AI segue 5 etapas obrigatórias:

### Etapa 1: Elaboração da Especificação (Spec Phase)
- O desenvolvedor redige ou atualiza o documento de especificação na pasta `/spec`.
- Define o modelo de dados em `snake_case`, tipos primitivos, restrições (`NOT NULL`, `REFERENCES ... ON DELETE CASCADE`) e índices.
- Define a assinatura dos endpoints HTTP, payloads de requisição/resposta e códigos de status (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`).

### Etapa 2: Validação do Contrato (Contract Review)
- Verificação de consistência entre frontend e backend.
- Garantia de que rotas de API entregam exclusivamente respostas em `application/json; charset=utf-8` para mitigar erros de interpretação (`Unexpected token '<'`).

### Etapa 3: Especificação dos Testes (Test-Driven Spec)
- Criação dos casos de teste automatizados em `/tests` correspondentes a cada requisito da especificação.
- Cenários de sucesso e cenários de exceção (ex: credenciais inválidas, chaves duplicadas, campos obrigatórios ausentes).

### Etapa 4: Implementação do Código (Implementation)
- Construção do código no frontend e no backend aderente à especificação.
- No frontend: componentes modulares desacoplados de regras globais através do gerenciador de estado central (`store.js`).
- No backend: separação em camadas (`server.py`, `backend/auth_service.py`, `backend/repository.py`, `backend/security.py`).

### Etapa 5: Validação e Aceite (Verification & Compliance)
- Execução da suíte de testes automatizados (`py -m unittest discover`).
- Confirmação de conformidade com os critérios de aceitação do OpenSpec.

---

## 4. Estrutura de Documentos OpenSpec do EduTrack AI

A documentação normativa do projeto está organizada em `/spec`:

| Documento | Tipo | Descrição |
| :--- | :--- | :--- |
| `spec/openspec_methodology.md` | Metodologia | Diretrizes e governança da metodologia OpenSpec (este documento). |
| `spec/backend_spec.md` | Arquitetura | Especificação de arquitetura de backend Python/FastAPI e PostgreSQL. |
| `spec/study_session_timer_spec.md` | Feature Spec | Especificação técnica do módulo de Cronômetro e Sessões de Estudo (`study_sessions`). |
| `spec/frontend_spec.md` | UI / Client | Especificação da arquitetura frontend, componentes e persistência reativa. |
| `spec/database_schema.sql` | Dados DDL | Script SQL executável consolidado para criação de todas as tabelas e índices PostgreSQL. |
| `spec/api_contracts.json` | API Schema | Especificação OpenAPI 3.1 formal dos contratos de endpoints REST. |
| `spec/README.md` | Catálogo | Índice geral e guia de consulta das especificações. |

---

## 5. Rastreabilidade de Requisitos (Matriz OpenSpec)

| Requisito Funcional | Especificação | Entidade no BD | Endpoint / Ação | Teste Automatizado |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01**: Autenticação Segura | `backend_spec.md` | `users` | `POST /api/login` | `test_auth.py::test_login_com_senha_correta_sucesso` |
| **RF-02**: Hash de Senha Bcrypt | `backend_spec.md` | `users.senha_hash` | `POST /api/register` | `test_auth.py::test_senha_armazenada_apenas_como_hash_bcrypt` |
| **RF-03**: Recuperação de Senha | `backend_spec.md` | `users.token_recuperacao` | `POST /api/forgot-password` | `test_auth.py::test_fluxo_recuperacao_e_redefinicao_de_senha` |
| **RF-04**: Gestão de Disciplinas | `backend_spec.md` | `subjects` | `GET/POST /api/v1/subjects` | Validação de persistência e cálculo de progresso |
| **RF-05**: Gestão de Tarefas | `backend_spec.md` | `academic_tasks` | `GET/POST /api/v1/tasks` | Validação de status e filtros |
| **RF-06**: Cronômetro de Lição | `study_session_timer_spec.md` | `study_sessions` | `POST /api/v1/study-sessions` | Validação de contagem temporal e persistência |
| **RF-07**: Interface Web/Desktop | `frontend_spec.md` | UI / DOM | Rotas SPA client-side | Teste de renderização e alternância de temas |
