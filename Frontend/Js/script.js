/* =========================================================
   GlobeMaster 2 - script.js
   Funcionalidades do frontend:
   01. Menu mobile (menu-toggle)
   02. Navbar ativa automática
   03. Formulários via fetch (Login / Cadastro / Contato)
   04. Alertas dinâmicos
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
       01. MENU MOBILE
       --------------------------------------------------------- */
  const toggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      const isOpen = navLinks.classList.toggle("active");
      toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Fecha o menu ao clicar em um link
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        navLinks.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // Fecha o menu ao clicar fora
    document.addEventListener("click", function (e) {
      if (
        navLinks.classList.contains("active") &&
        !navLinks.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        navLinks.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------------
       02. LINK ATIVO AUTOMÁTICO NA NAVBAR
       --------------------------------------------------------- */
  (function setActiveLink() {
    const currentPage = (
      location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();
    document.querySelectorAll(".nav-link").forEach(function (link) {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href === currentPage) {
        document.querySelectorAll(".nav-link.active").forEach(function (el) {
          el.classList.remove("active");
        });
        link.classList.add("active");
      }
    });
  })();

  /* ---------------------------------------------------------
       03. FORMULÁRIOS VIA FETCH
       --------------------------------------------------------- */

  /**
   * Cria (ou reutiliza) uma área de alerta dentro do formulário.
   */
  function getAlertBox(form) {
    let box = form.querySelector(".js-alert");
    if (!box) {
      box = document.createElement("div");
      box.className = "alert js-alert hidden";
      box.setAttribute("role", "alert");
      form.insertBefore(box, form.firstChild);
    }
    return box;
  }

  function showAlert(form, type, message) {
    const box = getAlertBox(form);
    box.className = "alert alert-" + type + " js-alert";
    box.textContent = message;
  }

  function setLoading(form, button, loading) {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Aguarde...";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function isPhpForm(form) {
    const action = form.getAttribute("action") || "";
    return action.includes(".php");
  }

  async function submitForm(form) {
    const button = form.querySelector('button[type="submit"]');
    const action = form.getAttribute("action") || location.pathname;

    setLoading(form, button, true);

    try {
      const response = await fetch(action, {
        method: form.getAttribute("method") || "POST",
        body: new FormData(form),
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!response.ok) {
        throw new Error("Erro no servidor (" + response.status + ")");
      }

      const data = await response.json();

      if (data.status === "success") {
        showAlert(form, "success", data.message);
        if (data.redirect) {
          setTimeout(function () {
            window.location.href = data.redirect;
          }, 900);
        }
      } else {
        showAlert(form, "danger", data.message || "Ocorreu um erro.");
      }
    } catch (err) {
      showAlert(
        form,
        "danger",
        "Não foi possível conectar ao servidor. Verifique se o PHP está ativo. (" +
          err.message +
          ")",
      );
    } finally {
      setLoading(form, button, false);
    }
  }

  document.querySelectorAll("form").forEach(function (form) {
    if (!isPhpForm(form)) return; // formulários sem backend: deixa comportamento padrão por enquanto

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitForm(form);
    });
  });

  /* ---------------------------------------------------------
       04. CONTATO (demo local - salva em localStorage)
       --------------------------------------------------------- */
  const contatoForm = document.querySelector("form:not([action])");
  if (contatoForm && document.getElementById("mensagem")) {
    contatoForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nome = contatoForm.querySelector("#nome");
      const email = contatoForm.querySelector("#email");
      const mensagem = contatoForm.querySelector("#mensagem");

      if (!nome.value.trim() || !email.value.trim() || !mensagem.value.trim()) {
        showAlert(
          contatoForm,
          "warning",
          "Preencha todos os campos antes de enviar.",
        );
        return;
      }

      try {
        const stored = JSON.parse(localStorage.getItem("gm2_contatos") || "[]");
        stored.push({
          nome: nome.value.trim(),
          email: email.value.trim(),
          mensagem: mensagem.value.trim(),
          data: new Date().toISOString(),
        });
        localStorage.setItem("gm2_contatos", JSON.stringify(stored));

        showAlert(
          contatoForm,
          "success",
          "Mensagem enviada com sucesso! Entraremos em contato.",
        );
        contatoForm.reset();
      } catch (err) {
        showAlert(
          contatoForm,
          "danger",
          "Não foi possível salvar sua mensagem.",
        );
      }
    });
  }
})();
