# EduTrack AI — Especificação Técnica: Features Avançadas (OpenSpec)

Este documento especifica o módulo de **Advanced Insights**, **Relatórios Semanal em PDF** e **Alertas de Prazo** no **EduTrack AI**, em total conformidade com a **Metodologia OpenSpec**.

---

## 1. Visão Geral do Recurso

A fase final do projeto EduTrack AI transforma os dados de estudo acumulados (tempo real via `study_sessions`, tarefas acadêmicas e disciplinas) em insights acionáveis para o estudante, relatórios periódicos em formato PDF e notificações de prazos críticos.

> **Nota de Arquitetura**: Os "Insights com IA" no EduTrack AI referem-se a algoritmos estatísticos e analíticos em Python executados sobre os dados reais do próprio estudante (análise determinística de regras e faixas percentuais de desvio). Não há dependência de APIs de LLM ou IA generativa externa no runtime da aplicação.

---

## 2. Alteração de Esquema do Banco de Dados (PostgreSQL / SQLite)

Para permitir a comparação entre o tempo estimado e o tempo real de estudo, a tabela `academic_tasks` recebe o campo `estimated_minutes`:

```sql
-- Adiciona a coluna de tempo estimado em minutos para tarefas acadêmicas
ALTER TABLE academic_tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0;
```

---

## 3. Requisitos do Sistema

### 3.1 Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-INS-01** | Cálculo Estimado vs. Real | O sistema deve somar a duração real (`duration_seconds` de `study_sessions`) por disciplina e comparar com a soma do tempo estimado (`estimated_minutes`) das tarefas concluídas (`status = 'completed'`) daquela disciplina. |
| **RF-INS-02** | Geração de Recomendação Textual | O algoritmo deve avaliar o desvio percentual. Se o desvio for >= 20% acima ou abaixo do estimado, gerar recomendação textual e classificar em níveis de severidade (`info`, `atencao`, `critico`). |
| **RF-INS-03** | Endpoint de Insights | O endpoint `GET /api/v1/insights` deve retornar JSON estruturado com os dados e recomendações por disciplina para o usuário autenticado. |
| **RF-INS-04** | Exibição no Dashboard | Renderizar os insights retornados em cards interativos no Dashboard utilizando o design system existente do projeto (paleta verde `#10b981`). |
| **RF-PDF-01** | Gerador de Relatório Semanal em PDF | O módulo Python (`backend/pdf_report.py`) deve gerar um arquivo PDF binário contendo resumo do tempo estudado na semana, progresso ponderado por disciplina e os insights de desvio. |
| **RF-PDF-02** | Endpoint de Download do PDF | O endpoint `GET /api/v1/reports/weekly` deve disponibilizar o PDF gerado para download direto sob demanda com cabeçalho `Content-Type: application/pdf`. |
| **RF-NOTIF-01** | Alertas de Prazo In-App | O Dashboard deve identificar tarefas do usuário logado com `due_date` nas próximas 48 horas e status diferente de `completed`, exibindo banners/badges de alerta visual. |
| **RF-NOTIF-02** | Preparação para Push Notifications | O endpoint `GET /api/v1/notifications/pending` deve retornar a lista de alertas ativos em formato JSON padronizado para futura integração com serviços de Push. |

### 3.2 Requisitos Não-Funcionais (RNF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-INS-01** | Isolamento Multi-tenant | Todos os cálculos de insights, relatórios PDF e notificações devem filtrar estritamente pelos dados do usuário autenticado (`user_id`). |
| **RNF-INS-02** | Performance do PDF | O relatório PDF semanal deve ser gerado sob demanda em menos de 1.5 segundos sem bloquear a thread principal da API. |
| **RNF-INS-03** | Fallback para Zero Dados | Caso o usuário não possua sessões ou tarefas cadastradas, os endpoints devem retornar respostas informativas amigáveis em vez de erros 500 ou divisão por zero. |

---

## 4. Algoritmo de Regras de Insights (RF-INS-01 & RF-INS-02)

O cálculo do desvio de tempo por disciplina obedece à seguinte fórmula:

```
Desvio (%) = ((Tempo Real Minutos - Tempo Estimado Minutos) / Tempo Estimado Minutos) * 100
```

### Regras de Classificação:

1. **Sem dados suficientes** (`estimated_minutes == 0` ou sem sessões):
   - Severidade: `info`
   - Mensagem: *"Cadastre tarefas com tempo estimado e inicie sessões de estudo para gerar insights."*
2. **Dentro do esperado** (Desvio entre -19% e +19%):
   - Severidade: `info`
   - Mensagem: *"Ritmo excelente! O tempo investido em [Disciplina] está alinhado com o estimado."*
3. **Atenção por excesso** (Desvio entre +20% e +49%):
   - Severidade: `atencao`
   - Mensagem: *"Você está dedicando X% a mais de tempo em [Disciplina] do que o estimado. Avalie ajustar o planejamento."*
4. **Crítico por excesso** (Desvio >= +50%):
   - Severidade: `critico`
   - Mensagem: *"Alerta: O tempo real em [Disciplina] superou o estimado em X%. É recomendável revisar a complexidade das tarefas."*
5. **Economia de tempo** (Desvio <= -20%):
   - Severidade: `info`
   - Mensagem: *"Você concluiu as tarefas de [Disciplina] X% mais rápido do que o previsto."*

---

## 5. Contratos de API REST (OpenSpec)

### 5.1 Obter Insights do Usuário
- **Rota**: `GET /api/v1/insights`
- **Headers**: `Authorization: Bearer <jwt_token>` ou cookie de sessão
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "sucesso": true,
    "total_disciplinas_analisadas": 2,
    "insights": [
      {
        "subject_id": 1,
        "subject_name": "Cálculo Diferencial",
        "real_minutes": 180,
        "estimated_minutes": 120,
        "deviation_percent": 50.0,
        "severity": "critico",
        "recommendation": "Alerta: O tempo real em Cálculo Diferencial superou o estimado em 50.0%. É recomendável revisar a complexidade das tarefas."
      }
    ]
  }
  ```

### 5.2 Download do Relatório Semanal em PDF
- **Rota**: `GET /api/v1/reports/weekly`
- **Headers**: `Authorization: Bearer <jwt_token>` ou cookie de sessão
- **Resposta de Sucesso (`200 OK`)**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="relatorio_semanal_edutrack.pdf"`

### 5.3 Notificações Pendentes (Endpoint Preparatório para Push)
- **Rota**: `GET /api/v1/notifications/pending`
- **Headers**: `Authorization: Bearer <jwt_token>` ou cookie de sessão
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "sucesso": true,
    "total_alertas": 1,
    "alertas": [
      {
        "task_id": 15,
        "title": "Entrega do Trabalho Prático",
        "subject_name": "Estrutura de Dados",
        "due_date": "2026-10-03T23:59:00Z",
        "hours_remaining": 38,
        "severity": "urgente"
      }
    ]
  }
  ```

---

## 6. Fora de Escopo
- Utilização de APIs de IA Generativa externas em runtime.
- Envio real de Web Push Notifications (apenas contrato JSON preparado).
- Cronjob/Agendador automático no backend (PDF gerado sob demanda via requisição HTTP GET).
