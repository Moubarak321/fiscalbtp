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
        let alertes = [];

        // 1. Alertes fiscales (analyseRisque.alertes)
        chantiers.forEach(c => {
            if (c.analyseRisque && Array.isArray(c.analyseRisque.alertes)) {
                c.analyseRisque.alertes.forEach(a => {
                    alertes.push({
                        type: 'danger',
                        icon: 'fa-exclamation-triangle',
                        titre: `Alerte fiscale - ${c.nom}`,
                        message: a,
                        chantierId: c.id
                    });
                });
            }
        });

        // 2. Échéances dépassées (retard)
        if (window.FiscalRules && window.CalendarModule) {
            chantiers.forEach(c => {
                const echeances = FiscalRules.genererEcheances(c);
                echeances.forEach(e => {
                    if (e.date && new Date(e.date) < new Date() && e.statut !== 'valide') {
                        alertes.push({
                            type: 'danger',
                            icon: 'fa-calendar-times',
                            titre: `Échéance dépassée - ${c.nom}`,
                            message: `${e.type} - ${e.description || ''} (${new Date(e.date).toLocaleDateString('fr-FR')})`,
                            chantierId: c.id
                        });
                    }
                });
            });
        }

        // 3. Alertes de niveau moyen (warning)
        chantiers.forEach(c => {
            if (c.analyseRisque && c.analyseRisque.niveau === 'moyen') {
                alertes.push({
                    type: 'warning',
                    icon: 'fa-exclamation-circle',
                    titre: `Risque à surveiller - ${c.nom}`,
                    message: c.analyseRisque.alertes[0] || 'Risque fiscal à surveiller',
                    chantierId: c.id
                });
            }
        });

        // Affichage
        let html = '';
        if (alertes.length === 0) {
            html = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> Aucune alerte critique détectée sur vos chantiers.</div>';
        } else {
            html += `<div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-exclamation-circle"></i>
                    Alertes critiques
                </h2>
                <span class="badge badge-danger">${alertes.length} alerte${alertes.length > 1 ? 's' : ''}</span>
            </div>`;
            alertes.forEach((a, idx) => {
                let extraBtn = '';
                if (a.icon === 'fa-calendar-times') {
                    extraBtn = `<button class=\"btn btn-warning\" style=\"margin-top:0.5rem; margin-left:0.5rem;\" onclick=\"window.simulateEmailAlerte && window.simulateEmailAlerte('${a.titre.replace(/'/g, "&#39;")}','${a.message.replace(/'/g, "&#39;")}')\"><i class=\"fas fa-envelope\"></i> Notifier par email</button>`;
                }
                html += `<div class=\"alert alert-${a.type}\">\n` +
                    `<i class=\"fas ${a.icon}\"></i>\n` +
                    `<div style=\"flex:1;\">\n` +
                        `<strong>${a.titre}</strong>\n` +
                        `<p>${a.message}</p>\n` +
                        `<button class=\"btn btn-secondary\" style=\"margin-top:0.5rem;\" onclick=\"window.viewChantierDetails && window.viewChantierDetails(${a.chantierId})\">Voir chantier</button>\n` +
                        extraBtn +
                    `</div>\n` +
                `</div>`;
            });
        // Simulation notification email pour échéances critiques
        window.simulateEmailAlerte = function(titre, message) {
            alert('Notification email envoyée !\n\nObjet : ' + titre + '\n' + message);
        };
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
        } else {
            // Principale
            if (chantier.nature === 'renovation' || chantier.nature === 'renovation_energetique') {
                items.push({ id: 'attestation_tva_reduite', label: "Attestation TVA simplifiée client", required: true });
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
                const formData = {
                    nom: document.getElementById('chantierName').value,
                    client: document.getElementById('chantierClient').value,
                    budget: parseFloat(document.getElementById('chantierBudget').value),
                    acomptesPourcentage: parseFloat(document.getElementById('chantierAcomptes').value),
                    dateDebut: document.getElementById('chantierDateDebut').value,
                    nature: document.getElementById('chantierNature').value,
                    role: document.getElementById('chantierRole').value,
                    typeClient: document.getElementById('chantierTypeClient').value
                };

                if (this.state.editingId) {
                    ChantiersModule.updateChantier(this.state.editingId, formData);
                    alert('Chantier mis à jour avec succès !');
                } else {
                    ChantiersModule.addChantier(formData);
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
                
                document.getElementById('chantierName').value = c.nom;
                document.getElementById('chantierClient').value = c.client;
                document.getElementById('chantierBudget').value = c.budget;
                document.getElementById('chantierAcomptes').value = c.acomptesPourcentage || 0;
                document.getElementById('chantierDateDebut').value = c.dateDebut;
                document.getElementById('chantierNature').value = c.nature || 'neuf';
                document.getElementById('chantierRole').value = c.role || 'principale';
                document.getElementById('chantierTypeClient').value = c.typeClient || 'prive';
                
                window.openModal('newChantierModal');
            }
        };

        window.viewChantierDetails = (id) => {
             const c = ChantiersModule.getById(id);
             if(c) {
                 const modal = document.getElementById('chantierDetailsModal');
                 if(modal) {
                    const setContent = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
                    
                    setContent('detailsName', c.nom);
                    setContent('detailsClient', c.client);
                    setContent('detailsBudget', new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c.budget));
                    setContent('detailsAcomptes', c.acomptesPourcentage + '%');
                    setContent('detailsDateDebut', new Date(c.dateDebut).toLocaleDateString('fr-FR'));
                    setContent('detailsType', c.nature);
                    
                    // Statut détaillé
                    const regime = c.regimeTVA || FiscalRules.determinerRegimeTVA(c);
                    const statutHtml = `
                        <span class="badge badge-${c.statutFiscal}">${c.statutFiscal}</span><br>
                        <small>TVA: ${regime.code} (${regime.taux}%)</small>
                    `;
                    setContent('detailsStatut', statutHtml);

                    window.openModal('chantierDetailsModal');
                 }
             }
        };
    }
};
