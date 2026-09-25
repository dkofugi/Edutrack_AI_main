/**
 * EduTrack AI — View / Componente do Carrossel de Recomendação de Prioridade
 * Ranquear e exibir as tarefas acadêmicas mais urgentes/relevantes
 * com base na proximidade do prazo, carga horária da disciplina e tempo de espera.
 */

import { store } from "../store.js";
import { studyTimer } from "../timer.js";
import { router } from "../router.js";

export function calculateTaskPriority(task, subject) {
  let score = 0;
  let urgency = "tranquilo"; // "urgente", "em_breve", "tranquilo"
  let urgencyText = "Sem prazo";
  let urgencyBadgeClass = "prio-badge-success";

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (task.due_date) {
    const due = new Date(task.due_date + "T00:00:00");
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const lateDays = Math.abs(diffDays);
      score += 1000 + lateDays * 50;
      urgency = "urgente";
      urgencyText = `🔴 Atrasada (${lateDays}d)`;
      urgencyBadgeClass = "prio-badge-danger";
    } else if (diffDays === 0) {
      score += 500;
      urgency = "urgente";
      urgencyText = "🔴 Vence Hoje!";
      urgencyBadgeClass = "prio-badge-danger";
    } else if (diffDays === 1) {
      score += 350;
      urgency = "urgente";
      urgencyText = "🔴 Vence Amanhã";
      urgencyBadgeClass = "prio-badge-danger";
    } else if (diffDays <= 5) {
      score += 150 - diffDays * 10;
      urgency = "em_breve";
      urgencyText = `🟡 Em ${diffDays} dias`;
      urgencyBadgeClass = "prio-badge-warning";
    } else {
      score += 50;
      urgency = "tranquilo";
      urgencyText = `🟢 Em ${diffDays} dias`;
      urgencyBadgeClass = "prio-badge-success";
    }
  } else {
    score += 10;
    urgencyText = "🟢 Sem prazo fixo";
    urgencyBadgeClass = "prio-badge-success";
  }

  // Peso da carga horária da disciplina (workload_hours)
  const workload = subject ? (subject.workload_hours || 0) : 0;
  score += workload * 5;

  // Bônus para tarefas já iniciadas (em andamento)
  if (task.status === "in_progress") {
    score += 80;
  }

  // Bônus de tempo parado (antiguidade)
  if (task.created_at) {
    const created = new Date(task.created_at);
    const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    score += Math.min(100, Math.max(0, ageDays * 5));
  }

  return { score, urgency, urgencyText, urgencyBadgeClass };
}

