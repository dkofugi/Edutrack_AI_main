/**
 * EduTrack AI — State Management (Store)
 * Persistência local reativa em localStorage com operações CRUD
 * para usuários, disciplinas (subjects) e tarefas acadêmicas (academic_tasks).
 */

import { initialMockData } from "./data/mockData.js";

const STORAGE_KEY = "edutrack_data_v1";
const AUTH_KEY = "edutrack_auth_user";
const ACTIVE_TIMER_KEY = "edutrack_active_timer";

class Store {
  constructor() {
    this.data = this.loadData();
    this.currentUser = this.loadAuth();
    this.listeners = [];
    this.loading = false;

    if (this.currentUser) {
      this.syncWithBackend();
    }
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.study_sessions) {
          parsed.study_sessions = JSON.parse(JSON.stringify(initialMockData.study_sessions || []));
          this.saveData(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Erro ao carregar localStorage:", e);
    }
    // Inicializa com dados mockados
    this.saveData(initialMockData);
    return JSON.parse(JSON.stringify(initialMockData));
  }

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }

  loadAuth() {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Erro ao carregar auth:", e);
    }
    return null; // Não logado por padrão para permitir testar a tela de login primeiro
  }

  saveAuth(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  // --- REQUISIÇÕES HTTP SEGURAS (PROTEÇÃO CONTRA UNEXPECTED TOKEN) ---
  async _fetchJson(url, options = {}) {
    const base = (typeof window !== "undefined" && window.location.protocol.startsWith("http") && window.location.port !== "8000" && !url.startsWith("http"))
      ? `http://${window.location.hostname || "localhost"}:8000`
      : "";
    const targetUrl = `${base}${url}`;

    let response;
    try {
      response = await fetch(targetUrl, options);
    } catch (netErr) {
      throw new Error("Não foi possível conectar ao servidor backend (localhost:8000). Certifique-se de que 'py server.py' está em execução.");
    }

    const contentType = response.headers.get("Content-Type") || "";
    let data;

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("Erro de parsing: resposta do backend não é um JSON válido.");
      }
    } else {
      // Backend retornou HTML ou texto em vez de JSON
      const text = await response.text();
      const cleanText = text.replace(/<[^>]*>/g, " ").trim().replace(/\s+/g, " ");
      const preview = cleanText.slice(0, 100);
      throw new Error(`Erro do servidor (${response.status}): ${preview || "Resposta inesperada não-JSON recebida."}`);
    }

    if (!response.ok || data.sucesso === false) {
      throw new Error(data.mensagem || "Ocorreu um erro na operação.");
    }

    return data;
  }

  // --- AUTENTICAÇÃO ---
  isAuthenticated() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async login(email, password) {
    const data = await this._fetchJson("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email, senha: password })
    });

    const user = {
      id: data.usuario.id,
      name: (data.usuario.login || email).split("@")[0].replace(".", " "),
      email: data.usuario.login || email
    };
    this.saveAuth(user);
    return user;
  }

  async register(name, email, password) {
    const data = await this._fetchJson("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email, senha: password, situacao: "ativo" })
    });

    const user = {
      id: data.usuario.id,
      name: name,
      email: data.usuario.login || email
    };
    this.saveAuth(user);
    return user;
  }

  async recoverPassword(email) {
    return await this._fetchJson("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email })
    });
  }

  async resetPassword(email, newPassword, token = null) {
    return await this._fetchJson("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email, nova_senha: newPassword, token })
    });
  }

  logout() {
    this.saveAuth(null);
  }

  async syncWithBackend() {
    if (!this.currentUser || !this.currentUser.id) return;
    this.loading = true;
    this.notify();

    try {
      const [resSub, resTask, resSess] = await Promise.all([
        this._fetchJson(`/api/disciplinas?usuario_id=${this.currentUser.id}`),
        this._fetchJson(`/api/tarefas?usuario_id=${this.currentUser.id}`),
        this._fetchJson(`/api/sessoes?usuario_id=${this.currentUser.id}`)
      ]);

      if (resSub && (resSub.disciplinas || resSub.subjects)) {
        this.data.subjects = resSub.disciplinas || resSub.subjects;
      }
      if (resTask && (resTask.tarefas || resTask.academic_tasks)) {
        this.data.academic_tasks = resTask.tarefas || resTask.academic_tasks;
      }
      if (resSess && (resSess.sessoes || resSess.study_sessions)) {
        this.data.study_sessions = resSess.sessoes || resSess.study_sessions;
      }
      this.saveData(this.data);
    } catch (e) {
      console.warn("Erro ao sincronizar com backend PostgreSQL:", e);
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  saveAuth(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      this.syncWithBackend();
    } else {
      localStorage.removeItem(AUTH_KEY);
      this.notify();
    }
  }

  // --- DISCIPLINAS (SUBJECTS) ---
  getSubjects() {
    return this.data.subjects || [];
  }

  getSubjectById(id) {
    const numId = Number(id);
    return (this.data.subjects || []).find(s => s.id === numId) || null;
  }

  async addSubject(subjectData) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const payload = {
      usuario_id: userId,
      nome: subjectData.name ? subjectData.name.trim() : "",
      professor: subjectData.professor ? subjectData.professor.trim() : "",
      carga_horaria: parseInt(subjectData.workload_hours, 10) || 0,
      descricao: subjectData.description ? subjectData.description.trim() : "",
      data_inicio: subjectData.start_date || "",
      data_fim: subjectData.end_date || "",
      cor: subjectData.color || "#10b981"
    };

    try {
      const res = await this._fetchJson("/api/disciplinas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify(payload)
      });
      const newSubject = res.disciplina || res.subject;
      this.data.subjects = this.data.subjects || [];
      this.data.subjects.push(newSubject);
      this.saveData(this.data);
      this.notify();
      return newSubject;
    } catch (e) {
      console.error("Erro ao adicionar disciplina:", e);
      throw e;
    }
  }

  async updateSubject(id, subjectData) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const numId = Number(id);
    const payload = {
      id: numId,
      usuario_id: userId,
      nome: subjectData.name ? subjectData.name.trim() : "",
      professor: subjectData.professor ? subjectData.professor.trim() : "",
      carga_horaria: parseInt(subjectData.workload_hours, 10) || 0,
      descricao: subjectData.description ? subjectData.description.trim() : "",
      data_inicio: subjectData.start_date || "",
      data_fim: subjectData.end_date || "",
      cor: subjectData.color || "#10b981"
    };

    try {
      const res = await this._fetchJson("/api/disciplinas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify(payload)
      });
      const updated = res.disciplina || res.subject;
      const index = (this.data.subjects || []).findIndex(s => s.id === numId);
      if (index !== -1) {
        this.data.subjects[index] = updated;
      }
      this.saveData(this.data);
      this.notify();
      return updated;
    } catch (e) {
      console.error("Erro ao atualizar disciplina:", e);
      throw e;
    }
  }

  async deleteSubject(id) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const numId = Number(id);

    try {
      await this._fetchJson(`/api/disciplinas?id=${numId}&usuario_id=${userId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": String(userId)
        }
      });
      this.data.subjects = (this.data.subjects || []).filter(s => s.id !== numId);
      this.data.academic_tasks = (this.data.academic_tasks || []).filter(t => (t.subject_id || t.disciplina_id) !== numId);
      this.saveData(this.data);
      this.notify();
    } catch (e) {
      console.error("Erro ao deletar disciplina:", e);
      throw e;
    }
  }

  // --- TAREFAS ACADÊMICAS (ACADEMIC_TASKS) ---
  getTasks(subjectId = null, filterStatus = null) {
    let tasks = this.data.academic_tasks || [];
    if (subjectId !== null) {
      const numSubjectId = Number(subjectId);
      tasks = tasks.filter(t => (t.subject_id || t.disciplina_id) === numSubjectId);
    }
    if (filterStatus && filterStatus !== "all") {
      tasks = tasks.filter(t => t.status === filterStatus);
    }
    return tasks;
  }

  getTaskById(id) {
    const numId = Number(id);
    return (this.data.academic_tasks || []).find(t => t.id === numId) || null;
  }

  async addTask(taskData) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const payload = {
      usuario_id: userId,
      disciplina_id: Number(taskData.subject_id || taskData.disciplina_id),
      titulo: taskData.title ? taskData.title.trim() : "",
      descricao: taskData.description ? taskData.description.trim() : "",
      prazo: taskData.due_date || "",
      status: taskData.status || "pending"
    };

    try {
      const res = await this._fetchJson("/api/tarefas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify(payload)
      });
      const newTask = res.tarefa || res.task;
      this.data.academic_tasks = this.data.academic_tasks || [];
      this.data.academic_tasks.push(newTask);
      this.saveData(this.data);
      this.notify();
      return newTask;
    } catch (e) {
      console.error("Erro ao adicionar tarefa:", e);
      throw e;
    }
  }

  async updateTask(id, taskData) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const numId = Number(id);
    const payload = {
      id: numId,
      usuario_id: userId,
      disciplina_id: Number(taskData.subject_id || taskData.disciplina_id),
      titulo: taskData.title ? taskData.title.trim() : (taskData.titulo || ""),
      descricao: taskData.description ? taskData.description.trim() : (taskData.descricao || ""),
      prazo: taskData.due_date || taskData.prazo || "",
      status: taskData.status || "pending"
    };

    try {
      const res = await this._fetchJson("/api/tarefas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify(payload)
      });
      const updated = res.tarefa || res.task;
      const index = (this.data.academic_tasks || []).findIndex(t => t.id === numId);
      if (index !== -1) {
        this.data.academic_tasks[index] = updated;
      }
      this.saveData(this.data);
      this.notify();
      return updated;
    } catch (e) {
      console.error("Erro ao atualizar tarefa:", e);
      throw e;
    }
  }

  async toggleTaskStatus(id) {
    const numId = Number(id);
    const task = this.getTaskById(numId);
    if (!task) return null;

    const nextStatus = task.status === "completed" ? "pending" : "completed";
    return await this.updateTask(numId, { ...task, status: nextStatus });
  }

  async deleteTask(id) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const numId = Number(id);

    try {
      await this._fetchJson(`/api/tarefas?id=${numId}&usuario_id=${userId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": String(userId)
        }
      });
      this.data.academic_tasks = (this.data.academic_tasks || []).filter(t => t.id !== numId);
      this.saveData(this.data);
      this.notify();
    } catch (e) {
      console.error("Erro ao deletar tarefa:", e);
      throw e;
    }
  }

  // --- SESSÕES DE ESTUDO & CRONÔMETRO (STUDY_SESSIONS) ---
  getStudySessions(subjectId = null) {
    let sessions = this.data.study_sessions || [];
    if (subjectId !== null) {
      const numSubjectId = Number(subjectId);
      sessions = sessions.filter(s => (s.subject_id || s.disciplina_id) === numSubjectId);
    }
    return sessions;
  }

  async addStudySession(sessionData) {
    const userId = this.currentUser ? this.currentUser.id : 1;
    const payload = {
      usuario_id: userId,
      disciplina_id: Number(sessionData.subject_id || sessionData.disciplina_id),
      tarefa_id: sessionData.task_id || sessionData.tarefa_id ? Number(sessionData.task_id || sessionData.tarefa_id) : null,
      titulo_licao: (sessionData.lesson_title || sessionData.titulo_licao || "Sessão de Estudos").trim(),
      duracao_segundos: Math.max(1, Math.round(sessionData.duration_seconds || sessionData.duracao_segundos || 0)),
      iniciado_em: sessionData.started_at || sessionData.iniciado_em || new Date().toISOString(),
      finalizado_em: sessionData.ended_at || sessionData.finalizado_em || new Date().toISOString()
    };

    try {
      const res = await this._fetchJson("/api/sessoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId)
        },
        body: JSON.stringify(payload)
      });
      const newSession = res.sessao || res.study_session;
      this.data.study_sessions = this.data.study_sessions || [];
      this.data.study_sessions.unshift(newSession);
      this.saveData(this.data);
      this.notify();
      return newSession;
    } catch (e) {
      console.error("Erro ao salvar sessão de estudo:", e);
      throw e;
    }
  }

  getTotalStudyTime(subjectId = null) {
    const sessions = this.getStudySessions(subjectId);
    return sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  }

  // Persistência do cronômetro ativo entre navegações de tela e recarregamento F5
  getActiveTimer() {
    try {
      const stored = localStorage.getItem(ACTIVE_TIMER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn("Erro ao ler active timer:", e);
      return null;
    }
  }

  saveActiveTimer(timerState) {
    try {
      if (timerState) {
        localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timerState));
      } else {
        localStorage.removeItem(ACTIVE_TIMER_KEY);
      }
    } catch (e) {
      console.error("Erro ao salvar active timer:", e);
    }
  }

  clearActiveTimer() {
    try {
      localStorage.removeItem(ACTIVE_TIMER_KEY);
    } catch (e) {
      console.error("Erro ao limpar active timer:", e);
    }
  }

  // --- CÁLCULOS E MÉTRICAS ---
  getSubjectProgress(subjectId) {
    const tasks = this.getTasks(subjectId);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  }

  getDashboardMetrics() {
    const subjects = this.getSubjects();
    const tasks = this.getTasks();
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
    const totalHours = subjects.reduce((sum, s) => sum + (s.workload_hours || 0), 0);
    const totalStudySeconds = this.getTotalStudyTime();
    const totalStudySessions = (this.data.study_sessions || []).length;

    return {
      totalSubjects: subjects.length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      totalHours,
      totalStudySeconds,
      totalStudySessions
    };
  }

  resetMockData() {
    this.data = JSON.parse(JSON.stringify(initialMockData));
    this.saveData(this.data);
    this.clearActiveTimer();
    this.notify();
  }
}

export const store = new Store();
