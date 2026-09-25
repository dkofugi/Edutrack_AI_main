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

  // --- DISCIPLINAS (SUBJECTS) ---
  getSubjects() {
    return this.data.subjects || [];
  }

  getSubjectById(id) {
    const numId = Number(id);
    return this.data.subjects.find(s => s.id === numId) || null;
  }

  addSubject(subjectData) {
    const newSubject = {
      id: Date.now(),
      user_id: this.currentUser ? this.currentUser.id : 1,
      name: subjectData.name.trim(),
      professor: subjectData.professor ? subjectData.professor.trim() : "",
      workload_hours: parseInt(subjectData.workload_hours, 10) || 0,
      description: subjectData.description ? subjectData.description.trim() : "",
      start_date: subjectData.start_date || "",
      end_date: subjectData.end_date || "",
      color: subjectData.color || "#10b981",
      created_at: new Date().toISOString()
    };

    this.data.subjects.push(newSubject);
    this.saveData(this.data);
    this.notify();
    return newSubject;
  }

  updateSubject(id, subjectData) {
    const numId = Number(id);
    const index = this.data.subjects.findIndex(s => s.id === numId);
    if (index === -1) return null;

    this.data.subjects[index] = {
      ...this.data.subjects[index],
      name: subjectData.name.trim(),
      professor: subjectData.professor ? subjectData.professor.trim() : "",
      workload_hours: parseInt(subjectData.workload_hours, 10) || 0,
      description: subjectData.description ? subjectData.description.trim() : "",
      start_date: subjectData.start_date || "",
      end_date: subjectData.end_date || "",
      color: subjectData.color || this.data.subjects[index].color,
      updated_at: new Date().toISOString()
    };

    this.saveData(this.data);
    this.notify();
    return this.data.subjects[index];
  }

  deleteSubject(id) {
    const numId = Number(id);
    this.data.subjects = this.data.subjects.filter(s => s.id !== numId);
    // Remove também as tarefas vinculadas (ON DELETE CASCADE)
    this.data.academic_tasks = this.data.academic_tasks.filter(t => t.subject_id !== numId);
    this.saveData(this.data);
    this.notify();
  }

  // --- TAREFAS ACADÊMICAS (ACADEMIC_TASKS) ---
  getTasks(subjectId = null, filterStatus = null) {
    let tasks = this.data.academic_tasks || [];
    if (subjectId !== null) {
      const numSubjectId = Number(subjectId);
      tasks = tasks.filter(t => t.subject_id === numSubjectId);
    }
    if (filterStatus && filterStatus !== "all") {
      tasks = tasks.filter(t => t.status === filterStatus);
    }
    return tasks;
  }

  getTaskById(id) {
    const numId = Number(id);
    return this.data.academic_tasks.find(t => t.id === numId) || null;
  }

  addTask(taskData) {
    const newTask = {
      id: Date.now(),
      subject_id: Number(taskData.subject_id),
      user_id: this.currentUser ? this.currentUser.id : 1,
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : "",
      due_date: taskData.due_date || "",
      status: taskData.status || "pending",
      created_at: new Date().toISOString()
    };

    this.data.academic_tasks.push(newTask);
    this.saveData(this.data);
    this.notify();
    return newTask;
  }

  updateTask(id, taskData) {
    const numId = Number(id);
    const index = this.data.academic_tasks.findIndex(t => t.id === numId);
    if (index === -1) return null;

    this.data.academic_tasks[index] = {
      ...this.data.academic_tasks[index],
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : "",
      due_date: taskData.due_date || "",
      status: taskData.status || this.data.academic_tasks[index].status,
      updated_at: new Date().toISOString()
    };

    this.saveData(this.data);
    this.notify();
    return this.data.academic_tasks[index];
  }

  toggleTaskStatus(id) {
    const numId = Number(id);
    const task = this.getTaskById(numId);
    if (!task) return null;

    const nextStatus = task.status === "completed" ? "pending" : "completed";
    return this.updateTask(numId, { ...task, status: nextStatus });
  }

  deleteTask(id) {
    const numId = Number(id);
    this.data.academic_tasks = this.data.academic_tasks.filter(t => t.id !== numId);
    this.saveData(this.data);
    this.notify();
  }

  // --- SESSÕES DE ESTUDO & CRONÔMETRO (STUDY_SESSIONS) ---
  getStudySessions(subjectId = null) {
    let sessions = this.data.study_sessions || [];
    if (subjectId !== null) {
      const numSubjectId = Number(subjectId);
      sessions = sessions.filter(s => s.subject_id === numSubjectId);
    }
    return sessions;
  }

  addStudySession(sessionData) {
    this.data.study_sessions = this.data.study_sessions || [];
    const newSession = {
      id: Date.now(),
      user_id: this.currentUser ? this.currentUser.id : 1,
      subject_id: Number(sessionData.subject_id),
      task_id: sessionData.task_id ? Number(sessionData.task_id) : null,
      lesson_title: (sessionData.lesson_title || "Sessão de Estudos").trim(),
      duration_seconds: Math.max(1, Math.round(sessionData.duration_seconds || 0)),
      started_at: sessionData.started_at || new Date().toISOString(),
      ended_at: sessionData.ended_at || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.data.study_sessions.unshift(newSession);
    this.saveData(this.data);
    this.notify();
    return newSession;
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
