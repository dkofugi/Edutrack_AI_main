# Catálogo de Especificações — OpenSpec (EduTrack AI)

Bem-vindo ao repositório de especificações técnicas do **EduTrack AI**, estruturado conforme a **Metodologia OpenSpec (Spec-Driven Development)**.

---

## 📚 Índice de Especificações

| Documento | Foco / Domínio | Descrição |
| :--- | :--- | :--- |
| 📄 [`openspec_methodology.md`](./openspec_methodology.md) | **Metodologia** | Princípios do Spec-Driven Development, ciclo de vida das especificações e matriz de rastreabilidade. |
| 📄 [`study_session_timer_spec.md`](./study_session_timer_spec.md) | **Feature: Cronômetro** | Especificação técnica do Cronômetro de Lição em tempo real e sessões de estudo (`study_sessions`). |
| 📄 [`priority_carousel_spec.md`](./priority_carousel_spec.md) | **Feature: Carrossel Prioridade** | Especificação técnica do Carrossel de Recomendação de Prioridade no Dashboard. |
| 📄 [`frontend_spec.md`](./frontend_spec.md) | **Frontend & UI** | Arquitetura client-side (SPA), componentes visuais, layout widescreen/mobile, temas e tratamento HTTP. |
| 📄 [`backend_spec.md`](./backend_spec.md) | **Backend & API** | Arquitetura recomendada em Python (FastAPI), autenticação JWT e endpoints REST. |
| 📄 [`database_schema.sql`](./database_schema.sql) | **Banco de Dados DDL** | Script executável consolidado para PostgreSQL 15+ com todas as tabelas, índices e triggers. |
| 📄 [`api_contracts.json`](./api_contracts.json) | **Contratos de API** | Especificação OpenAPI 3.1 formal dos endpoints e esquemas de dados. |
| 📄 [`schema_usuarios.sql`](./schema_usuarios.sql) | **Autenticação DDL** | Esquema específico da tabela de autenticação e tokens de recuperação. |

---

## 🎯 Como Utilizar as Especificações

1. **Para Novas Funcionalidades**: Comece sempre redigindo ou atualizando a especificação correspondente em `/spec` antes de programar.
2. **Para Testes Automatizados**: A suíte em `/tests` valida os contratos definidos nestes documentos.
3. **Para Integração de Banco**: Execute `database_schema.sql` em qualquer instância PostgreSQL para obter a estrutura completa pronta para produção.