export const PriorityCarouselView = {
  render(containerId = "priority-carousel-container") {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const subjects = store.getSubjects();
    const allTasks = store.getTasks();
    const pendingTasks = allTasks.filter(t => t.status === "pending" || t.status === "in_progress");

    if (pendingTasks.length === 0) {
      container.innerHTML = `
        <div class="prio-carousel-wrapper empty-prio">
          <div class="prio-header">
            <div>
              <div class="prio-title">🎯 Recomendação de Prioridade</div>
              <div class="prio-subtitle">Sua IA de foco analisa prazos e cargas horárias para indicar a melhor escolha.</div>
            </div>
          </div>
          <div class="prio-empty-card">
            <div style="font-size: 1.8rem; margin-bottom: 6px;">🎉</div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 1.05rem;">Tudo em dia! Nenhuma tarefa pendente.</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Você concluiu todas as tarefas cadastradas ou ainda não possui pendências.</div>
          </div>
        </div>
      `;
      return;
    }

    // Calcula a pontuação de prioridade para cada tarefa
    const rankedTasks = pendingTasks.map(task => {
      const subject = store.getSubjectById(task.subject_id) || { name: "Sem Disciplina", color: "var(--primary-500)", workload_hours: 0 };
      const priorityInfo = calculateTaskPriority(task, subject);
      return {
        task,
        subject,
        ...priorityInfo
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 recomendadas

    container.innerHTML = `
      <div class="prio-carousel-wrapper">
        <!-- Cabeçalho da Seção -->
        <div class="prio-header">
          <div class="prio-header-title-box">
            <div class="prio-badge-ai">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="12 8 8 12 12 16 16 12 12 8"></polygon>
              </svg>
              <span>Foco Inteligente AI</span>
            </div>
            <div class="prio-title">O que estudar agora?</div>
            <div class="prio-subtitle">Tarefas ranqueadas por urgência, carga horária e tempo de espera.</div>
          </div>

          <!-- Controles de Navegação Desktop -->
          <div class="prio-nav-controls">
            <button class="prio-nav-btn" id="btn-prio-prev" title="Anterior" aria-label="Anterior">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button class="prio-nav-btn" id="btn-prio-next" title="Próximo" aria-label="Próximo">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Trilha do Carrossel Dinâmico -->
        <div class="prio-carousel-track" id="prio-track">
          ${rankedTasks.map((item, index) => {
            const isTop1 = index === 0;
            return `
              <div class="prio-card ${isTop1 ? 'prio-card-top1' : ''}" data-task-id="${item.task.id}">
                <div class="prio-card-header">
                  <div class="prio-rank-badge ${isTop1 ? 'top1-badge' : ''}">
                    ${isTop1 ? '🔥 Top #1 Prioridade' : `#${index + 1} Recomendada`}
                  </div>
                  <div class="prio-urgency-badge ${item.urgencyBadgeClass}">
                    ${item.urgencyText}
                  </div>
                </div>

                <div class="prio-card-body">
                  <div class="prio-subject-tag" style="background: ${item.subject.color}18; color: ${item.subject.color}; border: 1px solid ${item.subject.color}35;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.subject.color};"></span>
                    <span>${item.subject.name}</span>
                  </div>

                  <h3 class="prio-task-title">${item.task.title}</h3>
                  <p class="prio-task-desc">${item.task.description ? item.task.description : 'Sem descrição detalhada.'}</p>
                </div>

                <div class="prio-card-footer">
                  <div class="prio-task-status-tag ${item.task.status === 'in_progress' ? 'status-in-progress' : ''}">
                    ${item.task.status === 'in_progress' ? '⚡ Em andamento' : '⏳ Pendente'}
                  </div>

                  <button class="btn btn-primary btn-sm prio-btn-start" data-task-id="${item.task.id}" data-subject-id="${item.subject.id}" data-task-title="${item.task.title.replace(/"/g, '&quot;')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>Começar Agora</span>
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    // Eventos de Navegação do Carrossel (Setas Desktop)
    const track = document.getElementById("prio-track");
    const btnPrev = document.getElementById("btn-prio-prev");
    const btnNext = document.getElementById("btn-prio-next");

    if (track && btnPrev && btnNext) {
      btnPrev.addEventListener("click", () => {
        track.scrollBy({ left: -320, behavior: "smooth" });
      });
      btnNext.addEventListener("click", () => {
        track.scrollBy({ left: 320, behavior: "smooth" });
      });
    }

    // Eventos do Botão "Começar Agora" nos Cards
    container.querySelectorAll(".prio-btn-start").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute("data-task-id");
        const subjectId = btn.getAttribute("data-subject-id");
        const taskTitle = btn.getAttribute("data-task-title");

        studyTimer.startLesson({
          subjectId: Number(subjectId),
          taskId: Number(taskId),
          lessonTitle: taskTitle
        });
      });
    });

    // Clique no próprio card redireciona para a disciplina/tarefa
    container.querySelectorAll(".prio-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".prio-btn-start")) return;
        const taskId = card.getAttribute("data-task-id");
        const task = store.getTaskById(taskId);
        if (task) {
          router.navigate("subject-detail", { subject_id: task.subject_id });
        }
      });
    });
  }
};
