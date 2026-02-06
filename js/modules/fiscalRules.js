/**
 * Moteur de règles fiscales spécifique au BTP
 */

window.FiscalRules = {
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
     * Vérifie les obligations de retenue de garantie
     * @param {Object} chantier 
     * @returns {Object} { obligatoire, taux, message }
     */
    verifierRetenueGarantie(chantier) {
        // La retenue de garantie (5%) est applicable si non remplacée par caution bancaire
        // Marchés privés et publics
        if (chantier.role === 'principale' || chantier.role === 'sous-traitant') {
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
        if (chantier.acomptesPourcentage > thresholdAcompte) {
            // Dans le BTP, de gros acomptes sans avancement prouvé peuvent être risqués (TVA exigible à l'encaissement pour prestataires services)
            // Note: Pour les livraisons de biens, TVA à la livraison. Pour services/travaux, TVA à l'encaissement.
            // Si on n'a pas la facture d'acompte, c'est un problème.
            if (!docs.includes('facture_acompte')) {
                score += 15;
                alertes.push(`Acomptes > ${thresholdAcompte}% sans facture d'acompte archivée`);
            }
        }
        if (chantier.acomptesPourcentage > 50) {
            score += 10; // Cumulatif
            alertes.push("Acomptes très élevés (>50%) : risque de requalification ou trésorerie");
        }

        // --- 2. Risque Sous-traitance (Loi 1975) ---
        
        if (chantier.role === 'principale' && chantier.budget > 100000) {
            // Suppose qu'un gros chantier a probablement des sous-traitants
            // Ceci est une heuristique pour la démo
            recommendations.push("Vérifier si recours à sous-traitance (obligation d'acceptation par le maître d'ouvrage)");
        }

        // Si on est sous-traitant, on doit avoir un contrat
        if (chantier.role === 'sous-traitant') {
            if (!docs.includes('contrat_sous_traitance')) {
                score += 25;
                alertes.push("Contrat de sous-traitance manquant");
            }
            if (!docs.includes('caution_bancaire') && !docs.includes('delegation_paiement')) {
                recommendations.push("Vérifier garantie de paiement (Caution ou Délégation)");
            }
        }

        // --- 3. Risque Documents Fiscaux ---
        
        // Attestation de vigilance URSSAF (tous les 6 mois si > seuil personnalisé)
        if (chantier.budget >= thresholdURSSAF && !docs.includes('attestation_urssaf')) {
            score += 20;
            alertes.push(`Attestation de vigilance URSSAF manquante (Obligatoire > ${thresholdURSSAF}€)`);
        }
        
        // Assurance Décennale
        if (!docs.includes('assurance_decennale')) {
            score += 30; // Très grave
            alertes.push("Attestation Assurance Décennale manquante");
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
        const start = new Date(chantier.dateDebut);
        const regime = this.determinerRegimeTVA(chantier);

        // 1. Déclaration TVA (Mensuelle par défaut)
        // On génère la prochaine
        let nextTvaDate = new Date();
        nextTvaDate.setDate(19); // Le 19 du mois
        if (nextTvaDate < today) {
            nextTvaDate.setMonth(nextTvaDate.getMonth() + 1);
        }

        if (regime.autoliquidation) {
            echeances.push({
                type: 'Déclaration TVA (Autoliquidation)',
                date: nextTvaDate,
                montant: 'N/A (Ligne 3B)',
                statut: 'avenir',
                priorite: 'haute',
                description: "Reporter le montant HT en ligne 'Autres opérations non imposables'"
            });
        } else {
            echeances.push({
                type: 'Déclaration TVA',
                date: nextTvaDate,
                montant: Math.round(chantier.budget * (regime.taux / 100) * 0.1) + ' € (Est.)', // 10% du budget par mois est.
                statut: 'avenir',
                priorite: 'haute',
                description: `Déclarer la TVA collectée à ${regime.taux}%`
            });
        }

        // 2. Acompte IS (si société) - Générique pour l'exemple
        // 15 mars, 15 juin, 15 sept, 15 dec
        
        // 3. Vérification Attestation URSSAF (Tous les 6 mois)
        // Si date début > 6 mois, vérifier renouvellement
        const sixMonthsLater = new Date(start);
        sixMonthsLater.setMonth(start.getMonth() + 6);
        
        if (sixMonthsLater < today) {
             echeances.push({
                type: 'Renouvellement URSSAF',
                date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7), // Urgent
                montant: '-',
                statut: 'urgent',
                priorite: 'haute',
                description: "L'attestation de vigilance doit être renouvelée tous les 6 mois"
            });
        }

        return echeances;
    }
};
