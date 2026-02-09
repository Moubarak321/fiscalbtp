// Gestion documentaire avancée (upload, archivage, checklist)
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('documentUploadInput');
    if (input) {
        input.addEventListener('change', function(e) {
            let docs = JSON.parse(localStorage.getItem('btp_documents') || '[]');
            Array.from(e.target.files).forEach(f => {
                docs.push({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    date: new Date().toLocaleDateString('fr-FR'),
                    content: null // Pour démo, pas de stockage binaire
                });
            });
            localStorage.setItem('btp_documents', JSON.stringify(docs));
            window.renderDocumentsTable && window.renderDocumentsTable();
            input.value = '';
        });
    }
    window.renderDocumentsTable = function() {
        const tbody = document.getElementById('documentsTableBody');
        if (!tbody) return;
        let docs = JSON.parse(localStorage.getItem('btp_documents') || '[]');
        if (!docs.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:#888;">Aucun document importé.</td></tr>';
            return;
        }
        tbody.innerHTML = docs.map((d, i) => `
            <tr>
                <td>${d.name}</td>
                <td>${d.type || 'Fichier'}</td>
                <td>${d.date}</td>
                <td>${(d.size/1024).toFixed(1)} KB</td>
                <td><button class="action-btn" onclick="window.deleteDocument && window.deleteDocument(${i})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    };
    window.deleteDocument = function(idx) {
        let docs = JSON.parse(localStorage.getItem('btp_documents') || '[]');
        docs.splice(idx,1);
        localStorage.setItem('btp_documents', JSON.stringify(docs));
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
        window.addEventListener('chantiersUpdated', () => this.renderAlertesDyn());
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
                });
            });
        }

        // Construction du HTML
        let html = '';
        const hasAlertes = alertesParRisque.haut.length + alertesParRisque.moyen.length + echeancesDepassees.length > 0;

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
            if (chantier.typeClient === 'public') {
                items.push({ id: 'acceptation_paiement_direct', label: "Demande d'acceptation et paiement direct (DC4)", required: true });
            }
        } else {
            // Principale
            if (chantier.nature === 'renovation' || chantier.nature === 'renovation_energetique') {
                items.push({ id: 'attestation_tva_reduite', label: "Attestation TVA simplifiée client", required: true });
            }
            if (chantier.typeClient === 'public') {
                items.push({ id: 'notification_marche', label: "Notification du marché public", required: true });
            }
        }

        if (chantier.budget > 5000) {
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
                    typeClient: formData.get('typeClient')
                };

                if (this.state.editingId) {
                    ChantiersModule.updateChantier(this.state.editingId, data);
                    alert('Chantier mis à jour avec succès !');
                } else {
                    ChantiersModule.addChantier(data);
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

        tbody.innerHTML = chantiers.map(c => `
            <tr>
                <td>${c.nom}</td>
                <td>${c.client}</td>
                <td>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c.budget)}</td>
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
                    if(form.elements['role']) form.elements['role'].value = c.role || 'principale';
                    if(form.elements['typeClient']) form.elements['typeClient'].value = c.typeClient || 'prive';
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
                    setContent('chantierDetailsBudget', new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c.budget));
                    setContent('chantierDetailsNature', c.nature);
                    setContent('chantierDetailsRole', c.role);
                    
                    // Statut détaillé
                    const regime = c.regimeTVA || (window.FiscalRules ? FiscalRules.determinerRegimeTVA(c) : {code:'?', taux:'?'});
                    const statutHtml = `
                        <span class="badge badge-${c.statutFiscal}">${c.statutFiscal === 'success' ? 'Conforme' : (c.statutFiscal === 'warning' ? 'À vérifier' : 'Non conforme')}</span>
                        <div style="font-size:0.85em; color:#555; margin-top:0.3rem;">
                            TVA: <strong>${regime.taux}%</strong> (${regime.code})
                        </div>
                    `;
                    setContent('chantierDetailsStatut', statutHtml);

                    window.openModal('chantierDetailsModal');
                 }
             }
        };
    }
};
