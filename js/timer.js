/**
 * EduTrack AI — Módulo do Cronômetro de Lição & Sessão de Estudos
 * Widget flutuante em tempo real no canto da tela, persistente entre navegações,
 * com suporte a pausar, retomar, minimizar, concluir e vincular a tarefas e disciplinas.
 */

import { store } from "./store.js";
import { router } from "./router.js";

class StudyTimer {
  constructor() {
    this.intervalId = null;
    this.container = null;
    this.state = {
      isActive: false,
      isPaused: false,
      isMinimized: false,
      subjectId: null,
      taskId: null,
      lessonTitle: "",
      startTimestamp: null,
      pausedTimestamp: null,
      accumulatedSeconds: 0
    };
  }

  init() {
    this.ensureContainer();
    this.restoreActiveTimer();
  }

  ensureContainer() {
    let container = document.getElementById("study-timer-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "study-timer-container";
      document.body.appendChild(container);
    }
    this.container = container;
  }

  restoreActiveTimer() {
    const saved = store.getActiveTimer();
    if (!saved || !saved.isActive) return;

    this.state = { ...saved };

    // Se estava rodando (não pausado), atualiza o tempo acumulado baseado na hora atual
    if (!this.state.isPaused && this.state.startTimestamp) {
      const now = Date.now();
      const elapsedSinceStart = Math.floor((now - this.state.startTimestamp) / 1000);
      this.state.accumulatedSeconds = Math.max(0, elapsedSinceStart);
    }

    this.renderWidget();
    if (!this.state.isPaused) {
      this.startTicker();
    }
  }

  saveState() {
    if (this.state.isActive) {
      store.saveActiveTimer(this.state);
    } else {
      store.clearActiveTimer();
    }
  }

  startTicker() {
    this.stopTicker();
    this.intervalId = setInterval(() => {
      if (!this.state.isPaused) {
        const now = Date.now();
        const currentElapsed = Math.floor((now - this.state.startTimestamp) / 1000);
        this.state.accumulatedSeconds = currentElapsed;
        this.updateDisplays();
      }
    }, 1000);
  }

  stopTicker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (n) => String(n).padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  formatFullTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  startLesson({ subjectId, taskId = null, lessonTitle = "" }) {
    // Se já houver lição ativa, confirma substituição
    if (this.state.isActive) {
      const confirmChange = confirm("Já existe uma lição em andamento no cronômetro. Deseja finalizar a anterior e iniciar esta nova?");
      if (!confirmChange) return;
      this.finishLesson(false);
    }

    const subject = store.getSubjectById(subjectId);
    if (!subject) {
      window.appToast("Disciplina não encontrada.", "danger");
      return;
    }

    let finalTitle = lessonTitle.trim();
    if (!finalTitle && taskId) {
      const task = store.getTaskById(taskId);
      if (task) finalTitle = task.title;
    }
    if (!finalTitle) {
      finalTitle = `Estudo de ${subject.name}`;
    }

    const now = Date.now();
    this.state = {
      isActive: true,
      isPaused: false,
      isMinimized: false,
      subjectId: Number(subjectId),
      taskId: taskId ? Number(taskId) : null,
      lessonTitle: finalTitle,
      startTimestamp: now,
      pausedTimestamp: null,
      accumulatedSeconds: 0,
      initialDate: new Date().toISOString()
    };

    this.saveState();
    this.renderWidget();
    this.startTicker();

    // Se estiver associada a uma tarefa pendente, marca como em andamento
    if (taskId) {
      const task = store.getTaskById(taskId);
      if (task && task.status === "pending") {
        store.updateTask(taskId, { status: "in_progress" });
      }
    }

    window.appToast(`▶ Lição iniciada: "${finalTitle}"! Cronômetro rodando no canto da tela.`, "success");
  }

