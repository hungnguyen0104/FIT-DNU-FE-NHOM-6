function setAlert(message, type) {
  const el = document.getElementById("authAlert");
  if (!el) return;
  el.className = `auth-alert alert-${type || "warning"}`;
  el.textContent = message;
  el.classList.remove("d-none");
}

function clearAlert() {
  const el = document.getElementById("authAlert");
  if (!el) return;
  el.classList.add("d-none");
  el.textContent = "";
}

function setActiveTab(which) {
  const loginTab = document.getElementById("tab-login");
  const regTab = document.getElementById("tab-register");
  const tabSwitch = document.querySelector(".auth-tab-switch");
  if (!loginTab || !regTab) return;

  const isRegister = which === "register";
  loginTab.classList.toggle("active", !isRegister);
  regTab.classList.toggle("active", isRegister);
  loginTab.setAttribute("aria-selected", String(!isRegister));
  regTab.setAttribute("aria-selected", String(isRegister));
  if (tabSwitch) tabSwitch.classList.toggle("is-register", isRegister);
}

function authUIShow(which) {
  clearAlert();
  setActiveTab(which);

  const pLogin = document.getElementById("panel-login");
  const pReg = document.getElementById("panel-register");
  if (!pLogin || !pReg) return;

  if (which === "register") {
    pLogin.classList.add("d-none");
    pReg.classList.remove("d-none");
  } else {
    pReg.classList.add("d-none");
    pLogin.classList.remove("d-none");
  }
}

function afterAuthNavigate(session) {
  const redirect = auth.getRedirectParam();
  if (redirect) {
    const target = decodeURIComponent(redirect);
    if (target === "admin.html" && session && session.role !== "admin") {
      setAlert("Tài khoản này không có quyền truy cập Admin.", "warning");
      setTimeout(() => auth.navigateTo("index.html"), 600);
      return;
    }
    auth.navigateTo(target);
    return;
  }
  if (session && session.role === "admin") {
    auth.navigateTo("admin.html");
  } else {
    auth.navigateTo("index.html");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  auth.ensureAdminCredentials();

  // If already logged in, skip re-login when possible
  const existing = auth.getCurrentUser();
  if (existing) {
    const redirect = auth.getRedirectParam();
    if (redirect) {
      const target = decodeURIComponent(redirect);
      if (target === "admin.html" && existing.role !== "admin") {
        setAlert("Tài khoản này không có quyền truy cập Admin.", "warning");
        setTimeout(() => auth.navigateTo("index.html"), 600);
      } else {
        auth.navigateTo(target);
      }
      return;
    }
    // No redirect: go to best landing page
    if (existing.role === "admin") auth.navigateTo("admin.html");
    else auth.navigateTo("index.html");
    return;
  }

  authUIShow("login");

  document.querySelectorAll("[data-auth-tab]").forEach((btn) => {
    btn.addEventListener("click", () => authUIShow(btn.getAttribute("data-auth-tab")));
  });

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();
      try {
        const session = await auth.login(
          document.getElementById("loginUsername").value,
          document.getElementById("loginPassword").value
        );
        setAlert("Đăng nhập thành công!", "success");
        setTimeout(() => afterAuthNavigate(session), 350);
      } catch (err) {
        setAlert(err.message || "Đăng nhập thất bại", "danger");
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert();
      const u = document.getElementById("registerUsername").value;
      const p1 = document.getElementById("registerPassword").value;
      const p2 = document.getElementById("registerPassword2").value;

      if (p1 !== p2) {
        setAlert("Mật khẩu nhập lại không khớp", "warning");
        return;
      }

      try {
        await auth.registerUser(u, p1);
        const session = await auth.login(u, p1);
        setAlert("Tạo tài khoản thành công!", "success");
        setTimeout(() => afterAuthNavigate(session), 350);
      } catch (err) {
        setAlert(err.message || "Đăng ký thất bại", "danger");
      }
    });
  }
});

window.authUIShow = authUIShow;

