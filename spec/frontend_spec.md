# EduTrack AI — Especificação Técnica de Frontend & Interface (OpenSpec)

Este documento define as diretrizes de arquitetura de **Frontend**, componentes de interface, reatividade, padrões visuais e gerenciamento de estado da aplicação **EduTrack AI**, aderente à **Metodologia OpenSpec**.

---

## 1. Visão Geral da Arquitetura Frontend

- **Tecnologias**: HTML5 Semântico, CSS3 Moderno com CSS Variables, Vanilla JavaScript Modular (ES Modules nativos).
- **Abordagem de Renderização**: Single-Page Application (SPA) client-side leve, sem dependência de bundlers pesados, permitindo execução instantânea e direta.
- **Padrão de Navegação**: Router baseado em hash/eventos customizados com injeção de views no elemento `#main-content`.
- **Gerenciamento de Estado**: Store centralizada reativa (`store.js`) com persistência em `localStorage` e suporte a observadores (`subscribe / notify`).

---

## 2. Layout & Responsividade (Desktop Widescreen & Mobile)

A interface utiliza uma estratégia de layout híbrida e adaptativa:

```text
  TELAS DESKTOP / NOTEBOOK (>= 768px)            TELAS MÓVEIS / SMARTPHONE (< 768px)
┌───────────────┬──────────────────────────────┐ ┌────────────────────────────────────┐
│ DESKTOP       │ MAIN CONTENT AREA            │ │ MOBILE HEADER                      │
│ SIDEBAR       │                              │ ├────────────────────────────────────┤
│ (Fixa 250px)  │ • Dashboard Widescreen       │ │ MAIN CONTENT AREA                  │
│               │ • Grid Multi-colunas         │ │ (Cards em coluna única)            │
│ • Logo/Marca  │ • Detalhes em 2 colunas      │ │                                    │
│ • Navegação   │ • Modais Centralizados       │ │                                    │
│ • Ações       │                              │ ├────────────────────────────────────┤
│ • Perfil      │ ┌──────────────────────────┐ │ │ [⏱ CRONÔMETRO FLUTUANTE]           │
│ • Tema        │ │ ⏱ CRONÔMETRO FLUTUANTE   │ │ ├────────────────────────────────────┤
│ • Logout      │ │ (Canto Inferior Direito) │ │ │ BOTTOM NAVIGATION BAR              │
└───────────────┴─┴──────────────────────────┴─┘ └────────────────────────────────────┘
```

### 2.1 Breakpoints de Mídia
- **Mobile**: `< 768px` (Sidebar oculta, Header compacto ativo, Bottom Navigation Bar ativa).
- **Tablet & Desktop**: `>= 768px` (Sidebar visível e fixa à esquerda, largura 250px, Bottom Bar oculta).
- **Desktop Widescreen**: `>= 1024px` e `>= 1280px` (Grids em 3 colunas, gráficos ampliados).

---

## 3. Catálogo de Componentes de Interface (UI Components)

| Componente | Elemento/Classe | Descrição e Comportamento |
| :--- | :--- | :--- |
| **Desktop Sidebar** | `<aside class="desktop-sidebar">` | Menu vertical fixo à esquerda com logo, links com estado ativo, botões de ação rápida e card de perfil. |
| **Mobile Header** | `<header class="app-header">` | Barra superior para dispositivos móveis com marca, botão de alternância de tema e atalho do cronômetro. |
| **Bottom Navigation** | `<nav class="bottom-nav">` | Barra de navegação inferior com abas táteis para acesso rápido no celular. |
| **Floating Timer** | `#study-timer-container` | Widget flutuante de cronômetro com display digital `HH:MM:SS`, status de pulso, pausar/retomar, minimizar e concluir. |
| **Botões (Buttons)** | `.btn .btn-primary, .btn-secondary` | Botões padronizados com microinterações, sombra suave e estados hover/active. |
| **Modais Centralizados** | `.modal-overlay .modal-card` | Diálogos modais com backdrop escurecido, acessíveis por teclado (ESC), para criação de matérias, tarefas e lições. |
| **Cards de Estatística** | `.stat-card` | Cartões de métricas ampliadas (Disciplinas, Tempo Focado, Pendentes, Concluídas). |
| **Barras de Progresso** | `.progress-container .progress-bar` | Indicador visual de percentual (0 a 100%) com transição suave CSS. |
| **Gráficos SVG** | `#dashboard-chart-container` | Gráfico interativo responsivo renderizado nativamente em SVG (alternância entre Barras e Donut). |
| **Notificações Toast** | `#toast-container .toast` | Alertas flutuantes automáticos com fechamento em 3.2s para feedback de operações CRUD. |

---

## 4. Sistema de Cores & Temas (Light & Dark Mode)

O sistema de temas utiliza CSS Custom Properties declaradas em `css/variables.css`:

```css
:root {
  --primary-500: #10b981; /* Verde Esmeralda Suave */
  --primary-600: #059669;
  --bg-base: #f8fafc;
  --bg-surface: #ffffff;
  --text-main: #0f172a;
  --border-color: #e2e8f0;
}

[data-theme="dark"] {
  --bg-base: #090d16;
  --bg-surface: #111827;
  --text-main: #f8fafc;
  --border-color: #1f2937;
}
```

- **Persistência**: Armazenado em `localStorage.getItem("edutrack_theme")`.
- **Detecção do Sistema**: Caso não haja preferência salva, avalia `window.matchMedia("(prefers-color-scheme: dark)")`.

---

## 5. Tratamento de Requisições HTTP Seguras (`_fetchJson`)

Para evitar erros críticos de parsing no frontend como `SyntaxError: Unexpected token '<'`, todas as requisições passam pela função controlada `_fetchJson()`:
1. Validação estrita do header `Content-Type: application/json`.
2. Tratamento defensivo caso o backend retorne HTML ou páginas de erro inesperadas.
3. Mensagens de erro amigáveis exibidas no Toast global sem quebrar o fluxo da aplicação.

## 6. Novas Funcionalidades (OpenSpec V2)
### 6.1 Modal de Edição de Perfil
- Acessível através de clique no card do usuário na sidebar (.sidebar-user-card).
- Permite alteração de dados do usuário (ex: Nome).
- Persiste as alterações e atualiza os dados na UI e backend (ou localStorage).

### 6.2 Botão Iniciar Lição Agora
- O botão #sidebar-btn-start-lesson e #btn-header-start-lesson devem exibir o widget flutuante de cronômetro (#study-timer-container).

### 6.3 Busca e Filtros Avançados
- Adição de input de texto e selects (status e data) nas páginas de listagem.
- A UI de tarefas e disciplinas deve filtrar dinamicamente os itens com base nos critérios selecionados.
