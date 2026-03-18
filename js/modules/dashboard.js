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
        const totalCA = chantiers.reduce((sum, c) => sum + (Number(c.budget || 0) || 0), 0);
        const totalTVA = chantiers.reduce((sum, c) => sum + (Number(c.tvaDue || 0) || 0), 0);
        const totalMarge = chantiers.reduce((sum, c) => sum + (Number(c.marge || 0) || 0), 0);

        this.updateStatValue('stat-chantiers-actifs', totalChantiers);
        this.updateStatValue('stat-ca-total', window.FiscalRules ? FiscalRules.formatFCFA(totalCA) : `${totalCA}`);
        this.updateStatValue('stat-tva-a-declarer', window.FiscalRules ? FiscalRules.formatFCFA(totalTVA) : `${totalTVA}`);
        this.updateStatValue('stat-marge-totale', window.FiscalRules ? FiscalRules.formatFCFA(totalMarge) : `${totalMarge}`);
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
                <div style="flex:1;">
                    <strong>${c.nom}</strong>
                    <p style="margin:0.2rem 0;">${alerteMsg}</p>
                    <button class="btn btn-outline" style="margin-top:0.5rem; font-size:0.85em; padding: 0.3rem 0.6rem; background:white;" onclick="window.viewChantierDetails && window.viewChantierDetails(${c.id})">
                        <i class="fas fa-search"></i> Voir détails
                    </button>
                </div>
            </div>
            `;
        });
        container.innerHTML = html;
    }
};
