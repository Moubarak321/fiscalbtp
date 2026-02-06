window.DashboardModule = {
    init() {
        // Écouter les mises à jour des chantiers
        window.addEventListener('chantiersUpdated', () => this.renderStats());
        // Rendu initial
        this.renderStats();
    },

    renderStats(filter = '') {
        let chantiers = ChantiersModule.getAll();
        if (filter) {
            const val = filter.toLowerCase();
            chantiers = chantiers.filter(c =>
                c.nom.toLowerCase().includes(val) ||
                c.client.toLowerCase().includes(val) ||
                (c.nature && c.nature.toLowerCase().includes(val)) ||
                (c.statutFiscal && c.statutFiscal.toLowerCase().includes(val))
            );
        }
        // Calcul des indicateurs
        const totalChantiers = chantiers.length;
        const alertesEnCours = chantiers.filter(c => c.statutFiscal === 'danger' || c.statutFiscal === 'warning').length;
        const chantiersConformes = chantiers.filter(c => c.statutFiscal === 'success').length;
        const conformite = totalChantiers > 0 ? Math.round((chantiersConformes / totalChantiers) * 100) : 100;
        this.updateStatValue('stat-chantiers-actifs', totalChantiers);
        this.updateStatValue('stat-alertes', alertesEnCours);
        this.updateStatValue('stat-conformite', conformite + '%');
        this.renderActionsPrioritaires(chantiers);
    },

    updateStatValue(id, value) {
        // Recherche par sélecteur plus robuste si l'ID n'est pas direct
        // Note: Dans le HTML actuel, les stats n'ont pas d'ID unique facile, on va devoir adapter le HTML ou utiliser des sélecteurs complexes.
        // Pour l'instant, je vais assumer que je vais ajouter des IDs dans le HTML.
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    renderActionsPrioritaires(chantiers) {
        const container = document.getElementById('actions-prioritaires-container');
        if (!container) return;

        const highRisk = chantiers.filter(c => c.statutFiscal === 'danger');
        
        if (highRisk.length === 0) {
            container.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i><div><strong>Tout est conforme</strong><p>Aucune action prioritaire requise.</p></div></div>';
            return;
        }

        let html = '';
        highRisk.forEach(c => {
            // Prendre la première alerte majeure
            const alerteMsg = c.analyseRisque?.alertes[0] || "Risque fiscal élevé détecté";
            html += `
            <div class="alert alert-danger">
                <i class="fas fa-times-circle"></i>
                <div>
                    <strong>${c.nom}</strong>
                    <p>${alerteMsg}</p>
                </div>
            </div>
            `;
        });
        container.innerHTML = html;
    }
};
