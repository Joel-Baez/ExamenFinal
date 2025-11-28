// js/dashboard.js
import { fetchAPI, getToken } from './utils.js';

const API_USERS = 'http://127.0.0.1:8001';
const API_AIRLINE = 'http://127.0.0.1:8002';

let currentSection = '';
let currentRole = '';

const contentEl = document.getElementById('content');
const navEl = document.getElementById('dashboardNav');

function setContent(html) {
    contentEl.innerHTML = html;
    requestAnimationFrame(() => {
        contentEl.classList.remove('view-enter');
        void contentEl.offsetWidth;
        contentEl.classList.add('view-enter');
    });
}

function setTableLoading(text = 'Cargando...') {
    const tableContainer = contentEl.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <div class="loading-skeleton">
                <div class="loading-pulse"></div>
                <p>${text}</p>
            </div>
        `;
    }
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createModal({ title, body, onSubmit, submitLabel = 'Guardar' }) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-open';
    modal.innerHTML = `
        <div class="modal-card">
            <header class="modal-card__header">
                <h3>${title}</h3>
                <button type="button" class="btn-icon" data-modal-close>✕</button>
            </header>
            <form class="modal-card__body">
                ${body}
                <footer class="modal-card__footer">
                    <button type="submit" class="btn-primary">${submitLabel}</button>
                    <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
                </footer>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(modal));
    });

    if (onSubmit) {
        modal.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            await onSubmit(data, modal);
        });
    }

    requestAnimationFrame(() => modal.classList.add('visible'));
    return modal;
}

function closeModal(modal) {
    modal.classList.remove('visible');
    setTimeout(() => modal.remove(), 250);
}

// ================== INIT ==================
async function init() {
    const token = getToken();
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    currentRole = localStorage.getItem('role');
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) {
        userRoleEl.textContent = currentRole === 'administrador' ? 'Administrador' : 'Gestor';
    }

    setupNavigation();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function setupNavigation() {
    if (!navEl) return;

    const isAdmin = currentRole === 'administrador';

    navEl.innerHTML = isAdmin
        ? `
        <ul class="nav-tabs nav-tabs--animated">
            <li class="nav-tab nav-tab--active" data-section="usuarios">Usuarios</li>
            <li class="nav-tab" data-section="vuelos">Vuelos</li>
            <li class="nav-tab" data-section="naves">Naves</li>
        </ul>
        `
        : `
        <ul class="nav-tabs nav-tabs--animated">
            <li class="nav-tab nav-tab--active" data-section="reservas">Reservas</li>
            <li class="nav-tab" data-section="vuelos">Consultar Vuelos</li>
        </ul>
        `;

    navEl.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            navEl.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('nav-tab--active'));
            tab.classList.add('nav-tab--active');
            loadSection(tab.dataset.section);
        });
    });

    loadSection(isAdmin ? 'usuarios' : 'reservas');
}

function loadSection(section) {
    currentSection = section;
    if (!contentEl) return;

    switch (section) {
        case 'usuarios':
            loadUsuarios();
            break;
        case 'vuelos':
            loadVuelos();
            break;
        case 'naves':
            loadNaves();
            break;
        case 'reservas':
            loadReservas();
            break;
        default:
            setContent('<p>Sección no encontrada</p>');
    }
}

