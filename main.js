// Estado de la aplicación
let state = {
    view: 'fixed', // 'fixed', 'panel', 'history'
    fixedItems: JSON.parse(localStorage.getItem('fixedItems')) || [],
    currentPeriod: null, // { range: '1st', items: [] }
    history: JSON.parse(localStorage.getItem('history')) || []
};

// Elementos del DOM
const mainContent = document.getElementById('main-content');
const navButtons = {
    fixed: document.getElementById('nav-fixed'),
    panel: document.getElementById('nav-panel'),
    history: document.getElementById('nav-history')
};

// Navegación
function setView(view) {
    state.view = view;
    Object.keys(navButtons).forEach(key => {
        navButtons[key].classList.toggle('active', key === view);
    });
    render();
}

navButtons.fixed.onclick = () => setView('fixed');
navButtons.panel.onclick = () => setView('panel');
navButtons.history.onclick = () => setView('history');

// Lógica de Persistencia
function saveState() {
    localStorage.setItem('fixedItems', JSON.stringify(state.fixedItems));
    localStorage.setItem('history', JSON.stringify(state.history));
}

// Renderizado principal
function render() {
    mainContent.innerHTML = '';

    if (state.view === 'fixed') {
        renderFixedItems();
    } else if (state.view === 'panel') {
        renderPanelQuincena();
    } else if (state.view === 'history') {
        renderHistory();
    }
}

