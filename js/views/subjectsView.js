/**
 * EduTrack AI — 5. Tela de Disciplinas
 * Listagem completa, criação, edição e exclusão de disciplinas.
 * Campos: nome, professor, carga horária, descrição, data início/fim.
 */

import { store } from "../store.js";
import { router } from "../router.js";

export const SubjectsView = {
  currentSearch: "",
  render(container) {
    const subjects = store.getSubjects();

    let filteredSubjects = subjects;
    if (this.currentSearch) {
      filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(this.currentSearch.toLowerCase()));
    }
    container.innerHTML = `
      <div class="subjects-view">
        <div class="screen-header">
          <button class="back-btn" id="btn-back-dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Voltar ao Dashboard
          </button>
          <button class="btn btn-primary btn-sm" id="btn-open-new-subject">
            + Nova Disciplina
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <h1 style="font-size: 1.35rem; font-weight: 800;">Minhas Disciplinas</h1>
            <p class="text-sm">Gerencie suas matérias do semestre atual</p>
          </div>
          <span class="badge badge-in_progress">${subjects.length} Ativas</span>
        </div>

        
        <div class="filters-bar" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <input type="text" id="subject-search-input" class="form-input" placeholder="Buscar disciplina por nome..." style="flex: 1; min-width: 200px;" value="${this.currentSearch || ''}" />
        </div>

        <div class="subjects-list" id="subjects-container">
          ${this.renderSubjectCards(filteredSubjects)}
        </div>
      </div>
    `;

    // Eventos
    document.getElementById("btn-back-dashboard").addEventListener("click", () => {
      router.back();
    });

    document.getElementById("btn-open-new-subject").addEventListener("click", () => {
      this.openSubjectModal();
    });

    this.bindSubjectActions(container);

    const searchInput = document.getElementById("subject-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            this.currentSearch = e.target.value;
            let currentFiltered = subjects;
            if (this.currentSearch) {
                currentFiltered = subjects.filter(s => s.name.toLowerCase().includes(this.currentSearch.toLowerCase()));
            }
            const listContainer = container.querySelector('#subjects-container');
            if (listContainer) {
                listContainer.innerHTML = this.renderSubjectCards(currentFiltered);
                this.bindSubjectActions(container);
            }
        });
    }

  },

  renderSubjectCards(subjects) {
    if (subjects.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="empty-state-title">Nenhuma disciplina cadastrada</div>
          <div class="empty-state-text">Clique no botão abaixo para adicionar sua primeira matéria.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-create-subject">
            + Cadastrar Disciplina
          </button>
        </div>
      `;
    }

    return subjects.map(s => {
      const tasks = store.getTasks(s.id);
      const progress = store.getSubjectProgress(s.id);
      const formattedStart = s.start_date ? new Date(s.start_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
      const formattedEnd = s.end_date ? new Date(s.end_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

      return `
        <div class="subject-card" style="border-left-color: ${s.color || 'var(--primary-500)'};" data-id="${s.id}">
          <div class="subject-card-header">
            <div>
              <div class="subject-card-title btn-view-detail" data-id="${s.id}">${s.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${s.professor || 'Professor não informado'}</div>
            </div>
            <span class="badge" style="background: var(--bg-muted); color: var(--text-main);">
              ${s.workload_hours || 0}h
            </span>
          </div>

          ${s.description ? `<p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">${s.description}</p>` : ''}

          <div class="subject-meta-grid">
            <div class="subject-meta-item">
              <span>📅 Início:</span>
              <strong style="color: var(--text-main);">${formattedStart}</strong>
            </div>
            <div class="subject-meta-item">
              <span>🏁 Fim:</span>
              <strong style="color: var(--text-main);">${formattedEnd}</strong>
            </div>
          </div>

          <!-- Mini Progresso -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
              <span>Progresso de tarefas</span>
              <strong>${progress}% (${tasks.filter(t => t.status === 'completed').length}/${tasks.length})</strong>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${progress}%; background: ${s.color || 'var(--primary-500)'};"></div>
            </div>
          </div>

          <div class="subject-card-actions">
            <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${s.id}">
              Ver Tarefas (${tasks.length}) →
            </button>
            <div class="subject-action-btns">
              <button class="icon-btn-action btn-edit-subject" data-id="${s.id}" title="Editar disciplina">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="icon-btn-action danger btn-delete-subject" data-id="${s.id}" title="Excluir disciplina">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  bindSubjectActions(container) {
    // Clique para ver detalhes
    container.querySelectorAll(".btn-view-detail").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        router.navigate("subject-detail", { subject_id: id });
      });
    });

    // Editar disciplina
    container.querySelectorAll(".btn-edit-subject").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const subject = store.getSubjectById(id);
        if (subject) {
          this.openSubjectModal(subject);
        }
      });
    });

    // Excluir disciplina
    container.querySelectorAll(".btn-delete-subject").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (confirm("Tem certeza que deseja excluir esta disciplina e todas as suas tarefas vinculadas?")) {
          store.deleteSubject(id);
          window.appToast("Disciplina removida com sucesso.", "danger");
          this.render(container);
        }
      });
    });

    const emptyBtn = container.querySelector("#btn-empty-create-subject");
    if (emptyBtn) {
      emptyBtn.addEventListener("click", () => this.openSubjectModal());
    }
  },

  /**
   * Modal de Criar/Editar Disciplina
   */
  openSubjectModal(subject = null) {
    const isEditing = !!subject;
    const modalContainer = document.getElementById("app-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="subject-modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <h3 class="modal-title">${isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
            <button class="modal-close" id="btn-close-modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form id="form-subject-crud">
            <div class="form-group">
              <label class="form-label" for="subj-name">Nome da Disciplina *</label>
              <input 
                type="text" 
                id="subj-name" 
                class="form-input" 
                placeholder="Ex: Redes de Computadores" 
                value="${isEditing ? subject.name : ''}" 
                required 
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="subj-prof">Professor *</label>
                <input 
                  type="text" 
                  id="subj-prof" 
                  class="form-input" 
                  placeholder="Ex: Prof. Roberto" 
                  value="${isEditing ? subject.professor : ''}" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="subj-hours">Carga Horária (h) *</label>
                <input 
                  type="number" 
                  id="subj-hours" 
                  class="form-input" 
                  placeholder="Ex: 60" 
                  min="1" 
                  value="${isEditing ? subject.workload_hours : 60}" 
                  required 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="subj-start">Data Início</label>
                <input 
                  type="date" 
                  id="subj-start" 
                  class="form-input" 
                  value="${isEditing && subject.start_date ? subject.start_date : ''}" 
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="subj-end">Data Fim</label>
                <input 
                  type="date" 
                  id="subj-end" 
                  class="form-input" 
                  value="${isEditing && subject.end_date ? subject.end_date : ''}" 
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="subj-desc">Descrição / Ementa</label>
              <textarea 
                id="subj-desc" 
                class="form-textarea" 
                placeholder="Tópicos principais da disciplina..."
              >${isEditing && subject.description ? subject.description : ''}</textarea>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn btn-secondary btn-full" id="btn-cancel-subject">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary btn-full">
                ${isEditing ? 'Salvar Alterações' : 'Criar Disciplina'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const overlay = document.getElementById("subject-modal-overlay");
    const closeBtn = document.getElementById("btn-close-modal");
    const cancelBtn = document.getElementById("btn-cancel-subject");
    const form = document.getElementById("form-subject-crud");

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

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const subjectData = {
        name: document.getElementById("subj-name").value,
        professor: document.getElementById("subj-prof").value,
        workload_hours: document.getElementById("subj-hours").value,
        start_date: document.getElementById("subj-start").value,
        end_date: document.getElementById("subj-end").value,
        description: document.getElementById("subj-desc").value
      };

      if (isEditing) {
        store.updateSubject(subject.id, subjectData);
        window.appToast("Disciplina atualizada com sucesso!", "success");
      } else {
        store.addSubject(subjectData);
        window.appToast("Nova disciplina adicionada!", "success");
      }

      closeModal();
      const contentContainer = document.getElementById("main-content");
      SubjectsView.render(contentContainer);
    });
  }
};
