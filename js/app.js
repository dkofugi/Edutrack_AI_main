/**
 * EduTrack AI — App Bootstrap & Global Controllers (Web / PC Desktop & Mobile)
 * Inicialização dos módulos, registro de rotas, navegação em Sidebar Desktop,
 * navegação inferior móvel, atalhos rápidos e notificações.
 */

import { store } from "./store.js?v=2.0";
import { themeManager } from "./theme.js";
import { router } from "./router.js";
import { AuthView } from "./views/authView.js";
import { DashboardView } from "./views/dashboardView.js";
import { SubjectsView } from "./views/subjectsView.js";
import { SubjectDetailView } from "./views/subjectDetailView.js";
import { TasksView } from "./views/tasksView.js";
import { ProfileModal } from "./views/profileModal.js";
import { studyTimer } from "./timer.js";

// Disponibiliza o cronômetro para todas as views
window.studyTimer = studyTimer;

// Toast global
window.appToast = function (message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === 'danger' ? 'toast-danger' : type === 'warning' ? 'toast-warning' : ''}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-muted);" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }
  }, 3200);
};

// Registro de rotas
router.registerRoute("login", (container) => AuthView.renderLogin(container));
router.registerRoute("register", (container) => AuthView.renderRegister(container));
router.registerRoute("forgot-password", (container) => AuthView.renderForgotPassword(container));
router.registerRoute("dashboard", (container) => DashboardView.render(container));
router.registerRoute("subjects", (container) => SubjectsView.render(container));
router.registerRoute("subject-detail", (container, params) => SubjectDetailView.render(container, params));
router.registerRoute("tasks", (container) => TasksView.render(container));

// Atualização de abas e itens ativos na Sidebar e Bottom Nav
router.onNavigate((routeName) => {
  // 1. Atualizar Sidebar Desktop
  const sidebarItems = document.querySelectorAll(".desktop-sidebar .sidebar-nav-item");
  sidebarItems.forEach(item => {
    const targetRoute = item.getAttribute("data-route");
    if (targetRoute === routeName || (routeName === "subject-detail" && targetRoute === "subjects")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // 2. Atualizar Bottom Nav Mobile
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  navItems.forEach(item => {
    const targetRoute = item.getAttribute("data-route");
    if (targetRoute === routeName || (routeName === "subject-detail" && targetRoute === "subjects")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // 3. Atualizar visibilidade do botão logout no cabeçalho mobile
  const logoutBtn = document.getElementById("btn-header-logout");
  if (logoutBtn) {
    if (["login", "register", "forgot-password"].includes(routeName)) {
      logoutBtn.style.display = "none";
    } else {
      logoutBtn.style.display = "inline-flex";
    }
  }

  // 4. Atualizar dados do usuário na Sidebar
  window.updateSidebarUserProfile();
});

window.updateSidebarUserProfile = function updateSidebarUserProfile() {
  const user = store.getCurrentUser();
  const nameEl = document.getElementById("sidebar-user-name");
  const emailEl = document.getElementById("sidebar-user-email");
  const avatarEl = document.getElementById("sidebar-user-avatar");

  if (user) {
    if (nameEl) nameEl.innerText = user.name;
    if (emailEl) emailEl.innerText = user.email;
    if (avatarEl) avatarEl.innerText = (user.name || "A").charAt(0).toUpperCase();
  } else {
    if (nameEl) nameEl.innerText = "Visitante";
    if (emailEl) emailEl.innerText = "Não logado";
  }
}

// Inicialização após carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  // 1. Vincula botões de alternância de tema (Mobile e Desktop Sidebar)
  const themeBtnMobile = document.getElementById("btn-toggle-theme");
  const themeBtnSidebar = document.getElementById("sidebar-btn-theme");
  themeManager.bindToggleBtn(themeBtnMobile);
  themeManager.bindToggleBtn(themeBtnSidebar);

  // 2. Vincula navegação da Sidebar Desktop
  const sideDashboard = document.getElementById("sidebar-nav-dashboard");
  const sideSubjects = document.getElementById("sidebar-nav-subjects");
  const sideTasks = document.getElementById("sidebar-nav-tasks");

  if (sideDashboard) sideDashboard.addEventListener("click", () => router.navigate("dashboard"));
  if (sideSubjects) sideSubjects.addEventListener("click", () => router.navigate("subjects"));
  if (sideTasks) sideTasks.addEventListener("click", () => router.navigate("tasks"));

  // 3. Vincula atalhos rápidos da Sidebar Desktop
  const sideStartLesson = document.getElementById("sidebar-btn-start-lesson");
  const sideNewSubject = document.getElementById("sidebar-btn-new-subject");
  const sideNewTask = document.getElementById("sidebar-btn-new-task");
  const headerStartLesson = document.getElementById("btn-header-start-lesson");

  if (sideStartLesson) {
    sideStartLesson.addEventListener("click", () => {
      studyTimer.openStartLessonModal();
    });
  }

  if (headerStartLesson) {
    headerStartLesson.addEventListener("click", () => {
      studyTimer.openStartLessonModal();
    });
  }

  if (sideNewSubject) {
    sideNewSubject.addEventListener("click", () => {
      SubjectsView.openSubjectModal();
    });
  }

  if (sideNewTask) {
    sideNewTask.addEventListener("click", () => {
      TasksView.openTaskModal(null, null, () => {
        if (router.currentRoute === "dashboard") {
          DashboardView.render(document.getElementById("main-content"));
        } else if (router.currentRoute === "tasks") {
          TasksView.render(document.getElementById("main-content"));
        } else if (router.currentRoute === "subjects") {
          SubjectsView.render(document.getElementById("main-content"));
        }
      });
    });
  }

  // 4. Inicializa o Cronômetro de Estudo flutuante
  studyTimer.init();

  // 5. Vincula navegação inferior móvel
  const navDashboard = document.getElementById("nav-dashboard");
  const navSubjects = document.getElementById("nav-subjects");
  const navTasks = document.getElementById("nav-tasks");

  if (navDashboard) navDashboard.addEventListener("click", () => router.navigate("dashboard"));
  if (navSubjects) navSubjects.addEventListener("click", () => router.navigate("subjects"));
  if (navTasks) navTasks.addEventListener("click", () => router.navigate("tasks"));

  // 6. Botões de Logout (Mobile e Desktop)
  const logoutBtnHeader = document.getElementById("btn-header-logout");
  const logoutBtnSidebar = document.getElementById("sidebar-btn-logout");

  const doLogout = () => {
    store.logout();
    window.appToast("Você saiu da conta.", "info");
    router.navigate("login");
  };

  if (logoutBtnHeader) logoutBtnHeader.addEventListener("click", doLogout);
  if (logoutBtnSidebar) logoutBtnSidebar.addEventListener("click", doLogout);

  // 7. Atualizar perfil
  window.updateSidebarUserProfile();


  // 9. Perfil
  const sidebarUserCard = document.querySelector(".sidebar-user-card");
  if (sidebarUserCard) {
    sidebarUserCard.style.cursor = "pointer";
    sidebarUserCard.title = "Editar Perfil";
    sidebarUserCard.addEventListener("click", () => {
      ProfileModal.open();
    });
  }

  // 8. Determina rota inicial
  if (store.isAuthenticated()) {
    router.navigate("dashboard");
  } else {
    router.navigate("login");
  }
});
