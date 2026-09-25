import { store } from "../store.js";

export const ProfileModal = {
  open() {
    const modalContainer = document.getElementById("app-modal-container");
    if (!modalContainer) return;

    const user = store.getCurrentUser() || { login: "", nome: "" };

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="profile-modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <h3 class="modal-title">Editar Perfil</h3>
            <button class="modal-close" id="btn-close-profile-modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form id="form-profile-edit">
            <div class="form-group">
              <label class="form-label" for="profile-name-input">Nome</label>
              <input 
                type="text" 
                id="profile-name-input" 
                class="form-input" 
                placeholder="Seu nome completo" 
                value="${user.nome || user.name || ''}" 
                required 
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Email (Login)</label>
              <input 
                type="text" 
                class="form-input" 
                value="${user.login || user.email || ''}" 
                disabled 
              />
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn btn-secondary btn-full" id="btn-cancel-profile">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary btn-full" id="btn-save-profile">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const overlay = document.getElementById("profile-modal-overlay");
    const closeBtn = document.getElementById("btn-close-profile-modal");
    const cancelBtn = document.getElementById("btn-cancel-profile");
    const form = document.getElementById("form-profile-edit");
    const btnSave = document.getElementById("btn-save-profile");

    const closeModal = () => {
      overlay.classList.remove("active");
      setTimeout(() => {
        modalContainer.innerHTML = "";
      }, 200);
    };

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const newName = document.getElementById("profile-name-input").value;
      const originalBtnText = btnSave.innerText;
      btnSave.innerText = "Salvando...";
      btnSave.disabled = true;

      try {
        const res = await fetch("http://localhost:8000/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: user.login || user.email,
            nome: newName
          })
        });

        const data = await res.json();
        
        if (data.sucesso) {
          // Atualiza store e UI
          user.name = newName;
          user.nome = newName;
          store.setCurrentUser(user);
          
          if (window.updateSidebarUserProfile) {
             window.updateSidebarUserProfile();
          }
          
          window.appToast("Perfil atualizado com sucesso!", "success");
          closeModal();
        } else {
          window.appToast(data.mensagem || "Erro ao atualizar perfil", "danger");
        }
      } catch (err) {
        window.appToast("Erro de conexão.", "danger");
      } finally {
        btnSave.innerText = originalBtnText;
        btnSave.disabled = false;
      }
    });
  }
};
