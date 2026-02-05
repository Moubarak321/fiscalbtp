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