  togglePause() {
    if (!this.state.isActive) return;

    if (this.state.isPaused) {
      // Retomar
      const pauseDuration = Date.now() - this.state.pausedTimestamp;
      this.state.startTimestamp += pauseDuration;
      this.state.isPaused = false;
      this.state.pausedTimestamp = null;
      this.startTicker();
      this.saveState();
      this.renderWidget();
      window.appToast("Cronômetro retomado!", "info");
    } else {
      // Pausar
      this.stopTicker();
      this.state.isPaused = true;
      this.state.pausedTimestamp = Date.now();
      this.saveState();
      this.renderWidget();
      window.appToast("Cronômetro pausado.", "warning");
    }
  }

  toggleMinimize() {
    this.state.isMinimized = !this.state.isMinimized;
    this.saveState();
    this.renderWidget();
  }

  async finishLesson(showToast = true) {
    if (!this.state.isActive) return;

    this.stopTicker();
    const duration = Math.max(1, this.state.accumulatedSeconds);
    const subject = store.getSubjectById(this.state.subjectId);
    const subjectName = subject ? subject.name : "Disciplina";

    try {
      // Salva a sessão no histórico do backend/store
      await store.addStudySession({
        subject_id: this.state.subjectId,
        task_id: this.state.taskId,
        lesson_title: this.state.lessonTitle,
        duration_seconds: duration,
        started_at: this.state.initialDate || new Date(Date.now() - duration * 1000).toISOString(),
        ended_at: new Date().toISOString()
      });

      // Se houver tarefa vinculada, oferece para marcar como concluída
      if (this.state.taskId) {
        const task = store.getTaskById(this.state.taskId);
        if (task && task.status !== "completed") {
          const markDone = confirm(`Você concluiu a sessão de estudos de "${task.title}". Deseja marcar esta tarefa como concluída no sistema?`);
          if (markDone) {
            await store.updateTask(task.id, { status: "completed" });
            window.appToast("Tarefa marcada como concluída com sucesso! 🎉", "success");
          }
        }
      }

      const formattedTime = this.formatDurationText(duration);

      // Reseta estado
      this.state = {
        isActive: false,
        isPaused: false,
        isMinimized: false,
        subjectId: null,
        taskId: null,
        lessonTitle: "",
        startTimestamp: null,
        pausedTimestamp: null,
        accumulatedSeconds: 0
      };
      this.saveState();
      this.renderWidget();

      if (showToast) {
        window.appToast(`🎉 Lição concluída com sucesso! Você focou por ${formattedTime} em ${subjectName}.`, "success");
      }

      // Se estiver em views que mostram progresso/sessões, re-renderiza
      if (router.currentRoute === "dashboard") {
        const content = document.getElementById("main-content");
        if (content) router.renderCurrent();
      }
    } catch (e) {
      window.appToast("Erro ao salvar sessão de estudo no servidor.", "danger");
    }
  }

  cancelLesson() {
    if (!this.state.isActive) return;

    const confirmCancel = confirm("Deseja realmente cancelar o cronômetro? O tempo estudado nesta lição será descartado.");
    if (!confirmCancel) return;

    this.stopTicker();
    this.state = {
      isActive: false,
      isPaused: false,
      isMinimized: false,
      subjectId: null,
      taskId: null,
      lessonTitle: "",
      startTimestamp: null,
      pausedTimestamp: null,
      accumulatedSeconds: 0
    };
    this.saveState();
    this.renderWidget();
    window.appToast("Sessão de estudos cancelada.", "info");
  }