// ETAPA 1: ARTÍCULOS FIJOS
function renderFixedItems() {
    const section = document.createElement('section');
    section.innerHTML = `
        <div class="section-header">
            <h2>Artículos Fijos</h2>
            <p>${state.fixedItems.length} artículos configurados</p>
        </div>

        <div class="form-card">
            <div class="grid-form">
                <div class="input-group">
                    <label>Artículo</label>
                    <input type="text" id="input-name" placeholder="Ej: Parqueadero">
                </div>
                <div class="input-group">
                    <label>Valor</label>
                    <input type="number" id="input-value" placeholder="150000">
                </div>
                <div class="input-group">
                    <label>Método de Pago</label>
                    <select id="input-method">
                        <option value="Llave">Llave</option>
                        <option value="Nequi">Nequi</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Banco">Banco</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Número de Cuenta</label>
                    <input type="text" id="input-account" placeholder="3004236422">
                </div>
                <div class="input-group">
                    <label>Rango de Fecha</label>
                    <select id="input-range">
                        <option value="1er quincena">1er quincena</option>
                        <option value="2da quincena">2da quincena</option>
                    </select>
                </div>
                <button class="btn-add" id="btn-save-item">Agregar Artículo</button>
            </div>
        </div>

        <div class="items-list" id="fixed-items-list">
            <!-- Items se cargarán aquí -->
        </div>
    `;

    mainContent.appendChild(section);

    const listContainer = document.getElementById('fixed-items-list');
    state.fixedItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="item-info">
                <h3>${item.name}</h3>
                <div class="item-details">
                    <span>$${Number(item.value).toLocaleString()}</span>
                    <span>•</span>
                    <span>${item.method} (${item.account})</span>
                    <span>•</span>
                    <span class="badge">${item.range}</span>
                </div>
            </div>
            <button class="btn-delete" data-index="${index}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
        `;
        listContainer.appendChild(row);
    });

    // Eventos
    document.getElementById('btn-save-item').onclick = () => {
        const name = document.getElementById('input-name').value;
        const value = document.getElementById('input-value').value;
        const method = document.getElementById('input-method').value;
        const account = document.getElementById('input-account').value;
        const range = document.getElementById('input-range').value;

        if (name && value) {
            state.fixedItems.push({ name, value, method, account, range, id: Date.now() });
            saveState();
            render();
        } else {
            alert('Por favor completa los campos principales');
        }
    };

    listContainer.onclick = (e) => {
        const btn = e.target.closest('.btn-delete');
        if (btn) {
            const index = btn.dataset.index;
            state.fixedItems.splice(index, 1);
            saveState();
            render();
        }
    };
}

// ETAPA 2: PANEL QUINCENAL
function renderPanelQuincena() {
    const section = document.createElement('section');

    // Si no hay quincena activa, mostrar selector
    if (!state.currentPeriod) {
        section.innerHTML = `
            <div class="section-header">
                <h2>Panel Quincenal</h2>
                <p>Selecciona un rango para iniciar</p>
            </div>
            <div class="form-card" style="text-align: center; padding: 4rem 2rem;">
                <h3 style="margin-bottom: 2rem;">¿Qué quincena deseas crear?</h3>
                <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-add" id="btn-create-1st" style="width: auto; padding: 1rem 2.5rem; background: var(--primary);">
                        1er Quincena
                    </button>
                    <button class="btn-add" id="btn-create-2nd" style="width: auto; padding: 1rem 2.5rem; background: var(--secondary);">
                        2da Quincena
                    </button>
                </div>
                <p style="margin-top: 2rem; color: var(--text-muted); font-size: 0.9rem;">
                    Se cargarán automáticamente los artículos fijos correspondientes al rango seleccionado.
                </p>
            </div>
        `;
        mainContent.appendChild(section);

        document.getElementById('btn-create-1st').onclick = () => createPeriod('1er quincena');
        document.getElementById('btn-create-2nd').onclick = () => createPeriod('2da quincena');
        return;
    }

    // Si hay quincena activa, mostrar listado de pagos
    const total = state.currentPeriod.items.reduce((acc, item) => acc + (item.paid ? 0 : Number(item.value)), 0);
    const paidTotal = state.currentPeriod.items.reduce((acc, item) => acc + (item.paid ? Number(item.value) : 0), 0);

    section.innerHTML = `
        <div class="section-header">
            <div>
                <h2>Corte: ${state.currentPeriod.range}</h2>
                <p>${state.currentPeriod.items.length} artículos cargados</p>
            </div>
            <button class="btn-delete" id="btn-reset-period" style="width: auto; height: auto; padding: 0.5rem 1rem; font-size: 0.8rem;">
                Resetear Panel
            </button>
        </div>

        <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
            <div class="form-card" style="margin-bottom: 0; text-align: center;">
                <label>Pendiente por Pagar</label>
                <h3 style="font-size: 1.5rem; color: #fbbf24;">$${total.toLocaleString()}</h3>
            </div>
            <div class="form-card" style="margin-bottom: 0; text-align: center;">
                <label>Total Pagado</label>
                <h3 style="font-size: 1.5rem; color: var(--secondary);">$${paidTotal.toLocaleString()}</h3>
            </div>
        </div>

        <div class="items-list">
            ${state.currentPeriod.items.map((item, index) => `
                <div class="item-row ${item.paid ? 'item-paid' : ''}" style="${item.paid ? 'opacity: 0.6; border-left: 4px solid var(--secondary);' : ''}">
                    <div class="item-info">
                        <h3>${item.name} ${item.paid ? '✓' : ''}</h3>
                        <div class="item-details">
                            <span>$${Number(item.value).toLocaleString()}</span>
                            <span>•</span>
                            <span>${item.method} (${item.account})</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        ${!item.paid ? `
                            <button class="btn-add btn-pay" data-index="${index}" style="width: auto; margin-top: 0; padding: 0.5rem 1rem; background: var(--secondary); font-size: 0.8rem;">
                                Marcar Pago
                            </button>
                        ` : ''}
                        <button class="btn-delete btn-remove-payment" data-index="${index}" title="Eliminar de este corte">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        ${state.currentPeriod.items.length === 0 ? `
            <div class="form-card" style="text-align: center; color: var(--text-muted);">
                No hay artículos para esta quincena. Agrégalos en "Artículos Fijos".
            </div>
        ` : ''}
    `;

    mainContent.appendChild(section);

    // Eventos del Panel
    document.getElementById('btn-reset-period').onclick = () => {
        if (confirm('¿Deseas borrar el progreso actual del panel?')) {
            state.currentPeriod = null;
            saveState();
            render();
        }
    };

    section.querySelectorAll('.btn-pay').forEach(btn => {
        btn.onclick = () => markAsPaid(btn.dataset.index);
    });

    section.querySelectorAll('.btn-remove-payment').forEach(btn => {
        btn.onclick = () => removePaymentFromPeriod(btn.dataset.index);
    });
}

function createPeriod(range) {
    // Filtrar items fijos que corresponden a este rango
    const relevantItems = state.fixedItems
        .filter(item => item.range === range)
        .map(item => ({ ...item, paid: false, datePaid: null }));

    state.currentPeriod = {
        range: range,
        items: relevantItems,
        createdAt: new Date().toISOString()
    };
    saveState();
    render();
}

function markAsPaid(index) {
    const item = state.currentPeriod.items[index];
    item.paid = true;
    item.datePaid = new Date().toISOString();

    // Guardar en Historial (Etapa 3 adelanto)
    state.history.push({
        ...item,
        period: state.currentPeriod.range,
        timestamp: Date.now()
    });

    saveState();
    render();
}

function removePaymentFromPeriod(index) {
    state.currentPeriod.items.splice(index, 1);
    saveState();
    render();
}

// Lógica de Persistencia
function saveState() {
    localStorage.setItem('fixedItems', JSON.stringify(state.fixedItems));
    localStorage.setItem('history', JSON.stringify(state.history));
    localStorage.setItem('currentPeriod', JSON.stringify(state.currentPeriod));
}

// Cargar estado inicial (con soporte para el panel y persistencia limpia)
try {
    state.fixedItems = JSON.parse(localStorage.getItem('fixedItems')) || [];
    state.history = JSON.parse(localStorage.getItem('history')) || [];
    state.currentPeriod = JSON.parse(localStorage.getItem('currentPeriod')) || null;
} catch (e) {
    console.warn("Error cargando LocalStorage, reiniciando estado.");
    state.fixedItems = [];
    state.history = [];
    state.currentPeriod = null;
}

function renderHistory() {
    const section = document.createElement('section');

    // Obtener lista única de artículos para el filtro
    const uniqueItems = [...new Set(state.history.map(item => item.name))];

    // Filtro actual (guardado en el estado temporal de la sesión si se desea, o local al render)
    const activeFilter = state.historyFilter || 'Todos';
    const filteredHistory = activeFilter === 'Todos'
        ? state.history
        : state.history.filter(item => item.name === activeFilter);

    const totalFiltered = filteredHistory.reduce((acc, item) => acc + Number(item.value), 0);

    section.innerHTML = `
        <div class="section-header">
            <h2>Historial de Pagos</h2>
            <p>${filteredHistory.length} registros encontrados</p>
        </div>

        <div class="form-card" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div class="grid-form" style="grid-template-columns: 1fr auto;">
                <div class="input-group">
                    <label>Filtrar por Artículo</label>
                    <select id="filter-article">
                        <option value="Todos">Todos los artículos</option>
                        ${uniqueItems.map(name => `<option value="${name}" ${name === activeFilter ? 'selected' : ''}>${name}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group" style="justify-content: flex-end;">
                     <button class="btn-add" id="btn-export-excel" style="width: auto; background: #15803d; margin-top: 1.7rem;">
                        Descargar Excel
                    </button>
                </div>
            </div>
            
            <div style="text-align: center; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                <label>Total de Pagos Filtrados</label>
                <h3 style="font-size: 2rem; color: var(--secondary);">$${totalFiltered.toLocaleString()}</h3>
            </div>
        </div>

        <div class="items-list">
            ${filteredHistory.slice().reverse().map(item => `
                <div class="item-row" style="border-left: 4px solid var(--secondary);">
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <div class="item-details">
                            <span>$${Number(item.value).toLocaleString()}</span>
                            <span>•</span>
                            <span>${new Date(item.datePaid).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>${item.period}</span>
                        </div>
                    </div>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--secondary);">
                        Pagado
                    </span>
                </div>
            `).join('')}
            ${filteredHistory.length === 0 ? '<p style="text-align: center; color: var(--text-muted);">No hay pagos registrados con este filtro.</p>' : ''}
        </div>
    `;

    mainContent.appendChild(section);

    // Eventos
    document.getElementById('filter-article').onchange = (e) => {
        state.historyFilter = e.target.value;
        render();
    };

    document.getElementById('btn-export-excel').onclick = exportToExcel;
}

function exportToExcel() {
    if (state.history.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    // Cabeceras
    let csvContent = "Articulo,Valor,Metodo,Cuenta,Fecha de Pago,Quincena\n";

    // Filas
    state.history.forEach(item => {
        const row = [
            item.name,
            item.value,
            item.method,
            item.account,
            new Date(item.datePaid).toLocaleDateString(),
            item.period
        ].join(",");
        csvContent += row + "\n";
    });

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Pagos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicialización
render();
