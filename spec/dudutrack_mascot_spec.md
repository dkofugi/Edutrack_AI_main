# EduTrack AI — Especificação Técnica: Assistente DuduTrack (Mascote Funcional)

Este documento especifica o assistente virtual **DuduTrack** (mascote funcional em formato de cachorro cartoon marrom claro) para o Dashboard do **EduTrack AI**, em total conformidade com a **Metodologia OpenSpec** do projeto.

---

## 1. Visão Geral do Recurso

O **DuduTrack** é um assistente virtual contextual exibido no topo do Dashboard. O seu objetivo é humanizar e tornar mais tangível a inteligência analítica do sistema, apresentando mensagens baseadas estritamente em dados reais do estudante (prazos de tarefas, desvios de tempo real vs. estimado, carrossel de prioridades, metas atingidas e saudações contextuais).

> **Nota de Design e Filosofia**: A aparência do DuduTrack é uma ilustração vetorial simples (SVG embutido + CSS puro), alinhada com a arquitetura leve e sem dependências do EduTrack AI (Vanilla JavaScript ES6+ e CSS puro). Não são utilizadas bibliotecas externas de animação (como Lottie, GIF ou Canvas).

---

## 2. Pré-requisitos de Dados (Reaproveitamento de APIs Existentes)

O motor de decisão do DuduTrack consome dados já existentes no sistema, sem a necessidade de criar endpoints adicionais ou duplicar lógicas de cálculo:
- `GET /api/v1/insights` — Retorna os desvios de tempo real vs. estimado por disciplina (`severity: critico/atencao/info`).
- `GET /api/v1/notifications/pending` — Retorna tarefas pendentes com vencimento crítico (nas próximas 48 horas).
- **Ranking do Carrossel de Prioridades** (`js/priority-carousel.js` / `spec/priority_carousel_spec.md`).
- `calcular_progresso_ponderado` — Retorna o percentual de meta cumprida por disciplina e no geral.
- **Perfil do Usuário Autenticado** (`AUTH_SERVICE` / `store.getUserProfile()`).

---

## 3. Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-DUDU-01** | Componente Visual Isolado | Widget no topo do Dashboard composto por avatar SVG do DuduTrack (cachorro cartoon marrom claro) + balão de fala dinâmico. Deve ser implementado em `js/dudutrack.js` e `css/dudutrack.css` sem bibliotecas externas. |
| **RF-DUDU-02** | Motor de Decisão de Mensagem | Algoritmo determinístico que, ao carregar o Dashboard, avalia as fontes de dados em ordem estrita de prioridade e seleciona exatamente UMA mensagem para exibição. |
| **RF-DUDU-03** | Templates com Variáveis Reais | Todas as mensagens devem ser montadas a partir de templates com substituição de placeholders (`{nome}`, `{disciplina}`, `{dias}`, `{percentual}`, `{tarefa}`) por dados reais do usuário autenticado. |
| **RF-DUDU-04** | Estados Visuais do Avatar em CSS | O avatar deve possuir 4 estados visuais alternados via classes CSS: `idle` (balanço sutil de rabo), `falando` (exibição do balão com fade-in e slide), `feliz` (bounce festivo ao celebrar marcos), e `alerta` (shake sutil em avisos de prazo). |
| **RF-DUDU-05** | Ação Direta no Balão de Fala | Quando a mensagem referenciar uma tarefa específica (prazo crítico ou recomendação de prioridade), o balão deve exibir o botão *"Ver agora"* guiando o usuário à tela/tarefa correspondente. |
| **RF-DUDU-06** | Controle de Frequência de Sessão | Para evitar repetição incômoda, o sistema deve guardar em memória de sessão (`sessionStorage` ou variável em memória) a última categoria de mensagem exibida e variar o template entre carregamentos consecutivos. |

---

## 4. Ordem Estrita de Prioridade do Motor de Decisão (RF-DUDU-02)

Ao inicializar no Dashboard, a função `DuduTrack.decidirMensagem()` avalia os dados disponíveis e escolhe o primeiro critério satisfeito na ordem abaixo:

1. **Alerta de Prazo Crítico** (Notificação com tarefa vencendo em $\le 48\text{h}$)
2. **Insight de Desvio Crítico** (`severity == 'critico'`, desvio de tempo $\ge +50\%$)
3. **Insight de Desvio de Atenção** (`severity == 'atencao'`, desvio de tempo entre $+20\%$ e $+49\%$)
4. **Recomendação de Prioridade do Carrossel** (Primeiro item do carrossel de tarefas prioritárias)
5. **Celebração de Marco de Progresso** (Meta semanal $\ge 80\%$ atingida ou tarefa recentemente concluída)
6. **Incentivo / Inatividade Hoje** (Nenhuma sessão registrada no dia atual após as 17:00)
7. **Saudação Neutra Contextual** (Fallback padrão baseado no nome do usuário e horário)

---

## 5. Catálogo de Templates e Variáveis (RF-DUDU-03)

| Categoria | Exemplo de Template | Variáveis Preenchidas |
| :--- | :--- | :--- |
| **Alerta de Prazo** | *"Ei {nome}, a tarefa {tarefa} de {disciplina} vence em {dias} dia(s)! Já conseguiu adiantar?"* | `nome`, `tarefa`, `disciplina`, `dias` |
| **Insight Crítico** | *"Notei que você está levando {percentual}% a mais de tempo em {disciplina} do que planejou. Bora reorganizar?"* | `percentual`, `disciplina` |
| **Insight Atenção** | *"Seu ritmo em {disciplina} está um pouco acima do estimado ({percentual}%). Nada grave, só de olho!"* | `percentual`, `disciplina` |
| **Carrossel Prioridade** | *"Pensando no que fazer agora? Eu sugiro {tarefa} — é a que mais precisa de atenção hoje."* | `tarefa`, `disciplina` |
| **Celebração Marco** | *"Parabéns, {nome}! Você bateu {percentual}% da meta em {disciplina}! 🎉"* | `nome`, `percentual`, `disciplina` |
| **Incentivo Final do Dia** | *"Ainda dá tempo de estudar um pouco hoje, {nome}. Que tal 25 minutinhos?"* | `nome` |
| **Saudação Neutra** | *"Olá, {nome}! Pronto pra mais um dia de estudos? 🐾"* | `nome` |

---

## 6. Requisitos Não-Funcionais (RNF)

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-DUDU-01** | Responsividade Mobile | O widget e o balão de fala devem se adaptar perfeitamente a telas de smartphones ($\le 480\text{px}$) sem ultrapassar as margens (*overflow-x*) da tela. |
| **RNF-DUDU-02** | Zero Bibliotecas Externas | O avatar e os efeitos visuais devem utilizar apenas SVG inline e CSS `@keyframes` nativos. |
| **RNF-DUDU-03** | Resiliência / Fallback Amigável | Se as requisições de API falharem ou o usuário não possuir dados cadastrados, o DuduTrack exibe a saudação neutra padrão sem gerar exceções no console. |

---

## 7. Fora de Escopo

- Chamadas a APIs de LLM / IA generativa em tempo de execução.
- Animações pesadas (Lottie, GIF animado, arquivos externos MP4/Canvas).
- Persistência das mensagens visualizadas no PostgreSQL.
- Chat interativo bidirecional (digitação de texto pelo aluno nesta versão).
