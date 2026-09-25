/**
 * EduTrack AI — SPA Router & Navigation Controller
 * Gerencia histórico de telas, fluxo de navegação dinâmico e botão "Voltar" consistente.
 */

export class Router {
  constructor() {
    this.currentRoute = null;
    this.currentParams = {};
    this.historyStack = [];
    this.routes = {};
    this.onNavigateCallback = null;
  }

  registerRoute(name, renderHandler) {
    this.routes[name] = renderHandler;
  }

  onNavigate(callback) {
    this.onNavigateCallback = callback;
  }

  navigate(name, params = {}, addToHistory = true) {
    if (!this.routes[name]) {
      console.error(`Rota "${name}" não encontrada.`);
      return;
    }

    if (addToHistory && this.currentRoute && this.currentRoute !== name) {
      this.historyStack.push({
        route: this.currentRoute,
        params: { ...this.currentParams }
      });
    }

    // Se estiver indo para login ou dashboard explicitamente, podemos limpar pilha se apropriado
    if (name === "login") {
      this.historyStack = [];
    }

    this.currentRoute = name;
    this.currentParams = params;

    // Atualiza visibilidade da barra inferior e cabeçalho
    this.updateLayoutState(name);

    // Renderiza a view registrada
    const contentContainer = document.getElementById("main-content");
    if (contentContainer) {
      this.routes[name](contentContainer, params);
      window.scrollTo(0, 0);
    }

    // Callback de notificação (ex: atualizar aba ativa na barra de navegação)
    if (this.onNavigateCallback) {
      this.onNavigateCallback(name, params);
    }
  }

  back() {
    if (this.historyStack.length > 0) {
      const prev = this.historyStack.pop();
      this.navigate(prev.route, prev.params, false);
      return;
    }

    // Fallbacks inteligentes caso não haja histórico
    if (this.currentRoute === "register" || this.currentRoute === "forgot-password") {
      this.navigate("login", {}, false);
    } else if (this.currentRoute === "subject-detail") {
      this.navigate("dashboard", {}, false);
    } else if (this.currentRoute === "subjects" || this.currentRoute === "tasks") {
      this.navigate("dashboard", {}, false);
    } else if (this.currentRoute === "dashboard") {
      this.navigate("login", {}, false);
    }
  }

  canGoBack() {
    return this.historyStack.length > 0 || 
      ["register", "forgot-password", "subject-detail", "subjects", "tasks"].includes(this.currentRoute);
  }

  updateLayoutState(routeName) {
    const isAuthRoute = ["login", "register", "forgot-password"].includes(routeName);
    const bottomNav = document.getElementById("bottom-nav");
    const appWrapper = document.getElementById("app");

    if (bottomNav) {
      if (isAuthRoute) {
        bottomNav.classList.add("hidden");
      } else {
        bottomNav.classList.remove("hidden");
      }
    }

    if (appWrapper) {
      if (isAuthRoute) {
        appWrapper.classList.add("auth-mode");
      } else {
        appWrapper.classList.remove("auth-mode");
      }
    }
  }
}

export const router = new Router();
