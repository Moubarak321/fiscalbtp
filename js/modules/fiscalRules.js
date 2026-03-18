/**
 * Moteur de règles fiscales spécifique au BTP
 */

window.FiscalRules = {
    /**
     * Formatte un montant en FCFA (format fr, sans décimales)
     * @param {number} amount
     */
    formatFCFA(amount) {
        const n = Number.isFinite(amount) ? amount : 0;
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' FCFA';
    },

    /**
     * Détermine le régime de TVA applicable
     * @param {Object} chantier 
     * @returns {Object} { code, taux, autoliquidation, justification }
     */
    determinerRegimeTVA(chantier) {
        // Règle 1: Sous-traitance (Autoliquidation)
        // Si l'entreprise est sous-traitante pour un assujetti, autoliquidation obligatoire
        if (chantier.role === 'sous-traitant') {
            return {
                code: 'AUTOLIQUIDATION',
                taux: 0,
                autoliquidation: true,
                justification: "Autoliquidation de la TVA (Article 283-2 nonies du CGI) - Sous-traitance BTP"
            };
        }

        // Récupérer les taux personnalisés depuis le module CustomRules
        const customTVA = window.CustomRulesModule && typeof CustomRulesModule.getCustomTVA === 'function' 
            ? CustomRulesModule.getCustomTVA() 
            : {};
        const defaultTVA = { neuf: 20, renovation: 10, renovation_energetique: 5.5 };
        const tvaMap = { ...defaultTVA, ...customTVA };

        // Règle 2: Rénovation énergétique
        // Locaux d'habitation achevés depuis > 2 ans + travaux éligibles
        if (chantier.nature === 'renovation_energetique') {
            // Simplification opérationnelle: le taux réduit est surtout pertinent pour l'habitation (souvent particulier).
            // Si client entreprise/administration, on applique par défaut le taux normal (sauf paramétrage futur).
            if (chantier.typeClient && chantier.typeClient !== 'particulier') {
                return {
                    code: 'TVA_NORMALE_20',
                    taux: tvaMap.neuf,
                    autoliquidation: false,
                    justification: `Client ${chantier.typeClient} : application par défaut de la TVA normale ${tvaMap.neuf}% (taux réduit habitation non présumé)`
                };
            }
            return {
                code: 'TVA_REDUITE_5_5',
                taux: tvaMap.renovation_energetique,
                autoliquidation: false,
                justification: `TVA à taux réduit ${tvaMap.renovation_energetique}% - Travaux d'amélioration énergétique (locaux > 2 ans)`
            };
        }

        // Règle 3: Rénovation habitat > 2 ans
        // Amélioration, transformation, aménagement, entretien
        if (chantier.nature === 'renovation' || chantier.nature === 'entretien') {
            if (chantier.typeClient && chantier.typeClient !== 'particulier') {
                return {
                    code: 'TVA_NORMALE_20',
                    taux: tvaMap.neuf,
                    autoliquidation: false,
                    justification: `Client ${chantier.typeClient} : application par défaut de la TVA normale ${tvaMap.neuf}% (taux 10% habitation non présumé)`
                };
            }
            return {
                code: 'TVA_INTERMEDIAIRE_10',
                taux: tvaMap.renovation,
                autoliquidation: false,
                justification: `TVA intermédiaire ${tvaMap.renovation}% - Travaux d'amélioration/entretien logement > 2 ans`
            };
        }

        // Par défaut: TVA Normale
        // Construction neuve, locaux commerciaux, surélévation, ou rénovation < 2 ans
        return {
            code: 'TVA_NORMALE_20',
            taux: tvaMap.neuf,
            autoliquidation: false,
            justification: `TVA normale ${tvaMap.neuf}% - Construction neuve ou locaux commerciaux`
        };
    },

    /**
     * Calcule les encaissements (acomptes) et la TVA due.
     * Hypothèse: les montants saisis sont HT (réglable plus tard si besoin TTC).
     * @param {Object} chantier
     * @returns {Object} { totalAcomptes, resteAPayer, tvaDue, tauxTVA, regime }
     */
    calculerTVAEtReste(chantier) {
        const budget = Number(chantier.budget || 0);
        const acomptes = Array.isArray(chantier.acomptes) ? chantier.acomptes : [];
        const totalAcomptes = acomptes.reduce((sum, a) => sum + (Number(a.montant || 0) || 0), 0);
        const resteAPayer = Math.max(0, budget - totalAcomptes);
        const regime = this.determinerRegimeTVA(chantier);
        const taux = Number(regime.taux || 0);
        const tvaDue = regime.autoliquidation ? 0 : Math.round(totalAcomptes * (taux / 100));
        return { totalAcomptes, resteAPayer, tvaDue, tauxTVA: taux, regime };
    },

    /**
     * Vérifie les obligations de retenue de garantie
     * @param {Object} chantier 
     * @returns {Object} { obligatoire, taux, message }
     */
    verifierRetenueGarantie(chantier) {
        // La retenue de garantie (5%) est applicable si non remplacée par caution bancaire
        // Marchés privés et publics
        if (chantier.role === 'titulaire' || chantier.role === 'sous-traitant') {
            return {
                obligatoire: true,
                taux: 5,
                message: "Retenue de garantie 5% possible sur les acomptes (sauf caution bancaire fournie)"
            };
        }
        return {
            obligatoire: false,
            taux: 0,
            message: "Pas de retenue spécifique détectée"
        };
    },

    /**
     * Analyse le risque fiscal du chantier
     * @param {Object} chantier 
     * @returns {Object} { niveau: 'bas'|'moyen'|'haut', points: number, alertes: Array, recommendations: Array }
     */
    analyserRisque(chantier) {
        let score = 0;
        let alertes = [];
        let recommendations = [];

        const docs = chantier.documents || [];

        // Récupérer les seuils personnalisés
        const customThresholds = window.CustomRulesModule && typeof CustomRulesModule.getCustomThresholds === 'function'
            ? CustomRulesModule.getCustomThresholds()
            : {};
        const thresholdAcompte = customThresholds.thresholdAcompte || 30;
        const thresholdURSSAF = customThresholds.thresholdURSSAF || 5000;

        // --- 1. Risque TVA & Facturation ---
        
        // Risque Acomptes élevés sans facture correspondante
        if ((chantier.acomptesPourcentage || 0) > thresholdAcompte) {
            // Dans le BTP, de gros acomptes sans avancement prouvé peuvent être risqués (TVA exigible à l'encaissement pour prestataires services)
            // Note: Pour les livraisons de biens, TVA à la livraison. Pour services/travaux, TVA à l'encaissement.
            // Si on n'a pas la facture d'acompte, c'est un problème.
            if (!docs.includes('facture_acompte')) {
                score += 15;
                alertes.push(`Acomptes > ${thresholdAcompte}% sans facture d'acompte archivée`);
            }
        }
        if ((chantier.acomptesPourcentage || 0) > 50) {
            score += 10; // Cumulatif
            alertes.push("Acomptes très élevés (>50%) : risque de requalification ou trésorerie");
        }

        // --- Incohérence Nature vs TVA (Requalification) ---
        const regimeAttendu = this.determinerRegimeTVA(chantier);
        if (regimeAttendu.taux < 20 && !regimeAttendu.autoliquidation) {
             // Si on s'attend à du 10% ou 5.5% mais qu'on a pas l'attestation, c'est une incohérence majeure
             if (!docs.includes('attestation_tva_reduite')) {
                 score += 25;
                 alertes.push(`Incohérence TVA : Nature "${chantier.nature}" requiert une attestation pour le taux ${regimeAttendu.taux}%`);
             }
        }

        // --- 2. Risque Sous-traitance (Loi 1975) & Marchés Publics ---
        
        if (chantier.role === 'titulaire' && (chantier.budget || 0) > 100000) {
            recommendations.push("Vérifier si recours à sous-traitance (obligation d'acceptation par le maître d'ouvrage)");
        }

        if (chantier.role === 'sous-traitant') {
            if (!docs.includes('contrat_sous_traitance')) {
                score += 25;
                alertes.push("Contrat de sous-traitance manquant");
            }
            if (!docs.includes('caution_bancaire') && !docs.includes('delegation_paiement')) {
                recommendations.push("Vérifier garantie de paiement (Caution ou Délégation)");
            }
            // Spécifique Administration
            if (chantier.typeClient === 'administration') {
                recommendations.push("Administration : Vérifier le droit au paiement direct si sous-traitance et pièces contractuelles");
            }
        }

        // --- 3. Risque Documents Fiscaux & Retards Déclaratifs ---
        
        // Attestation de vigilance URSSAF (tous les 6 mois si > seuil personnalisé)
        if (chantier.budget >= thresholdURSSAF && !docs.includes('attestation_urssaf')) {
            score += 20;
            alertes.push(`Attestation de vigilance URSSAF manquante (Obligatoire > ${this.formatFCFA(thresholdURSSAF)})`);
        }
        
        // Assurance Décennale
        if (!docs.includes('assurance_decennale')) {
            score += 30; // Très grave
            alertes.push("Attestation Assurance Décennale manquante");
        }

        // Intégration des retards depuis le calendrier
        const echeances = this.genererEcheances(chantier);
        const retards = echeances.filter(e => e.statut === 'retard' || e.statut === 'urgent');
        
        if (retards.length > 0) {
            score += 15 * retards.length; // Pénalité forte par retard
            retards.forEach(r => {
                alertes.push(`Retard Déclaratif : ${r.type} (${r.description})`);
            });
        }

        // --- 4. Risque Autoliquidation ---
        
        const regime = this.determinerRegimeTVA(chantier);
        if (regime.autoliquidation) {
            if (!docs.includes('mention_autoliquidation_facture')) {
                score += 15;
                recommendations.push("Vérifier mention 'Autoliquidation' sur les factures émises");
            }
        } else if (regime.taux < 20) {
            // Si taux réduit, il faut l'attestation simplifiée du client
            if (!docs.includes('attestation_tva_reduite')) {
                score += 20;
                alertes.push(`Attestation TVA réduite (${regime.taux}%) manquante`);
            }
        }

        // --- Détermination du niveau ---
        let niveau = 'bas';
        if (score >= 60) niveau = 'haut';
        else if (score >= 30) niveau = 'moyen';

        return {
            niveau,
            score,
            alertes,
            recommendations
        };
    },

    /**
     * Génère la liste des échéances fiscales prévisionnelles pour ce chantier
     * @param {Object} chantier 
     * @returns {Array} Liste d'objets échéance
     */
    genererEcheances(chantier) {
        const echeances = [];
        const today = new Date();
        const start = chantier.dateDebut ? new Date(chantier.dateDebut) : new Date();
        const regime = this.determinerRegimeTVA(chantier);
        const periodicityCfg = window.CustomRulesModule && typeof CustomRulesModule.getPeriodicityConfig === 'function'
            ? CustomRulesModule.getPeriodicityConfig()
            : {};
        const tvaPeriodicity = periodicityCfg.tvaPeriodicity || 'mensuelle';

        // 1. Déclaration TVA (Mensuelle / Trimestrielle) -> prochaine date au 19
        let nextTvaDate;
        if (tvaPeriodicity === 'trimestrielle') {
            const quarter = Math.floor(today.getMonth() / 3);
            const quarterEndMonth = quarter * 3 + 2; // 2,5,8,11
            // Déclaration le 19 du mois suivant la fin du trimestre
            nextTvaDate = new Date(today.getFullYear(), quarterEndMonth + 1, 19);
            if (nextTvaDate < today) {
                const nextQuarter = quarter + 1;
                const nextQuarterEnd = (nextQuarter % 4) * 3 + 2;
                const year = today.getFullYear() + (nextQuarter >= 4 ? 1 : 0);
                nextTvaDate = new Date(year, nextQuarterEnd + 1, 19);
            }
        } else {
            nextTvaDate = new Date(today.getFullYear(), today.getMonth(), 19);
            if (nextTvaDate < today) nextTvaDate = new Date(today.getFullYear(), today.getMonth() + 1, 19);
        }

        const calc = this.calculerTVAEtReste(chantier);
        const estimatedTVA = calc.tvaDue;

        echeances.push({
            type: regime.autoliquidation ? 'Déclaration TVA (Autoliquidation)' : 'Déclaration TVA',
            date: nextTvaDate,
            montant: regime.autoliquidation ? 'N/A (Autoliquidation)' : this.formatFCFA(estimatedTVA),
            statut: (nextTvaDate < today) ? 'urgent' : 'a_venir',
            priority: (nextTvaDate - today <= 3 * 24 * 3600 * 1000) ? 'critical' : ((nextTvaDate - today <= 14 * 24 * 3600 * 1000) ? 'important' : 'info'),
            description: regime.justification || ''
        });

        // 2. Acompte client (rappel au démarrage + 15 jours)
        if (chantier.acomptesPourcentage && chantier.acomptesPourcentage > 0) {
            const acompteDate = new Date(start);
            acompteDate.setDate(acompteDate.getDate() + 15);
            const montantAcompte = Math.round((chantier.budget || 0) * (chantier.acomptesPourcentage / 100));
            echeances.push({
                type: 'Acompte client',
                date: acompteDate,
                montant: this.formatFCFA(montantAcompte),
                statut: (acompteDate < today) ? 'retard' : 'a_venir',
                priority: (acompteDate - today <= 7 * 24 * 3600 * 1000) ? 'important' : 'info',
                description: `Acompte ${chantier.acomptesPourcentage}% à prévoir`
            });
        }

        // 3. Vérification attestation URSSAF (tous les 6 mois)
        const sixMonthsLater = new Date(start);
        sixMonthsLater.setMonth(start.getMonth() + 6);
        if (sixMonthsLater < today) {
            const missing = !(chantier.documents || []).includes('attestation_urssaf');
            echeances.push({
                type: 'Vérification URSSAF',
                date: new Date(),
                montant: '-',
                statut: missing ? 'urgent' : 'valide',
                priority: missing ? 'important' : 'info',
                description: missing ? 'Attestation URSSAF manquante ou à renouveler' : 'Attestation URSSAF OK'
            });
        }

        // 4. Assurance décennale => échéance critique si manquante
        if (!(chantier.documents || []).includes('assurance_decennale')) {
            echeances.push({
                type: 'Assurance Décennale',
                date: new Date(),
                montant: '-',
                statut: 'urgent',
                priority: 'critical',
                description: 'Attestation décennale manquante'
            });
        }

        // 5. Rappels génériques (Acomptes IS) - pour suivi
        const year = today.getFullYear();
        const isDates = [new Date(year,2,15), new Date(year,5,15), new Date(year,8,15), new Date(year,11,15)];
        isDates.forEach(d => {
            if (d >= today) {
                echeances.push({
                    type: 'Acompte IS',
                    date: d,
                    montant: '-',
                    statut: 'a_venir',
                    priority: 'info',
                    description: 'Acompte IS (si applicable)'
                });
            }
        });

        echeances.sort((a,b) => a.date - b.date);
        return echeances;
    }
};
