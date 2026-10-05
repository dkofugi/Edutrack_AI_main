/**
 * EduTrack AI — DuduTrack Mascot Component (Vanilla JS ES6+)
 * Assistente virtual contextual em formato de mascote cartoon.
 * Exibe mensagens dinâmicas e reações interativas a eventos do usuário.
 */

import { store } from "./store.js";
import { router } from "./router.js";

export const DuduTrack = {
  activeEventMessage: null,

  renderSVGAvatar() {
    return `
      
    <svg width="92" height="92" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
      <defs>
        <linearGradient id="dudu-frame-grad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(16, 185, 129, 0.16)"/>
          <stop offset="100%" stop-color="rgba(5, 150, 105, 0.08)"/>
        </linearGradient>

        <!-- Recorte só do círculo (corpo e pés ficam dentro) -->
        <clipPath id="dudu-circle-clip">
          <circle cx="60" cy="64" r="44"/>
        </clipPath>

        <!-- Recorte só do topo (cabeça/orelhas saem livres) -->
        <clipPath id="dudu-head-top-free">
          <rect x="0" y="-30" width="120" height="75"/>
        </clipPath>

        <!-- NOVO: união círculo + topo livre, usado para recortar a sombra -->
        <clipPath id="dudu-visible-area">
          <circle cx="60" cy="64" r="44"/>
          <rect x="0" y="-30" width="120" height="75"/>
        </clipPath>

        <filter id="dudu-char-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.25"/>
        </filter>

        <filter id="dudu-ring-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#10b981" flood-opacity="0.2"/>
        </filter>
      </defs>

      <!-- 1 (FUNDO): círculo e anel verde -->
      <circle cx="60" cy="64" r="44" fill="url(#dudu-frame-grad)" stroke="#10b981" stroke-width="4.5" filter="url(#dudu-ring-shadow)"/>

      <!-- 2 (MEIO): sombra do mascote, agora recortada (sem pernas para fora) -->
      <g clip-path="url(#dudu-visible-area)">
        <g filter="url(#dudu-char-shadow)" opacity="0.9">
          <image href="img/dudutrack_mascot-Photoroom.png?v=6.1" x="5" y="10" width="110" height="110" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </g>

      <!-- 3 (FRENTE): corpo e pés recortados dentro do círculo -->
      <g clip-path="url(#dudu-circle-clip)">
        <image href="img/dudutrack_mascot-Photoroom.png?v=6.1" x="5" y="10" width="110" height="110" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- 4 (FRENTE): cabeça e orelhas saindo pelo topo -->
      <g clip-path="url(#dudu-head-top-free)">
        <image href="img/dudutrack_mascot-Photoroom.png?v=6.1" x="5" y="10" width="110" height="110" preserveAspectRatio="xMidYMid meet"/>
      </g>
    </svg>
  `;
},

  // Banco de Variações de Mensagens Personalizadas por Evento
  eventMessageTemplates: {
    task_completed: [
      "Sensacional, {nome}! Você concluiu a tarefa <strong>{tarefa}</strong>! Menos uma pendência e mais um passo rumo à aprovação! 🎉",
      "Mandou muito bem, {nome}! Tarefa <strong>{tarefa}</strong> finalizada com sucesso! Seu esforço está valendo a pena! 💪",
      "Excelente, {nome}! <strong>{tarefa}</strong> foi concluída! Que tal aproveitar o embalo e mandar ver na próxima?",
      "Parabéns, {nome}! Concluir <strong>{tarefa}</strong> te aproxima da sua meta da semana! Continue nesse ritmo! 🐾"
    ],
    app_welcome: [
      "Olá, <strong>{nome}</strong>! Que bom te ver de novo! Vamos dar uma olhada no seu progresso hoje? 🐾",
      "Bem-vindo de volta, <strong>{nome}</strong>! Estou pronto para te acompanhar nos estudos. Bora lá?",
      "Oi, <strong>{nome}</strong>! Pronto para transformar tempo focado em grandes conquistas hoje? Estou aqui para ajudar! 🐶"
    ],
    session_completed: [
      "Sessão incrível, <strong>{nome}</strong>! Mais um bloco de estudo de <strong>{disciplina}</strong> gravado com sucesso! ⏱️",
      "Excelente foco em <strong>{disciplina}</strong>, <strong>{nome}</strong>! Cada minuto investido constrói seu resultado!",
      "Parabéns pelo treino mental em <strong>{disciplina}</strong>, <strong>{nome}</strong>! Progresso constante!"
    ],
    task_reminder: [
      "Fica de olho, <strong>{nome}</strong>! A tarefa <strong>{tarefa}</strong> está chegando perto do prazo de entrega!",
      "Atenção, <strong>{nome}</strong>! Você tem tarefas importantes aguardando em <strong>{disciplina}</strong>. Que tal agendar uma lição?"
    ],
    goal_reached: [
      "Incrível, <strong>{nome}</strong>! Você atingiu a marca de <strong>{percentual}%</strong> em <strong>{disciplina}</strong>! Meta batida com sucesso! 🎉",
      "Conquista atingida em <strong>{disciplina}</strong>, <strong>{nome}</strong>! Você dominou os conteúdos dessa matéria!"
    ]
  },

  // Dispara uma mensagem interativa motivada por um evento do app
  triggerEvent(eventType, eventData = {}) {
    const user = store.getCurrentUser() || { name: "Estudante" };
    const firstName = user.name ? user.name.split(" ")[0] : "Estudante";

    const templates = this.eventMessageTemplates[eventType] || this.eventMessageTemplates.app_welcome;
    let template = templates[Math.floor(Math.random() * templates.length)];

    // Preenche placeholders dinâmicos
    const taskTitle = eventData.task ? (eventData.task.title || eventData.task.titulo) : (eventData.tarefa || "pendente");
    const subjectName = eventData.subject ? (eventData.subject.name || eventData.subject.nome) : (eventData.disciplina || "sua matéria");
    const percentual = eventData.percentual || 80;

    template = template
      .replace(/{nome}/g, firstName)
      .replace(/{tarefa}/g, taskTitle)
      .replace(/{disciplina}/g, subjectName)
      .replace(/{percentual}/g, percentual);

    const badgeText = eventType === "task_completed" ? "🎉 Tarefa Concluída!" :
                      eventType === "session_completed" ? "⏱️ Lição Finalizada!" :
                      eventType === "goal_reached" ? "🏆 Meta Batida!" :
                      eventType === "task_reminder" ? "⚠️ Lembrete" : "DuduTrack • Assistente AI";

    this.activeEventMessage = {
      state: eventType === "task_completed" || eventType === "goal_reached" ? "feliz" : "falando",
      category: eventType,
      badgeText: badgeText,
      text: template,
      actionText: eventType === "task_completed" ? "Ver tarefas" : null,
      actionRoute: eventType === "task_completed" ? "tasks" : null
    };

    // Re-renderiza o widget se ele estiver no DOM
    const widgetContainer = document.getElementById("dudutrack-container");
    if (widgetContainer) {
      this.renderIntoDOM(widgetContainer, this.activeEventMessage);
    }
  },

  async decidirMensagem() {
    if (this.activeEventMessage) {
      const msg = this.activeEventMessage;
      return msg;
    }

    const user = store.getCurrentUser() || { name: "Estudante" };
    const firstName = user.name ? user.name.split(" ")[0] : "Estudante";
    const subjects = store.getSubjects() || [];
    const tasks = store.getTasks() || [];

    // 1. Alertas de Prazo Crítico (vencendo em <= 48h)
    try {
      const notifRes = await fetch("/api/v1/notifications/pending", {
        headers: { "X-User-Id": user.id ? String(user.id) : "1" }
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        const pendingNotifs = notifData.notificacoes || notifData.notifications || [];
        if (pendingNotifs.length > 0) {
          const topNotif = pendingNotifs[0];
          return {
            state: "alerta",
            category: "prazo_critico",
            badgeText: "⚠️ Alerta de Prazo",
            text: `Ei <strong>${firstName}</strong>, a tarefa <strong>${topNotif.titulo || topNotif.task_title || 'pendente'}</strong> vence em <strong>${topNotif.dias_restantes || topNotif.days_left || 1} dia(s)</strong>! Já conseguiu adiantar? 🐾`,
            actionText: "Ver tarefa agora",
            actionRoute: "tasks",
            actionParams: { taskId: topNotif.id || topNotif.task_id }
          };
        }
      }
    } catch (e) {
      console.warn("[DuduTrack] Aviso ao buscar notificações:", e);
    }

    // 2. Insights de Desvio
    try {
      const insightsRes = await fetch("/api/v1/insights", {
        headers: { "X-User-Id": user.id ? String(user.id) : "1" }
      });
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        const insightsList = insightsData.insights || [];
        const critico = insightsList.find(i => i.severity === "critico" || i.deviation_percent >= 50);
        if (critico) {
          return {
            state: "alerta",
            category: "insight_critico",
            badgeText: "🚨 Alerta de Ritmo",
            text: `Notei que você está levando <strong>${Math.round(critico.deviation_percent)}% a mais</strong> de tempo em <strong>${critico.subject_name}</strong> do que planejou. Bora reorganizar juntos?`,
            actionText: "Ver disciplina",
            actionRoute: "subject-detail",
            actionParams: { subject_id: critico.subject_id }
          };
        }
      }
    } catch (e) {
      console.warn("[DuduTrack] Aviso ao buscar insights:", e);
    }

    // 3. Recomendação do Carrossel de Prioridades
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    if (pendingTasks.length > 0) {
      const nextTask = pendingTasks.sort((a, b) => new Date(a.due_date || a.prazo || '9999-12-31') - new Date(b.due_date || b.prazo || '9999-12-31'))[0];
      const subject = subjects.find(s => String(s.id) === String(nextTask.subject_id || nextTask.disciplina_id)) || { name: "suas matérias" };

      return {
        state: "falando",
        category: "carrossel_prioridade",
        badgeText: "🎯 Recomendação do Dia",
        text: `Pensando no que fazer agora, <strong>${firstName}</strong>? Eu sugiro focar em <strong>${nextTask.title || nextTask.titulo}</strong> (${subject.name}) — é a tarefa mais urgente!`,
        actionText: "Ver tarefa",
        actionRoute: "tasks",
        actionParams: { taskId: nextTask.id }
      };
    }

    // 4. Fallback Boas-Vindas / Saudação Neutra com variação
    const welcomePhrases = this.eventMessageTemplates.app_welcome;
    const randomWelcome = welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)].replace(/{nome}/g, firstName);

    return {
      state: "idle",
      category: "saudacao_neutra",
      badgeText: "DuduTrack • Assistente AI",
      text: randomWelcome,
      actionText: null
    };
  },

  renderIntoDOM(container, mensagem) {
    container.innerHTML = `
      <div class="dudutrack-widget ${mensagem.state}" id="dudutrack-widget-element">
        <div class="dudutrack-avatar-wrapper" title="DuduTrack - Seu assistente de estudos" id="dudutrack-avatar-trigger">
          ${this.renderSVGAvatar()}
        </div>
        <div class="dudutrack-bubble">
          <div class="dudutrack-header">
            <span class="dudutrack-badge">${mensagem.badgeText}</span>
            <button style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:0.85rem;" title="Fechar balão" id="dudutrack-close-btn">✕</button>
          </div>
          <div class="dudutrack-body">
            ${mensagem.text}
          </div>
          ${mensagem.actionText ? `
            <div class="dudutrack-footer">
              <button class="dudutrack-action-btn" id="dudutrack-action-btn">
                <span>${mensagem.actionText}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Eventos
    const actionBtn = container.querySelector("#dudutrack-action-btn");
    if (actionBtn && mensagem.actionRoute) {
      actionBtn.addEventListener("click", () => {
        router.navigate(mensagem.actionRoute, mensagem.actionParams || {});
      });
    }

    const closeBtn = container.querySelector("#dudutrack-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.activeEventMessage = null;
        const bubble = container.querySelector(".dudutrack-bubble");
        if (bubble) bubble.style.display = "none";
      });
    }
  },

  async render(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const mensagem = await this.decidirMensagem();
    this.renderIntoDOM(container, mensagem);
  }
};

// Disponibiliza o DuduTrack globalmente para disparos de eventos
window.DuduTrack = DuduTrack;
