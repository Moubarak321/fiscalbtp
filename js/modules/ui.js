// Gestion documentaire avancée (upload, archivage, checklist)
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('documentUploadInput');
    const select = document.getElementById('documentsChantierSelect');

    const getDocs = () => JSON.parse(localStorage.getItem('btp_documents') || '[]');
    const setDocs = (docs) => localStorage.setItem('btp_documents', JSON.stringify(docs));

    const updateDocumentsSelect = () => {
        if (!select || !window.ChantiersModule) return;
        const current = select.value;
        const chantiers = ChantiersModule.getAll();
        select.innerHTML = '<option value="">Tous les chantiers</option>' +
            chantiers.map(c => `<option value="${c.id}">${c.nom}</option>`).join('');
        if (current) select.value = current;
    };

    if (select) {
        select.addEventListener('change', () => window.renderDocumentsTable && window.renderDocumentsTable());
    }
    if (window.ChantiersModule) {
        updateDocumentsSelect();
        window.addEventListener('chantiersUpdated', updateDocumentsSelect);
    }

    if (input) {
        input.addEventListener('change', function(e) {
            let docs = getDocs();
            const chantierId = select && select.value ? Number(select.value) : null;
            const chantier = chantierId && window.ChantiersModule ? ChantiersModule.getById(chantierId) : null;
            Array.from(e.target.files).forEach(f => {
                docs.push({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    date: new Date().toLocaleDateString('fr-FR'),
                    chantierId: chantierId,
                    chantierName: chantier ? chantier.nom : '',
                    content: null // Pour démo, pas de stockage binaire
                });
            });
            setDocs(docs);
            window.renderDocumentsTable && window.renderDocumentsTable();
            input.value = '';
        });
    }
    window.renderDocumentsTable = function() {
        const tbody = document.getElementById('documentsTableBody');
        if (!tbody) return;
        let docs = getDocs();
        const allDocs = docs;
        const chantierFilter = select && select.value ? Number(select.value) : null;
        if (chantierFilter) {
            docs = docs
                .map((d, idx) => ({ ...d, __idx: idx }))
                .filter(d => Number(d.chantierId) === chantierFilter);
        } else {
            docs = docs.map((d, idx) => ({ ...d, __idx: idx }));
        }
        if (!docs.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:#888;">Aucun document importé.</td></tr>';
            return;
        }
        tbody.innerHTML = docs.map((d, i) => `
            <tr>
                <td>
                    <div style="font-weight:600;">${d.name}</div>
                    ${d.chantierName ? `<div style="font-size:0.85em; color:#666;">${d.chantierName}</div>` : ''}
                </td>
                <td>${d.type || 'Fichier'}</td>
                <td>${d.date}</td>
                <td>${(d.size/1024).toFixed(1)} KB</td>
                <td><button class="action-btn" onclick="window.deleteDocument && window.deleteDocument(${d.__idx})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    };
    window.deleteDocument = function(idx) {
        let docs = getDocs();
        docs.splice(idx,1);
        setDocs(docs);
        window.renderDocumentsTable && window.renderDocumentsTable();
    };
    window.renderDocumentsTable && window.renderDocumentsTable();
});
// Filtrage avancé dashboard/calendrier
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('globalSearchInput');
    if (input) {
        input.addEventListener('input', function(e) {
            const val = e.target.value.toLowerCase();
            // Filtrage dashboard
            if (window.DashboardModule && typeof DashboardModule.renderStats === 'function') {
                window.DashboardModule.renderStats(val);
            }
            // Filtrage calendrier
            if (window.CalendarModule && typeof CalendarModule.renderEcheances === 'function') {
                window.CalendarModule.renderEcheances(val);
            }
        });
    }
});
// Export CSV des alertes dynamiques et historiques
window.exportAlertesCSV = function() {
    let alertes = [];
    try {
        // Récupérer alertes dynamiques
        if (window.UIModule && typeof window.UIModule.renderAlertesDyn === 'function') {
            const chantiers = window.ChantiersModule ? ChantiersModule.getAll() : [];
            chantiers.forEach(c => {
                if (c.analyseRisque && Array.isArray(c.analyseRisque.alertes)) {
                    c.analyseRisque.alertes.forEach(a => {
                        alertes.push({
                            type: 'danger',
                            titre: `Alerte fiscale - ${c.nom}`,
                            message: a,
                            chantier: c.nom
                        });
                    });
                }
            });
        }
        // Ajout historique
        let historique = JSON.parse(localStorage.getItem('btp_alertes_historique') || '[]');
        historique.forEach(h => {
            alertes.push({
                type: h.type,
                titre: h.titre,
                message: h.message,
                chantier: h.chantierId || ''
            });
        });
    } catch(e) {}
    if (!alertes.length) { alert('Aucune alerte à exporter.'); return; }
    let csv = 'Type;Titre;Message;Chantier\n';
    alertes.forEach(a => {
        csv += `${a.type};${a.titre.replace(/;/g,',')};${a.message.replace(/;/g,',')};${a.chantier}\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alertes_fiscales.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 100);
};

