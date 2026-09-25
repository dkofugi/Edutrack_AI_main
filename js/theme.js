/**
 * EduTrack AI — Gerenciamento de Tema (Claro / Escuro)
 * Suporte a múltiplos botões (Sidebar Desktop e Header Mobile),
 * detecção da preferência do sistema e persistência em localStorage.
 */

const THEME_KEY = "edutrack_theme";

export class ThemeManager {
  constructor() {
    this.buttons = [];
    this.currentTheme = this.getInitialTheme();
    this.applyTheme(this.currentTheme);
  }

  getInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    // Preferência do sistema operacional
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(THEME_KEY, theme);
    this.updateToggleIcons();
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(nextTheme);
  }

  bindToggleBtn(buttonElement) {
    if (!buttonElement) return;
    this.buttons.push(buttonElement);
    buttonElement.addEventListener("click", () => this.toggleTheme());
    this.updateButtonIcon(buttonElement);
  }

  updateToggleIcons() {
    this.buttons.forEach(btn => this.updateButtonIcon(btn));
  }

  updateButtonIcon(btn) {
    if (!btn) return;

    const isSidebarBtn = btn.id === "sidebar-btn-theme";

    if (this.currentTheme === "dark") {
      if (isSidebarBtn) {
        btn.innerHTML = `<span>☀️</span><span>Tema Claro</span>`;
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
      }
      btn.setAttribute("title", "Mudar para Tema Claro");
    } else {
      if (isSidebarBtn) {
        btn.innerHTML = `<span>🌙</span><span>Tema Escuro</span>`;
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      }
      btn.setAttribute("title", "Mudar para Tema Escuro");
    }
  }
}

export const themeManager = new ThemeManager();
