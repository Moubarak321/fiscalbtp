function showSection(sectionId, element) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    if (element) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

document.querySelectorAll('.checklist-item').forEach(item => {
    const checkbox = item.querySelector('.checkbox');
    const text = item.querySelector('.checklist-text');
    const badge = item.querySelector('.badge');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                text.classList.add('completed');
                badge.className = 'badge badge-success';
                badge.textContent = 'Validé';
            } else {
                text.classList.remove('completed');
                badge.className = 'badge badge-danger';
                badge.textContent = 'À faire';
            }
        });
    }
});

let chantierList = [];
let editingIndex = null;

function formatEuro(v) {
    return Number(v).toLocaleString('fr-FR') + '€';
}

function formatDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

function statutBadge(s) {
    if (s === 'Conforme') return { cls: 'badge badge-success', txt: 'Conforme' };
    if (s === 'Non conforme') return { cls: 'badge badge-danger', txt: 'Non conforme' };
    return { cls: 'badge badge-warning', txt: 'À vérifier' };
}

function computeStatut(acomptes) {
    return Number(acomptes) >= 50 ? 'À vérifier' : 'Conforme';
}

function loadChantiers() {
    const stored = localStorage.getItem('chantierList');
    if (stored) {
        chantierList = JSON.parse(stored);
    } else {
        chantierList = [
            { name: 'Résidence Les Jardins', client: 'Promoteur ABC', budget: 850000, acomptes: 65, statut: 'À vérifier', dateDebut: '2026-01-05', type: 'Neuf' },
            { name: 'Centre Commercial Nord', client: 'SCI Nordis', budget: 1450000, acomptes: 45, statut: 'Non conforme', dateDebut: '2026-01-10', type: 'Rénovation' },
            { name: 'Immeuble Durand', client: 'Famille Durand', budget: 320000, acomptes: 30, statut: 'Conforme', dateDebut: '2026-01-03', type: 'Neuf' },
            { name: 'Bureaux Tech Park', client: 'Tech Solutions SA', budget: 2100000, acomptes: 50, statut: 'Conforme', dateDebut: '2026-01-08', type: 'Rénovation' }
        ];
        saveChantiers();
    }
}

function saveChantiers() {
    localStorage.setItem('chantierList', JSON.stringify(chantierList));
}

function renderChantiers(filter) {
    const tbody = document.getElementById('chantierTableBody');
    if (!tbody) return;
    const f = (filter || '').toLowerCase();
    const rows = chantierList
        .filter(c => c.name.toLowerCase().includes(f) || c.client.toLowerCase().includes(f))
        .map((c, idx) => {
            const badge = statutBadge(c.statut || computeStatut(c.acomptes));
            return `
            <tr data-index="${idx}">
                <td>${c.name}</td>
                <td>${c.client}</td>
                <td>${formatEuro(c.budget)}</td>
                <td>${Number(c.acomptes)}%</td>
                <td><span class="${badge.cls}">${badge.txt}</span></td>
                <td>
                    <button class="action-btn view-btn" title="Voir détails"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Supprimer"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        })
        .join('');
    tbody.innerHTML = rows;
}

function bindChantierEvents() {
    const search = document.getElementById('chantierSearch');
    if (search) {
        search.addEventListener('input', e => {
            renderChantiers(e.target.value);
        });
    }
    const tbody = document.getElementById('chantierTableBody');
    if (tbody) {
        tbody.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const tr = btn.closest('tr');
            if (!tr) return;
            const idx = Number(tr.getAttribute('data-index'));
            if (btn.classList.contains('view-btn')) {
                showChantierDetails(idx);
            } else if (btn.classList.contains('edit-btn')) {
                startEditChantier(idx);
            } else if (btn.classList.contains('delete-btn')) {
                deleteChantier(idx);
            }
        });
    }
    const form = document.getElementById('newChantierForm');
    if (form) {
        form.addEventListener('submit', submitChantierForm);
    }
    const openBtn = document.getElementById('openNewChantierBtn');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            editingIndex = null;
            document.getElementById('chantierModalTitle').textContent = 'Nouveau Chantier';
            document.getElementById('chantierSubmitBtn').textContent = 'Créer le chantier';
            resetChantierForm();
        });
    }
}

function resetChantierForm() {
    const name = document.getElementById('chantierName');
    const client = document.getElementById('chantierClient');
    const budget = document.getElementById('chantierBudget');
    const acomptes = document.getElementById('chantierAcomptes');
    const dateDebut = document.getElementById('chantierDateDebut');
    const type = document.getElementById('chantierType');
    if (name) name.value = '';
    if (client) client.value = '';
    if (budget) budget.value = '';
    if (acomptes) acomptes.value = '';
    if (dateDebut) dateDebut.value = '';
    if (type) type.value = 'Neuf';
}

function submitChantierForm(e) {
    e.preventDefault();
    const name = document.getElementById('chantierName').value.trim();
    const client = document.getElementById('chantierClient').value.trim();
    const budget = Number(document.getElementById('chantierBudget').value);
    const acomptes = Number(document.getElementById('chantierAcomptes').value);
    const dateDebut = document.getElementById('chantierDateDebut').value;
    const type = document.getElementById('chantierType').value;
    const statut = computeStatut(acomptes);
    const item = { name, client, budget, acomptes, statut, dateDebut, type };
    if (editingIndex !== null && !Number.isNaN(editingIndex)) {
        chantierList[editingIndex] = item;
    } else {
        chantierList.push(item);
    }
    saveChantiers();
    renderChantiers(document.getElementById('chantierSearch') ? document.getElementById('chantierSearch').value : '');
    closeModal('newChantierModal');
    editingIndex = null;
    resetChantierForm();
    alert('Chantier enregistré');
}

function startEditChantier(idx) {
    const c = chantierList[idx];
    if (!c) return;
    editingIndex = idx;
    document.getElementById('chantierModalTitle').textContent = 'Modifier Chantier';
    document.getElementById('chantierSubmitBtn').textContent = 'Enregistrer';
    document.getElementById('chantierName').value = c.name;
    document.getElementById('chantierClient').value = c.client;
    document.getElementById('chantierBudget').value = c.budget;
    document.getElementById('chantierAcomptes').value = c.acomptes;
    document.getElementById('chantierDateDebut').value = c.dateDebut || '';
    document.getElementById('chantierType').value = c.type || 'Neuf';
    openModal('newChantierModal');
}

function deleteChantier(idx) {
    if (!Number.isInteger(idx)) return;
    if (!confirm('Supprimer ce chantier ?')) return;
    chantierList.splice(idx, 1);
    saveChantiers();
    renderChantiers(document.getElementById('chantierSearch') ? document.getElementById('chantierSearch').value : '');
}

function showChantierDetails(idx) {
    const c = chantierList[idx];
    if (!c) return;
    document.getElementById('detailsName').textContent = c.name;
    document.getElementById('detailsClient').textContent = c.client;
    document.getElementById('detailsBudget').textContent = formatEuro(c.budget);
    document.getElementById('detailsAcomptes').textContent = Number(c.acomptes) + '%';
    document.getElementById('detailsDateDebut').textContent = formatDate(c.dateDebut || '');
    document.getElementById('detailsType').textContent = c.type || '';
    const badge = statutBadge(c.statut || computeStatut(c.acomptes));
    document.getElementById('detailsStatut').textContent = badge.txt;
    openModal('chantierDetailsModal');
}

function initChantiers() {
    loadChantiers();
    renderChantiers('');
    bindChantierEvents();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initChantiers();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        initChantiers();
    });
}
