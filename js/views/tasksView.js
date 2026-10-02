/**
 * EduTrack AI — 7. Tela & Modal de Tarefas Acadêmicas
 * Criar e editar tarefas com campos:
 * - subject_id (disciplina vinculada)
 * - título
 * - descrição
 * - data prevista (due_date)
 * - status (pending, in_progress, completed)
 */

import { store } from "../store.js";
import { router } from "../router.js";

export const TasksView = {
  currentSearch: "",
  currentStatus: "",
  currentDate: "",
  /**
   * Renderiza visão geral de todas as tarefas acadêmicas
   */
  render(container) {
    const tasks = store.getTasks();
    const subjects = store.getSubjects();

    
    let filteredTasks = tasks;
    if (this.currentSearch) {
      filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(this.currentSearch.toLowerCase()));
    }
    if (this.currentStatus) {
      filteredTasks = filteredTasks.filter(t => t.status === this.currentStatus);
    }
    if (this.currentDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      filteredTasks = filteredTasks.filter(t => {
        if (!t.due_date) return false;
        const [y, m, d] = t.due_date.split('-');
        const due = new Date(y, m - 1, d);
        if (this.currentDate === 'today') return due.getTime() === today.getTime();
        if (this.currentDate === 'week') return due >= today && due <= nextWeek;
        if (this.currentDate === 'overdue') return due < today && t.status !== 'completed';
        return true;
      });
    }

    container.innerHTML = `
      <div class="tasks-view" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="screen-header">
          <button class="back-btn" id="btn-back-from-all-tasks">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Voltar
          </button>
          <button class="btn btn-primary btn-sm" id="btn-create-task-global">
            + Nova Tarefa
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <h1 style="font-size: 1.35rem; font-weight: 800;">Todas as Tarefas</h1>
            <p class="text-sm">Controle geral de atividades e prazos de entrega</p>
          </div>
          <span class="badge badge-pending">${tasks.filter(t => t.status !== 'completed').length} Pendentes</span>
        </div>

        
        <div class="filters-bar" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <input type="text" id="task-search-input" class="form-input" placeholder="Buscar por título..." style="flex: 1; min-width: 200px;" value="${this.currentSearch || ''}" />
          <select id="task-status-filter" class="form-select" style="width: 140px;">
            <option value="">Todos os status</option>
            <option value="pending" ${this.currentStatus === 'pending' ? 'selected' : ''}>Pendentes</option>
            <option value="in_progress" ${this.currentStatus === 'in_progress' ? 'selected' : ''}>Em andamento</option>
            <option value="completed" ${this.currentStatus === 'completed' ? 'selected' : ''}>Concluídas</option>
          </select>
          <select id="task-date-filter" class="form-select" style="width: 140px;">
            <option value="">Qualquer data</option>
            <option value="today" ${this.currentDate === 'today' ? 'selected' : ''}>Hoje</option>
            <option value="week" ${this.currentDate === 'week' ? 'selected' : ''}>Próximos 7 dias</option>
            <option value="overdue" ${this.currentDate === 'overdue' ? 'selected' : ''}>Atrasadas</option>
          </select>
        </div>

        <div class="tasks-list" id="all-tasks-container">
          ${this.renderAllTasksList(filteredTasks, subjects)}
        </div>
      </div>
    `;

    document.getElementById("btn-back-from-all-tasks").addEventListener("click", () => router.back());
    document.getElementById("btn-create-task-global").addEventListener("click", () => {
      this.openTaskModal(null, null, () => this.render(container));
    });

    this.bindGlobalTaskEvents(container);

    const searchInput = document.getElementById("task-search-input");
    const statusFilter = document.getElementById("task-status-filter");
    const dateFilter = document.getElementById("task-date-filter");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            this.currentSearch = e.target.value;
            this.renderFilteredTasks(container);
        });
    }
    if (statusFilter) {
        statusFilter.addEventListener("change", (e) => {
            this.currentStatus = e.target.value;
            this.renderFilteredTasks(container);
        });
    }
    if (dateFilter) {
        dateFilter.addEventListener("change", (e) => {
            this.currentDate = e.target.value;
            this.renderFilteredTasks(container);
        });
    }

  },

  
  renderFilteredTasks(container) {
    const tasks = store.getTasks();
    const subjects = store.getSubjects();
    let filteredTasks = tasks;
    if (this.currentSearch) {
      filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(this.currentSearch.toLowerCase()));
    }
    if (this.currentStatus) {
      filteredTasks = filteredTasks.filter(t => t.status === this.currentStatus);
    }
    if (this.currentDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      filteredTasks = filteredTasks.filter(t => {
        if (!t.due_date) return false;
        const [y, m, d] = t.due_date.split('-');
        const due = new Date(y, m - 1, d);
        if (this.currentDate === 'today') return due.getTime() === today.getTime();
        if (this.currentDate === 'week') return due >= today && due <= nextWeek;
        if (this.currentDate === 'overdue') return due < today && t.status !== 'completed';
        return true;
      });
    }
    const listContainer = container.querySelector('#all-tasks-container');
    if (listContainer) {
        listContainer.innerHTML = this.renderAllTasksList(filteredTasks, subjects);
        this.bindGlobalTaskEvents(container);
    }
  },

  renderAllTasksList(tasks, subjects) {
    if (tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <div class="empty-state-title">Nenhuma tarefa pendente</div>
          <div class="empty-state-text">Parabéns! Você está com todos os seus prazos acadêmicos em dia.</div>
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
      const subject = subjects.find(s => s.id === task.subject_id) || { name: "Disciplina", color: "#10b981" };
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
              />
              <div>
                <span class="task-title ${isCompleted ? 'completed' : ''}">${task.title}</span>
                <div style="font-size: 0.75rem; color: ${subject.color}; font-weight: 600; margin-top: 2px;">
                  ● ${subject.name}
                </div>
              </div>
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
              ${formattedDue}
            </span>

            <div class="task-actions">
              <button class="btn btn-secondary btn-sm btn-start-task-lesson" data-id="${task.id}" data-subject-id="${task.subject_id}" title="Iniciar Lição com Cronômetro" style="padding: 4px 10px; font-size: 0.75rem; gap: 4px; color: var(--primary-600); border-color: var(--primary-300);">
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

  bindGlobalTaskEvents(container) {
    container.querySelectorAll(".task-checkbox").forEach(chk => {
      chk.addEventListener("change", async (e) => {
        const id = e.target.getAttribute("data-id");
        await store.toggleTaskStatus(id);
        const updated = store.getTaskById(id);
        if (updated && updated.status === "completed") {
          window.appToast("Tarefa concluída! 🎉", "success");
        }
        this.render(container);
      });
    });

    container.querySelectorAll(".btn-start-task-lesson").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const subjectId = btn.getAttribute("data-subject-id");
        const task = store.getTaskById(id);
        if (task && window.studyTimer) {
          window.studyTimer.startLesson({
            subjectId: subjectId || task.subject_id,
            taskId: task.id,
            lessonTitle: task.title
          });
        }
      });
    });

    container.querySelectorAll(".btn-edit-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const task = store.getTaskById(id);
        if (task) {
          this.openTaskModal(task, null, () => this.render(container));
        }
      });
    });

    container.querySelectorAll(".btn-delete-task").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Deseja realmente excluir esta tarefa?")) {
          await store.deleteTask(id);
          window.appToast("Tarefa excluída.", "danger");
          this.render(container);
        }
      });
    });
  },

  /**
   * Modal de Criar/Editar Tarefa
   */
  openTaskModal(task = null, defaultSubjectId = null, onSavedCallback = null) {
    const isEditing = !!task;
    const subjects = store.getSubjects();
    const modalContainer = document.getElementById("app-modal-container");
    if (!modalContainer) return;

    const selectedSubjectId = isEditing ? task.subject_id : (defaultSubjectId || (subjects[0] ? subjects[0].id : ""));

    const subjectOptions = subjects.map(s => `
      <option value="${s.id}" ${Number(selectedSubjectId) === s.id ? 'selected' : ''}>
        ${s.name}
      </option>
    `).join("");

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="task-modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <h3 class="modal-title">${isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
            <button class="modal-close" id="btn-close-task-modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form id="form-task-crud">
            <div class="form-group">
              <label class="form-label" for="task-subj-select">Disciplina *</label>
              <select id="task-subj-select" class="form-select" required>
                ${subjectOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="task-title-input">Título da Tarefa *</label>
              <input 
                type="text" 
                id="task-title-input" 
                class="form-input" 
                placeholder="Ex: Trabalho prático em grupo" 
                value="${isEditing ? task.title : ''}" 
                required 
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="task-due-input">Data Prevista *</label>
                <input 
                  type="date" 
                  id="task-due-input" 
                  class="form-input" 
                  value="${isEditing && task.due_date ? task.due_date : ''}" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="task-status-select">Status *</label>
                <select id="task-status-select" class="form-select" required>
                  <option value="pending" ${isEditing && task.status === 'pending' ? 'selected' : ''}>Pendente</option>
                  <option value="in_progress" ${isEditing && task.status === 'in_progress' ? 'selected' : ''}>Em Andamento</option>
                  <option value="completed" ${isEditing && task.status === 'completed' ? 'selected' : ''}>Concluída</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="task-desc-input">Descrição / Observações</label>
              <textarea 
                id="task-desc-input" 
                class="form-textarea" 
                placeholder="Detalhes sobre a entrega, formato, páginas ou links..."
              >${isEditing && task.description ? task.description : ''}</textarea>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn btn-secondary btn-full" id="btn-cancel-task">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary btn-full">
                ${isEditing ? 'Salvar Tarefa' : 'Criar Tarefa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const overlay = document.getElementById("task-modal-overlay");
    const closeBtn = document.getElementById("btn-close-task-modal");
    const cancelBtn = document.getElementById("btn-cancel-task");
    const form = document.getElementById("form-task-crud");

    const closeModal = () => {
      overlay.classList.remove("active");
      setTimeout(() => {
        modalContainer.innerHTML = "";
      }, 200);
    };

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const taskData = {
        subject_id: document.getElementById("task-subj-select").value,
        title: document.getElementById("task-title-input").value,
        due_date: document.getElementById("task-due-input").value,
        status: document.getElementById("task-status-select").value,
        description: document.getElementById("task-desc-input").value
      };

      try {
        if (isEditing) {
          await store.updateTask(task.id, taskData);
          window.appToast("Tarefa atualizada com sucesso!", "success");
        } else {
          await store.addTask(taskData);
          window.appToast("Nova tarefa adicionada!", "success");
        }
        closeModal();
        if (onSavedCallback) {
          onSavedCallback();
        }
      } catch (err) {
        window.appToast(err.message || "Erro ao salvar tarefa.", "danger");
      }
    });
  }
};
