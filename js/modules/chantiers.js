window.ChantiersModule = {
    state: {
        chantiers: []
    },

    init() {
        this.loadChantiers();
    },

    loadChantiers() {
        const stored = localStorage.getItem('btp_chantiers');
        if (stored) {
            this.state.chantiers = JSON.parse(stored);
        } else {
            // Données de démonstration enrichies
            this.state.chantiers = [
                {
                    id: 1,
                    nom: "Résidence Les Jardins",
                    client: "Promoteur ABC",
                    typeClient: "prive",
                    budget: 850000,
                    acomptesPourcentage: 65,
                    dateDebut: "2025-11-01",
                    nature: "neuf",
                    role: "principale",
                    statutFiscal: "warning", // Sera recalculé
                    documents: ['devis_signe']
                },
                {
                    id: 2,
                    nom: "Centre Commercial Nord",
                    client: "SCI Nordis",
                    typeClient: "prive",
                    budget: 1450000,
                    acomptesPourcentage: 45,
                    dateDebut: "2025-12-15",
                    nature: "renovation",
                    role: "sous-traitant",
                    statutFiscal: "danger",
                    documents: []
                },
                {
                    id: 3,
                    nom: "Mairie Annexe",
                    client: "Mairie de Lyon",
                    typeClient: "public",
                    budget: 320000,
                    acomptesPourcentage: 30,
                    dateDebut: "2026-01-10",
                    nature: "renovation_energetique",
                    role: "principale",
                    statutFiscal: "success",
                    documents: ['devis_signe', 'attestation_assurance']
                }
            ];
            this.saveChantiers();
        }
        // Recalculer les statuts fiscaux au chargement
        this.recalculerTousLesStatuts();
    },

    saveChantiers() {
        localStorage.setItem('btp_chantiers', JSON.stringify(this.state.chantiers));
        // Déclencher un événement pour que le dashboard se mette à jour
        window.dispatchEvent(new CustomEvent('chantiersUpdated'));
    },

    recalculerTousLesStatuts() {
        this.state.chantiers = this.state.chantiers.map(c => {
            const analyse = FiscalRules.analyserRisque(c);
            const regime = FiscalRules.determinerRegimeTVA(c);
            
            // Mise à jour des métadonnées fiscales
            c.analyseRisque = analyse;
            c.regimeTVA = regime;
            
            // Mapping niveau de risque -> badge status
            if (analyse.niveau === 'haut') c.statutFiscal = 'danger';
            else if (analyse.niveau === 'moyen') c.statutFiscal = 'warning';
            else c.statutFiscal = 'success';
            
            return c;
        });
        this.saveChantiers();
    },

    addChantier(chantierData) {
        const newChantier = {
            id: Date.now(),
            ...chantierData,
            documents: []
        };
        
        // Calculer les règles fiscales immédiatement
        newChantier.regimeTVA = FiscalRules.determinerRegimeTVA(newChantier);
        newChantier.analyseRisque = FiscalRules.analyserRisque(newChantier);
        
        if (newChantier.analyseRisque.niveau === 'haut') newChantier.statutFiscal = 'danger';
        else if (newChantier.analyseRisque.niveau === 'moyen') newChantier.statutFiscal = 'warning';
        else newChantier.statutFiscal = 'success';

        this.state.chantiers.push(newChantier);
        this.saveChantiers();
        return newChantier;
    },

    updateChantier(id, updates) {
        const index = this.state.chantiers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.state.chantiers[index] = { ...this.state.chantiers[index], ...updates };
            this.recalculerTousLesStatuts(); // Recalculer car les données ont changé
            return true;
        }
        return false;
    },

    deleteChantier(id) {
        this.state.chantiers = this.state.chantiers.filter(c => c.id !== id);
        this.saveChantiers();
    },

    getAll() {
        return this.state.chantiers;
    },

    getById(id) {
        return this.state.chantiers.find(c => c.id === id);
    }
};
