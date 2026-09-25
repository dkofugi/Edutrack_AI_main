# EduTrack AI — Especificação Técnica: Cronômetro de Lição & Sessões de Estudo (OpenSpec)

Este documento especifica o módulo de **Cronômetro de Lição em Tempo Real** e o gerenciamento de **Sessões de Estudo Acadêmicas** (`study_sessions`), em total conformidade com a **Metodologia OpenSpec**.

---

## 1. Visão Geral do Recurso

O estudante universitário/técnico necessita acompanhar o tempo dedicado a cada disciplina e tarefa para otimizar sua rotina de estudos, combater a procrastinação e medir seu esforço real por matéria.

O módulo disponibiliza:
1. **Opções para Iniciar a Lição**:
   - Botão direto em tarefas acadêmicas pendentes ou em andamento.
   - Botão de ação rápida na Sidebar Desktop e no Header Mobile (*"Iniciar Lição"*).
   - Botão em destaque no Dashboard principal.
   - Modal com seleção de disciplina, tarefa vinculada opcional e tópico de estudo.
2. **Widget Flutuante de Cronômetro**:
   - Fixado no canto da tela (`bottom: 24px; right: 24px` no desktop, responsivo no mobile).
   - Permanece visível e rodando continuamente em tempo real durante a navegação entre telas.
   - Controles de **Pausar / Retomar**, **Minimizar / Expandir** (para pílula discreta), **Concluir Lição** e **Cancelar**.
3. **Persistência e Histórico de Estudo**:
   - Registro de sessões de estudo finalizadas com duração exata em segundos.
   - Atualização das métricas de tempo acumulado no Dashboard do estudante.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-TIMER-01** | Início de Lição | O sistema deve permitir iniciar um cronômetro indicando a disciplina obrigatória e uma tarefa ou tópico opcional. |
| **RF-TIMER-02** | Contagem em Tempo Real | O cronômetro deve atualizar a cada 1 segundo exibindo o formato `HH:MM:SS` (ou `MM:SS`). |
| **RF-TIMER-03** | Widget Flutuante | O cronômetro deve ser renderizado em um container fixo no canto da tela, sobrepondo as páginas sem bloquear o clique em elementos adjacentes. |
| **RF-TIMER-04** | Pausa e Retomada | O usuário deve poder pausar a contagem a qualquer momento sem perder o tempo já acumulado e retomá-la sem desvios de relógio (drift). |
| **RF-TIMER-05** | Modo Minimizável | O usuário deve poder recolher o widget para uma pílula compacta contendo apenas o tempo rodando e o nome da matéria, podendo expandi-lo com um clique. |
| **RF-TIMER-06** | Persistência entre Navegações | Ao trocar de rota (Dashboard -> Disciplinas -> Tarefas) ou atualizar a página (F5), o cronômetro deve continuar contando perfeitamente a partir do timestamp original no `localStorage`. |
| **RF-TIMER-07** | Conclusão de Lição | Ao concluir a lição, o sistema deve registrar a sessão na tabela/store `study_sessions`, exibir o tempo focado formatado e, se houver tarefa vinculada, oferecer a marcação da tarefa como concluída. |
| **RF-TIMER-08** | Descarte Seguro | O usuário pode cancelar a sessão ativa mediante diálogo de confirmação. |

### 2.2 Requisitos Não-Funcionais (RNF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-TIMER-01** | Precisão Temporal | O cálculo do tempo decorrido deve utilizar a diferença de timestamps UNIX (`Date.now() - startTimestamp`) para evitar atrasos cumulativos causados por throttles de aba inativa do navegador. |
| **RNF-TIMER-02** | Responsividade | O widget deve se adaptar a telas móveis (< 768px), posicionando-se acima da barra de navegação inferior sem obstruir botões essenciais. |
| **RNF-TIMER-03** | Aderência Visual | O componente deve respeitar o tema claro e escuro (`--bg-surface`, `--text-main`, `--primary-500`), apresentando contraste acessível (WCAG AA). |

---

## 3. Máquina de Estados do Cronômetro

```text
               ┌──────────────┐
               │     IDLE     │
               └──────┬───────┘
                      │ Iniciar Lição (startLesson)
                      ▼
               ┌──────────────┐
        ┌─────►│   RUNNING    │◄─────┐
        │      └──────┬───────┘      │
 Retomar│             │ Pausar       │ Retomar
(resume)│             ▼ (pause)      │ (resume)
        │      ┌──────────────┐      │
        └──────┤    PAUSED    ├──────┘
               └──────┬───────┘
                      │
        ┌─────────────┴─────────────┐
        │ Concluir Lição            │ Descartar / Cancelar
        ▼                           ▼
 ┌──────────────┐            ┌──────────────┐
 │  COMPLETED   │            │  CANCELLED   │
 │ (Persistido) │            │ (Descartado) │
 └──────────────┘            └──────────────┘
```

---

## 4. Esquema de Banco de Dados (PostgreSQL)

Tabela que armazena o histórico consolidado de sessões de estudo realizadas:

```sql
-- Tabela: study_sessions (Sessões de Estudo & Lições do Cronômetro)
CREATE TABLE study_sessions (
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

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_subject_id ON study_sessions(subject_id);
CREATE INDEX idx_study_sessions_task_id ON study_sessions(task_id);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at DESC);
```

---

## 5. Contratos de API REST (OpenSpec)

### 5.1 Registrar Nova Sessão de Estudo Concluída
- **Rota**: `POST /api/v1/study-sessions`
- **Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Payload de Envio (Request Body)**:
  ```json
  {
    "subject_id": 1,
    "task_id": 2,
    "lesson_title": "Resolução de Exercícios — Integrais Definidas",
    "duration_seconds": 2700,
    "started_at": "2026-09-22T14:00:00Z",
    "ended_at": "2026-09-22T14:45:00Z"
  }
  ```
- **Resposta de Sucesso (`201 Created`)**:
  ```json
  {
    "sucesso": true,
    "mensagem": "Sessão de estudos registrada com sucesso!",
    "sessao": {
      "id": 42,
      "user_id": 1,
      "subject_id": 1,
      "task_id": 2,
      "lesson_title": "Resolução de Exercícios — Integrais Definidas",
      "duration_seconds": 2700,
      "started_at": "2026-09-22T14:00:00Z",
      "ended_at": "2026-09-22T14:45:00Z",
      "created_at": "2026-09-22T14:45:01Z"
    }
  }
  ```

### 5.2 Listar Sessões de Estudo do Usuário
- **Rota**: `GET /api/v1/study-sessions?subject_id={id}&limit=20`
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "sucesso": true,
    "total_seconds": 7500,
    "total_sessions": 3,
    "sessoes": [ ... ]
  }
  ```

---

## 6. Persistência de Estado no Cliente (`localStorage`)

Para garantir sobrevivência a recarregamentos acidentais de página e transições de rotas, o estado ativo é armazenado na chave `edutrack_active_timer`:

```json
{
  "isActive": true,
  "isPaused": false,
  "isMinimized": false,
  "subjectId": 1,
  "taskId": 2,
  "lessonTitle": "Resolução de Exercícios — Integrais Definidas",
  "startTimestamp": 1790092800000,
  "pausedTimestamp": null,
  "accumulatedSeconds": 1425,
  "initialDate": "2026-09-22T14:00:00.000Z"
}
```