  formatDurationText(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} segundos`;
    if (mins === 1) return `1 minuto e ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins} minutos`;
  }

  renderWidget() {
    this.ensureContainer();

    if (!this.state.isActive) {
      this.container.innerHTML = "";
      return;
    }

    const subject = store.getSubjectById(this.state.subjectId) || { name: "Disciplina", color: "#10b981" };
    const formattedTime = this.formatFullTime(this.state.accumulatedSeconds);

    if (this.state.isMinimized) {
      // Visualização Pílula Compacta
      this.container.innerHTML = `
        <div class="floating-timer-pill" id="timer-pill-expand" title="Clique para expandir o cronômetro">
          <span class="timer-pulse-dot ${this.state.isPaused ? 'paused' : ''}"></span>
          <span class="timer-pill-time" id="timer-display-pill">${formattedTime}</span>
          <span class="timer-pill-title" style="color: ${subject.color};">● ${this.state.lessonTitle}</span>
          <button class="timer-pill-btn-expand" aria-label="Expandir">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        </div>
      `;

      document.getElementById("timer-pill-expand").addEventListener("click", () => {
        this.toggleMinimize();
      });
      return;
    }

    // Visualização Expandida Completa
    this.container.innerHTML = `
      <div class="floating-timer-card ${this.state.isPaused ? 'timer-card-paused' : ''}">
        <!-- Top Bar: Status e Ações de Janela -->
        <div class="timer-header">
          <div class="timer-badge-status">
            <span class="timer-pulse-dot ${this.state.isPaused ? 'paused' : ''}"></span>
            <span class="timer-status-text">${this.state.isPaused ? 'Pausado' : 'Estudando Agora'}</span>
          </div>
          <div class="timer-window-actions">
            <button class="timer-btn-icon" id="btn-timer-minimize" title="Minimizar para pílula discreta">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button class="timer-btn-icon danger" id="btn-timer-cancel" title="Cancelar e descartar">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Conteúdo: Info da Matéria & Lição -->
        <div class="timer-body">
          <div class="timer-subject-tag" style="background: ${subject.color}15; color: ${subject.color}; border: 1px solid ${subject.color}30;">
            ${subject.name}
          </div>
          <h4 class="timer-lesson-title" title="${this.state.lessonTitle}">
            ${this.state.lessonTitle}
          </h4>

          <!-- Contador Digital Grande -->
          <div class="timer-digital-display" id="timer-display-main">
            ${formattedTime}
          </div>
        </div>

        <!-- Controles Interativos -->
        <div class="timer-controls">
          <button class="btn btn-secondary btn-sm timer-action-btn" id="btn-timer-pause">
            ${this.state.isPaused ? `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Retomar</span>
            ` : `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <span>Pausar</span>
            `}
          </button>

          <button class="btn btn-primary btn-sm timer-action-btn" id="btn-timer-finish" style="flex: 1.2;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Concluir Lição</span>
          </button>
        </div>
      </div>
    `;

    // Eventos dos Controles
    document.getElementById("btn-timer-minimize").addEventListener("click", () => this.toggleMinimize());
    document.getElementById("btn-timer-cancel").addEventListener("click", () => this.cancelLesson());
    document.getElementById("btn-timer-pause").addEventListener("click", () => this.togglePause());
    document.getElementById("btn-timer-finish").addEventListener("click", () => this.finishLesson());
  }

  updateDisplays() {
    const formatted = this.formatFullTime(this.state.accumulatedSeconds);
    const mainDisplay = document.getElementById("timer-display-main");
    if (mainDisplay) mainDisplay.innerText = formatted;

    const pillDisplay = document.getElementById("timer-display-pill");
    if (pillDisplay) pillDisplay.innerText = formatted;
  }

  // --- MODAL DE INICIAR LIÇÃO ---
  openStartLessonModal({ defaultSubjectId = null, defaultTaskId = null, defaultTitle = "" } = {}) {
    const modalContainer = document.getElementById("app-modal-container");
    if (!modalContainer) return;

    const subjects = store.getSubjects();
    if (subjects.length === 0) {
      window.appToast("Cadastre pelo menos uma disciplina antes de iniciar lições de estudo.", "warning");
      return;
    }

    const selectedSubjectId = defaultSubjectId || subjects[0].id;
    const initialTasks = store.getTasks(selectedSubjectId, "pending").concat(store.getTasks(selectedSubjectId, "in_progress"));

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="modal-start-lesson-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="modal-icon-badge" style="background: var(--primary-100); color: var(--primary-700); padding: 8px; border-radius: var(--radius-md);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Iniciar Lição de Estudo</h3>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">O cronômetro começará a contar e ficará rodando no canto da tela.</p>
              </div>
            </div>
            <button class="btn-icon btn-secondary" id="btn-close-start-modal">✕</button>
          </div>

          <form id="form-start-lesson">
            <div class="form-group">
              <label class="form-label" for="lesson-subject-select">Disciplina *</label>
              <select class="form-select" id="lesson-subject-select" required>
                ${subjects.map(s => `
                  <option value="${s.id}" ${Number(s.id) === Number(selectedSubjectId) ? 'selected' : ''}>
                    ${s.name} (${s.workload_hours}h)
                  </option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="lesson-task-select">Vincular a uma Tarefa Existente (Opcional)</label>
              <select class="form-select" id="lesson-task-select">
                <option value="">— Sem tarefa vinculada (Estudo livre) —</option>
                ${initialTasks.map(t => `
                  <option value="${t.id}" ${Number(t.id) === Number(defaultTaskId) ? 'selected' : ''}>
                    ${t.title} [${t.status === 'in_progress' ? 'Em andamento' : 'Pendente'}]
                  </option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="lesson-title-input">Nome da Lição / Tópico de Foco *</label>
              <input 
                type="text" 
                class="form-input" 
                id="lesson-title-input" 
                placeholder="Ex: Leitura do Capítulo 3, Resolução de Exercícios, Revisão para Prova..."
                value="${defaultTitle}"
                required 
              />
            </div>

            <div class="modal-actions" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-start-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-start-lesson">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Começar a Estudar Agora
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const overlay = document.getElementById("modal-start-lesson-overlay");
    const subjectSelect = document.getElementById("lesson-subject-select");
    const taskSelect = document.getElementById("lesson-task-select");
    const titleInput = document.getElementById("lesson-title-input");

    // Atualiza opções de tarefas quando muda a disciplina
    subjectSelect.addEventListener("change", (e) => {
      const subId = Number(e.target.value);
      const subTasks = store.getTasks(subId, "pending").concat(store.getTasks(subId, "in_progress"));
      taskSelect.innerHTML = `
        <option value="">— Sem tarefa vinculada (Estudo livre) —</option>
        ${subTasks.map(t => `<option value="${t.id}">${t.title}</option>`).join("")}
      `;
    });

    // Quando seleciona uma tarefa, auto-preenche o título da lição se estiver vazio
    taskSelect.addEventListener("change", (e) => {
      const tId = e.target.value;
      if (tId) {
        const t = store.getTaskById(tId);
        if (t && (!titleInput.value || titleInput.value.startsWith("Estudo de"))) {
          titleInput.value = t.title;
        }
      }
    });

    // Se já veio com tarefa ou título inicial, sincroniza
    if (defaultTaskId) {
      const task = store.getTaskById(defaultTaskId);
      if (task && !titleInput.value) {
        titleInput.value = task.title;
      }
    } else if (!titleInput.value && subjects.length > 0) {
      titleInput.value = `Estudo de ${subjects[0].name}`;
    }

    const closeModal = () => {
      modalContainer.innerHTML = "";
    };

    document.getElementById("btn-close-start-modal").addEventListener("click", closeModal);
    document.getElementById("btn-cancel-start-modal").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById("form-start-lesson").addEventListener("submit", (e) => {
      e.preventDefault();
      const subjectId = subjectSelect.value;
      const taskId = taskSelect.value || null;
      const lessonTitle = titleInput.value.trim();

      if (!lessonTitle) {
        alert("Por favor, informe o nome ou tópico da lição.");
        return;
      }

      closeModal();
      this.startLesson({ subjectId, taskId, lessonTitle });
    });
  }
}

export const studyTimer = new StudyTimer();
