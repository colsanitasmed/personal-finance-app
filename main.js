// Estado de la aplicación
let state = {
    view: 'fixed',
    fixedItems: [],
    currentPeriod: null,
    history: [],
    historyFilter: 'Todos',
    balance: 0
};

let mainChart = null;

// Cargar datos desde LocalStorage
function loadPersistedData() {
    try {
        state.fixedItems = JSON.parse(localStorage.getItem('fixedItems')) || [];
        state.history = JSON.parse(localStorage.getItem('history')) || [];
        state.currentPeriod = JSON.parse(localStorage.getItem('currentPeriod')) || null;
        state.balance = JSON.parse(localStorage.getItem('balance')) || 0;
    } catch (e) {
        console.error("Error al cargar datos:", e);
    }
}

// Guardar datos
function saveState() {
    localStorage.setItem('fixedItems', JSON.stringify(state.fixedItems));
    localStorage.setItem('history', JSON.stringify(state.history));
    localStorage.setItem('currentPeriod', JSON.stringify(state.currentPeriod));
    localStorage.setItem('balance', JSON.stringify(state.balance));
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadPersistedData();
    setupNavigation();
    render();
});

function setupNavigation() {
    const navButtons = {
        fixed: document.getElementById('nav-fixed'),
        panel: document.getElementById('nav-panel'),
        history: document.getElementById('nav-history')
    };

    if (navButtons.fixed) navButtons.fixed.onclick = () => setView('fixed');
    if (navButtons.panel) navButtons.panel.onclick = () => setView('panel');
    if (navButtons.history) navButtons.history.onclick = () => setView('history');
}

function setView(view) {
    state.view = view;
    ['nav-fixed', 'nav-panel', 'nav-history'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('active', id === `nav-${view}`);
    });
    render();
}

function render() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = '';

    if (state.view === 'fixed') renderFixedItems(mainContent);
    else if (state.view === 'panel') renderPanelQuincena(mainContent);
    else if (state.view === 'history') renderHistory(mainContent);
}

// --- ETAPA 1: ARTÍCULOS FIJOS ---
function renderFixedItems(container) {
    const section = document.createElement('section');
    section.innerHTML = `
        <div class="section-header">
            <h2>Artículos Fijos</h2>
            <p>${state.fixedItems.length} artículos</p>
        </div>
        <div class="form-card">
            <div class="grid-form">
                <div class="input-group"><label>Artículo</label><input type="text" id="input-name" placeholder="Ej: Parqueadero"></div>
                <div class="input-group"><label>Valor</label><input type="number" id="input-value" placeholder="150000"></div>
                <div class="input-group">
                    <label>Método de Pago</label>
                    <select id="input-method">
                        <option value="Llave">Llave</option><option value="Nequi">Nequi</option><option value="Efectivo">Efectivo</option><option value="Banco">Banco</option>
                    </select>
                </div>
                <div class="input-group"><label>Número de Cuenta</label><input type="text" id="input-account" placeholder="3004236422"></div>
                <div class="input-group">
                    <label>Rango de Fecha</label>
                    <select id="input-range"><option value="1er quincena">1er quincena</option><option value="2da quincena">2da quincena</option></select>
                </div>
                <button class="btn-add" id="btn-save-item">Agregar Artículo</button>
            </div>
        </div>

        <div class="items-list" id="fixed-items-list" style="margin-bottom: 3rem;"></div>

        <div class="section-header">
            <h2>Resumen Quincenal</h2>
        </div>
        <div class="comparison-grid" id="config-summary" style="margin-bottom: 3rem;"></div>

        <div class="backup-section">
            <h3>Sincronización y Respaldo</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                Usa estos botones para pasar tus datos de un dispositivo a otro (PC al Celular).
            </p>
            <div class="backup-btns">
                <button class="btn-add" style="margin:0; flex:1;" onclick="exportData()">Descargar Copia (JSON)</button>
                <button class="btn-add" style="margin:0; flex:1; background:var(--secondary)" onclick="document.getElementById('import-file').click()">Subir Copia</button>
                <input type="file" id="import-file" style="display:none" accept=".json" onchange="importData(event)">
            </div>
        </div>
    `;
    container.appendChild(section);

    renderFixedList();
    renderConfigSummary();

    const btnSave = document.getElementById('btn-save-item');
    if (btnSave) {
        btnSave.onclick = () => {
            const name = document.getElementById('input-name').value;
            const value = document.getElementById('input-value').value;
            if (!name || !value) return alert('Completa nombre y valor');

            state.fixedItems.push({
                name, value,
                method: document.getElementById('input-method').value,
                account: document.getElementById('input-account').value,
                range: document.getElementById('input-range').value,
                id: Date.now()
            });
            saveState();
            render();
        };
    }
}

