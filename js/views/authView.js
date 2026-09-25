/**
 * EduTrack AI — Telas de Autenticação (1. Login, 2. Cadastro, 3. Recuperar Senha)
 */

import { store } from "../store.js";
import { router } from "../router.js";

export const AuthView = {
  /**
   * 1. Tela de Login
   */
  renderLogin(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">E</div>
            <h1 class="auth-title">EduTrack AI</h1>
            <p class="auth-subtitle">Sua rotina acadêmica com foco e organização</p>
          </div>

          <form id="form-login">
            <div class="form-group">
              <label class="form-label" for="login-email">E-mail Acadêmico</label>
              <input 
                type="email" 
                id="login-email" 
                class="form-input" 
                placeholder="seu.email@faculdade.edu.br" 
                value="aluno@edutrack.ai" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Senha</label>
              <input 
                type="password" 
                id="login-password" 
                class="form-input" 
                placeholder="••••••••" 
                value="123456" 
                required 
              />
            </div>

            <button type="submit" class="btn btn-primary btn-full" style="margin-top: 8px;">
              Entrar na Plataforma
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>

          <div class="auth-links">
            <a href="javascript:void(0)" id="link-forgot" class="auth-link">Esqueceu sua senha?</a>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Ainda não tem conta? 
              <a href="javascript:void(0)" id="link-register" class="auth-link">Cadastre-se</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos
    const form = document.getElementById("form-login");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-password").value;
      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.innerHTML;

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Verificando credenciais...";
        await store.login(email, pass);
        window.appToast("Bem-vindo(a) de volta!", "success");
        router.navigate("dashboard");
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        // Mensagem genérica estrita contra enumeração de usuários
        window.appToast(error.message || "Usuário ou senha inválidos", "danger");
        const passInput = document.getElementById("login-password");
        if (passInput) {
          passInput.value = "";
          passInput.focus();
        }
      }
    });

    document.getElementById("link-forgot").addEventListener("click", () => {
      router.navigate("forgot-password");
    });

    document.getElementById("link-register").addEventListener("click", () => {
      router.navigate("register");
    });
  },

  /**
   * 2. Tela de Cadastro
   */
  renderRegister(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div style="margin-bottom: 14px;">
          <button class="back-btn" id="btn-back-login">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Voltar ao Login
          </button>
        </div>

        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Criar Conta</h1>
            <p class="auth-subtitle">Comece a gerenciar suas disciplinas e prazos</p>
          </div>

          <form id="form-register">
            <div class="form-group">
              <label class="form-label" for="reg-name">Nome Completo</label>
              <input 
                type="text" 
                id="reg-name" 
                class="form-input" 
                placeholder="Ex: Ana Clara Silva" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">E-mail Acadêmico</label>
              <input 
                type="email" 
                id="reg-email" 
                class="form-input" 
                placeholder="aluno@faculdade.edu.br" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">Senha</label>
              <input 
                type="password" 
                id="reg-password" 
                class="form-input" 
                placeholder="Mínimo 6 caracteres" 
                minlength="6" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-confirm">Confirmar Senha</label>
              <input 
                type="password" 
                id="reg-confirm" 
                class="form-input" 
                placeholder="Repita sua senha" 
                minlength="6" 
                required 
              />
            </div>

            <button type="submit" class="btn btn-primary btn-full" style="margin-top: 8px;">
              Finalizar Cadastro
            </button>
          </form>

          <div class="auth-links">
            <a href="javascript:void(0)" id="link-login-now" class="auth-link">
              Já possui conta? Fazer login
            </a>
          </div>
        </div>
      </div>
    `;

    // Eventos
    document.getElementById("btn-back-login").addEventListener("click", () => {
      router.back();
    });

    document.getElementById("link-login-now").addEventListener("click", () => {
      router.navigate("login");
    });

    const form = document.getElementById("form-register");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      const pass = document.getElementById("reg-password").value;
      const confirm = document.getElementById("reg-confirm").value;

      if (pass !== confirm) {
        window.appToast("As senhas digitadas não coincidem.", "danger");
        return;
      }

      try {
        await store.register(name, email, pass);
        window.appToast("Conta criada com sucesso!", "success");
        router.navigate("dashboard");
      } catch (err) {
        window.appToast(err.message || "Erro ao cadastrar usuário.", "danger");
      }
    });
  },

  /**
   * 3. Tela de Recuperar Senha
   */
  renderForgotPassword(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div style="margin-bottom: 14px;">
          <button class="back-btn" id="btn-back-login-forgot">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Voltar ao Login
          </button>
        </div>

        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo" style="background: linear-gradient(135deg, var(--warning), #f59e0b);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h1 class="auth-title">Recuperar Senha</h1>
            <p class="auth-subtitle">Informe seu e-mail cadastrado para receber o link de redefinição.</p>
          </div>

          <div id="forgot-feedback-area"></div>

          <form id="form-forgot">
            <div class="form-group">
              <label class="form-label" for="forgot-email">E-mail Cadastrado</label>
              <input 
                type="email" 
                id="forgot-email" 
                class="form-input" 
                placeholder="seu.email@faculdade.edu.br" 
                required 
              />
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="btn-send-forgot">
              Enviar Instruções de Recuperação
            </button>
          </form>

          <div class="auth-links">
            <a href="javascript:void(0)" id="link-back-login-2" class="auth-link">
              Lembrou a senha? Voltar para o Login
            </a>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-back-login-forgot").addEventListener("click", () => router.back());
    document.getElementById("link-back-login-2").addEventListener("click", () => router.navigate("login"));

    const form = document.getElementById("form-forgot");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value.trim();
      const feedbackArea = document.getElementById("forgot-feedback-area");
      const btn = document.getElementById("btn-send-forgot");
      const originalText = btn.innerText;

      try {
        btn.disabled = true;
        btn.innerText = "Consultando dados...";
        const resp = await store.recoverPassword(email);

        feedbackArea.innerHTML = `
          <div class="auth-instruction-box">
            <strong>Instruções de Recuperação</strong>
            <p style="margin-top: 4px; font-size: 0.85rem;">
              ${resp.mensagem || "Instruções de recuperação enviadas para o e-mail informado."}
            </p>
            ${resp.token ? `
              <div style="margin-top: 8px; font-size: 0.8rem; background: var(--bg-surface); padding: 8px; border-radius: 6px; word-break: break-all;">
                <strong>Token de Recuperação (Banco de Dados):</strong><br/>
                <code style="font-size: 0.75rem; color: var(--primary);">${resp.token}</code>
              </div>
            ` : ""}
          </div>
        `;

        btn.disabled = true;
        btn.innerText = "Solicitação Concluída";
        btn.classList.replace("btn-primary", "btn-secondary");
        window.appToast(resp.mensagem || "Instruções de recuperação enviadas!", "success");
      } catch (err) {
        btn.disabled = false;
        btn.innerText = originalText;
        window.appToast(err.message || "Erro ao processar recuperação de senha.", "danger");
      }
    });
  }
};
