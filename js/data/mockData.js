/**
 * EduTrack AI — Dados Iniciais Mockados
 * Esquema alinhado ao PostgreSQL em snake_case:
 * - users
 * - subjects
 * - academic_tasks
 */

export const initialMockData = {
  currentUser: {
    id: 1,
    name: "Ana Clara Silva",
    email: "aluno@edutrack.ai"
  },

  subjects: [
    {
      id: 1,
      user_id: 1,
      name: "Cálculo Diferencial e Integral I",
      professor: "Prof. Dr. Ricardo Santos",
      workload_hours: 80,
      description: "Estudo de limites, derivadas, regras de integração e aplicações em taxas de variação.",
      start_date: "2026-08-10",
      end_date: "2026-12-15",
      color: "#10b981"
    },
    {
      id: 2,
      user_id: 1,
      name: "Algoritmos e Estruturas de Dados",
      professor: "Profa. Camila Duarte",
      workload_hours: 72,
      description: "Complexidade assintótica, listas encadeadas, árvores binárias, grafos e algoritmos de busca.",
      start_date: "2026-08-12",
      end_date: "2026-12-18",
      color: "#059669"
    },
    {
      id: 3,
      user_id: 1,
      name: "Inteligência Artificial e Machine Learning",
      professor: "Prof. Marcos Lima",
      workload_hours: 60,
      description: "Fundamentos de aprendizado supervisionado, redes neurais e processamento de linguagem natural.",
      start_date: "2026-08-15",
      end_date: "2026-12-20",
      color: "#34d399"
    },
    {
      id: 4,
      user_id: 1,
      name: "Banco de Dados e Engenharia de Dados",
      professor: "Profa. Juliana Melo",
      workload_hours: 64,
      description: "Modelagem relacional, álgebra relacional, normalização, SQL avançado e arquiteturas NoSQL.",
      start_date: "2026-08-11",
      end_date: "2026-12-14",
      color: "#0ea5e9"
    }
  ],

  academic_tasks: [
    {
      id: 1,
      subject_id: 1,
      user_id: 1,
      title: "Lista de Exercícios — Derivadas Parciais",
      description: "Resolver os exercícios 1 a 25 do capítulo 4 do livro Stewart.",
      due_date: "2026-09-15",
      status: "completed"
    },
    {
      id: 2,
      subject_id: 1,
      user_id: 1,
      title: "Simulado P1 — Integrais Definidas",
      description: "Revisão com questões de provas anteriores do departamento.",
      due_date: "2026-09-22",
      status: "in_progress"
    },
    {
      id: 3,
      subject_id: 2,
      user_id: 1,
      title: "Implementação da Árvore AVL balanceada",
      description: "Código em Python com rotações à esquerda, direita e testes de inserção.",
      due_date: "2026-09-18",
      status: "in_progress"
    },
    {
      id: 4,
      subject_id: 2,
      user_id: 1,
      title: "Artigo sobre Grafos de Fluxo Máximo",
      description: "Leitura e resumo crítico do algoritmo Ford-Fulkerson.",
      due_date: "2026-10-02",
      status: "pending"
    },
    {
      id: 5,
      subject_id: 3,
      user_id: 1,
      title: "Fine-Tuning de Modelo de Classificação",
      description: "Treinar pipeline com dataset IMDB e avaliar matriz de confusão e F1-score.",
      due_date: "2026-09-28",
      status: "pending"
    },
    {
      id: 6,
      subject_id: 4,
      user_id: 1,
      title: "Diagrama E-R do Projeto Acadêmico",
      description: "Normalização até a 3ª Forma Normal e script DDL PostgreSQL.",
      due_date: "2026-09-12",
      status: "completed"
    }
  ],

  study_sessions: [
    {
      id: 1,
      user_id: 1,
      subject_id: 1,
      task_id: 1,
      lesson_title: "Lista de Exercícios — Derivadas Parciais",
      duration_seconds: 3000, // 50 minutos
      started_at: "2026-09-14T14:00:00Z",
      ended_at: "2026-09-14T14:50:00Z",
      created_at: "2026-09-14T14:50:00Z"
    },
    {
      id: 2,
      user_id: 1,
      subject_id: 2,
      task_id: 3,
      lesson_title: "Implementação da Árvore AVL balanceada",
      duration_seconds: 4500, // 1h 15m
      started_at: "2026-09-17T16:00:00Z",
      ended_at: "2026-09-17T17:15:00Z",
      created_at: "2026-09-17T17:15:00Z"
    }
  ]
};
