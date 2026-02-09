window.CalendarModule = {
    init() {
        this.renderEcheances();
        window.addEventListener('chantiersUpdated', () => this.renderEcheances());
    },

    renderEcheances(filter = '') {
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
        const tbody = document.querySelector('#calendar-table tbody');
        if (!tbody) return;

        let allEcheances = [];

        chantiers.forEach(c => {
            // Utiliser le moteur de règles pour générer les échéances précises
            const echeancesChantier = FiscalRules.genererEcheances(c);
            
            // Ajouter le nom du chantier à chaque échéance pour l'affichage
            echeancesChantier.forEach(e => {
                e.chantierName = c.nom;
                allEcheances.push(e);
            });
        });

        // Trier par date
        allEcheances.sort((a, b) => a.date - b.date);

        // Limiter à 10 prochaines échéances pour la vue dashboard
        // Mais si on était sur une page calendrier dédiée, on afficherait tout.
        // Ici c'est un tableau dans le dashboard ou une section ? 
        // Dans index.html, c'est dans <section id="dashboard"> "Échéances à venir" (table id="calendar-table")
        // ET potentiellement ailleurs ? Non, c'est la seule table visiblement.
        
        const displayedEcheances = allEcheances.slice(0, 10);

        // Rendu
        tbody.innerHTML = displayedEcheances.map(e => {
            // Priorité (préférée) -> badge mapping
            let badgeClass = 'badge-primary';
            let badgeText = (e.statut || 'A_VENIR').toString().toUpperCase();

            if (e.priority) {
                if (e.priority === 'critical') { badgeClass = 'badge-danger'; badgeText = 'CRITIQUE'; }
                else if (e.priority === 'important') { badgeClass = 'badge-warning'; badgeText = 'IMPORTANT'; }
                else if (e.priority === 'info') { badgeClass = 'badge-primary'; badgeText = 'INFORMATIF'; }
            } else {
                // Fallback on statut legacy
                if (e.statut === 'urgent') { badgeClass = 'badge-danger'; badgeText = 'URGENT'; }
                if (e.statut === 'valide') { badgeClass = 'badge-success'; badgeText = 'VALIDE'; }
            }

            // Formattage date
            const dateStr = (e.date && typeof e.date.toLocaleDateString === 'function') ? e.date.toLocaleDateString('fr-FR') : e.date;
            const isLate = (e.date instanceof Date ? e.date : new Date(e.date)) < new Date() && e.statut !== 'valide';
            const dateDisplay = isLate ? `<span style="color:red; font-weight:bold">${dateStr} (Retard)</span>` : dateStr;

            return `
            <tr>
                <td><strong>${e.chantierName}</strong></td>
                <td>
                    ${e.type}
                    <div style="font-size: 0.8em; color: gray;">${e.description || ''}</div>
                </td>
                <td>${dateDisplay}</td>
                <td>${e.montant}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            </tr>
            `;
        }).join('');
    }
};
