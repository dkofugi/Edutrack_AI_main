/**
 * EduTrack AI — 6. Tela de Detalhe da Disciplina
 * Exibe informações detalhadas da matéria, barra de progresso consolidada,
 * filtros por status e listagem das tarefas vinculadas com botão de criar nova tarefa.
 */

import { store } from "../store.js";
import { router } from "../router.js";
import { TasksView } from "./tasksView.js";

export const SubjectDetailView = {
  currentFilter: "all", // "all", "pending", "in_progress", "completed"

  render(container, params = {}) {
    const subjectId = params.subject_id;
    const subject = store.getSubjectById(subjectId);

    if (!subject) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Disciplina não encontrada</div>
          <p class="empty-state-text">A disciplina solicitada pode ter sido removida.</p>
          <button class="btn btn-primary btn-sm" id="btn-err-back">Voltar ao Dashboard</button>
        </div>
      `;
      document.getElementById("btn-err-back").addEventListener("click", () => router.navigate("dashboard"));
      return;
    }

    const tasks = store.getTasks(subject.id, this.currentFilter);
    const allTasks = store.getTasks(subject.id);
    const progress = store.getSubjectProgress(subject.id);
    const formattedStart = subject.start_date ? new Date(subject.start_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const formattedEnd = subject.end_date ? new Date(subject.end_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

    container.innerHTML = `
      <div class="subject-detail-view">
        <!-- Navegação Voltar -->
        <div class="screen-header">
          <button class="back-btn" id="btn-back-from-detail">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Voltar
          </button>
          <button class="btn btn-primary btn-sm" id="btn-new-task-from-detail">
            + Nova Tarefa
          </button>
        </div>

        <!-- Layout Desktop em 2 Colunas -->
        <div class="detail-desktop-grid">
          <!-- Coluna 1: Informações e Progresso da Disciplina -->
          <div class="detail-hero-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <h1 class="detail-hero-title">${subject.name}</h1>
              <span class="badge" style="background: var(--primary-100); color: var(--primary-800); font-size: 0.8rem;">
                ${subject.workload_hours}h
              </span>
            </div>

            <div class="detail-hero-meta">
              <div><strong>Professor(a):</strong> ${subject.professor || 'Não informado'}</div>
              <div><strong>Período:</strong> ${formattedStart} até ${formattedEnd}</div>
              ${subject.description ? `<div style="margin-top: 4px; color: var(--text-muted); font-size: 0.83rem;">${subject.description}</div>` : ''}
            </div>

            <!-- Barra de Progresso das Tarefas -->
            <div class="detail-progress-box">
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600;">
                <span>Progresso Acadêmico</span>
                <span style="color: var(--primary-600);">${progress}% concluído</span>
              </div>
              <div class="progress-container" style="height: 10px;">
                <div class="progress-bar" style="width: ${progress}%; background: ${subject.color || 'var(--primary-500)'};"></div>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-align: right;">
                ${allTasks.filter(t => t.status === 'completed').length} de ${allTasks.length} tarefas concluídas
              </div>
            </div>
          </div>

          <!-- Coluna 2: Filtros e Lista de Tarefas -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h2 style="font-size: 1.15rem; font-weight: 700;">Tarefas da Matéria</h2>
              <span class="text-xs" style="color: var(--text-muted); font-weight: 600;">
                ${tasks.length} exibida(s)
              </span>
            </div>

            <div class="tasks-filter-bar">
              <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                Todas (${allTasks.length})
              </button>
              <button class="filter-tab ${this.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
                Pendentes (${allTasks.filter(t => t.status === 'pending').length})
              </button>
              <button class="filter-tab ${this.currentFilter === 'in_progress' ? 'active' : ''}" data-filter="in_progress">
                Em Andamento (${allTasks.filter(t => t.status === 'in_progress').length})
              </button>
              <button class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                Concluídas (${allTasks.filter(t => t.status === 'completed').length})
              </button>
            </div>

            <!-- Lista de Tarefas -->
            <div class="tasks-list" id="tasks-list-container">
              ${this.renderTasksList(tasks, subject)}
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos
    document.getElementById("btn-back-from-detail").addEventListener("click", () => {
      router.back();
    });

    document.getElementById("btn-new-task-from-detail").addEventListener("click", () => {
      TasksView.openTaskModal(null, subject.id, () => {
        this.render(container, params);
      });
    });

    // Filtros por status
    container.querySelectorAll(".filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        this.currentFilter = tab.getAttribute("data-filter");
        this.render(container, params);
      });
    });

    this.bindTaskActions(container, subject);
  },

  renderTasksList(tasks, subject) {
    if (tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <div class="empty-state-title">Nenhuma tarefa encontrada</div>
          <div class="empty-state-text">Você não possui tarefas ${this.currentFilter !== 'all' ? 'neste filtro' : 'nesta disciplina'}.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-task">
            + Adicionar Nova Tarefa
          </button>
        </div>
      `;
    }

    const statusLabels = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluída"
    };

    return tasks.map(task => {
      const isCompleted = task.status === "completed";
      const formattedDue = task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo';

      return `
        <div class="task-item" data-id="${task.id}">
          <div class="task-item-header">
            <div class="task-title-group">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                data-id="${task.id}" 
                ${isCompleted ? 'checked' : ''} 
                title="Alternar conclusão"
              />
              <span class="task-title ${isCompleted ? 'completed' : ''}">${task.title}</span>
            </div>
            <span class="badge badge-${task.status}">
              ${statusLabels[task.status] || task.status}
            </span>
          </div>

          ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}

          <div class="task-footer">
            <span class="task-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Entrega: ${formattedDue}
            </span>

            <div class="task-actions">
              <button class="btn btn-secondary btn-sm btn-start-task-lesson" data-id="${task.id}" title="Iniciar Lição com Cronômetro" style="padding: 4px 10px; font-size: 0.75rem; gap: 4px; color: var(--primary-600); border-color: var(--primary-300);">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Iniciar Lição</span>
              </button>
              <button class="icon-btn-action btn-edit-task" data-id="${task.id}" title="Editar Tarefa">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="icon-btn-action danger btn-delete-task" data-id="${task.id}" title="Excluir Tarefa">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  bindTaskActions(container, subject) {
    // Checkbox alternar conclusão rápida
    container.querySelectorAll(".task-checkbox").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        store.toggleTaskStatus(id);
        const updated = store.getTaskById(id);
        if (updated && updated.status === "completed") {
          window.appToast("Tarefa marcada como concluída! 🎉", "success");
        } else {
          window.appToast("Tarefa reaberta como pendente.", "warning");
        }
        this.render(container, { subject_id: subject.id });
      });
    });

    // Iniciar Lição no Cronômetro
    container.querySelectorAll(".btn-start-task-lesson").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const task = store.getTaskById(id);
        if (task && window.studyTimer) {
          window.studyTimer.startLesson({
            subjectId: subject.id,
            taskId: task.id,
            lessonTitle: task.title
          });
        }
      });
    });

    // Editar tarefa
    container.querySelectorAll(".btn-edit-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const task = store.getTaskById(id);
        if (task) {
          TasksView.openTaskModal(task, subject.id, () => {
            this.render(container, { subject_id: subject.id });
          });
        }
      });
    });

    // Excluir tarefa
    container.querySelectorAll(".btn-delete-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Deseja realmente excluir esta tarefa?")) {
          store.deleteTask(id);
          window.appToast("Tarefa removida com sucesso.", "danger");
          this.render(container, { subject_id: subject.id });
        }
      });
    });

    const emptyAddBtn = container.querySelector("#btn-empty-add-task");
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener("click", () => {
        TasksView.openTaskModal(null, subject.id, () => {
          this.render(container, { subject_id: subject.id });
        });
      });
    }
  }
};
