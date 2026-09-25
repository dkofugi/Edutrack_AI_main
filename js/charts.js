/**
 * EduTrack AI — Renderizador de Gráficos Leves em SVG Puro
 * Permite alternar entre Gráfico de Barras e Gráfico de Pizza/Donut
 * representando o tempo/carga horária por disciplina.
 */

export class ChartRenderer {
  /**
   * Renderiza gráfico de barras de tempo/carga horária por disciplina
   */
  static renderBarChart(containerId, subjects) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!subjects || subjects.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
          Nenhuma disciplina cadastrada para exibir o gráfico.
        </div>
      `;
      return;
    }

    const maxHours = Math.max(...subjects.map(s => s.workload_hours || 0), 10);
    const chartHeight = 160;

    let barsSvg = "";
    const barWidth = 36;
    const gap = 16;
    const totalWidth = subjects.length * (barWidth + gap) + 20;

    subjects.forEach((subj, index) => {
      const hours = subj.workload_hours || 0;
      const height = Math.max(12, Math.round((hours / maxHours) * (chartHeight - 40)));
      const x = 10 + index * (barWidth + gap);
      const y = chartHeight - height - 24;
      const color = subj.color || "#10b981";
      const shortName = subj.name.length > 10 ? subj.name.substring(0, 8) + "..." : subj.name;

      barsSvg += `
        <g class="chart-bar-group" data-title="${subj.name}: ${hours}h">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="6" fill="${color}" opacity="0.9">
            <animate attributeName="height" from="0" to="${height}" dur="0.5s" fill="freeze" />
            <animate attributeName="y" from="${chartHeight - 24}" to="${y}" dur="0.5s" fill="freeze" />
          </rect>
          <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-main)">
            ${hours}h
          </text>
          <text x="${x + barWidth / 2}" y="${chartHeight - 6}" text-anchor="middle" font-size="10" font-weight="500" fill="var(--text-muted)">
            ${shortName}
          </text>
        </g>
      `;
    });

    container.innerHTML = `
      <div style="overflow-x: auto; width: 100%; padding-bottom: 4px;">
        <svg viewBox="0 0 ${Math.max(totalWidth, 320)} ${chartHeight}" style="width: 100%; min-width: ${Math.max(totalWidth, 320)}px; height: ${chartHeight}px; display: block;">
          <line x1="0" y1="${chartHeight - 22}" x2="${Math.max(totalWidth, 320)}" y2="${chartHeight - 22}" stroke="var(--border-color)" stroke-width="1.5" />
          ${barsSvg}
        </svg>
      </div>
    `;
  }

  /**
   * Renderiza gráfico Donut/Pizza em SVG
   */
  static renderDonutChart(containerId, subjects) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!subjects || subjects.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted)">Sem dados</div>`;
      return;
    }

    const totalHours = subjects.reduce((sum, s) => sum + (s.workload_hours || 0), 0) || 1;
    let accumulatedAngle = 0;
    const size = 180;
    const center = size / 2;
    const radius = 60;
    const strokeWidth = 26;

    let slices = "";

    subjects.forEach(subj => {
      const hours = subj.workload_hours || 0;
      const fraction = hours / totalHours;
      const angle = fraction * 360;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (circumference * fraction);
      const rotation = accumulatedAngle - 90;
      const color = subj.color || "#10b981";

      slices += `
        <circle cx="${center}" cy="${center}" r="${radius}" 
          fill="none" 
          stroke="${color}" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${circumference}" 
          stroke-dashoffset="${strokeDashoffset}"
          transform="rotate(${rotation} ${center} ${center})"
          opacity="0.95"
        />
      `;
      accumulatedAngle += angle;
    });

    const legendHtml = subjects.map(s => `
      <div class="legend-item" title="${s.name}">
        <span class="legend-color" style="background-color: ${s.color || '#10b981'};"></span>
        <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${s.name} (${s.workload_hours}h)
        </span>
      </div>
    `).join("");

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
            ${slices}
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <span style="font-size: 1.3rem; font-weight: 800; color: var(--primary-600); display: block; line-height: 1;">
              ${totalHours}h
            </span>
            <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total</span>
          </div>
        </div>
        <div class="chart-legend" style="justify-content: center;">
          ${legendHtml}
        </div>
      </div>
    `;
  }
}
