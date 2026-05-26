# Guide Complet d'Utilisation - FiscalBTP Pro
## Accompagnement Fiscal pour le Secteur BTP

---

## Table des Matières

1. [Introduction](#introduction)
2. [Vue d'ensemble de l'application](#vue-densemble)
3. [Interface principale](#interface-principale)
4. [Guide par section](#guide-par-section)
5. [Règles de guidage fiscal](#règles-de-guidage-fiscal)
6. [Règles de détermination du régime TVA](#règles-tva)
7. [Analyse des risques fiscaux](#analyse-risques)
8. [Procédures courantes](#procédures-courantes)
9. [FAQ](#faq)

---

## Introduction

**FiscalBTP Pro** est une application web conçue pour accompagner les entreprises de BTP dans la gestion de leurs obligations fiscales, la conformité réglementaire et l'optimisation fiscale.

### Objectifs de l'application :
- **Centraliser** les informations sur les chantiers et les obligations fiscales
- **Automatiser** le calcul des régimes TVA applicables
- **Alerter** sur les risques fiscaux potentiels
- **Guider** la documentation obligatoire par chantier
- **Partager** des rapports d'analyse avec les auditeurs
- **Personnaliser** les paramètres fiscaux selon votre contexte

### Accès
L'application est accessible directement via le fichier `index.html` dans un navigateur moderne (Chrome, Firefox, Safari, Edge).

---

## Vue d'ensemble de l'application

### Structure générale

L'application utilise une architecture modulaire avec :
- **Frontend** : HTML5 + CSS3 + JavaScript vanilla
- **Stockage** : localStorage du navigateur (données persistantes)
- **Modules** :
  - `FiscalRules` : Moteur de règles fiscales
  - `ChantiersModule` : Gestion des chantiers
  - `DashboardModule` : Indicateurs et statistiques
  - `CalendarModule` : Échéances fiscales
  - `UIModule` : Interface utilisateur
  - `CustomRulesModule` : Paramètres personnalisés

### Flux de données

```
1. Créer/modifier un chantier
   ↓
2. FiscalRules analyse le risque et détermine le régime TVA
   ↓
3. Dashboard affiche les indicateurs globaux
   ↓
4. Calendar génère les échéances prévisionnelles
   ↓
5. UIModule affiche les alertes et guidage
```

---

## Interface Principale

### Layout

L'interface est composée de :

| Élément | Description |
|---------|-------------|
| **Header** | Logo, menu hamburger (mobile), notifications, informations utilisateur |
| **Sidebar** | Navigation principale avec 7 sections |
| **Main Content** | Zone de contenu des sections actives |
| **Modals** | Dialogues pour créer/modifier des chantiers |

### Navigation

Les 7 sections principales sont accessibles via la sidebar :

1. 📊 **Tableau de bord** - Vue synthétique et alertes prioritaires
2. 🏗️ **Chantiers** - Gestion complète des chantiers
3. 📋 **Guidage** - Checklist documentaire par chantier
4. ⚠️ **Alertes** - Notifications fiscales en temps réel
5. 📄 **Documents** - Centre documentaire centralisé
6. 📈 **Rapports** - Analyses et statistiques
7. ⚙️ **Paramètres** - Personnalisation des règles fiscales

---

## Guide par Section

### 1. 📊 Tableau de Bord

#### Vue d'ensemble
Le tableau de bord est votre **centre de contrôle** de la conformité fiscale.

#### Indicateurs affichés

| Indicateur | Signification |
|-----------|--------------|
| **Chantiers actifs** | Nombre total de chantiers en portefeuille |
| **Alertes en cours** | Chantiers avec risques "danger" ou "warning" |
| **Taux de conformité** | Pourcentage de chantiers sans risque fiscal détecté |

#### Actions prioritaires

Une section "Actions prioritaires" affiche automatiquement :
- ✅ **Message de conformité** : Si aucun risque détecté
- ⚠️ **Alertes critiques** (danger) : Par risque détecté avec recommandations
- 🔍 Bouton "Voir détails" pour examiner chaque risque

#### Filtre de recherche

Un champ de recherche en haut permet de **filtrer les chantiers** par :
- Nom du chantier
- Client
- Nature (neuf, rénovation, etc.)
- Statut fiscal

### 2. 🏗️ Gestion des Chantiers

#### Créer un chantier

**Cliquez** sur le bouton **"Nouveau chantier"** (coin haut-droit).

**Formula duModal :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| **Nom du chantier** | Texte | ✅ | Ex: "Résidence Les Jardins" |
| **Client** | Texte | ✅ | Nom du promoteur ou maître d'ouvrage |
| **Type de client** | Liste | ✅ | "Privé" ou "Public" |
| **Budget (€)** | Nombre | ✅ | Montant HT prévisionnel |
| **% Acomptes** | Nombre | ✅ | Pourcentage facturé en acompte |
| **Date de début** | Date | ✅ | Date de démarrage |
| **Nature des travaux** | Liste | ✅ | Voir détailed ci-dessous |
| **Rôle** | Liste | ✅ | Principal ou Sous-traitant |

##### Options Nature des travaux

- **Neuf** : Construction neuve → TVA normale 18%
- **Rénovation** : Amélioration/entretien habitat > 2 ans → TVA 10%
- **Rénovation énergétique** : Travaux éligibles en locaux > 2 ans → TVA 5.5%
- **Entretien** : Maintenance courante → TVA 10%

##### Options Rôle

- **Principal** : Vous êtes l'entreprise principale du marché
- **Sous-traitant** : Vous êtes sous-traitant chez un assujetti TVA → Autoliquidation

#### Modifier ou supprimer

1. Allez à la section **"Chantiers"**
2. Localisez le chantier dans le tableau
3. Cliquez sur l'icône **✏️** pour modifier
4. Cliquez sur l'icône **🗑️** pour supprimer

💡 **Note** : La modification recalcule automatiquement l'analyse de risque.

### 3. 📋 Guidage Fiscal par Chantier

#### Objectif

Cette section fournit une **checklist personnalisée** des documents et actions obligatoires **par chantier**.

#### Mode d'emploi

1. **Sélectionnez** un chantier dans le dropdown "Chantier"
2. Une **checklist dynamique** s'affiche
3. **Cochez** les éléments au fur et à mesure de leur acquisition
4. La **barre de progression** indique le taux de complétude

#### Éléments génériques (tous les chantiers)

- ✓ Devis signé par le client (obligatoire)
- ✓ Attestation Assurance Décennale à jour (obligatoire)
- ✓ Facture d'acompte émise (si acomptes perçus)

#### Éléments spécifiques

##### Pour les **sous-traitants** supplémentairement :
- ✓ Attestation de régularité URSSAF (avant chaque paiement)
- ✓ Preuve d'autoliquidation déclarée (déclaration TVA mensuelle)
- ✓ Contrat de sous-traitance signé par tous les cocontractants

##### Pour les chantiers **> 5 000 €** supplémentairement :
- ✓ Attestation de vigilance URSSAF (tous les 6 mois)

#### Code couleur

- 🟢 **Vert** : Élément complété ✓
- 🟡 **Jaune** : Élément recommandé mais non obligatoire
- 🔴 **Rouge** : Élément obligatoire et manquant

### 4. ⚠️ Alertes et Notifications

#### Types d'alertes

| Niveau | Couleur | Signification |
|--------|---------|---------------|
| **Critique** | 🔴 | Action immédiate requise (< 3 jours) |
| **Important** | 🟠 | À traiter rapidement (< 14 jours) |
| **Informatif** | 🔵 | À noter (purement informatif) |

#### Filtres disponibles

- **Afficher tout** : Toutes les alertes
- **Critiques seulement** : Pour cibler l'urgent
- **Exporter CSV** : Générer un rapport pour votre auditeur

#### Sources d'alerte

1. **Risques fiscaux** (du moteur d'analyse)
2. **Échéances dépassées** (du calendrier)
3. **Documents manquants** (du guidage)

### 5. 📄 Documents Centralisés

#### Objectif

Centraliser tous les documents denses liés à vos chantiers dans un seul espace.

#### Upload de documents

1. Cliquez sur **"Sélectionner un fichier"**
2. Choisissez votre document (PDF, Word, Excel, images, etc.)
3. Le système enregistre :
   - Nom
   - Type
   - Taille
   - Date d'ajout

#### Gestion des documents

- **Voir** : Cliquez sur le nom pour télécharger
- **Supprimer** : Cliquez sur l'icône 🗑️

#### Bonnes pratiques

```
📁 Documents à archiver :
├── Devis signés
├── Factures et devis-factures
├── Attestations d'assurance
├── Preuves de vigilance URSSAF
├── Contrats de sous-traitance
├── Déclarations TVA
└── Correspondances avec l'administration
```

### 6. 📈 Rapports et Analyses

#### Sections

##### Overview Stats
- Nombre total de chantiers
- Revenus totaux
- TVA collectée (estimation)
- Risques détectés

##### Export Calendrier Fiscal
Un tableau synthétique de **toutes les échéances** avec :
- Chantier
- Type d'échéance
- Date
- Montant estimé
- Statut

**Export CSV** : Générable pour export vers Excel ou audit.

### 7. ⚙️ Paramètres Fiscaux Personnalisés

#### Objectif

Adapter les **règles de calcul** selon votre contexte fiscal spécifique.

#### Paramètres personnalisables

##### Taux de TVA

| Nature | Défaut | Vous pouvez modifier |
|--------|--------|------|
| **Construction neuve** | 18% | ❌ Non (norme légale) |
| **Rénovation** | 10% | ✅ Oui (selon cas) |
| **Rénovation énergétique** | 5.5% | ✅ Oui (selon travaux) |

##### Seuils d'alerte

| Seuil | Défaut | Signification |
|-------|--------|---------------|
| **Seuil URSSAF** | 5 000 € | Montant au-delà duquel vigilance requise |
| **Seuil Acomptes** | 30% | % d'acompte déclenchant une alerte |

#### Utilisation

1. Allez à **"Paramètres"**
2. Modifiez les valeurs selon votre contexte
3. Cliquez **"Enregistrer"**
4. Tous les chantiers se **recalculent automatiquement**

#### Export / Réinitialisation

- **Exporter Config** : Génère un fichier JSON de vos paramètres
- **Réinitialiser** : Revient aux défauts (attention : irréversible)

---

## Règles de Guidage Fiscal

### Principes Généraux

Le guidage fiscal automatise l'**identification des documents obligatoires** en fonction du profil unique de chaque chantier.

### Matrice de Guidage

#### Critères d'évaluation

```
Pour chaque chantier, le système évalue :
1. Le rôle : Principal vs Sous-traitant
2. La nature : Neuf vs Rénovation vs Énergétique
3. Le budget : Seuil de 5 000 € et 100 000 €
4. Le client : Public vs Privé
5. Les documents collectés jusqu'à présent
```

#### Règles par situation

##### Situation 1 : Sous-traitant BTP (Autoliquidation TVA)

**Documents obligatoires :**
1. ✅ Contrat de sous-traitance signé (Loi 1975 du 3/1/75)
2. ✅ Attestation URSSAF avant chaque paiement
3. ✅ Copie de la déclaration de sous-traitance à l'URSSAF
4. ✅ Preuve d'autoliquidation TVA (ligne déclaration mensuelle)

**Recommandations :**
- Déclaration TVA faite dans les 19 jours du mois suivant
- Archivage des justificatifs 6 ans

##### Situation 2 : Principal avec rôle public (Marché public)

**Documents obligatoires :**
1. ✅ Attestation de vigilance URSSAF (6 mois)
2. ✅ Devis/facture conforme aux Conditions Particulières
3. ✅ Certificat de régularité fiscale (si > 100k€)

**Recommandations :**
- Déclarer la sous-traitance à la mairie
- Retenue de garantie 5% standard

##### Situation 3 : Principal avec client privé < 5k€

**Documents obligatoires :**
1. ✅ Devis signé
2. ✅ Facturation conforme

**Recommandations :**
- Simplification possible : TVA sur encaissements
- Pas de vigilance URSSAF obligatoire

##### Situation 4 : Principal avec client privé > 5k€

**Documents obligatoires :**
1. ✅ Devis signé
2. ✅ Attestation de vigilance URSSAF (renouvellement 6 mois)
3. ✅ Assurance décennale

**Recommandations :**
- Vérifier la régularité URSSAF du maître d'ouvrage
- Vigilance concernant les acomptes importants

### Calendrier documentaire obligatoire

```
┌─────────────────────────────────────────────────┐
│ ÉVÉNEMENT                 │ DOCUMENT       │ DÉLAI│
├──────────────────────────────────────────────────┤
│ Démarrage                 │ Devis signé    │ Avant│
│ Travaux débutent          │ Attestation    │ Avant│
│ Chaque paiement           │ Facture        │ 30j  │
│ Tous les 6 mois           │ Vigilance URSS │ Renou│
│ En continu                │ TVA mensuelles │ 19e  │
│ Avant fin                 │ Attestations   │ Avant│
└──────────────────────────────────────────────────┘
```

---

## Règles de Détermination du Régime TVA

### Moteur d'analyse TVA

Le système applique une **logique hiérarchique** pour déterminer le régime TVA optimal.

### Hiérarchie de détermination

```
┌─ Chantier externe ─────────────────┐
│                                    │
├─ Rôle = Sous-traitant ?           │
│  → OUI : AUTOLIQUIDATION (0%)      │
│      (Articles 283-2 CGI)          │
│  → NON : Continuer                 │
│                                    │
├─ Nature = Rénovation énergétique ? │
│  → OUI : TVA RÉDUITE 5,5%          │
│      (Conditions: habitat > 2 ans) │
│  → NON : Continuer                 │
│                                    │
├─ Nature = Rénovation/Entretien ?   │
│  → OUI : TVA INTERMÉDIAIRE 10%     │
│      (Conditions: habitat > 2 ans) │
│  → NON : Continuer                 │
│                                    │
└─ DÉFAUT : TVA NORMALE 18%          │
   (Construction neuve ou commerce)  │
```

### Règles détaillées par régime

#### Régime 1 : Autoliquidation (0%)

**Conditions :**
- Vous êtes en position de **sous-traitant**
- Client est un **assujetti TVA**

**Justification légale :**
- Article 283-2 nonies du Code Général des Impôts
- Directive 2006/112/CE (TVA intra-UE)

**Implications :**
- ✅ Vous ne facturez PAS de TVA
- ✅ Vous déclarez l'autoliquidation en ligne TVA mensuelle
- ✅ Client procède à sa propre taxation
- ✅ Contrat de sous-traitance obligatoire

**Exemple :**
```
Budget HT : 100 000 €
TVA facturée : 0 € (autoliquidation)
Total : 100 000 €

Déclaration TVA (ligne spéciale) : 18 000 € autoliquidés
```

#### Régime 2 : TVA Réduite 5,5%

**Conditions :**
- Travaux **d'amélioration énergétique**
- Logement **achevé depuis plus de 2 ans**
- Travaux **éligibles** (isolation, chauffage, ventilation, etc.)

**Justification légale :**
- Articles 279 et 280 du CGI
- Arrêté thermique et liste des travaux éligibles

**Documents probants :**
- ✅ Facture avec mention "Travaux éligibles à 5,5%"
- ✅ Preuves de travaux (certificats, rapports)
- ✅ État de l'immeuble avant travaux

**Exemple :**
```
Budget HT : 50 000 €
TVA à 5,5% : 2 750 €
Total TTC : 52 750 €

Déductible pour le client (logement principal/secondaire)
```

#### Régime 3 : TVA Intermédiaire 10%

**Conditions :**
- Travaux d'**amélioration, transformation, aménagement**
- Logement **achevé depuis plus de 2 ans**
- Destiné à l'**habitation**

**Justification légale :**
- Article 279 du CGI (travaux d'amélioration)

**Cas couverts :**
- Rénovation globale
- Amélioration fonctionnelle
- Entretien et maintenance
- Agrandissement

**Exemple :**
```
Budget HT : 80 000 €
TVA à 10% : 8 000 €
Total TTC : 88 000 €
```

#### Régime 4 : TVA Normale 18%

**Conditions :**
- **Construction neuve** (y compris surélévation)
- Locaux **commerciaux**
- Travaux sur immeuble **< 2 ans**
- Sous-traitance sans autoliquidation

**Justification légale :**
- Article 277 du CGI (TVA normale)

**Exemple :**
```
Budget HT : 200 000 €
TVA à 18% : 36 000 €
Total TTC : 236 000 €
```

### Exceptions et cas particuliers

| Cas | Régime appliqué | Remarque |
|-----|-----------------|----------|
| Vente de maison habitation | 18% | Exonération possible |
| Travaux en zone sinistrée | 5,5% | Sur justification |
| Fournitures + Pose | Régime travaux | TVA sur totalité |
| Travaux par own services | Autoliquidation | Sous certaines conditions |

---

## Analyse des Risques Fiscaux

### Méthodologie d'analyse

Le système **notation des risques** sur **100 points** avec seuils :

```
Score    Niveau    Couleur    Action
────────────────────────────────────
0-30     BAS       🟢 Vert    Suivi standard
31-60    MOYEN     🟡 Orange  Surveillance
61-100   HAUT      🔴 Rouge   Intervention urgente
```

### Critères d'évaluation

#### 1️⃣ Risque TVA & Facturation (max 30 pts)

**Acomptes élevés (> seuil, défaut 30%)**
- 🔴 +5 pts : Risque de requalification
- ⚠️ Recommandation : Justifiez les acomptes par étapes identifiables

**Incohérence Nature/TVA**
- 🔴 +10 pts : Si nature exigerait TVA basse mais TVA normale appliquée
- ⚠️ Recommandation : Régulariser avenant ou note d'intention

**TVA sur encaissements (non déclaré)**
- 🔴 +15 pts : Révision possible par administration
- ⚠️ Recommandation : Justifier l'option choisie

#### 2️⃣ Risque Sous-traitance Loi 1975 (max 25 pts)

**Sous-traitant sans documents**
- 🔴 +10 pts : Contrat signé absent
- 🔴 +10 pts : Déclaration URSSAF non faite
- 🔴 +5 pts : Attestation URSSAF absente

**Principal sans vigilance sur sous-traitants**
- 🔴 +10 pts : Déclaration sous-traitance non effectuée
- ⚠️ Recommandation : Demander attestations URSSAF de vos sous-traitants

#### 3️⃣ Risque Documents Fiscaux (max 25 pts)

**Assurance Décennale**
- 🔴 +10 pts : Manquante ou expirée
- ✅ Obligatoire avant travaux

**Attestation URSSAF (chantiers > 5k€)**
- 🔴 +8 pts : Absente ou périmée (> 6 mois)
- 🔴 +5 pts : À renouveler bientôt

**Retards déclaratifs**
- 🔴 +7 pts : TVA déclarée après le 19
- 🔴 +5 pts : IS/CFE en retard

#### 4️⃣ Risque Autoliquidation (max 15 pts)

**Pour sous-traitants :**
- 🔴 +10 pts : Autoliquidation non déclarée correctement
- 🔴 +5 pts : Montant TVA déclaré ne correspond pas au devis

**Pour principaux :**
- 🔴 +5 pts : Sous-traitants facturant TVA en autoliquidation
- ⚠️ Recommandation : Harmoniser les régimes TVA

#### 5️⃣ Risque Budget & Seuils (max 10 pts)

**Seuils publics**
- 🔴 +10 pts : Budget > 100k€ sans documents publics requis

**Seuils franchements**
- 🔴 +5 pts : Contournement apparent (plusieurs contrats < 100k)

### Recommendations générées automatiquement

Le système génère des **recommendations contextualisées** :

| Risque détecté | Recommendation |
|-----------------|-------------------|
| TVA anormale | Vérifier avant/après 2 ans du bâtiment |
| Sous-traitant sans contrat | Signer contrat immédiatement |
| Attestation URSSAF < 6 mois | Renouveler avant prochaine facture |
| Assurance décennale expirée | Demander nouvel original à l'assureur |
| Retard déclaratif > 3j | Contacter votre expert-comptable |

---

## Procédures Courantes

### Procédure 1 : Intégrer un nouveau chantier

**Étapes :**

1. Cliquez **"Nouveau chantier"** (section Chantiers)
2. Remplissez les informations :
   - Nom, Client, Type client
   - Budget et % acomptes
   - Date de début
   - Nature (clé pour TVA)
   - Rôle (Principal/Sous-traitant)
3. Validez : Le système **calcule automatiquement** :
   - ✅ Régime TVA
   - ✅ Analyse de risque
   - ✅ Liste des documents attendus
4. Allez à **Guidage** pour voir la checklist
5. Commencez à collecter les documents via **Documents**

**Durée :** 5 minutes

### Procédure 2 : Valider la conformité avant facturation

**Étapes :**

1. Allez à **Tableau de bord**
2. Vérifiez que votre chantier affiche **✅ Conformité** (badge vert)
3. Sinon, explorez les **Actions prioritaires** :
   - Cliquez **"Voir détails"** sur chaque alerte
   - Consultez les recommendations
   - Collectez les documents manquants
4. Allez à **Guidage** et complétez la checklist
5. **Retour Tableau de bord** : Le statut doit passer à vert

**Durée :** 10-20 minutes (selon documents à collecter)

### Procédure 3 : Adapter les paramètres fiscaux

**Cas d'usage :** Vous avez une situation particulière (TVA dérogatoire, seuils différents d'après maître d'ouvrage).

**Étapes :**

1. Allez à **Paramètres**
2. Modifiez les taux de TVA ou seuils selon votre contexte
3. Cliquez **"Enregistrer TVA personnalisée"** ou **"Enregistrer seuils"**
4. ✅ Tous les chantiers **se recalculent automatiquement**
5. Exportez la configuration pour la transmettre à votre auditeur (optionnel)

⚠️ **Important :** Ces modifications affectent TOUS les chantiers.

**Durée :** 5 minutes

### Procédure 4 : Exporter un rapport pour l'auditeur

**Étapes :**

**Alertes :**
1. Allez à **Alertes**
2. Cliquez **"Exporter alertes CSV"**
3. Utiliser le fichier dans Excel

**Calendrier fiscal :**
1. Allez à **Rapports**
2. Cliquez **"Exporter calendrier"**
3. Utilisez pour planning fiscal

**Configuration :**
1. Allez à **Paramètres**
2. Cliquez **"Exporter Config"**
3. Conservez en archive

**Durée :** 5 minutes (3 fichiers)

### Procédure 5 : Ajouter un sous-traitant (matrice TVA)

**Scénario :** Vous êtes principal et engagez un sous-traitant.

**Étapes :**

1. ✅ Faites signer le **contrat de sous-traitance** (Loi 1975)
2. ✅ Demandez l'**attestation URSSAF** avant paiement
3. ✅ Le sous-traitant vous facture **en autoliquidation** (0% TVA)
4. **Vous** reportez cette autoliquidation sur votre TVA mensuelle
5. Archivez tous les documents dans **Documents**
6. Mettez à jour l'**analyse de risque** (recalcul automatique)

⚠️ **Vigilance :** Non-respect = pénalités + majorations 80%.

**Durée :** 30 minutes (administratif)

### Procédure 6 : Gérer les acomptes clients

**Scénario :** Client demande 50% d'acompte, vous en demandez 30%.

**Étapes :**

1. Dans **Chantiers**, modifiez le champ **"% Acomptes"** à 50
2. ⚠️ Le système affichera une alerte (> seuil 30%)
3. **Justification :** Ajoutez une note dans les documents :
   ```
   "Acompte 50% justifié par montant important (200k€) 
   et calendrier des approvisionnements."
   ```
4. Allez à **Alertes** : Vous verrez la recommendation
5. ✅ Facturez avec mention explicite : "Acompte pour frais directs"

**Durée :** 10 minutes

---

## Scénarios d'Utilisation Avancée

### Scénario 1 : Construction neuve principale (client privé)

**Profil chantier :**
- Nature : Neuf
- Rôle : Principal
- Budget : 500k€
- Client : Privé

**Règles appliquées :**
```
Régime TVA    → TVA NORMALE 18%
Justification → Construction neuve (article 277 CGI)
Documents     → Attestation URSSAF (> 5k€), Assurance décennale
Alertes       → Vigilance si acomptes > 30%
Deadline      → TVA déclarée avant 19 du mois suivant
```

**Checklist :**
- [ ] Devis signé
- [ ] Assurance décennale
- [ ] Attestation vigilance URSSAF
- [ ] Factures avec TVA 18%

### Scénario 2 : Rénovation sous-traitant (PUBLIC)

**Profil chantier :**
- Nature : Rénovation
- Rôle : Sous-traitant
- Budget : 150k€
- Client : Mairie

**Règles appliquées :**
```
Régime TVA    → AUTOLIQUIDATION (0%)
Justification → Sous-traitance BTP (article 283-2 CGI)
Documents     → Contrat sous-traitance sig., Attestation URSSAF, 
                Déclaration URSSAF
Alertes       → CRITIQUE : Contrat manquant
Deadline      → Déclaration TVA avant 19 du mois suivant
```

**Checklist :**
- [ ] Contrat de sous-traitance signé
- [ ] Attestation URSSAF avant paiement
- [ ] Déclaration sous-traitance (mairie)
- [ ] Factures sans TVA (autoliquidation)
- [ ] Preuves autoliquidation déclarée

### Scénario 3 : Rénovation énergétique (client privé)

**Profil chantier :**
- Nature : Rénovation énergétique
- Rôle : Principal
- Budget : 80k€
- Client : Privé
- Bien > 2 ans : OUI

**Règles appliquées :**
```
Régime TVA    → TVA RÉDUITE 5,5%
Justification → Travaux d'amélioration énergétique (article 279 CGI)
Documents     → Devis détaillé travaux, Attestation géothermie/etc.,
                Facture 5,5%
Alertes       → Alerte si nature incorrectement saisi
Deadline      → Déduction TVA 30 jours après facture
```

**Bonus :** Client peut déduire TVA (crédit d'impôt ou MaPrimeRénov).

**Facture modèle :**
```
Travaux de rénovation énergétique :
- Isolation thermique    : 50 000 € HT
- Chauffage gaz + PAC    : 25 000 € HT
- Pose et main-d'œuvre   : 5 000 € HT
────────────────────────────
Sous-total HT            : 80 000 €
TVA 5,5% (travaux éligibles) : 4 400 €
────────────────────────────
TOTAL TTC                : 84 400 €
```

---

## FAQ

### Q1. Quand dois-je utiliser l'autoliquidation ?
**R.** Exclusivement si vous êtes **sous-traitant** auprès d'un **assujetti TVA**. Le client est responsable d'une TVA sur ses achats. Cette règle prévient la fraude.

### Q2. Mon attest URSSAF a 7 mois. Est-ce un problème ?
**R.** ⚠️ Oui. La validité est **6 mois**. Renouvelez-la IMMÉDIATEMENT avant la prochaine facture pour éviter une alerte "Anomalie URSSAF".

### Q3. Puis-je facturer 50% d'acompte sans justification ?
**R.** Techniquement oui, mais le système vous alerte. L'administration accepte les acomptes > 30%, à condition que vous justifiiez par :
- Calendrier des paiements fournisseurs
- Frais directs (matériaux, sous-traitance)
- Si contesté : risque de requalification TVA.

### Q4. Je suis principal. Mon sous-traitant me facture avec TVA 18%. Est-ce normal ?
**R.** **NON**. Il devrait facturer en **zéro TVA (autoliquidation)**. S'il facture 18%, il ne respecte pas son statut légal. 🔴 Contactez-le immédiatement.

### Q5. Quelle TVA pour une extension de maison habitée depuis 10 ans ?
**R.** Cela dépend :
- **Extension = surélévation** ? → TVA 18%
- **Extension ≠ surélévation** (annexe) ? → TVA 5,5% si travaux d'amélioration
- **Amélioration salle de bain/cuisine** ? → TVA 10%

Le système demande la **nature précise**. Choisissez la catégorie la plus appropriée.

### Q6. Comment personnaliser le seuil URSSAF de 5 000 € ?
**R.** Allez à **Paramètres** > Modifiez **"Seuil URSSAF"** > Cliquez **"Enregistrer"**. ✅ Tous les chantiers se mettront à jour.

### Q7. Puis-je exporter les données en format autre que CSV ?
**R.** Actuellement, seul **CSV** est disponible. Vous pouvez importer le CSV dans **Excel** et exporter au format de votre choix (XLSX, PDF, etc.).

### Q8. L'appli stocke-t-elle mes données dans le cloud ?
**R.** **Non**. Les données restent dans le **localStorage** de votre navigateur (stockage local). Pour sauvegarder, [exportez la configuration](file:parametres).

### Q9. Que faire si je supprime accidentellement un chantier ?
**R.** Malheureusement, la suppression est **irréversible**. Bonnes pratiques :
- ✅ Exportez régulièrement vos alertes et calendrier
- ✅ Archivez les documents importants
- ✅ Nettoyez les chantiers en fin d'année seulement

### Q10. Dois-je tenir à jour l'appli manuellement ?
**R.** Oui :
- ✅ Ajouter les chantiers
- ✅ Cocher les documents dans le guidage
- ✅ Mettre à jour les statuts

L'appli **ne se synchronise pas automatiquement** avec votre comptabilité. Elle sert de **pilote de conformité**.

### Q11. Quelle est la différence entre "Alerte" et "Notification" ?
**R.** 
- **Alerte** = Risque détecté (affichée dans Alertes)
- **Notification** = Badge en haut (décompte : "3 notifications")
  
Pour l'instant, les deux sont synchronisées.

### Q12. Je veux réinitialiser tous mes paramètres. Comment ?
**R.** Allez à **Paramètres** > Bouton **"Réinitialiser tous les paramètres"** > Confirmez. ⚠️ **ATTENTION : IRRÉVERSIBLE**. Vos chantiers restent, seules les règles fiscales reviennent aux défauts.

---

## Index des Raccourcis Clavier / Actions

| Fonction | Onde | Clavier |
|----------|------|---------|
| Créer chantier | Menu Chantiers | Bouton "Nouveau" |
| Voir détails chantier | Cliquer chantier | Tableau |
| Filtrer | En-tête toutes sections | Champ "Recherche" |
| Exporter alertes | Section Alertes | Bouton CSV |
| Valider checklist | Section Guidage | ☑️ Cochez |
| Modifier paramètres | Section Paramètres | Inputs + Enregistrer |
| Fermer modal | Toute modale | ✕ ou ESC |

---

## Support & Contact

### Qui contacter pour...

| Problème | Contact |
|----------|---------|
| **Règles fiscales incorrectes** | Expert-comptable (CGI) |
| **Bug de l'application** | IT / Support digital |
| **Interprétation d'une alerte** | Auditeur fiscal / Conseil |
| **Archivage des documents** | Responsable administratif |

### Ressources externes

- 📌 **Code Général des Impôts (CGI)** : https://www.legifrance.gouv.fr
- 📌 **Loi 1975 (Sous-traitance)** : Code de la Sécurité Sociale
- 📌 **URSSAF** : https://www.urssaf.fr
- 📌 **ACTUALITÉ BTP** : Ordre des Experts-Comptables

---

## Version & Mises à jour

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 2026-02-11 | Version initiale |

**Dernière mise à jour** : 11 février 2026

---

## Glossaire Fiscal

| Terme | Définition |
|--------|-----------|
| **Autoliquidation** | Régime TVA où le sous-traitant ne facture pas TVA; c'est le client qui la paie |
| **TVA collectée** | TVA facturée à votre client |
| **TVA déductible** | TVA que vous avez payée et que vous récupérez |
| **Acompte** | Versement partiel avant fin de chantier |
| **Devis** | Proposition de prix avant acceptation |
| **Attestation URSSAF** | Preuve que vous êtes à jour des cotisations sociales |
| **Décennale** | Assurance couvrant les défauts de construction sur 10 ans |
| **Régime TVA** | Ensemble de règles TVA applicables selon la nature du chantier |
| **Vigilance** | Vérification de la régularité fiscale et sociale |
| **Retenue de garantie** | Pourcentage (5%) retenu par maître d'ouvrage en garantie |

---

**Documentation complète v1.0 - FiscalBTP Pro**
© 2026 - Tous droits réservés
