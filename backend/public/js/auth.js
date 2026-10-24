/**
 * Authentication Page Controller (login.html)
 * Internal Chat — Modern Messaging App
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const authAlert = document.getElementById('auth-alert');

  // Password toggles
  const toggleLoginPass = document.getElementById('toggle-login-password');
  const loginPassInput = document.getElementById('login-password');

  const toggleRegPass = document.getElementById('toggle-reg-password');
  const regPassInput = document.getElementById('reg-password');

  const toggleRegConfirm = document.getElementById('toggle-reg-confirm');
  const regConfirmInput = document.getElementById('reg-password-confirm');

  const passStrengthMeter = document.getElementById('pass-strength-meter');
  const passStrengthText = document.getElementById('pass-strength-text');
  const linkForgotPass = document.getElementById('link-forgot-pass');

  // If already logged in, redirect to chat
  if (window.api && window.api.getToken()) {
    window.location.href = '/';
    return;
  }

  function showAlert(message, isError = true) {
    if (!authAlert) return;
    authAlert.textContent = message;
    authAlert.style.display = 'block';
    authAlert.style.backgroundColor = isError ? '#FFF0F3' : '#F0FDF4';
    authAlert.style.color = isError ? '#E11D48' : '#15803D';
    authAlert.style.border = `1.5px solid ${isError ? '#FFCCD5' : '#BBF7D0'}`;
  }

  function hideAlert() {
    if (authAlert) authAlert.style.display = 'none';
  }

  // Password visibility toggle helpers
  function bindPasswordToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁️';
    });
  }

  bindPasswordToggle(toggleLoginPass, loginPassInput);
  bindPasswordToggle(toggleRegPass, regPassInput);
  bindPasswordToggle(toggleRegConfirm, regConfirmInput);

  // Password strength check
  if (regPassInput && passStrengthMeter && passStrengthText) {
    regPassInput.addEventListener('input', () => {
      const val = regPassInput.value;
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

      if (val.length === 0) {
        passStrengthMeter.style.width = '0%';
        passStrengthText.textContent = '';
      } else if (score <= 1) {
        passStrengthMeter.style.width = '33%';
        passStrengthMeter.style.background = '#F43F5E';
        passStrengthText.textContent = 'Độ mạnh: Yếu (Nên thêm chữ hoa, số hoặc ký tự)';
        passStrengthText.style.color = '#F43F5E';
      } else if (score <= 3) {
        passStrengthMeter.style.width = '66%';
        passStrengthMeter.style.background = '#F59E0B';
        passStrengthText.textContent = 'Độ mạnh: Khá tốt';
        passStrengthText.style.color = '#F59E0B';
      } else {
        passStrengthMeter.style.width = '100%';
        passStrengthMeter.style.background = '#10B981';
        passStrengthText.textContent = 'Độ mạnh: Rất an toàn!';
        passStrengthText.style.color = '#10B981';
      }
    });
  }

  // Forgot password notice
  if (linkForgotPass) {
    linkForgotPass.addEventListener('click', () => {
      showAlert('Vui lòng liên hệ quản trị viên nội bộ (Admin) để được hỗ trợ đặt lại mật khẩu.', false);
    });
  }

  // Switch tabs
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabLogin.setAttribute('aria-selected', 'true');
    tabRegister.classList.remove('active');
    tabRegister.setAttribute('aria-selected', 'false');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
    hideAlert();
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabRegister.setAttribute('aria-selected', 'true');
    tabLogin.classList.remove('active');
    tabLogin.setAttribute('aria-selected', 'false');
    formRegister.style.display = 'block';
    formLogin.style.display = 'none';
    hideAlert();
  });

  // Handle Login
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btnSubmit = document.getElementById('btn-login-submit');

    if (!username || !password) {
      showAlert('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Đang kết nối máy chủ...';

    try {
      const res = await window.api.auth.login({ username, password });
      window.api.setToken(res.data.token);
      window.api.setUser(res.data.user);
      showAlert('Đăng nhập thành công! Đang chuyển hướng vào trang chat...', false);
      setTimeout(() => {
        window.location.href = '/';
      }, 400);
    } catch (err) {
      showAlert(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Đăng Nhập Vào Internal Chat';
    }
  });

  // Handle Register
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const displayName = document.getElementById('reg-displayname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;
    const btnSubmit = document.getElementById('btn-register-submit');

    if (!displayName || !username || !password) {
      showAlert('Vui lòng nhập tên hiển thị, tên đăng nhập và mật khẩu.');
      return;
    }

    if (username.length < 3) {
      showAlert('Tên đăng nhập phải có ít nhất 3 ký tự.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showAlert('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới (_).');
      return;
    }

    if (password.length < 6) {
      showAlert('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Đang khởi tạo tài khoản...';

    try {
      await window.api.auth.register({
        username,
        displayName: displayName || username,
        email: email || undefined,
        password,
      });

      showAlert('Tạo tài khoản thành công! Đang chuyển sang đăng nhập...', false);
      setTimeout(() => {
        tabLogin.click();
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = password;
        showAlert('Đăng ký thành công! Bạn có thể nhấn Đăng Nhập ngay bây giờ.', false);
      }, 700);
    } catch (err) {
      showAlert(err.message || 'Đăng ký không thành công. Tên đăng nhập có thể đã tồn tại.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Tạo Tài Khoản Internal Chat';
    }
  });
});