function renderFixedList() {
    const list = document.getElementById('fixed-items-list');
    if (!list) return;

    state.fixedItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="item-info">
                <h3>${item.name}</h3>
                <div class="item-details">
                    <span>$${Number(item.value).toLocaleString()}</span><span>•</span><span>${item.method}</span><span>•</span><span class="badge">${item.range}</span>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteFixedItem(${index})">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        `;
        list.appendChild(row);
    });
}

function renderConfigSummary() {
    const summaryContainer = document.getElementById('config-summary');
    if (!summaryContainer) return;

    ['1er quincena', '2da quincena'].forEach(range => {
        const items = state.fixedItems.filter(i => i.range === range);
        const total = items.reduce((acc, i) => acc + Number(i.value), 0);

        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--primary);">${range === '1er quincena' ? '1er Quincena' : '2da Quincena'}</h3>
            <table class="summary-table">
                <thead><tr><th>Artículo</th><th style="text-align:right">Valor</th></tr></thead>
                <tbody>
                    ${items.map(i => `<tr><td>${i.name}</td><td style="text-align:right">$${Number(i.value).toLocaleString()}</td></tr>`).join('')}
                    ${items.length === 0 ? '<tr><td colspan="2" style="text-align:center; color:var(--text-muted); padding: 1rem;">Sin artículos</td></tr>' : ''}
                </tbody>
            </table>
            <div class="summary-total"><span>Total</span><span>$${total.toLocaleString()}</span></div>
        `;
        summaryContainer.appendChild(card);
    });
}

window.deleteFixedItem = (index) => {
    state.fixedItems.splice(index, 1);
    saveState();
    render();
};

window.exportData = () => {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_AppPagos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
};

window.importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedState = JSON.parse(e.target.result);
            if (confirm('¿Estás seguro? Esto reemplazará todos tus datos actuales.')) {
                state = importedState;
                saveState();
                render();
                alert('Datos cargados con éxito.');
            }
        } catch (err) { alert('Error al cargar el archivo.'); }
    };
    reader.readAsText(file);
};

// --- ETAPA 2: PANEL QUINCENAL ---
function renderPanelQuincena(container) {
    if (!state.currentPeriod) {
        container.innerHTML = `
            <div class="section-header"><h2>Panel Quincenal</h2></div>
            <div class="form-card" style="text-align: center; padding: 4rem 2rem;">
                <h3 style="margin-bottom: 2rem;">¿Qué quincena deseas crear?</h3>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-add" style="width:auto; padding: 1rem 2rem;" onclick="createPeriod('1er quincena')">1er Quincena</button>
                    <button class="btn-add" style="width:auto; padding: 1rem 2rem; background: var(--secondary);" onclick="createPeriod('2da quincena')">2da Quincena</button>
                </div>
            </div>`;
        return;
    }

    const pendingValue = state.currentPeriod.items.reduce((acc, i) => acc + (i.paid ? 0 : Number(i.value)), 0);
    const paidValue = state.currentPeriod.items.reduce((acc, i) => acc + (i.paid ? Number(i.paidValue || i.value) : 0), 0);

    const section = document.createElement('section');
    section.innerHTML = `
        <div class="section-header">
            <h2>Corte: ${state.currentPeriod.range}</h2>
            <button class="btn-delete" style="width:auto; height:auto; padding: 0.5rem;" onclick="resetPeriod()">Resetear</button>
        </div>
        
        <div class="stats-grid">
            <div class="form-card" style="text-align:center;"><label>Saldo en Caja</label><h3 style="color:var(--secondary)">$${state.balance.toLocaleString()}</h3></div>
            <div class="form-card" style="text-align:center;"><label>Pendiente</label><h3 style="color:#fbbf24">$${pendingValue.toLocaleString()}</h3></div>
        </div>

        <div class="form-card income-card">
            <h3 style="margin-bottom: 1rem;">+ Registrar Ingreso</h3>
            <div class="hormiga-form" style="border-top: none; margin-top: 0; padding-top: 0;">
                <div class="hormiga-inputs">
                    <div class="input-group"><label>Descripción</label><input type="text" id="income-desc" placeholder="Ej: Sueldo, Venta..."></div>
                    <div class="input-group"><label>Valor</label><input type="number" id="income-value" placeholder="1000000"></div>
                    <div class="input-group">
                        <label>Destino</label>
                        <select id="income-method">
                            <option value="Nequi">Nequi</option><option value="Efectivo">Efectivo</option><option value="Llave">Llave</option><option value="Banco">Banco</option>
                        </select>
                    </div>
                    <button class="btn-add" style="width:auto; margin:0; padding: 0.75rem 1.5rem; background: var(--secondary);" onclick="addIncome()">Agregar</button>
                </div>
            </div>
        </div>

        <div class="form-card">
            <h3 style="margin-bottom: 1rem;">+ Agregar Gasto Hormiga</h3>
            <div class="hormiga-form">
                <div class="hormiga-inputs">
                    <div class="input-group"><label>Descripción</label><input type="text" id="hormiga-desc" maxlength="50" placeholder="Ej: Café"></div>
                    <div class="input-group"><label>Valor</label><input type="number" id="hormiga-value" placeholder="2000"></div>
                    <div class="input-group">
                        <label>Pago</label>
                        <select id="hormiga-method">
                            <option value="Efectivo">Efectivo</option><option value="Nequi">Nequi</option><option value="Llave">Llave</option>
                        </select>
                    </div>
                    <button class="btn-add" style="width:auto; margin:0; padding: 0.75rem 1.5rem;" onclick="addHormiga()">Agregar</button>
                </div>
            </div>
        </div>

        <div class="items-list">
            ${state.currentPeriod.items.map((item, idx) => `
                <div class="item-row" style="${item.paid ? 'opacity:0.6; border-left:4px solid var(--secondary)' : ''}">
                    <div class="item-info" style="flex: 1;">
                        <h3>${item.name} ${item.paid ? '✓' : ''}</h3>
                        <div class="item-details">
                            ${!item.paid ? `
                                <div class="input-group" style="width: 120px;">
                                    <input type="number" id="input-pay-${idx}" value="${item.value}" style="padding: 0.4rem; font-size: 0.9rem;">
                                </div>
                            ` : `<span>$${Number(item.paidValue || item.value).toLocaleString()}</span>`}
                            <span>•</span><span>${item.method}</span>
                            ${item.account ? `<br><small style="color:var(--secondary); font-weight:600;">Cuenta: ${item.account}</small>` : ''}
                            ${item.isHormiga ? `<br><small style="color:var(--text-muted)">${item.desc || ''}</small>` : ''}
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items: center;">
                        ${!item.paid ? `<button class="btn-add" style="width:auto; margin:0; padding:0.5rem 1rem; background:var(--secondary)" onclick="markPaid(${idx})">Pagar</button>` : ''}
                        <button class="btn-delete" onclick="removeFromPeriod(${idx})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    container.appendChild(section);
}

window.addHormiga = () => {
    const desc = document.getElementById('hormiga-desc').value;
    const value = document.getElementById('hormiga-value').value;
    if (!desc || !value) return alert('Pon descripción y valor');
    state.currentPeriod.items.push({ name: 'Gasto Hormiga', desc, value, method: document.getElementById('hormiga-method').value, isHormiga: true, paid: false });
    saveState(); render();
};

window.createPeriod = (range) => {
    state.currentPeriod = { range, items: state.fixedItems.filter(i => i.range === range).map(i => ({ ...i, paid: false, isHormiga: false, account: i.account })), date: new Date().toISOString() };
    saveState(); render();
};

window.resetPeriod = () => { if (confirm('¿Resetear?')) { state.currentPeriod = null; saveState(); render(); } };

window.addIncome = () => {
    const desc = document.getElementById('income-desc').value;
    const value = Number(document.getElementById('income-value').value);
    const method = document.getElementById('income-method').value;

    if (!desc || !value) return alert('Pon descripción y valor');

    state.balance += value;
    state.history.push({
        name: 'Ingreso',
        desc: desc,
        value: value,
        method: method,
        isIncome: true,
        datePaid: new Date().toISOString(),
        period: state.currentPeriod ? state.currentPeriod.range : 'N/A'
    });

    saveState();
    render();
};

window.markPaid = (idx) => {
    const item = state.currentPeriod.items[idx];
    const adjustedValue = Number(document.getElementById(`input-pay-${idx}`).value);

    if (isNaN(adjustedValue) || adjustedValue <= 0) return alert('Ingresa un valor válido');

    item.paid = true;
    item.paidValue = adjustedValue; // Guardamos el valor real pagado
    item.datePaid = new Date().toISOString();

    state.balance -= adjustedValue;
    state.history.push({ ...item, value: adjustedValue, period: state.currentPeriod.range });

    saveState();
    render();
};

window.removeFromPeriod = (idx) => { state.currentPeriod.items.splice(idx, 1); saveState(); render(); };

// --- ETAPA 3: HISTORIAL ---
function renderHistory(container) {
    const items = state.historyFilter === 'Todos' ? state.history : state.history.filter(i => i.name === state.historyFilter);
    const total = items.reduce((acc, i) => acc + Number(i.value), 0);
    const names = [...new Set(state.history.map(i => i.name))];

    container.innerHTML = `
        <div class="section-header"><h2>Historial</h2><p>${items.length} pagos</p></div>
        <div class="chart-container"><canvas id="historyChart"></canvas></div>
        <div class="form-card">
            <div style="display:grid; grid-template-columns: 1fr auto; gap:1rem; align-items:end;">
                <div class="input-group">
                    <label>Filtrar</label>
                    <select onchange="window.updateHistoryFilter(this.value)">
                        <option value="Todos">Todos</option>
                        <option value="Gasto Hormiga">Gastos Hormiga</option>
                        ${names.filter(n => n !== 'Gasto Hormiga').map(n => `<option value="${n}" ${n === state.historyFilter ? 'selected' : ''}>${n}</option>`).join('')}
                    </select>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-add" style="background:#15803d; width: auto; margin: 0; padding: 0.75rem 1.5rem;" onclick="exportExcel()">Excel</button>
                    <button class="btn-delete" style="width: auto; height: auto; padding: 0.75rem 1rem;" onclick="clearHistory()">Borrar Historial</button>
                </div>
            </div>
            <div style="text-align:center; margin-top:1rem; border-top:1px solid var(--glass-border); padding-top:1rem;">
                <label>Total Filtrado</label><h3>$${total.toLocaleString()}</h3>
            </div>
        </div>
        <div class="items-list">
            ${items.slice().reverse().map(i => `
                <div class="item-row" style="border-left:4px solid ${i.isIncome ? 'var(--secondary)' : 'var(--primary)'}">
                    <div class="item-info">
                        <h3>${i.name} ${i.isHormiga ? `<small>(${i.desc})</small>` : ''} ${i.isIncome ? `<small style="color:var(--secondary)">(${i.desc})</small>` : ''}</h3>
                        <div class="item-details">
                            <span style="color: ${i.isIncome ? 'var(--secondary)' : 'white'}">${i.isIncome ? '+' : ''}$${Number(i.value).toLocaleString()}</span>
                            <span>•</span><span>${new Date(i.datePaid).toLocaleDateString()}</span>
                            <span>•</span><span>${i.method}</span>
                        </div>
                    </div>
                    <span class="badge" style="background:${i.isIncome ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}; color:${i.isIncome ? 'var(--secondary)' : 'var(--primary)'}">
                        ${i.isIncome ? 'Ingreso' : 'Pagado'}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
    setTimeout(() => initChart(items), 100);
}

function initChart(data) {
    const ctx = document.getElementById('historyChart');
    if (!ctx || !window.Chart) return;
    const grouped = {};
    data.forEach(i => { const d = new Date(i.datePaid).toLocaleDateString(); grouped[d] = (grouped[d] || 0) + Number(i.value); });
    if (mainChart) mainChart.destroy();
    mainChart = new Chart(ctx, {
        type: 'line',
        data: { labels: Object.keys(grouped), datasets: [{ label: 'Gastos', data: Object.values(grouped), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
    });
}

window.updateHistoryFilter = (val) => { state.historyFilter = val; render(); };

window.clearHistory = () => {
    if (confirm('¿Estás seguro de que deseas borrar todo el historial y reiniciar el saldo a $0? Esta acción no se puede deshacer.')) {
        state.history = [];
        state.balance = 0;
        saveState();
        render();
        alert('Historial y saldo reiniciados con éxito.');
    }
};

window.exportExcel = () => {
    let csv = "Articulo,Descripcion,Valor,Metodo,Fecha,Quincena\n";
    state.history.forEach(i => {
        const val = i.isIncome ? i.value : -i.value;
        csv += `${i.name},${i.desc || ''},${val},${i.method},${new Date(i.datePaid).toLocaleDateString()},${i.period}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Reporte_Pagos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
};