// ========== USUARIOS ==========
async function loadUsuarios() {
    setContent(`
        <div class="section-header">
            <div>
                <h2 class="section-title">Gestión de Usuarios</h2>
                <p class="section-subtitle">Administra roles y accesos del sistema</p>
            </div>
            <button class="btn-primary btn-cta" data-open-user-modal>+ Crear Usuario</button>
        </div>
        <div class="table-card glass-card">
            <div class="table-card__inner table-container">
                <div class="loading-skeleton">
                    <div class="loading-pulse"></div>
                    <p>Cargando usuarios...</p>
                </div>
            </div>
        </div>
    `);

    const createBtn = contentEl.querySelector('[data-open-user-modal]');
    if (createBtn) {
        createBtn.addEventListener('click', () => openUserModal());
    }

    try {
        const users = await fetchAPI(`${API_USERS}/users`, { method: 'GET' });

        if (!users || users.length === 0) {
            contentEl.querySelector('.table-container').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👤</div>
                    <p>No hay usuarios registrados</p>
                </div>
            `;
            return;
        }

        contentEl.querySelector('.table-container').innerHTML = `
            <table class="data-table data-table--hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>#${user.id}</td>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>
                                <span class="badge ${user.role === 'administrador' ? 'badge-admin' : 'badge-gestor'}">
                                    ${user.role}
                                </span>
                            </td>
                            <td class="actions text-right">
                                <button class="btn-ghost btn-small" data-edit-user="${user.id}">Editar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        contentEl.querySelectorAll('[data-edit-user]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-edit-user'), 10);
                openUserModal(id);
            });
        });

    } catch (error) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <p class="error-text">Error: ${error.message}</p>
            </div>
        `;
        showError(error.message);
    }
}

function openUserModal(userId = null) {
    const modal = createModal({
        title: userId ? 'Editar Usuario' : 'Crear Usuario',
        submitLabel: 'Guardar',
        body: `
            <div class="form-grid">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" name="name" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" name="password" ${userId ? '' : 'required'}>
                    ${userId ? '<small>Dejar en blanco para mantener la actual</small>' : ''}
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select name="role" required>
                        <option value="gestor">Gestor</option>
                        <option value="administrador">Administrador</option>
                    </select>
                </div>
            </div>
        `,
        onSubmit: async (data, modalRef) => {
            if (userId && !data.password) {
                delete data.password;
            }

            try {
                if (userId) {
                    await fetchAPI(`${API_USERS}/users/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    showSuccess('Usuario actualizado correctamente');
                } else {
                    await fetchAPI(`${API_USERS}/register`, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    showSuccess('Usuario creado correctamente');
                }
                closeModal(modalRef);
                loadUsuarios();
            } catch (error) {
                showError(error.message);
            }
        }
    });

    if (userId) {
        loadUserData(userId, modal);
    }
}

