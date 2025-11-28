import { fetchAPI } from './utils.js';

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('error-message');
const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('btn-loading', isLoading);
    submitBtn.textContent = isLoading ? 'Ingresando...' : 'Ingresar';
}

function showError(msg) {
    if (errorBox) {
        errorBox.textContent = msg;
        errorBox.classList.add('error-visible');
    } else {
        alert(msg);
    }

    if (form) {
        form.classList.remove('form-shake');
        void form.offsetWidth;
        form.classList.add('form-shake');
    }
}

function clearError() {
    if (errorBox) {
        errorBox.textContent = '';
        errorBox.classList.remove('error-visible');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearError();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
        showError('Por favor ingresa tu correo y contraseña');
        return;
    }

    try {
        setLoading(true);

        const data = await fetchAPI('http://127.0.0.1:8001/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        console.log('Response data:', data);

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            if (data.name) {
                localStorage.setItem('name', data.name);
            }

            document.body.classList.add('login-success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';

            }, 400);
        } else {
            showError(data.error || 'Credenciales incorrectas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError(error.message || 'Error al conectar con el servidor');
    } finally {
        setLoading(false);
    }
}

if (form) {
    form.addEventListener('submit', handleLogin);
}