// Export CSV des chantiers (pour logiciel comptable / analyse)
window.exportChantiersCSV = function() {
    if (!window.ChantiersModule) return;
    const chantiers = ChantiersModule.getAll();
    if (!chantiers.length) { alert('Aucun chantier à exporter.'); return; }
    const headers = [
        'Id','Nom','Client','TypeClient','Nature','Role','MontantFCFA','AcomptesPourcentage',
        'TotalAcomptesFCFA','ResteAPayerFCFA','TvaTaux','TvaDueFCFA',
        'CoutMainOeuvreFCFA','CoutMateriauxFCFA','AutresCoutsFCFA','TotalCoutsFCFA','MargeFCFA',
        'StatutFiscal','Validated','DateDebut'
    ];
    let csv = headers.join(';') + '\n';
    const safe = (v) => String(v ?? '').replace(/;/g, ',').replace(/\n/g,' ');
    chantiers.forEach(c => {
        const regime = c.regimeTVA || (window.FiscalRules ? FiscalRules.determinerRegimeTVA(c) : { taux: '' });
        const row = [
            c.id, safe(c.nom), safe(c.client), safe(c.typeClient), safe(c.nature), safe(c.role),
            c.budget || 0, c.acomptesPourcentage || 0,
            c.totalAcomptes || 0, c.resteAPayer || 0, regime.taux ?? '',
            c.tvaDue || 0,
            c.coutMainOeuvre || 0, c.coutMateriaux || 0, c.autresCouts || 0, c.totalCouts || 0, c.marge || 0,
            safe(c.statutFiscal), c.validated ? '1' : '0', safe(c.dateDebut)
        ];
        csv += row.map(safe).join(';') + '\n';
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chantiers_btp.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 100);
};

// Export JSON des chantiers (sauvegarde/interop)
window.exportChantiersJSON = function() {
    if (!window.ChantiersModule) return;
    const payload = {
        exportDate: new Date().toISOString(),
        currency: 'FCFA',
        chantiers: ChantiersModule.getAll()
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chantiers_btp.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 100);
};

// Export CSV de l'historique (traçabilité)
window.exportAuditCSV = function() {
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem('btp_audit_log') || '[]'); } catch(e) {}
    if (!logs.length) { alert('Aucun historique à exporter.'); return; }
    let csv = 'Date;Utilisateur;Action;ChantierId;Details\n';
    const safe = (v) => String(v ?? '').replace(/;/g, ',').replace(/\n/g,' ');
    logs.slice().reverse().forEach(l => {
        const dateStr = l.ts ? new Date(l.ts).toLocaleString('fr-FR') : '';
        csv += `${safe(dateStr)};${safe(l.user)};${safe(l.action)};${safe(l.chantierId)};${safe(JSON.stringify(l.details || {}))}\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historique_actions.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 100);
};

// Export CSV du calendrier fiscal
window.exportCalendarCSV = function() {
    if (!window.FiscalRules || !window.ChantiersModule) return;
    let rows = [];
    const chantiers = ChantiersModule.getAll();
    chantiers.forEach(c => {
        const echeances = FiscalRules.genererEcheances(c);
        echeances.forEach(e => {
            rows.push({
                chantier: c.nom,
                type: e.type,
                date: e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '',
                montant: e.montant,
                statut: e.statut,
                description: e.description || ''
            });
        });
    });
    if (!rows.length) { alert('Aucune échéance à exporter.'); return; }
    let csv = 'Chantier;Type;Date;Montant;Statut;Description\n';
    rows.forEach(r => {
        csv += `${r.chantier};${r.type.replace(/;/g,',')};${r.date};${r.montant};${r.statut};${r.description.replace(/;/g,',')}\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendrier_fiscal.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 100);
};
window.UIModule = {
    state: {
        editingId: null,
        selectedGuidageId: null
    },

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupChecklists();
        this.setupGlobalHelpers();
        this.setupChantierUI();
        this.setupGuidageUI();
        this.renderAlertesDyn();
        this.renderAuditHistory();
        window.addEventListener('chantiersUpdated', () => this.renderAlertesDyn());
        window.addEventListener('auditUpdated', () => this.renderAuditHistory());
    },
    /**
     * Affiche dynamiquement les alertes réelles dans l'onglet Alertes
     */
    renderAlertesDyn() {
        const container = document.getElementById('alertes-dyn-container');
        if (!container) return;

        const chantiers = window.ChantiersModule ? ChantiersModule.getAll() : [];
        let alertesParRisque = { haut: [], moyen: [], bas: [] };
        let echeancesDepassees = [];
        let echeancesProches = [];
        const periodicityCfg = window.CustomRulesModule && typeof CustomRulesModule.getPeriodicityConfig === 'function'
            ? CustomRulesModule.getPeriodicityConfig()
            : {};
        const thresholdDays = periodicityCfg.thresholdEcheanceDays || 7;

        // 1. Alertes par niveau de risque fiscal
        chantiers.forEach(c => {
            if (c.analyseRisque && c.analyseRisque.niveau) {
                const level = c.analyseRisque.niveau;
                if (['haut', 'moyen', 'bas'].includes(level)) {
                    alertesParRisque[level].push({
                        chantier: c,
                        niveau: c.analyseRisque.niveau,
                        score: c.analyseRisque.score || 0,
                        alertes: c.analyseRisque.alertes || [],
                        recommendations: c.analyseRisque.recommendations || []
                    });
                }
            }
        });

        // 2. Échéances dépassées (retard)
        if (window.FiscalRules) {
            chantiers.forEach(c => {
                const echeances = FiscalRules.genererEcheances(c);
                echeances.forEach(e => {
                    const dateObj = e.date ? new Date(e.date) : null;
                    if (!dateObj || Number.isNaN(dateObj.getTime())) return;
                    const now = new Date();
                    const delta = dateObj.getTime() - now.getTime();
                    const within = delta >= 0 && delta <= thresholdDays * 24 * 3600 * 1000;

                    if (e.date && new Date(e.date) < new Date() && (e.statut === 'urgent' || e.statut === 'retard')) {
                        echeancesDepassees.push({
                            chantier: c.nom,
                            chantierId: c.id,
                            type: e.type,
                            description: e.description || '',
                            date: new Date(e.date).toLocaleDateString('fr-FR'),
                            priority: e.priority || 'important'
                        });
                    }
                    if (within && e.statut !== 'valide') {
                        echeancesProches.push({
                            chantier: c.nom,
                            chantierId: c.id,
                            type: e.type,
                            description: e.description || '',
                            date: dateObj.toLocaleDateString('fr-FR'),
                            priority: e.priority || 'important'
                        });
                    }
                });
            });
        }

        // Construction du HTML
        let html = '';
        const hasAlertes = alertesParRisque.haut.length + alertesParRisque.moyen.length + echeancesDepassees.length + echeancesProches.length > 0;

        if (!hasAlertes && alertesParRisque.bas.length === 0) {
            html = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> <strong>Excellent !</strong> Aucune alerte critique détectée. Tous les chantiers sont conformes.</div>';
        } else {
            // Alertes de risque HAUT
            if (alertesParRisque.haut.length > 0) {
                html += `<div class="card-header" style="margin-top: 1rem;">
                    <h2 class="card-title" style="color: var(--danger);">
                        <i class="fas fa-times-circle"></i> Risque fiscal ÉLEVÉ
                    </h2>
                    <span class="badge badge-danger">${alertesParRisque.haut.length} chantier${alertesParRisque.haut.length > 1 ? 's' : ''}</span>
                </div>`;
                alertesParRisque.haut.forEach(item => {
                    const { chantier, score, alertes, recommendations } = item;
                    html += `<div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div style="flex:1;">
                            <strong>${chantier.nom}</strong>
                            <div style="font-size: 0.9em; margin-top: 0.3rem; color: rgba(0,0,0,0.7);">
                                Score de risque: <strong>${score}/100</strong>
                            </div>`;
                    if (alertes.length > 0) {
                        html += `<div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 4px;">
                            <strong style="font-size: 0.9em;">Problèmes détectés :</strong>
                            <ul style="margin: 0.3rem 0; padding-left: 1.5rem; font-size: 0.9em;">`;
                        alertes.forEach(a => {
                            html += `<li>${a}</li>`;
                        });
                        html += `</ul></div>`;
                    }
                    if (recommendations.length > 0) {
                        html += `<div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(16,185,129,0.05); border-radius: 4px;">
                            <strong style="font-size: 0.9em; color: var(--secondary);">Actions recommandées :</strong>
                            <ul style="margin: 0.3rem 0; padding-left: 1.5rem; font-size: 0.9em;">`;
                        recommendations.forEach(r => {
                            html += `<li><em>${r}</em></li>`;
                        });
                        html += `</ul></div>`;
                    }
                    html += `<div style="margin-top: 0.5rem;">
                        <button class="btn btn-secondary" style="font-size: 0.85em;" onclick="window.viewChantierDetails && window.viewChantierDetails(${chantier.id})">
                            <i class="fas fa-eye"></i> Détails
                        </button>
                    </div>
                        </div>
                    </div>`;
                });
            }

            // Alertes de risque MOYEN
            if (alertesParRisque.moyen.length > 0) {
                html += `<div class="card-header" style="margin-top: 1rem;">
                    <h2 class="card-title" style="color: var(--warning);">
                        <i class="fas fa-exclamation-circle"></i> Risque fiscal MOYEN
                    </h2>
                    <span class="badge badge-warning">${alertesParRisque.moyen.length} chantier${alertesParRisque.moyen.length > 1 ? 's' : ''}</span>
                </div>`;
                alertesParRisque.moyen.forEach(item => {
                    const { chantier, score, alertes, recommendations } = item;
                    html += `<div class="alert alert-warning">
                        <i class="fas fa-exclamation-circle"></i>
                        <div style="flex:1;">
                            <strong>${chantier.nom}</strong>
                            <div style="font-size: 0.9em; margin-top: 0.3rem; color: rgba(0,0,0,0.7);">
                                Score de risque: <strong>${score}/100</strong>
                            </div>`;
                    if (alertes.length > 0) {
                        html += `<div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 4px;">
                            <strong style="font-size: 0.9em;">Points d'attention :</strong>
                            <ul style="margin: 0.3rem 0; padding-left: 1.5rem; font-size: 0.9em;">`;
                        alertes.forEach(a => {
                            html += `<li>${a}</li>`;
                        });
                        html += `</ul></div>`;
                    }
                    if (recommendations.length > 0) {
                        html += `<div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(16,185,129,0.05); border-radius: 4px;">
                            <strong style="font-size: 0.9em; color: var(--secondary);">Recommandations :</strong>
                            <ul style="margin: 0.3rem 0; padding-left: 1.5rem; font-size: 0.9em;">`;
                        recommendations.forEach(r => {
                            html += `<li><em>${r}</em></li>`;
                        });
                        html += `</ul></div>`;
                    }
                    html += `<div style="margin-top: 0.5rem;">
                        <button class="btn btn-secondary" style="font-size: 0.85em;" onclick="window.viewChantierDetails && window.viewChantierDetails(${chantier.id})">
                            <i class="fas fa-eye"></i> Détails
                        </button>
                    </div>
                        </div>
                    </div>`;
                });
            }

            // Échéances dépassées
            if (echeancesDepassees.length > 0) {
                html += `<div class="card-header" style="margin-top: 1rem;">
                    <h2 class="card-title" style="color: var(--danger);">
                        <i class="fas fa-calendar-times"></i> Échéances dépassées
                    </h2>
                    <span class="badge badge-danger">${echeancesDepassees.length}</span>
                </div>`;
                echeancesDepassees.forEach(e => {
                    html += `<div class="alert alert-danger">
                        <i class="fas fa-clock"></i>
                        <div style="flex:1;">
                            <strong>${e.chantier} — ${e.type}</strong>
                            <div style="font-size: 0.9em; margin-top: 0.3rem; color: rgba(0,0,0,0.7);">
                                ${e.description} (Date : <strong>${e.date}</strong>)
                            </div>
                            <button class="btn btn-warning" style="margin-top: 0.5rem; font-size: 0.85em;" onclick="window.viewChantierDetails && window.viewChantierDetails(${e.chantierId})">
                                <i class="fas fa-arrow-right"></i> Agir
                            </button>
                        </div>
                    </div>`;
                });
            }

            // Échéances proches
            if (echeancesProches.length > 0) {
                html += `<div class="card-header" style="margin-top: 1rem;">
                    <h2 class="card-title" style="color: var(--warning);">
                        <i class="fas fa-calendar-exclamation"></i> Échéances proches (${thresholdDays} jours)
                    </h2>
                    <span class="badge badge-warning">${echeancesProches.length}</span>
                </div>`;
                echeancesProches.slice(0, 6).forEach(e => {
                    html += `<div class="alert alert-warning">
                        <i class="fas fa-bell"></i>
                        <div style="flex:1;">
                            <strong>${e.chantier} — ${e.type}</strong>
                            <div style="font-size: 0.9em; margin-top: 0.3rem; color: rgba(0,0,0,0.7);">
                                ${e.description} (Date : <strong>${e.date}</strong>)
                            </div>
                            <button class="btn btn-secondary" style="margin-top: 0.5rem; font-size: 0.85em;" onclick="window.viewChantierDetails && window.viewChantierDetails(${e.chantierId})">
                                <i class="fas fa-eye"></i> Préparer
                            </button>
                        </div>
                    </div>`;
                });
            }

            // Résumé des chantiers sains
            if (alertesParRisque.bas.length > 0) {
                html += `<div class="card-header" style="margin-top: 1rem;">
                    <h2 class="card-title" style="color: var(--secondary);">
                        <i class="fas fa-check-circle"></i> Chantiers conformes
                    </h2>
                    <span class="badge badge-success">${alertesParRisque.bas.length}</span>
                </div>`;
                html += `<div class="alert alert-success">
                    <i class="fas fa-smile-wink"></i>
                    <div><strong>${alertesParRisque.bas.map(x => x.chantier.nom).join(', ')}</strong> — Aucun problème fiscal détecté.</div>
                </div>`;
            }
        }

        container.innerHTML = html;
    },

    getCurrentUser() {
        const el = document.querySelector('.user-name');
        return el ? el.textContent.trim() : 'Utilisateur';
    },

    auditLog(action, chantierId, details) {
        try {
            const key = 'btp_audit_log';
            const logs = JSON.parse(localStorage.getItem(key) || '[]');
            logs.unshift({
                ts: new Date().toISOString(),
                user: this.getCurrentUser(),
                action,
                chantierId: chantierId || null,
                details: details || {}
            });
            localStorage.setItem(key, JSON.stringify(logs.slice(0, 500)));
            window.dispatchEvent(new CustomEvent('auditUpdated'));
        } catch(e) {}
    },

    renderAuditHistory() {
        const container = document.getElementById('alertes-historique-list');
        if (!container) return;
        let logs = [];
        try { logs = JSON.parse(localStorage.getItem('btp_audit_log') || '[]'); } catch(e) {}
        if (!logs.length) {
            container.innerHTML = '<div style="color:#777;">Aucun historique pour le moment.</div>';
            return;
        }
        container.innerHTML = logs.slice(0, 30).map(l => {
            const d = new Date(l.ts);
            const dateStr = Number.isNaN(d.getTime()) ? l.ts : d.toLocaleString('fr-FR');
            const chantierName = (window.ChantiersModule && l.chantierId) ? (ChantiersModule.getById(Number(l.chantierId))?.nom || '') : '';
            return `
                <div style="padding:0.75rem 0; border-bottom:1px solid #eee;">
                    <div style="display:flex; justify-content:space-between; gap:1rem;">
                        <div style="font-weight:600;">${l.action}${chantierName ? ` — <span style="color:#555; font-weight:500;">${chantierName}</span>` : ''}</div>
                        <div style="color:#666; font-size:0.85em;">${dateStr}</div>
                    </div>
                    <div style="color:#666; font-size:0.9em; margin-top:0.25rem;">${l.user || ''}</div>
                </div>
            `;
        }).join('');
    },

    setupNavigation() {
        window.showSection = (sectionId, element) => {
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
        };
    },

    setupModals() {
        window.openModal = (modalId) => {
            // Reset form if opening new chantier modal
            if (modalId === 'newChantierModal' && this.state.editingId === null) {
                document.getElementById('newChantierForm').reset();
                document.getElementById('chantierModalTitle').textContent = 'Nouveau Chantier';
                document.getElementById('chantierSubmitBtn').textContent = 'Créer le chantier';
            }
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('active');
        };

        window.closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
            
            if (modalId === 'newChantierModal') {
                this.state.editingId = null; // Reset editing state
            }
        };

        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
                if (event.target.id === 'newChantierModal') {
                    this.state.editingId = null;
                }
            }
        };
    },

    setupChecklists() {
        // Event delegation pour les checklists
        const checklistContainer = document.getElementById('guidageChecklist');
        if (checklistContainer) {
            checklistContainer.addEventListener('change', (e) => {
                if (e.target.matches('.checkbox') && this.state.selectedGuidageId) {
                    const docName = e.target.dataset.doc;
                    const isChecked = e.target.checked;
                    
                    const chantier = ChantiersModule.getById(parseInt(this.state.selectedGuidageId));
                    if (chantier) {
                        if (!chantier.documents) chantier.documents = [];
                        
                        if (isChecked) {
                            if (!chantier.documents.includes(docName)) chantier.documents.push(docName);
                        } else {
                            chantier.documents = chantier.documents.filter(d => d !== docName);
                        }
                        
                        // Sauvegarder et mettre à jour l'UI
                        ChantiersModule.updateChantier(chantier.id, { documents: chantier.documents });
                        this.renderGuidageContent(chantier.id);
                    }
                }
            });
        }
    },

    setupGuidageUI() {
        const select = document.getElementById('guidageChantierSelect');
        if (select) {
            select.addEventListener('change', (e) => {
                const id = e.target.value;
                this.state.selectedGuidageId = id;
                this.renderGuidageContent(id);
            });
            
            // Initialiser le select
            this.updateGuidageSelect();
            window.addEventListener('chantiersUpdated', () => this.updateGuidageSelect());
        }
    },

    updateGuidageSelect() {
        const select = document.getElementById('guidageChantierSelect');
        if (!select) return;
        
        const chantiers = ChantiersModule.getAll();
        const currentVal = select.value;
        
        select.innerHTML = '<option value="">Sélectionner un chantier...</option>' + 
            chantiers.map(c => `<option value="${c.id}">${c.nom}</option>`).join('');
            
        if (currentVal) select.value = currentVal;
    },

    renderGuidageContent(id) {
        const content = document.getElementById('guidage-content');
        const empty = document.getElementById('guidage-empty');
        
        if (!id) {
            content.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        const chantier = ChantiersModule.getById(parseInt(id));
        if (!chantier) return;

        content.style.display = 'block';
        empty.style.display = 'none';
        
        document.getElementById('guidageChantierName').textContent = chantier.nom;
        
        // Générer la checklist dynamique
        const checklist = document.getElementById('guidageChecklist');
        const docs = chantier.documents || [];
        
        // Liste des documents/actions possibles selon le profil
        const items = [
            { id: 'devis_signe', label: "Devis signé par le client", required: true },
            { id: 'assurance_decennale', label: "Attestation Assurance Décennale à jour", required: true },
            { id: 'facture_acompte', label: "Facture d'acompte émise (si acomptes perçus)", required: chantier.acomptesPourcentage > 0 }
        ];

        if (chantier.role === 'sous-traitant') {
            items.push({ id: 'contrat_sous_traitance', label: "Contrat de sous-traitance signé", required: true });
            items.push({ id: 'autoliquidation_mention', label: "Mention autoliquidation sur factures", required: true });
            if (chantier.typeClient === 'administration') {
                items.push({ id: 'acceptation_paiement_direct', label: "Demande d'acceptation et paiement direct (DC4)", required: true });
            }
        } else {
            // Principale
            if ((chantier.nature === 'renovation' || chantier.nature === 'renovation_energetique') && chantier.typeClient === 'particulier') {
                items.push({ id: 'attestation_tva_reduite', label: "Attestation TVA simplifiée client", required: true });
            }
            if (chantier.typeClient === 'administration') {
                items.push({ id: 'notification_marche', label: "Notification / ordre de service (administration)", required: true });
            }
        }

        const customThresholds = window.CustomRulesModule && typeof CustomRulesModule.getCustomThresholds === 'function'
            ? CustomRulesModule.getCustomThresholds()
            : {};
        const thresholdURSSAF = customThresholds.thresholdURSSAF || 5000;
        if (chantier.budget > thresholdURSSAF) {
            items.push({ id: 'attestation_urssaf', label: "Attestation de vigilance URSSAF", required: true });
        }

        // Calcul progression
        const totalRequired = items.filter(i => i.required).length;
        const completedRequired = items.filter(i => i.required && docs.includes(i.id)).length;
        const progress = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

        document.getElementById('guidageProgressBar').style.width = `${progress}%`;
        document.getElementById('guidageProgressText').textContent = `Progression: ${progress}%`;
        
        // Rendu items
        checklist.innerHTML = items.map(item => {
            const checked = docs.includes(item.id);
            const statusClass = checked ? 'badge-success' : (item.required ? 'badge-danger' : 'badge-warning');
            const statusText = checked ? 'Validé' : 'À faire';
            
            return `
            <li class="checklist-item">
                <input type="checkbox" class="checkbox" data-doc="${item.id}" ${checked ? 'checked' : ''}>
                <span class="checklist-text ${checked ? 'completed' : ''}">${item.label}</span>
                <span class="badge ${statusClass}">${statusText}</span>
            </li>
            `;
        }).join('');

        // Rendu Recommandations (depuis l'analyse de risque)
        const recContainer = document.getElementById('guidageRecommendations');
        const analyse = chantier.analyseRisque || FiscalRules.analyserRisque(chantier); // Fallback
        
        if (analyse.alertes.length === 0 && analyse.recommendations.length === 0) {
            recContainer.innerHTML = '<div class="alert alert-success"><i class="fas fa-check"></i> Aucun risque majeur identifié.</div>';
        } else {
            let html = '';
            analyse.alertes.forEach(a => {
                html += `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> ${a}</div>`;
            });
            analyse.recommendations.forEach(r => {
                html += `<div class="alert alert-warning"><i class="fas fa-info-circle"></i> ${r}</div>`;
            });
            recContainer.innerHTML = html;
        }
    },

    setupChantierUI() {
        const searchInput = document.getElementById('chantierSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderChantiersTable(e.target.value);
            });
        }

        window.addEventListener('chantiersUpdated', () => this.renderChantiersTable());

        const form = document.getElementById('newChantierForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = {
                    nom: formData.get('nom'),
                    client: formData.get('client'),
                    budget: parseFloat(formData.get('budget')),
                    acomptesPourcentage: parseFloat(formData.get('acomptesPourcentage')),
                    dateDebut: formData.get('dateDebut'),
                    nature: formData.get('nature'),
                    role: formData.get('role'),
                    typeClient: formData.get('typeClient'),
                    coutMainOeuvre: parseFloat(formData.get('coutMainOeuvre')) || 0,
                    coutMateriaux: parseFloat(formData.get('coutMateriaux')) || 0,
                    autresCouts: parseFloat(formData.get('autresCouts')) || 0
                };

                if (this.state.editingId) {
                    const current = ChantiersModule.getById(this.state.editingId);
                    if (current && current.validated) {
                        alert("Ce chantier est validé. Pour modifier, vous devez d’abord le déverrouiller depuis la fiche chantier.");
                        return;
                    }
                    ChantiersModule.updateChantier(this.state.editingId, data);
                    this.auditLog('Modification chantier', this.state.editingId, { fields: Object.keys(data) });
                    alert('Chantier mis à jour avec succès !');
                } else {
                    const created = ChantiersModule.addChantier(data);
                    this.auditLog('Création chantier', created?.id, { nom: data.nom });
                    alert('Chantier créé avec succès !');
                }
                
                window.closeModal('newChantierModal');
                form.reset();
            };
        }
        
        // Bouton pour ouvrir le modal (reset state)
        const openBtn = document.getElementById('openNewChantierBtn');
        if(openBtn) {
            openBtn.onclick = () => {
                this.state.editingId = null;
                document.getElementById('chantierModalTitle').textContent = 'Nouveau Chantier';
                document.getElementById('chantierSubmitBtn').textContent = 'Créer le chantier';
                if(form) form.reset();
                window.openModal('newChantierModal');
            };
        }

        this.renderChantiersTable();
    },

    renderChantiersTable(searchTerm = '') {
        const tbody = document.getElementById('chantierTableBody');
        if (!tbody) return;

        let chantiers = ChantiersModule.getAll();

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            chantiers = chantiers.filter(c => 
                c.nom.toLowerCase().includes(term) || 
                c.client.toLowerCase().includes(term)
            );
        }

        const fmt = (n) => window.FiscalRules ? FiscalRules.formatFCFA(n) : `${n}`;
        tbody.innerHTML = chantiers.map(c => `
            <tr>
                <td>${c.nom}</td>
                <td>${c.client}</td>
                <td>${fmt(c.budget)}</td>
                <td>${c.acomptesPourcentage}%</td>
                <td><span class="badge badge-${c.statutFiscal}">${c.statutFiscal === 'success' ? 'Conforme' : (c.statutFiscal === 'warning' ? 'À vérifier' : 'Non conforme')}</span></td>
                <td>
                    <button class="action-btn" title="Voir détails" onclick="window.viewChantierDetails(${c.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" title="Modifier" onclick="window.editChantier(${c.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" title="Supprimer" onclick="window.deleteChantier(${c.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    setupGlobalHelpers() {
        window.deleteChantier = (id) => {
            if(confirm('Voulez-vous vraiment supprimer ce chantier ?')) {
                ChantiersModule.deleteChantier(id);
            }
        };
        
        window.editChantier = (id) => {
            const c = ChantiersModule.getById(id);
            if(c) {
                if (c.validated) {
                    alert("Ce chantier est verrouillé (validé). Ouvrez la fiche chantier pour le déverrouiller si nécessaire.");
                    return;
                }
                this.state.editingId = id;
                document.getElementById('chantierModalTitle').textContent = 'Modifier Chantier';
                document.getElementById('chantierSubmitBtn').textContent = 'Mettre à jour';
                
                const form = document.getElementById('newChantierForm');
                if (form) {
                    if(form.elements['nom']) form.elements['nom'].value = c.nom;
                    if(form.elements['client']) form.elements['client'].value = c.client;
                    if(form.elements['budget']) form.elements['budget'].value = c.budget;
                    if(form.elements['acomptesPourcentage']) form.elements['acomptesPourcentage'].value = c.acomptesPourcentage || 0;
                    if(form.elements['dateDebut']) form.elements['dateDebut'].value = c.dateDebut;
                    if(form.elements['nature']) form.elements['nature'].value = c.nature || 'neuf';
                    if(form.elements['role']) form.elements['role'].value = c.role || 'titulaire';
                    if(form.elements['typeClient']) form.elements['typeClient'].value = c.typeClient || 'entreprise';
                    if(form.elements['coutMainOeuvre']) form.elements['coutMainOeuvre'].value = c.coutMainOeuvre || 0;
                    if(form.elements['coutMateriaux']) form.elements['coutMateriaux'].value = c.coutMateriaux || 0;
                    if(form.elements['autresCouts']) form.elements['autresCouts'].value = c.autresCouts || 0;
                }
                
                window.openModal('newChantierModal');
            }
        };

        window.viewChantierDetails = (id) => {
             const c = ChantiersModule.getById(id);
             if(c) {
                 const modal = document.getElementById('chantierDetailsModal');
                 if(modal) {
                    const setContent = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
                    
                    setContent('chantierDetailsName', c.nom);
                    setContent('chantierDetailsClient', c.client);
                    setContent('chantierDetailsBudget', window.FiscalRules ? FiscalRules.formatFCFA(c.budget) : `${c.budget}`);
                    setContent('chantierDetailsNature', c.nature);
                    setContent('chantierDetailsRole', c.role);
                    
                    // Statut détaillé
                    const regime = c.regimeTVA || (window.FiscalRules ? FiscalRules.determinerRegimeTVA(c) : {code:'?', taux:'?'});
                    const calc = window.FiscalRules ? FiscalRules.calculerTVAEtReste(c) : { totalAcomptes: 0, resteAPayer: 0, tvaDue: 0 };
                    const couts = (Number(c.coutMainOeuvre || 0) || 0) + (Number(c.coutMateriaux || 0) || 0) + (Number(c.autresCouts || 0) || 0);
                    const marge = (Number(c.budget || 0) || 0) - couts;
                    const statutHtml = `
                        <span class="badge badge-${c.statutFiscal}">${c.statutFiscal === 'success' ? 'Conforme' : (c.statutFiscal === 'warning' ? 'À vérifier' : 'Non conforme')}</span>
                        <div style="font-size:0.85em; color:#555; margin-top:0.3rem;">
                            TVA: <strong>${regime.taux}%</strong> (${regime.code})
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; margin-top:0.75rem;">
                            <div style="padding:0.5rem; background:#f8fafc; border-radius:8px;">
                                <div style="color:#666; font-size:0.85em;">Acomptes encaissés</div>
                                <div style="font-weight:700;">${window.FiscalRules ? FiscalRules.formatFCFA(calc.totalAcomptes) : calc.totalAcomptes}</div>
                            </div>
                            <div style="padding:0.5rem; background:#f8fafc; border-radius:8px;">
                                <div style="color:#666; font-size:0.85em;">Reste à payer</div>
                                <div style="font-weight:700;">${window.FiscalRules ? FiscalRules.formatFCFA(calc.resteAPayer) : calc.resteAPayer}</div>
                            </div>
                            <div style="padding:0.5rem; background:#fff7ed; border-radius:8px;">
                                <div style="color:#666; font-size:0.85em;">TVA due (sur encaissements)</div>
                                <div style="font-weight:700;">${regime.autoliquidation ? 'Autoliquidation' : (window.FiscalRules ? FiscalRules.formatFCFA(calc.tvaDue) : calc.tvaDue)}</div>
                            </div>
                            <div style="padding:0.5rem; background:#f0fdf4; border-radius:8px;">
                                <div style="color:#666; font-size:0.85em;">Marge estimée</div>
                                <div style="font-weight:700;">${window.FiscalRules ? FiscalRules.formatFCFA(marge) : marge}</div>
                            </div>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.75rem;">
                            <button class="btn btn-secondary" style="font-size:0.85em; padding:0.45rem 0.75rem;" onclick="window.addAcompte && window.addAcompte(${c.id})">
                                <i class="fas fa-plus"></i> Ajouter acompte
                            </button>
                            <button class="btn btn-outline" style="font-size:0.85em; padding:0.45rem 0.75rem;" onclick="window.toggleValidation && window.toggleValidation(${c.id})">
                                <i class="fas fa-lock"></i> ${c.validated ? 'Déverrouiller' : 'Valider & verrouiller'}
                            </button>
                        </div>
                    `;
                    setContent('chantierDetailsStatut', statutHtml);

                    window.openModal('chantierDetailsModal');
                 }
             }
        };

        window.addAcompte = (id) => {
            const c = ChantiersModule.getById(id);
            if (!c) return;
            const val = prompt("Montant de l'acompte encaissé (FCFA) ?");
            const montant = Number(val);
            if (!Number.isFinite(montant) || montant <= 0) return;
            const acompte = { id: 'a' + Date.now(), date: new Date().toISOString().slice(0,10), montant: Math.round(montant) };
            const next = Array.isArray(c.acomptes) ? [...c.acomptes, acompte] : [acompte];
            ChantiersModule.updateChantier(id, { acomptes: next });
            this.auditLog('Ajout acompte', id, { montant: acompte.montant });
            alert("Acompte enregistré. La TVA due et le reste à payer ont été recalculés.");
            window.viewChantierDetails(id);
        };

        window.toggleValidation = (id) => {
            const c = ChantiersModule.getById(id);
            if (!c) return;
            if (!c.validated) {
                if (!confirm("Valider ce chantier ? Certaines informations ne seront plus modifiables.")) return;
                ChantiersModule.updateChantier(id, { validated: true, validatedAt: new Date().toISOString() });
                this.auditLog('Validation chantier', id, {});
                alert("Chantier validé et verrouillé.");
            } else {
                if (!confirm("Déverrouiller ce chantier ? (action tracée)")) return;
                ChantiersModule.updateChantier(id, { validated: false });
                this.auditLog('Déverrouillage chantier', id, {});
                alert("Chantier déverrouillé.");
            }
            window.viewChantierDetails(id);
        };
    }
};
