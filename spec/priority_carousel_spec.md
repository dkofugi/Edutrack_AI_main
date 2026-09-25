# EduTrack AI — Especificação Técnica: Carrossel de Recomendação de Prioridade (OpenSpec)

## 1. Visão Geral do Recurso

O estudante enfrenta paralisia de decisão ao abrir o Dashboard com várias tarefas
pendentes de disciplinas diferentes. Este recurso resolve isso recomendando
automaticamente qual tarefa estudar agora, em formato de carrossel dinâmico.

## 2. Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
|---|---|---|
| RF-PRIO-01 | Cálculo de prioridade | Ranquear tarefas pendentes/em andamento por: proximidade do prazo, peso/carga horária da disciplina (reaproveitar lógica de `advanced_metrics.py`) e tempo parado sem interação. |
| RF-PRIO-02 | Exibição em carrossel | Mostrar as top 3-5 tarefas ranqueadas no Dashboard, com a nº1 centralizada/destacada e as demais menores/esmaecidas nas laterais. |
| RF-PRIO-03 | Navegação | Permitir avançar entre os cards via setas (desktop) e swipe (mobile), usando `scroll-snap` em CSS puro, sem biblioteca externa. |
| RF-PRIO-04 | Badge de urgência | Cada card exibe indicador visual de urgência (🔴 Urgente / 🟡 Em breve / 🟢 Tranquilo) conforme o prazo. |
| RF-PRIO-05 | Ação rápida | Botão "Começar agora" em cada card, que aciona o cronômetro já existente (`js/timer.js`) direto na disciplina/tarefa daquele card. |
| RF-PRIO-06 | Recalculo dinâmico | O ranking deve ser recalculado automaticamente ao concluir uma tarefa, editar prazo, ou ao recarregar o Dashboard. |

## 3. Requisitos Não-Funcionais (RNF)

| ID | Requisito | Descrição |
|---|---|---|
| RNF-PRIO-01 | Sem dependência nova | Não deve exigir tabela nova no banco nem endpoint novo — usar os dados já existentes de `subjects`/`academic_tasks`. |
| RNF-PRIO-02 | Performance | Cálculo do ranking deve ser feito no frontend (JS puro), sem chamada adicional à API. |
| RNF-PRIO-03 | Aderência visual | Respeitar tema claro/escuro e a paleta verde já definida em `css/variables.css`. |

## 4. Fora de Escopo (nesta versão)
- Machine learning ou IA real para a priorização (usar apenas fórmula de pontuação por regras).
- Persistência de preferências de priorização por usuário.
