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
                    typeClient: "entreprise",
                    budget: 850000000,
                    acomptesPourcentage: 65,
                    dateDebut: "2025-11-01",
                    nature: "neuf",
                    role: "titulaire",
                    statutFiscal: "warning", // Sera recalculé
                    documents: ['devis_signe'],
                    acomptes: [
                        { id: 'a1', date: "2025-11-20", montant: 120000000 }
                    ],
                    coutMainOeuvre: 180000000,
                    coutMateriaux: 260000000,
                    autresCouts: 25000000,
                    validated: false
                },
                {
                    id: 2,
                    nom: "Centre Commercial Nord",
                    client: "SCI Nordis",
                    typeClient: "entreprise",
                    budget: 1450000000,
                    acomptesPourcentage: 45,
                    dateDebut: "2025-12-15",
                    nature: "renovation",
                    role: "sous-traitant",
                    statutFiscal: "danger",
                    documents: [],
                    acomptes: [
                        { id: 'a1', date: "2026-01-10", montant: 250000000 }
                    ],
                    coutMainOeuvre: 220000000,
                    coutMateriaux: 310000000,
                    autresCouts: 30000000,
                    validated: false
                },
                {
                    id: 3,
                    nom: "Mairie Annexe",
                    client: "Mairie de Lyon",
                    typeClient: "administration",
                    budget: 320000000,
                    acomptesPourcentage: 30,
                    dateDebut: "2026-01-10",
                    nature: "renovation_energetique",
                    role: "titulaire",
                    statutFiscal: "success",
                    documents: ['devis_signe', 'attestation_urssaf', 'assurance_decennale', 'attestation_tva_reduite'],
                    acomptes: [],
                    coutMainOeuvre: 60000000,
                    coutMateriaux: 90000000,
                    autresCouts: 10000000,
                    validated: false
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
            const calc = FiscalRules.calculerTVAEtReste(c);

            const couts = (Number(c.coutMainOeuvre || 0) || 0) + (Number(c.coutMateriaux || 0) || 0) + (Number(c.autresCouts || 0) || 0);
            const marge = (Number(c.budget || 0) || 0) - couts;
            
            // Mise à jour des métadonnées fiscales
            c.analyseRisque = analyse;
            c.regimeTVA = regime;
            c.tvaDue = calc.tvaDue;
            c.totalAcomptes = calc.totalAcomptes;
            c.resteAPayer = calc.resteAPayer;
            c.totalCouts = couts;
            c.marge = marge;
            
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
            documents: [],
            acomptes: [],
            validated: false
        };
        
        // Calculer les règles fiscales immédiatement
        newChantier.regimeTVA = FiscalRules.determinerRegimeTVA(newChantier);
        newChantier.analyseRisque = FiscalRules.analyserRisque(newChantier);
        const calc = FiscalRules.calculerTVAEtReste(newChantier);
        newChantier.tvaDue = calc.tvaDue;
        newChantier.totalAcomptes = calc.totalAcomptes;
        newChantier.resteAPayer = calc.resteAPayer;
        const couts = (Number(newChantier.coutMainOeuvre || 0) || 0) + (Number(newChantier.coutMateriaux || 0) || 0) + (Number(newChantier.autresCouts || 0) || 0);
        newChantier.totalCouts = couts;
        newChantier.marge = (Number(newChantier.budget || 0) || 0) - couts;
        
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