async function loadUserData(userId, modal) {
    try {
        const users = await fetchAPI(`${API_USERS}/users`, { method: 'GET' });
        const user = users.find(u => u.id === userId);
        if (user) {
            modal.querySelector('[name="name"]').value = user.name;
            modal.querySelector('[name="email"]').value = user.email;
            modal.querySelector('[name="role"]').value = user.role;
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
        showError('Error cargando usuario');
    }
}

// ========== NAVES ==========
async function loadNaves() {
    setContent(`
        <div class="section-header">
            <div>
                <h2 class="section-title">Gestión de Naves</h2>
                <p class="section-subtitle">Administra la flota disponible para los vuelos</p>
            </div>
            <button class="btn-primary btn-cta" data-open-nave-modal>+ Crear Nave</button>
        </div>
        <div class="table-card glass-card">
            <div class="table-card__inner table-container">
                <div class="loading-skeleton">
                    <div class="loading-pulse"></div>
                    <p>Cargando naves...</p>
                </div>
            </div>
        </div>
    `);

    const btn = contentEl.querySelector('[data-open-nave-modal]');
    if (btn) btn.addEventListener('click', () => openNaveModal());

    try {
        const naves = await fetchAPI(`${API_AIRLINE}/naves`, { method: 'GET' });

        if (!naves || naves.length === 0) {
            contentEl.querySelector('.table-container').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛩️</div>
                    <p>No hay naves registradas</p>
                </div>
            `;
            return;
        }

        contentEl.querySelector('.table-container').innerHTML = `
            <table class="data-table data-table--hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Modelo</th>
                        <th>Capacidad</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${naves.map(nave => `
                        <tr>
                            <td>#${nave.id}</td>
                            <td>${nave.name}</td>
                            <td>${nave.model}</td>
                            <td>${nave.capacity}</td>
                            <td class="actions text-right">
                                <button class="btn-ghost btn-small" data-edit-nave="${nave.id}">Editar</button>
                                <button class="btn-danger btn-small" data-delete-nave="${nave.id}">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        contentEl.querySelectorAll('[data-edit-nave]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-edit-nave'), 10);
                openNaveModal(id);
            });
        });

        contentEl.querySelectorAll('[data-delete-nave]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-delete-nave'), 10);
                deleteNave(id);
            });
        });

    } catch (error) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <p class="error-text">Error: ${error.message}</p>
            </div>
        `;
        showError(error.message);
    }
}

function openNaveModal(naveId = null) {
    const modal = createModal({
        title: naveId ? 'Editar Nave' : 'Crear Nave',
        body: `
            <div class="form-grid">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Modelo</label>
                    <input type="text" name="model" required>
                </div>
                <div class="form-group">
                    <label>Capacidad</label>
                    <input type="number" name="capacity" min="1" required>
                </div>
            </div>
        `,
        onSubmit: async (data, modalRef) => {
            try {
                if (naveId) {
                    await fetchAPI(`${API_AIRLINE}/naves/${naveId}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    showSuccess('Nave actualizada');
                } else {
                    await fetchAPI(`${API_AIRLINE}/naves`, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    showSuccess('Nave creada');
                }
                closeModal(modalRef);
                loadNaves();
            } catch (error) {
                showError(error.message);
            }
        }
    });

    if (naveId) {
        loadNaveData(naveId, modal);
    }
}

async function loadNaveData(naveId, modal) {
    try {
        const naves = await fetchAPI(`${API_AIRLINE}/naves`, { method: 'GET' });
        const nave = naves.find(n => n.id === naveId);
        if (nave) {
            modal.querySelector('[name="name"]').value = nave.name;
            modal.querySelector('[name="model"]').value = nave.model;
            modal.querySelector('[name="capacity"]').value = nave.capacity;
        }
    } catch (error) {
        console.error('Error cargando nave:', error);
        showError('Error cargando nave');
    }
}

async function deleteNave(naveId) {
    if (!confirm('¿Estás seguro de eliminar esta nave?')) return;

    try {
        await fetchAPI(`${API_AIRLINE}/naves/${naveId}`, { method: 'DELETE' });
        showSuccess('Nave eliminada');
        loadNaves();
    } catch (error) {
        showError(error.message);
    }
}

// ========== VUELOS ==========
async function loadVuelos() {
    const isAdmin = currentRole === 'administrador';

    setContent(`
        <div class="section-header">
            <div>
                <h2 class="section-title">${isAdmin ? 'Gestión de Vuelos' : 'Consulta de Vuelos'}</h2>
                <p class="section-subtitle">Busca y administra vuelos disponibles</p>
            </div>
            ${isAdmin ? '<button class="btn-primary btn-cta" data-open-flight-modal>+ Crear Vuelo</button>' : ''}
        </div>

        <div class="filters-card glass-card">
            <h3 class="filters-title">Buscar Vuelos</h3>
            <div class="filters-grid">
                <div class="form-group">
                    <label>Origen</label>
                    <input type="text" id="searchOrigin" placeholder="Ej: Bogotá">
                </div>
                <div class="form-group">
                    <label>Destino</label>
                    <input type="text" id="searchDestination" placeholder="Ej: Medellín">
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="searchDate">
                </div>
                <div class="filters-actions">
                    <button class="btn-primary" data-search-flights>Buscar</button>
                    <button class="btn-secondary" data-clear-flights>Limpiar</button>
                </div>
            </div>
        </div>

        <div class="table-card glass-card">
            <div class="table-card__inner table-container">
                <div class="loading-skeleton">
                    <div class="loading-pulse"></div>
                    <p>Cargando vuelos...</p>
                </div>
            </div>
        </div>
    `);

    const searchBtn = contentEl.querySelector('[data-search-flights]');
    const clearBtn = contentEl.querySelector('[data-clear-flights]');
    const createBtn = contentEl.querySelector('[data-open-flight-modal]');

    if (searchBtn) searchBtn.addEventListener('click', searchFlights);
    if (clearBtn) clearBtn.addEventListener('click', clearSearchFlights);
    if (createBtn) createBtn.addEventListener('click', () => openFlightModal());

    try {
        const flights = await fetchAPI(`${API_AIRLINE}/flights`, { method: 'GET' });
        displayFlights(flights, isAdmin);
    } catch (error) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <p class="error-text">Error: ${error.message}</p>
            </div>
        `;
        showError(error.message);
    }
}

async function searchFlights() {
    const origin = document.getElementById('searchOrigin').value.trim();
    const destination = document.getElementById('searchDestination').value.trim();
    const date = document.getElementById('searchDate').value;

    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);

    setTableLoading('Buscando vuelos...');

    try {
        const url = `${API_AIRLINE}/flights${params.toString() ? `?${params.toString()}` : ''}`;
        const flights = await fetchAPI(url, { method: 'GET' });
        displayFlights(flights, currentRole === 'administrador');
    } catch (error) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <p class="error-text">Error: ${error.message}</p>
            </div>
        `;
        showError(error.message);
    }
}

function clearSearchFlights() {
    document.getElementById('searchOrigin').value = '';
    document.getElementById('searchDestination').value = '';
    document.getElementById('searchDate').value = '';
    loadVuelos();
}

function displayFlights(flights, isAdmin) {
    if (!flights || flights.length === 0) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✈️</div>
                <p>No se encontraron vuelos</p>
            </div>
        `;
        return;
    }

    contentEl.querySelector('.table-container').innerHTML = `
        <table class="data-table data-table--hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Salida</th>
                    <th>Llegada</th>
                    <th>Precio</th>
                    <th>Nave</th>
                    ${isAdmin ? '<th class="text-right">Acciones</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${flights.map(flight => `
                    <tr>
                        <td>#${flight.id}</td>
                        <td>${flight.origin}</td>
                        <td>${flight.destination}</td>
                        <td>${new Date(flight.departure).toLocaleString()}</td>
                        <td>${new Date(flight.arrival).toLocaleString()}</td>
                        <td>${parseFloat(flight.price).toLocaleString()}</td>
                        <td>${flight.nave_id}</td>
                        ${isAdmin ? `
                        <td class="actions text-right">
                            <button class="btn-ghost btn-small" data-edit-flight="${flight.id}">Editar</button>
                            <button class="btn-danger btn-small" data-delete-flight="${flight.id}">Eliminar</button>
                        </td>` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    if (isAdmin) {
        contentEl.querySelectorAll('[data-edit-flight]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-edit-flight'), 10);
                openFlightModal(id);
            });
        });

        contentEl.querySelectorAll('[data-delete-flight]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-delete-flight'), 10);
                deleteFlight(id);
            });
        });
    }
}

