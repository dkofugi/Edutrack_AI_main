/**
 * EduTrack AI — 4. Tela de Dashboard
 * Exibe saudação, métricas rápidas, lista de disciplinas com % de progresso
 * e gráfico interativo (barras / pizza) de tempo/carga horária por disciplina.
 */

import { store } from "../store.js";
import { router } from "../router.js";
import { ChartRenderer } from "../charts.js";
import { AdvancedMetricsView } from "./advancedMetricsView.js";
import { PriorityCarouselView } from "./priorityCarouselView.js";

export const DashboardView = {
  currentChartMode: "bar", // "bar" ou "donut"

  formatStudyHours(seconds) {
    if (!seconds || seconds <= 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },

  render(container) {
    const user = store.getCurrentUser() || { name: "Estudante" };
    const subjects = store.getSubjects();
    const metrics = store.getDashboardMetrics();

    // Renderiza a estrutura do Dashboard
    container.innerHTML = `
      <div class="dashboard-view">
        <!-- Saudação com Botão de Ação Rápida -->
        <div class="welcome-card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div class="welcome-title">Olá, ${user.name.split(" ")[0]} 👋</div>
            <div class="welcome-subtitle">Aqui está o panorama das suas disciplinas e prazos acadêmicos.</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-dashboard-start-lesson" style="background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Iniciar Lição Agora</span>
          </button>
        </div>

        <!-- Métricas Rápidas (4 Cards no Desktop) -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${metrics.totalSubjects}</div>
            <div class="stat-label">Disciplinas</div>
          </div>
          <div class="stat-card" title="${metrics.totalHours}h de carga horária cadastrada">
            <div class="stat-value" style="color: var(--primary-600);">${this.formatStudyHours(metrics.totalStudySeconds)}</div>
            <div class="stat-label">Tempo Focado</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--warning);">${metrics.pendingTasks}</div>
            <div class="stat-label">Pendentes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--success);">${metrics.completedTasks}</div>
            <div class="stat-label">Concluídas</div>
          </div>
        </div>

        <!-- Carrossel de Recomendação de Prioridade (AI Priority Carousel) -->
        <div id="priority-carousel-container"></div>

        <!-- Métricas Avançadas -->
        <div id="advanced-metrics-container"></div>

        <!-- Layout Desktop Principal em 2 Colunas -->
        <div class="dashboard-main-grid">
          <!-- Coluna 1: Gráfico de Tempo / Carga Horária -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="section-title" style="margin-bottom: 2px;">Carga Horária / Tempo</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Distribuição de tempo por disciplina</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button id="btn-chart-bar" class="btn btn-sm ${this.currentChartMode === 'bar' ? 'btn-primary' : 'btn-secondary'}">
                  Barras
                </button>
                <button id="btn-chart-donut" class="btn btn-sm ${this.currentChartMode === 'donut' ? 'btn-primary' : 'btn-secondary'}">
                  Pizza
                </button>
              </div>
            </div>

            <div id="dashboard-chart-container"></div>
          </div>

          <!-- Coluna 2: Lista de Disciplinas com Progresso -->
          <div>
            <div class="section-header">
              <h2 class="section-title">Progresso das Disciplinas</h2>
              <a href="javascript:void(0)" id="link-all-subjects" class="section-link">Ver todas →</a>
            </div>

            <div class="subject-progress-list" id="dashboard-subjects-list">
              ${this.renderSubjectsProgress(subjects)}
            </div>
          </div>
        </div>
      </div>
    `;

    // Renderiza os componentes e gráficos
    this.renderChart(subjects);
    PriorityCarouselView.render("priority-carousel-container");
    AdvancedMetricsView.render("advanced-metrics-container");


    // Eventos de alternância do gráfico
    document.getElementById("btn-chart-bar").addEventListener("click", () => {
      this.currentChartMode = "bar";
      document.getElementById("btn-chart-bar").className = "btn btn-sm btn-primary";
      document.getElementById("btn-chart-donut").className = "btn btn-sm btn-secondary";
      this.renderChart(subjects);
    });

    document.getElementById("btn-chart-donut").addEventListener("click", () => {
      this.currentChartMode = "donut";
      document.getElementById("btn-chart-donut").className = "btn btn-sm btn-primary";
      document.getElementById("btn-chart-bar").className = "btn btn-sm btn-secondary";
      this.renderChart(subjects);
    });

    // Botão Iniciar Lição Agora no Dashboard
    const dashStartBtn = document.getElementById("btn-dashboard-start-lesson");
    if (dashStartBtn) {
      dashStartBtn.addEventListener("click", () => {
        if (window.studyTimer) {
          window.studyTimer.openStartLessonModal();
        }
      });
    }

    // Link para gerenciar disciplinas
    document.getElementById("link-all-subjects").addEventListener("click", () => {
      router.navigate("subjects");
    });

    // Eventos de clique nos cards de disciplina
    container.querySelectorAll(".subject-progress-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        router.navigate("subject-detail", { subject_id: id });
      });
    });

    const emptyAddBtn = container.querySelector("#btn-empty-add-subj");
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener("click", () => {
        router.navigate("subjects");
      });
    }
  },

  renderSubjectsProgress(subjects) {
    if (subjects.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div class="empty-state-title">Nenhuma disciplina cadastrada</div>
          <div class="empty-state-text">Comece adicionando sua primeira matéria para acompanhar seus prazos.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-subj">
            + Adicionar Disciplina
          </button>
        </div>
      `;
    }

    return subjects.map(subject => {
      const progress = store.getSubjectProgress(subject.id);
      const tasks = store.getTasks(subject.id);
      const pendingCount = tasks.filter(t => t.status !== "completed").length;

      return `
        <div class="subject-progress-item" data-id="${subject.id}">
          <div class="subject-progress-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${subject.color || 'var(--primary-500)'};"></span>
              <span class="subject-progress-name">${subject.name}</span>
            </div>
            <span class="subject-progress-percent">${progress}%</span>
          </div>

          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%; background: ${subject.color || 'var(--primary-500)'};"></div>
          </div>

          <div class="subject-progress-info">
            <span>${subject.professor}</span>
            <span>${pendingCount === 0 ? 'Tudo concluído 🎉' : `${pendingCount} tarefa(s) pendente(s)`}</span>
          </div>
        </div>
      `;
    }).join("");
  },

  renderChart(subjects) {
    if (this.currentChartMode === "bar") {
      ChartRenderer.renderBarChart("dashboard-chart-container", subjects);
    } else {
      ChartRenderer.renderDonutChart("dashboard-chart-container", subjects);
    }
  }
};
