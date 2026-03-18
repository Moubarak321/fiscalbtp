/**
 * Module de personnalisation des règles fiscales
 * Permet d'éditer et sauvegarder les taux de TVA et seuils d'alerte
 */

window.CustomRulesModule = {
    // Récupérer les taux de TVA personnalisés
    getCustomTVA() {
        try {
            return JSON.parse(localStorage.getItem('btp_custom_tva') || 'null') || {};
        } catch(e) { return {}; }
    },

    // Récupérer les seuils personnalisés
    getCustomThresholds() {
        try {
            return JSON.parse(localStorage.getItem('btp_custom_thresholds') || 'null') || {};
        } catch(e) { return {}; }
    },

    // Récupérer la configuration de périodicité TVA + alertes échéances
    getPeriodicityConfig() {
        try {
            return JSON.parse(localStorage.getItem('btp_periodicity') || 'null') || {};
        } catch(e) { return {}; }
    },

    // Sauvegarder les taux de TVA
    saveTVA(tvaData) {
        localStorage.setItem('btp_custom_tva', JSON.stringify(tvaData));
        // Recalculer tous les statuts fiscaux après modification
        if (window.ChantiersModule) {
            window.ChantiersModule.recalculerTousLesStatuts();
        }
    },

    // Sauvegarder les seuils
    saveThresholds(thresholdData) {
        localStorage.setItem('btp_custom_thresholds', JSON.stringify(thresholdData));
        if (window.ChantiersModule) {
            window.ChantiersModule.recalculerTousLesStatuts();
        }
    },

    savePeriodicity(config) {
        localStorage.setItem('btp_periodicity', JSON.stringify(config));
        if (window.ChantiersModule) {
            window.ChantiersModule.recalculerTousLesStatuts();
        }
    },

    // Réinitialiser tous les paramètres personnalisés
    reset() {
        localStorage.removeItem('btp_custom_tva');
        localStorage.removeItem('btp_custom_thresholds');
        localStorage.removeItem('btp_periodicity');
        alert('Tous les paramètres fiscaux ont été réinitialisés par défaut.');
        if (window.ChantiersModule) {
            window.ChantiersModule.recalculerTousLesStatuts();
        }
    },

    // Exporter les paramètres en JSON
    exportConfig() {
        const config = {
            tva: this.getCustomTVA(),
            thresholds: this.getCustomThresholds(),
            exportDate: new Date().toISOString()
        };
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config_fiscale.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 100);
    }
};

// Initialisation du formulaire de paramètres au chargement
document.addEventListener('DOMContentLoaded', function() {
    window.loadCustomRulesForm = function() {
        const tva = CustomRulesModule.getCustomTVA();
        const thresholds = CustomRulesModule.getCustomThresholds();
        const periodicity = CustomRulesModule.getPeriodicityConfig();

        document.getElementById('tva-neuf').value = tva.neuf || 20;
        document.getElementById('tva-renovation').value = tva.renovation || 10;
        document.getElementById('tva-renovation-energetique').value = tva.renovation_energetique || 5.5;
        document.getElementById('threshold-urssaf').value = thresholds.thresholdURSSAF || 5000;
        document.getElementById('threshold-acompte').value = thresholds.thresholdAcompte || 30;
        const periodiciteEl = document.getElementById('tva-periodicite');
        if (periodiciteEl) periodiciteEl.value = periodicity.tvaPeriodicity || 'mensuelle';
        const echEl = document.getElementById('threshold-ech');
        if (echEl) echEl.value = periodicity.thresholdEcheanceDays || 7;
    };

    window.saveCustomRules = function() {
        const tvaData = {
            neuf: parseFloat(document.getElementById('tva-neuf').value) || 20,
            renovation: parseFloat(document.getElementById('tva-renovation').value) || 10,
            renovation_energetique: parseFloat(document.getElementById('tva-renovation-energetique').value) || 5.5
        };
        CustomRulesModule.saveTVA(tvaData);
        alert('Taux de TVA personnalisés enregistrés avec succès !');
    };

    window.saveCustomThresholds = function() {
        const thresholdData = {
            thresholdURSSAF: parseFloat(document.getElementById('threshold-urssaf').value) || 5000,
            thresholdAcompte: parseFloat(document.getElementById('threshold-acompte').value) || 30
        };
        CustomRulesModule.saveThresholds(thresholdData);
        alert('Seuils d\'alerte enregistrés avec succès !');
    };

    window.resetCustomRules = function() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres fiscaux par défaut ?')) {
            CustomRulesModule.reset();
            window.loadCustomRulesForm();
        }
    };

    window.saveCustomPeriodicity = function() {
        const periodiciteEl = document.getElementById('tva-periodicite');
        const echEl = document.getElementById('threshold-ech');
        const config = {
            tvaPeriodicity: periodiciteEl ? periodiciteEl.value : 'mensuelle',
            thresholdEcheanceDays: Math.max(1, parseInt(echEl ? echEl.value : '7', 10) || 7)
        };
        CustomRulesModule.savePeriodicity(config);
        alert('Périodicité et seuils d’échéance enregistrés !');
    };

    window.exportCustomRules = function() {
        CustomRulesModule.exportConfig();
        alert('Configuration fiscale exportée !');
    };

    // Charger les valeurs au démarrage
    window.loadCustomRulesForm();
});