async function openFlightModal(flightId = null) {
    let naves = [];
    try {
        naves = await fetchAPI(`${API_AIRLINE}/naves`, { method: 'GET' });
    } catch (error) {
        showError('Error cargando naves: ' + error.message);
        return;
    }

    const modal = createModal({
        title: flightId ? 'Editar Vuelo' : 'Crear Vuelo',
        body: `
            <div class="form-grid">
                <div class="form-group">
                    <label>Nave</label>
                    <select name="nave_id" required>
                        <option value="">Seleccione una nave</option>
                        ${naves.map(n => `<option value="${n.id}">${n.name} - ${n.model}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Origen</label>
                    <input type="text" name="origin" required>
                </div>
                <div class="form-group">
                    <label>Destino</label>
                    <input type="text" name="destination" required>
                </div>
                <div class="form-group">
                    <label>Fecha/Hora Salida</label>
                    <input type="datetime-local" name="departure" required>
                </div>
                <div class="form-group">
                    <label>Fecha/Hora Llegada</label>
                    <input type="datetime-local" name="arrival" required>
                </div>
                <div class="form-group">
                    <label>Precio</label>
                    <input type="number" name="price" min="0" step="0.01" required>
                </div>
            </div>
        `,
        onSubmit: async (data, modalRef) => {
            try {
                if (flightId) {
                    await fetchAPI(`${API_AIRLINE}/flights/${flightId}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    showSuccess('Vuelo actualizado');
                } else {
                    await fetchAPI(`${API_AIRLINE}/flights`, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    showSuccess('Vuelo creado');
                }
                closeModal(modalRef);
                loadVuelos();
            } catch (error) {
                showError(error.message);
            }
        }
    });

    if (flightId) {
        loadFlightData(flightId, modal);
    }
}

