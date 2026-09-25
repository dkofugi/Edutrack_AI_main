import { store } from "../store.js";

export const AdvancedMetricsView = {
  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Loading state
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">Carregando métricas avançadas...</div>`;

    const subjects = store.getSubjects();
    const metrics = store.getDashboardMetrics();
    
    // Calcula dias estudados a partir das sessões
    const sessions = store.data.study_sessions || [];
    const uniqueDays = new Set(sessions.map(s => s.started_at ? s.started_at.split('T')[0] : ''));
    uniqueDays.delete('');
    const dias_estudados = Math.max(1, uniqueDays.size);

    const payload = {
      disciplinas: subjects.map(s => ({
        id: s.id,
        name: s.name,
        color: s.color || 'var(--primary-500)',
        workload_hours: s.workload_hours,
        progress_percent: store.getSubjectProgress(s.id)
      })),
      tarefas_concluidas: metrics.completedTasks,
      tarefas_pendentes: metrics.pendingTasks,
      dias_estudados: dias_estudados
    };

    try {
      const data = await store._fetchJson("/api/v1/metrics/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      this.renderCards(container, data, payload);
    } catch (err) {
      container.innerHTML = `<div style="padding: 15px; color: var(--danger); background: var(--bg-surface); border-radius: 8px;">Erro ao carregar métricas avançadas: ${err.message}</div>`;
    }
  },

  renderCards(container, data, payload) {
    const progresso = data.progresso_ponderado || 0;
    const diasEstimadosOriginais = data.dias_estimados || -1;
    const pesos = data.pesos_disciplinas || {};
    
    // Animação SVG Ring
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progresso / 100) * circumference;

    // Peso details html
    const pesosHtml = payload.disciplinas.map(d => {
      const peso = pesos[d.id] || 0;
      return `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 4px;">
          <span style="color: ${d.color}">● ${d.name}</span>
          <span style="color: var(--text-muted);">${peso}% peso</span>
        </div>
      `;
    }).join('');

    const calcSpeed = (payload.tarefas_concluidas / payload.dias_estudados).toFixed(1);
    
    container.innerHTML = `
      <div class="advanced-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
        
        <!-- Card 1: Progresso Ponderado -->
        <div class="stat-card" id="card-progresso-ponderado" style="cursor: pointer; position: relative; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="stat-label">Progresso Ponderado</div>
              <div class="text-sm" style="color: var(--text-muted); font-size: 0.75rem; margin-top: 2px;">
                Baseado na carga horária
              </div>
            </div>
            
            <div style="position: relative; width: 80px; height: 80px;">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="8"></circle>
                <circle cx="40" cy="40" r="${radius}" fill="none" stroke="var(--primary-500)" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease-in-out; transform: rotate(-90deg); transform-origin: 50% 50%;"></circle>
              </svg>
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: var(--text-main);">
                ${progresso}%
              </div>
            </div>
          </div>
          
          <div id="pesos-details" style="display: none; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px;">
            <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; color: var(--text-subtle);">Peso por Disciplina</div>
            ${pesosHtml || '<div class="text-sm">Sem dados de disciplinas.</div>'}
          </div>
        </div>

        <!-- Card 2: Previsão de Conclusão -->
        <div class="stat-card">
          <div class="stat-label" style="margin-bottom: 12px;">Previsão de Conclusão</div>
          
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="stat-value" id="dias-estimados-text" style="color: var(--primary-600); font-size: 2rem;">
              ${diasEstimadosOriginais > 0 ? `~${diasEstimadosOriginais} dias` : 'N/A'}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.2;">
              para concluir ${payload.tarefas_pendentes} pendências.
            </div>
          </div>

          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; color: var(--text-subtle);">
              <span>Ritmo (tarefas/dia):</span>
              <strong id="ritmo-display">${calcSpeed}</strong>
            </div>
            <input type="range" id="ritmo-slider" min="0.1" max="10" step="0.1" value="${calcSpeed}" style="width: 100%; accent-color: var(--primary-500);" ${payload.tarefas_pendentes === 0 ? 'disabled' : ''}>
          </div>
        </div>
        
      </div>
    `;

    // Interatividade do Card 1
    const cardProgresso = container.querySelector('#card-progresso-ponderado');
    const pesosDetails = container.querySelector('#pesos-details');
    cardProgresso.addEventListener('click', () => {
      if (pesosDetails.style.display === 'none') {
        pesosDetails.style.display = 'block';
      } else {
        pesosDetails.style.display = 'none';
      }
    });

    // Interatividade do Card 2
    const slider = container.querySelector('#ritmo-slider');
    const ritmoDisplay = container.querySelector('#ritmo-display');
    const diasEstimadosText = container.querySelector('#dias-estimados-text');
    
    if (slider) {
      slider.addEventListener('input', (e) => {
        const vel = parseFloat(e.target.value);
        ritmoDisplay.innerText = vel.toFixed(1);
        
        if (payload.tarefas_pendentes > 0 && vel > 0) {
          const diasCalc = Math.round(payload.tarefas_pendentes / vel);
          diasEstimadosText.innerText = `~${diasCalc} dias`;
        } else {
          diasEstimadosText.innerText = 'N/A';
        }
      });
    }
  }
};
