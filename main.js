// Estado de la aplicación
let state = {
    view: 'fixed',
    fixedItems: [],
    currentPeriod: null,
    history: [],
    historyFilter: 'Todos'
};

// Cargar datos desde LocalStorage de forma segura
function loadPersistedData() {
    try {
        state.fixedItems = JSON.parse(localStorage.getItem('fixedItems')) || [];
        state.history = JSON.parse(localStorage.getItem('history')) || [];
        state.currentPeriod = JSON.parse(localStorage.getItem('currentPeriod')) || null;
    } catch (e) {
        console.error("Error al cargar datos:", e);
    }
}

// Guardar datos
function saveState() {
    localStorage.setItem('fixedItems', JSON.stringify(state.fixedItems));
    localStorage.setItem('history', JSON.stringify(state.history));
    localStorage.setItem('currentPeriod', JSON.stringify(state.currentPeriod));
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log("Aplicación de Pagos iniciada...");
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
            <p>${state.fixedItems.length} artículos configurados</p>
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
        <div class="items-list" id="fixed-items-list"></div>
    `;
    container.appendChild(section);

    const list = document.getElementById('fixed-items-list');
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

window.deleteFixedItem = (index) => {
    state.fixedItems.splice(index, 1);
    saveState();
    render();
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

    const total = state.currentPeriod.items.reduce((acc, i) => acc + (i.paid ? 0 : Number(i.value)), 0);
    const paid = state.currentPeriod.items.reduce((acc, i) => acc + (i.paid ? Number(i.value) : 0), 0);

    const section = document.createElement('section');
    section.innerHTML = `
        <div class="section-header">
            <h2>Corte: ${state.currentPeriod.range}</h2>
            <button class="btn-delete" style="width:auto; height:auto; padding: 0.5rem;" onclick="resetPeriod()">Resetear</button>
        </div>
        <div class="stats-grid">
            <div class="form-card" style="text-align:center;"><label>Pendiente</label><h3 style="color:#fbbf24">$${total.toLocaleString()}</h3></div>
            <div class="form-card" style="text-align:center;"><label>Pagado</label><h3 style="color:var(--secondary)">$${paid.toLocaleString()}</h3></div>
        </div>
        <div class="items-list">
            ${state.currentPeriod.items.map((item, idx) => `
                <div class="item-row" style="${item.paid ? 'opacity:0.6; border-left:4px solid var(--secondary)' : ''}">
                    <div class="item-info">
                        <h3>${item.name} ${item.paid ? '✓' : ''}</h3>
                        <div class="item-details"><span>$${Number(item.value).toLocaleString()}</span><span>•</span><span>${item.method}</span></div>
                    </div>
                    <div style="display:flex; gap:0.5rem">
                        ${!item.paid ? `<button class="btn-add" style="width:auto; margin:0; padding:0.5rem; background:var(--secondary)" onclick="markPaid(${idx})">Pagar</button>` : ''}
                        <button class="btn-delete" onclick="removeFromPeriod(${idx})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    container.appendChild(section);
}

window.createPeriod = (range) => {
    state.currentPeriod = {
        range,
        items: state.fixedItems.filter(i => i.range === range).map(i => ({ ...i, paid: false })),
        date: new Date().toISOString()
    };
    saveState();
    render();
};

window.resetPeriod = () => { if (confirm('¿Resetear?')) { state.currentPeriod = null; saveState(); render(); } };

window.markPaid = (idx) => {
    const item = state.currentPeriod.items[idx];
    item.paid = true;
    item.datePaid = new Date().toISOString();
    state.history.push({ ...item, period: state.currentPeriod.range });
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
        <div class="form-card">
            <div style="display:grid; grid-template-columns: 1fr auto; gap:1rem; align-items:end;">
                <div class="input-group">
                    <label>Filtrar</label>
                    <select onchange="state.historyFilter=this.value; render()">
                        <option value="Todos">Todos</option>
                        ${names.map(n => `<option value="${n}" ${n === state.historyFilter ? 'selected' : ''}>${n}</option>`).join('')}
                    </select>
                </div>
                <button class="btn-add" style="background:#15803d" onclick="exportExcel()">Excel</button>
            </div>
            <div style="text-align:center; margin-top:1rem; border-top:1px solid var(--glass-border); padding-top:1rem;">
                <label>Total Filtrado</label><h3>$${total.toLocaleString()}</h3>
            </div>
        </div>
        <div class="items-list">
            ${items.slice().reverse().map(i => `
                <div class="item-row" style="border-left:4px solid var(--secondary)">
                    <div class="item-info"><h3>${i.name}</h3><div class="item-details"><span>$${Number(i.value).toLocaleString()}</span><span>•</span><span>${new Date(i.datePaid).toLocaleDateString()}</span></div></div>
                    <span class="badge" style="background:rgba(16,185,129,0.2); color:var(--secondary)">Pagado</span>
                </div>
            `).join('')}
        </div>
    `;
}

window.exportExcel = () => {
    let csv = "Articulo,Valor,Fecha,Quincena\n";
    state.history.forEach(i => csv += `${i.name},${i.value},${new Date(i.datePaid).toLocaleDateString()},${i.period}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Reporte_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
};