async function loadFlightData(flightId, modal) {
    try {
        const flights = await fetchAPI(`${API_AIRLINE}/flights`, { method: 'GET' });
        const flight = flights.find(f => f.id === flightId);
        if (flight) {
            modal.querySelector('[name="nave_id"]').value = flight.nave_id;
            modal.querySelector('[name="origin"]').value = flight.origin;
            modal.querySelector('[name="destination"]').value = flight.destination;

            const departure = new Date(flight.departure);
            modal.querySelector('[name="departure"]').value = departure.toISOString().slice(0, 16);

            const arrival = new Date(flight.arrival);
            modal.querySelector('[name="arrival"]').value = arrival.toISOString().slice(0, 16);

            modal.querySelector('[name="price"]').value = flight.price;
        }
    } catch (error) {
        console.error('Error cargando vuelo:', error);
        showError('Error cargando vuelo');
    }
}

async function deleteFlight(flightId) {
    if (!confirm('¿Estás seguro de eliminar este vuelo?')) return;

    try {
        await fetchAPI(`${API_AIRLINE}/flights/${flightId}`, { method: 'DELETE' });
        showSuccess('Vuelo eliminado');
        loadVuelos();
    } catch (error) {
        showError(error.message);
    }
}

// ========== RESERVAS ==========
async function loadReservas() {
    setContent(`
        <div class="section-header">
            <div>
                <h2 class="section-title">Gestión de Reservas</h2>
                <p class="section-subtitle">Administra reservas activas y canceladas</p>
            </div>
            <button class="btn-primary btn-cta" data-open-reservation-modal>+ Nueva Reserva</button>
        </div>

        <div class="filters-card glass-card">
            <h3 class="filters-title">Filtrar Reservas</h3>
            <div class="filters-grid">
                <div class="form-group">
                    <label>ID de Usuario</label>
                    <input type="number" id="filterUserId" placeholder="Ej: 2">
                </div>
                <div class="filters-actions">
                    <button class="btn-primary" data-search-reservations>Buscar</button>
                    <button class="btn-secondary" data-clear-reservations>Limpiar</button>
                </div>
            </div>
        </div>

        <div class="table-card glass-card">
            <div class="table-card__inner table-container">
                <div class="loading-skeleton">
                    <div class="loading-pulse"></div>
                    <p>Cargando reservas...</p>
                </div>
            </div>
        </div>
    `);

    const searchBtn = contentEl.querySelector('[data-search-reservations]');
    const clearBtn = contentEl.querySelector('[data-clear-reservations]');
    const createBtn = contentEl.querySelector('[data-open-reservation-modal]');

    if (searchBtn) searchBtn.addEventListener('click', searchReservations);
    if (clearBtn) clearBtn.addEventListener('click', clearSearchReservations);
    if (createBtn) createBtn.addEventListener('click', () => openReservationModal());

    try {
        const reservations = await fetchAPI(`${API_AIRLINE}/reservations`, { method: 'GET' });
        await displayReservations(reservations);
    } catch (error) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <p class="error-text">Error: ${error.message}</p>
            </div>
        `;
        showError(error.message);
    }
}

async function searchReservations() {
    const userId = document.getElementById('filterUserId').value.trim();

    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);

    setTableLoading('Buscando reservas...');

    try {
        const url = `${API_AIRLINE}/reservations${params.toString() ? `?${params.toString()}` : ''}`;
        const reservations = await fetchAPI(url, { method: 'GET' });
        await displayReservations(reservations);
    } catch (error) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <p class="error-text">Error: ${error.message}</p>
            </div>
        `;
        showError(error.message);
    }
}

function clearSearchReservations() {
    document.getElementById('filterUserId').value = '';
    loadReservas();
}

async function displayReservations(reservations) {
    if (!reservations || reservations.length === 0) {
        contentEl.querySelector('.table-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No se encontraron reservas</p>
            </div>
        `;
        return;
    }

    let flights = [];
    try {
        flights = await fetchAPI(`${API_AIRLINE}/flights`, { method: 'GET' });
    } catch (error) {
        console.error('Error cargando vuelos:', error);
    }

    const flightsMap = {};
    flights.forEach(f => {
        flightsMap[f.id] = f;
    });

    const rows = reservations.map(res => {
        const flight = flightsMap[res.flight_id] || {};
        const price = flight.price ? parseFloat(flight.price).toLocaleString() : 'N/A';
        const origin = flight.origin || 'N/A';
        const destination = flight.destination || 'N/A';
        const departure = flight.departure ? new Date(flight.departure).toLocaleString() : 'N/A';
        const statusLabel = res.status === 'activa' ? '✓ Activa' : '✕ Cancelada';
        const statusClass = res.status === 'activa' ? 'status-pill--active' : 'status-pill--cancelled';
        const action = res.status === 'activa'
            ? `<button class="btn-danger btn-small" data-cancel-reservation="${res.id}">Cancelar</button>`
            : '<span class="muted">—</span>';

        return `
            <tr>
                <td><strong>#${res.id}</strong></td>
                <td>Usuario #${res.user_id}</td>
                <td>Vuelo #${res.flight_id}</td>
                <td>${origin} → ${destination}</td>
                <td>${departure}</td>
                <td>${price}</td>
                <td>
                    <span class="status-pill ${statusClass}">
                        ${statusLabel}
                    </span>
                </td>
                <td>${new Date(res.reserved_at).toLocaleString()}</td>
                <td class="actions text-right">${action}</td>
            </tr>
        `;
    }).join('');

    contentEl.querySelector('.table-container').innerHTML = `
        <table class="data-table data-table--hover">
            <thead>
                <tr>
                    <th>ID Reserva</th>
                    <th>Usuario ID</th>
                    <th>Vuelo</th>
                    <th>Origen → Destino</th>
                    <th>Fecha Vuelo</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Fecha Reserva</th>
                    <th class="text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="summary-card glass-card">
            <p>
                Total de reservas: <strong>${reservations.length}</strong> ·
                Activas: <strong>${reservations.filter(r => r.status === 'activa').length}</strong> ·
                Canceladas: <strong>${reservations.filter(r => r.status === 'cancelada').length}</strong>
            </p>
        </div>
    `;

    contentEl.querySelectorAll('[data-cancel-reservation]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-cancel-reservation'), 10);
            cancelReservation(id);
        });
    });
}

async function openReservationModal() {
    let flights = [];
    try {
        flights = await fetchAPI(`${API_AIRLINE}/flights`, { method: 'GET' });
    } catch (error) {
        showError('Error cargando vuelos: ' + error.message);
        return;
    }

    createModal({
        title: 'Nueva Reserva',
        submitLabel: 'Crear Reserva',
        body: `
            <div class="form-group">
                <label>Vuelo</label>
                <select name="flight_id" required>
                    <option value="">Seleccione un vuelo</option>
                    ${flights.map(flight => `
                        <option value="${flight.id}">
                            ${flight.origin} → ${flight.destination}
                            (${new Date(flight.departure).toLocaleDateString()}) - 
                            ${parseFloat(flight.price).toLocaleString()}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="info-banner">
                La reserva se creará a tu nombre automáticamente.
            </div>
        `,
        onSubmit: async (data, modalRef) => {
            try {
                await fetchAPI(`${API_AIRLINE}/reservations`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                showSuccess('Reserva creada exitosamente');
                closeModal(modalRef);
                loadReservas();
            } catch (error) {
                showError(error.message);
            }
        }
    });
}

async function cancelReservation(reservationId) {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
        await fetchAPI(`${API_AIRLINE}/reservations/${reservationId}/cancel`, {
            method: 'PUT'
        });
        showSuccess('Reserva cancelada');
        loadReservas();
    } catch (error) {
        showError(error.message);
    }
}

// ========== LOGOUT ==========
async function logout() {
    try {
        await fetchAPI(`${API_USERS}/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

window.dashboard = {
    openUserModal,
    editUser: (id) => openUserModal(id),
    openNaveModal,
    editNave: (id) => openNaveModal(id),
    deleteNave,
    openFlightModal,
    editFlight: (id) => openFlightModal(id),
    deleteFlight,
    searchFlights,
    clearSearchFlights,
    searchReservations,
    clearSearchReservations,
    openReservationModal,
    cancelReservation
};

init();
