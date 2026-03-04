:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/solution/crm/design).
:::

# Conception détaillée du système CRM 2.0


## 1. Présentation du système et philosophie de conception

### 1.1 Positionnement du système

Ce système est une **plateforme de gestion des ventes CRM 2.0** construite sur la plateforme sans code NocoBase. L'objectif principal est le suivant :

```
Permettre aux commerciaux de se concentrer sur l'établissement de relations clients, plutôt que sur la saisie de données et les analyses répétitives.
```

Le système automatise les tâches courantes via des flux de travail et utilise l'IA pour aider au scoring des leads, à l'analyse des opportunités et à d'autres tâches, aidant ainsi les équipes de vente à gagner en efficacité.

### 1.2 Philosophie de conception

#### Philosophie 1 : Entonnoir de vente complet

**Processus de vente de bout en bout :**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Pourquoi cette conception ?**

| Méthode traditionnelle | CRM intégré |
|---------|-----------|
| Plusieurs systèmes utilisés pour différentes étapes | Système unique couvrant tout le cycle de vie |
| Transfert manuel de données entre les systèmes | Flux de données et conversion automatisés |
| Vues clients incohérentes | Vue client unifiée à 360 degrés |
| Analyse de données fragmentée | Analyse du pipeline de vente de bout en bout |

#### Philosophie 2 : Pipeline de vente configurable
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Différents secteurs d'activité peuvent personnaliser les étapes du pipeline de vente sans modifier le code.

#### Philosophie 3 : Conception modulaire

- Les modules de base (Clients + Opportunités) sont obligatoires ; les autres modules peuvent être activés selon les besoins.
- La désactivation des modules ne nécessite pas de modifications de code ; elle se fait via la configuration de l'interface NocoBase.
- Chaque module est conçu indépendamment pour réduire le couplage.

---

## 2. Architecture des modules et personnalisation

### 2.1 Aperçu des modules

Le système CRM adopte une conception d'**architecture modulaire** — chaque module peut être activé ou désactivé indépendamment en fonction des besoins de l'entreprise.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Dépendances des modules

| Module | Obligatoire | Dépendances | Condition de désactivation |
|-----|---------|--------|---------|
| **Gestion des clients** | ✅ Oui | - | Ne peut pas être désactivé (Cœur) |
| **Gestion des opportunités** | ✅ Oui | Gestion des clients | Ne peut pas être désactivé (Cœur) |
| **Gestion des leads** | Optionnel | - | Lorsque l'acquisition de leads n'est pas requise |
| **Gestion des devis** | Optionnel | Opportunités, Produits | Transactions simples ne nécessitant pas de devis formels |
| **Gestion des commandes** | Optionnel | Opportunités (ou Devis) | Lorsque le suivi des commandes/paiements n'est pas requis |
| **Gestion des produits** | Optionnel | - | Lorsqu'un catalogue de produits n'est pas requis |
| **Intégration d'e-mails** | Optionnel | Clients, Contacts | Lors de l'utilisation d'un système de messagerie externe |

### 2.3 Versions préconfigurées

| Version | Modules inclus | Cas d'utilisation | Nombre de collections |
|-----|---------|---------|-----------|
| **Lite** | Clients + Opportunités | Suivi de transactions simples | 6 |
| **Standard** | Lite + Leads + Devis + Commandes + Produits | Cycle de vente complet | 15 |
| **Entreprise** | Standard + Intégration d'e-mails | Fonctionnalité complète incluant l'e-mail | 17 |

### 2.4 Correspondance Module-Collection

#### Collections des modules de base (Toujours requises)

| Collection | Module | Description |
|-------|------|------|
| nb_crm_customers | Gestion des clients | Dossiers clients/entreprises |
| nb_crm_contacts | Gestion des clients | Contacts |
| nb_crm_customer_shares | Gestion des clients | Autorisations de partage client |
| nb_crm_opportunities | Gestion des opportunités | Opportunités de vente |
| nb_crm_opportunity_stages | Gestion des opportunités | Configurations des étapes |
| nb_crm_opportunity_users | Gestion des opportunités | Collaborateurs de l'opportunité |
| nb_crm_activities | Gestion des activités | Enregistrements d'activités |
| nb_crm_comments | Gestion des activités | Commentaires/Notes |
| nb_crm_tags | Cœur | Étiquettes partagées |
| nb_cbo_currencies | Données de base | Dictionnaire des devises |
| nb_cbo_regions | Données de base | Dictionnaire des pays/régions |

### 2.5 Comment désactiver des modules

Il suffit de masquer l'entrée de menu du module dans l'interface d'administration de NocoBase ; il n'est pas nécessaire de modifier le code ou de supprimer des collections.

---

## 3. Entités de base et modèle de données

### 3.1 Aperçu des relations entre entités
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Détails des collections de base

#### 3.2.1 Leads (nb_crm_leads)

Gestion des leads utilisant un flux de travail simplifié en 4 étapes.

**Processus par étapes :**
```
Nouveau → En cours → Qualifié → Converti en Client/Opportunité
            ↓          ↓
      Non qualifié  Non qualifié
```

**Champs clés :**

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| lead_no | VARCHAR | Numéro du lead (Généré automatiquement) |
| name | VARCHAR | Nom du contact |
| company | VARCHAR | Nom de l'entreprise |
| title | VARCHAR | Titre du poste |
| email | VARCHAR | E-mail |
| phone | VARCHAR | Téléphone |
| mobile_phone | VARCHAR | Mobile |
| website | TEXT | Site web |
| address | TEXT | Adresse |
| source | VARCHAR | Source du lead : website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Secteur d'activité |
| annual_revenue | VARCHAR | Échelle du chiffre d'affaires annuel |
| number_of_employees | VARCHAR | Échelle de l'effectif |
| status | VARCHAR | Statut : new/working/qualified/unqualified |
| rating | VARCHAR | Évaluation : hot/warm/cold |
| owner_id | BIGINT | Propriétaire (FK → users) |
| ai_score | INTEGER | Score de qualité IA 0-100 |
| ai_convert_prob | DECIMAL | Probabilité de conversion IA |
| ai_best_contact_time | VARCHAR | Moment de contact recommandé par l'IA |
| ai_tags | JSONB | Étiquettes générées par l'IA |
| ai_scored_at | TIMESTAMP | Heure du scoring IA |
| ai_next_best_action | TEXT | Suggestion de la meilleure action suivante par l'IA |
| ai_nba_generated_at | TIMESTAMP | Heure de génération de la suggestion IA |
| is_converted | BOOLEAN | Indicateur de conversion |
| converted_at | TIMESTAMP | Heure de conversion |
| converted_customer_id | BIGINT | ID du client converti |
| converted_contact_id | BIGINT | ID du contact converti |
| converted_opportunity_id | BIGINT | ID de l'opportunité créée |
| lost_reason | TEXT | Raison de la perte |
| disqualification_reason | TEXT | Raison de la disqualification |
| description | TEXT | Description |

#### 3.2.2 Clients (nb_crm_customers)

Gestion des clients/entreprises prenant en charge les activités internationales.

**Champs clés :**

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| name | VARCHAR | Nom du client (Requis) |
| account_number | VARCHAR | Numéro de compte (Généré automatiquement, Unique) |
| phone | VARCHAR | Téléphone |
| website | TEXT | Site web |
| address | TEXT | Adresse |
| industry | VARCHAR | Secteur d'activité |
| type | VARCHAR | Type : prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Échelle de l'effectif |
| annual_revenue | VARCHAR | Échelle du chiffre d'affaires annuel |
| level | VARCHAR | Niveau : normal/important/vip |
| status | VARCHAR | Statut : potential/active/dormant/churned |
| country | VARCHAR | Pays |
| region_id | BIGINT | Région (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Devise préférée : CNY/USD/EUR |
| owner_id | BIGINT | Propriétaire (FK → users) |
| parent_id | BIGINT | Société mère (FK → self) |
| source_lead_id | BIGINT | ID du lead source |
| ai_health_score | INTEGER | Score de santé IA 0-100 |
| ai_health_grade | VARCHAR | Grade de santé IA : A/B/C/D |
| ai_churn_risk | DECIMAL | Risque d'attrition IA 0-100% |
| ai_churn_risk_level | VARCHAR | Niveau de risque d'attrition IA : low/medium/high |
| ai_health_dimensions | JSONB | Scores des dimensions de santé IA |
| ai_recommendations | JSONB | Liste de recommandations IA |
| ai_health_assessed_at | TIMESTAMP | Heure de l'évaluation de santé IA |
| ai_tags | JSONB | Étiquettes générées par l'IA |
| ai_best_contact_time | VARCHAR | Moment de contact recommandé par l'IA |
| ai_next_best_action | TEXT | Suggestion de la meilleure action suivante par l'IA |
| ai_nba_generated_at | TIMESTAMP | Heure de génération de la suggestion IA |
| description | TEXT | Description |
| is_deleted | BOOLEAN | Indicateur de suppression logique |

#### 3.2.3 Opportunités (nb_crm_opportunities)

Gestion des opportunités de vente avec des étapes de pipeline configurables.

**Champs clés :**

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| opportunity_no | VARCHAR | Numéro d'opportunité (Généré automatiquement, Unique) |
| name | VARCHAR | Nom de l'opportunité (Requis) |
| amount | DECIMAL | Montant attendu |
| currency | VARCHAR | Devise |
| exchange_rate | DECIMAL | Taux de change |
| amount_usd | DECIMAL | Montant équivalent en USD |
| customer_id | BIGINT | Client (FK) |
| contact_id | BIGINT | Contact principal (FK) |
| stage | VARCHAR | Code de l'étape (FK → stages.code) |
| stage_sort | INTEGER | Ordre de tri de l'étape (Redondant pour un tri facile) |
| stage_entered_at | TIMESTAMP | Heure d'entrée dans l'étape actuelle |
| days_in_stage | INTEGER | Jours passés dans l'étape actuelle |
| win_probability | DECIMAL | Probabilité de gain manuelle |
| ai_win_probability | DECIMAL | Probabilité de gain prédite par l'IA |
| ai_analyzed_at | TIMESTAMP | Heure de l'analyse IA |
| ai_confidence | DECIMAL | Confiance de la prédiction IA |
| ai_trend | VARCHAR | Tendance de la prédiction IA : up/stable/down |
| ai_risk_factors | JSONB | Facteurs de risque identifiés par l'IA |
| ai_recommendations | JSONB | Liste de recommandations IA |
| ai_predicted_close | DATE | Date de clôture prédite par l'IA |
| ai_next_best_action | TEXT | Suggestion de la meilleure action suivante par l'IA |
| ai_nba_generated_at | TIMESTAMP | Heure de génération de la suggestion IA |
| expected_close_date | DATE | Date de clôture prévue |
| actual_close_date | DATE | Date de clôture réelle |
| owner_id | BIGINT | Propriétaire (FK → users) |
| last_activity_at | TIMESTAMP | Heure de la dernière activité |
| stagnant_days | INTEGER | Jours sans activité |
| loss_reason | TEXT | Raison de la perte |
| competitor_id | BIGINT | Concurrent (FK) |
| lead_source | VARCHAR | Source du lead |
| campaign_id | BIGINT | ID de la campagne marketing |
| expected_revenue | DECIMAL | Revenu attendu = montant × probabilité |
| description | TEXT | Description |

#### 3.2.4 Devis (nb_crm_quotations)

Gestion des devis prenant en charge les devises multiples et les flux d'approbation.

**Flux de statut :**
```
Brouillon → En attente d'approbation → Approuvé → Envoyé → Accepté/Refusé/Expiré
                   ↓
                Refusé → Modifier → Brouillon
```

**Champs clés :**

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| quotation_no | VARCHAR | N° de devis (Généré automatiquement, Unique) |
| name | VARCHAR | Nom du devis |
| version | INTEGER | Numéro de version |
| opportunity_id | BIGINT | Opportunité (FK, Requis) |
| customer_id | BIGINT | Client (FK) |
| contact_id | BIGINT | Contact (FK) |
| owner_id | BIGINT | Propriétaire (FK → users) |
| currency_id | BIGINT | Devise (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Taux de change |
| subtotal | DECIMAL | Sous-total |
| discount_rate | DECIMAL | Taux de remise |
| discount_amount | DECIMAL | Montant de la remise |
| shipping_handling | DECIMAL | Expédition/Manutention |
| tax_rate | DECIMAL | Taux de taxe |
| tax_amount | DECIMAL | Montant de la taxe |
| total_amount | DECIMAL | Montant total |
| total_amount_usd | DECIMAL | Montant équivalent en USD |
| status | VARCHAR | Statut : draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Heure de soumission |
| approved_by | BIGINT | Approbateur (FK → users) |
| approved_at | TIMESTAMP | Heure d'approbation |
| rejected_at | TIMESTAMP | Heure de refus |
| sent_at | TIMESTAMP | Heure d'envoi |
| customer_response_at | TIMESTAMP | Heure de réponse du client |
| expired_at | TIMESTAMP | Heure d'expiration |
| valid_until | DATE | Valide jusqu'au |
| payment_terms | TEXT | Conditions de paiement |
| terms_condition | TEXT | Termes et conditions |
| address | TEXT | Adresse de livraison |
| description | TEXT | Description |

#### 3.2.5 Commandes (nb_crm_orders)

Gestion des commandes incluant le suivi des paiements.

**Champs clés :**

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| order_no | VARCHAR | Numéro de commande (Généré automatiquement, Unique) |
| customer_id | BIGINT | Client (FK) |
| contact_id | BIGINT | Contact (FK) |
| opportunity_id | BIGINT | Opportunité (FK) |
| quotation_id | BIGINT | Devis (FK) |
| owner_id | BIGINT | Propriétaire (FK → users) |
| currency | VARCHAR | Devise |
| exchange_rate | DECIMAL | Taux de change |
| order_amount | DECIMAL | Montant de la commande |
| paid_amount | DECIMAL | Montant payé |
| unpaid_amount | DECIMAL | Montant impayé |
| status | VARCHAR | Statut : pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Statut de paiement : unpaid/partial/paid |
| order_date | DATE | Date de commande |
| delivery_date | DATE | Date de livraison prévue |
| actual_delivery_date | DATE | Date de livraison réelle |
| shipping_address | TEXT | Adresse de livraison |
| logistics_company | VARCHAR | Société de logistique |
| tracking_no | VARCHAR | Numéro de suivi |
| terms_condition | TEXT | Termes et conditions |
| description | TEXT | Description |

### 3.3 Résumé des collections

#### Collections métier CRM

| N° | Nom de la collection | Description | Type |
|-----|------|------|------|
| 1 | nb_crm_leads | Gestion des leads | Métier |
| 2 | nb_crm_customers | Clients/Entreprises | Métier |
| 3 | nb_crm_contacts | Contacts | Métier |
| 4 | nb_crm_opportunities | Opportunités de vente | Métier |
| 5 | nb_crm_opportunity_stages | Configuration des étapes | Configuration |
| 6 | nb_crm_opportunity_users | Collaborateurs de l'opportunité (Équipe de vente) | Association |
| 7 | nb_crm_quotations | Devis | Métier |
| 8 | nb_crm_quotation_items | Articles du devis | Métier |
| 9 | nb_crm_quotation_approvals | Enregistrements d'approbation | Métier |
| 10 | nb_crm_orders | Commandes | Métier |
| 11 | nb_crm_order_items | Articles de la commande | Métier |
| 12 | nb_crm_payments | Enregistrements de paiement | Métier |
| 13 | nb_crm_products | Catalogue de produits | Métier |
| 14 | nb_crm_product_categories | Catégories de produits | Configuration |
| 15 | nb_crm_price_tiers | Tarification par paliers | Configuration |
| 16 | nb_crm_activities | Enregistrements d'activités | Métier |
| 17 | nb_crm_comments | Commentaires/Notes | Métier |
| 18 | nb_crm_competitors | Concurrents | Métier |
| 19 | nb_crm_tags | Étiquettes | Configuration |
| 20 | nb_crm_lead_tags | Association Lead-Étiquette | Association |
| 21 | nb_crm_contact_tags | Association Contact-Étiquette | Association |
| 22 | nb_crm_customer_shares | Autorisations de partage client | Association |
| 23 | nb_crm_exchange_rates | Historique des taux de change | Configuration |

#### Collections de données de base (Modules communs)

| N° | Nom de la collection | Description | Type |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Dictionnaire des devises | Configuration |
| 2 | nb_cbo_regions | Dictionnaire des pays/régions | Configuration |

### 3.4 Collections auxiliaires

#### 3.4.1 Commentaires (nb_crm_comments)

Collection générique de commentaires/notes pouvant être associée à divers objets métier.

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| content | TEXT | Contenu du commentaire |
| lead_id | BIGINT | Lead associé (FK) |
| customer_id | BIGINT | Client associé (FK) |
| opportunity_id | BIGINT | Opportunité associée (FK) |
| order_id | BIGINT | Commande associée (FK) |

#### 3.4.2 Partages clients (nb_crm_customer_shares)

Permet la collaboration multi-personnes et le partage d'autorisations pour les clients.

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| customer_id | BIGINT | Client (FK, Requis) |
| shared_with_user_id | BIGINT | Partagé avec l'utilisateur (FK, Requis) |
| shared_by_user_id | BIGINT | Partagé par l'utilisateur (FK) |
| permission_level | VARCHAR | Niveau d'autorisation : read/write/full |
| shared_at | TIMESTAMP | Heure de partage |

#### 3.4.3 Collaborateurs d'opportunité (nb_crm_opportunity_users)

Prend en charge la collaboration de l'équipe de vente sur les opportunités.

| Champ | Type | Description |
|-----|------|------|
| opportunity_id | BIGINT | Opportunité (FK, PK composite) |
| user_id | BIGINT | Utilisateur (FK, PK composite) |
| role | VARCHAR | Rôle : owner/collaborator/viewer |

#### 3.4.4 Régions (nb_cbo_regions)

Dictionnaire de données de base des pays/régions.

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| code_alpha2 | VARCHAR | Code ISO 3166-1 Alpha-2 (Unique) |
| code_alpha3 | VARCHAR | Code ISO 3166-1 Alpha-3 (Unique) |
| code_numeric | VARCHAR | Code numérique ISO 3166-1 |
| name | VARCHAR | Nom du pays/région |
| is_active | BOOLEAN | Est actif |
| sort_order | INTEGER | Ordre de tri |

---

## 4. Cycle de vie du lead

La gestion des leads utilise un flux de travail simplifié en 4 étapes. Lorsqu'un nouveau lead est créé, un flux de travail peut déclencher automatiquement un scoring IA pour aider les commerciaux à identifier rapidement les leads de haute qualité.

### 4.1 Définitions des statuts

| Statut | Nom | Description |
|-----|------|------|
| new | Nouveau | Vient d'être créé, en attente de contact |
| working | En cours | Suivi actif en cours |
| qualified | Qualifié | Prêt pour la conversion |
| unqualified | Non qualifié | Ne correspond pas |

### 4.2 Organigramme des statuts

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Processus de conversion de lead

L'interface de conversion propose trois options simultanément ; les utilisateurs peuvent choisir de créer ou d'associer :

- **Client** : Créer un nouveau client OU associer à un client existant.
- **Contact** : Créer un nouveau contact (associé au client).
- **Opportunité** : Une opportunité doit obligatoirement être créée.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Enregistrements post-conversion :**
- `converted_customer_id` : ID du client associé
- `converted_contact_id` : ID du contact associé
- `converted_opportunity_id` : ID de l'opportunité créée

---

## 5. Cycle de vie de l'opportunité

La gestion des opportunités utilise des étapes de pipeline de vente configurables. Lorsqu'une étape d'opportunité change, elle peut déclencher automatiquement une prédiction de probabilité de gain par l'IA pour aider les commerciaux à identifier les risques et les opportunités.

### 5.1 Étapes configurables

Les étapes sont stockées dans la collection `nb_crm_opportunity_stages` et peuvent être personnalisées :

| Code | Nom | Ordre | Probabilité de gain par défaut |
|-----|------|------|---------|
| prospecting | Prospection | 1 | 10% |
| analysis | Analyse des besoins | 2 | 30% |
| proposal | Proposition/Devis | 3 | 60% |
| negotiation | Négociation/Révision | 4 | 80% |
| won | Fermé Gagné | 5 | 100% |
| lost | Fermé Perdu | 6 | 0% |

### 5.2 Flux du pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Détection de stagnation

Les opportunités sans activité seront signalées :

| Jours sans activité | Action |
|-----------|------|
| 7 jours | Avertissement jaune |
| 14 jours | Rappel orange au propriétaire |
| 30 jours | Rappel rouge au manager |

```sql
-- Calculer les jours de stagnation
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Gestion des gains/pertes

**En cas de gain :**
1. Mettre à jour l'étape à 'won'.
2. Enregistrer la date de clôture réelle.
3. Mettre à jour le statut du client à 'active'.
4. Déclencher la création de la commande (si un devis a été accepté).

**En cas de perte :**
1. Mettre à jour l'étape à 'lost'.
2. Enregistrer la raison de la perte.
3. Enregistrer l'ID du concurrent (si perdu au profit d'un concurrent).
4. Informer le manager.

---

## 6. Cycle de vie du devis

### 6.1 Définitions des statuts

| Statut | Nom | Description |
|-----|------|------|
| draft | Brouillon | En préparation |
| pending_approval | En attente d'approbation | En attente de validation |
| approved | Approuvé | Prêt à être envoyé |
| sent | Envoyé | Envoyé au client |
| accepted | Accepté | Accepté par le client |
| rejected | Refusé | Refusé par le client |
| expired | Expiré | Date de validité dépassée |

### 6.2 Règles d'approbation (À finaliser)

Les flux d'approbation sont déclenchés en fonction des conditions suivantes :

| Condition | Niveau d'approbation |
|------|---------|
| Remise > 10% | Manager des ventes |
| Remise > 20% | Directeur des ventes |
| Montant > 100 000 $ | Finance + Directeur général |

### 6.3 Prise en charge multi-devises

#### Philosophie de conception

Utiliser l'**USD comme devise de base unifiée** pour tous les rapports et analyses. Chaque enregistrement de montant stocke :
- La devise et le montant d'origine (ce que voit le client)
- Le taux de change au moment de la transaction
- Le montant équivalent en USD (pour comparaison interne)

#### Dictionnaire des devises (nb_cbo_currencies)

La configuration des devises utilise une collection de données de base commune, permettant une gestion dynamique. Le champ `current_rate` stocke le taux de change actuel, mis à jour par une tâche planifiée à partir de l'enregistrement le plus récent dans `nb_crm_exchange_rates`.

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| code | VARCHAR | Code devise (Unique) : USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nom de la devise |
| symbol | VARCHAR | Symbole de la devise |
| decimal_places | INTEGER | Nombre de décimales |
| current_rate | DECIMAL | Taux actuel par rapport à l'USD (Synchronisé depuis l'historique) |
| is_active | BOOLEAN | Est actif |
| sort_order | INTEGER | Ordre de tri |

#### Historique des taux de change (nb_crm_exchange_rates)

Enregistre les données historiques des taux de change. Une tâche planifiée synchronise les derniers taux vers `nb_cbo_currencies.current_rate`.

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| currency_code | VARCHAR | Code devise (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Taux par rapport à l'USD |
| effective_date | DATE | Date d'effet |
| source | VARCHAR | Source : manual/api |
| createdAt | TIMESTAMP | Heure de création |

> **Note** : Les devises sont associées à la collection `nb_cbo_currencies` via la clé étrangère `currency_id`, et le taux de change est récupéré directement depuis le champ `current_rate`. Les opportunités et les commandes utilisent un champ VARCHAR `currency` pour stocker le code de la devise.

#### Modèle de champ de montant

Les collections contenant des montants suivent ce modèle :

| Champ | Type | Description |
|-----|------|------|
| currency | VARCHAR | Devise de la transaction |
| amount | DECIMAL | Montant d'origine |
| exchange_rate | DECIMAL | Taux de change vers l'USD lors de la transaction |
| amount_usd | DECIMAL | Équivalent USD (Calculé) |

**Appliqué à :**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Intégration du flux de travail
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logique de récupération du taux de change :**
1. Récupérer le taux de change directement depuis `nb_cbo_currencies.current_rate` lors des opérations métier.
2. Transactions en USD : Taux = 1.0, aucune recherche requise.
3. `current_rate` est synchronisé par une tâche planifiée à partir du dernier enregistrement `nb_crm_exchange_rates`.

### 6.4 Gestion des versions

Lorsqu'un devis est refusé ou expiré, il peut être dupliqué en tant que nouvelle version :

```
QT-20260119-001 v1 → Refusé
QT-20260119-001 v2 → Envoyé
QT-20260119-001 v3 → Accepté
```

---

## 7. Cycle de vie de la commande

### 7.1 Aperçu de la commande

Les commandes sont créées lorsqu'un devis est accepté, représentant un engagement commercial confirmé.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Définitions des statuts de commande

| Statut | Code | Description | Actions autorisées |
|-----|------|------|---------|
| Brouillon | `draft` | Commande créée, pas encore confirmée | Modifier, Confirmer, Annuler |
| Confirmée | `confirmed` | Commande confirmée, en attente d'exécution | Commencer l'exécution, Annuler |
| En cours | `in_progress` | Commande en cours de traitement/production | Mettre à jour l'avancement, Expédier, Annuler (nécessite approbation) |
| Expédiée | `shipped` | Produits expédiés au client | Marquer comme livrée |
| Livrée | `delivered` | Le client a reçu les marchandises | Terminer la commande |
| Terminée | `completed` | Commande entièrement terminée | Aucune |
| Annulée | `cancelled` | Commande annulée | Aucune |

### 7.3 Modèle de données de commande

#### nb_crm_orders

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| order_no | VARCHAR | Numéro de commande (Généré automatiquement, Unique) |
| customer_id | BIGINT | Client (FK) |
| contact_id | BIGINT | Contact (FK) |
| opportunity_id | BIGINT | Opportunité (FK) |
| quotation_id | BIGINT | Devis (FK) |
| owner_id | BIGINT | Propriétaire (FK → users) |
| status | VARCHAR | Statut de la commande |
| payment_status | VARCHAR | Statut de paiement : unpaid/partial/paid |
| order_date | DATE | Date de commande |
| delivery_date | DATE | Date de livraison prévue |
| actual_delivery_date | DATE | Date de livraison réelle |
| currency | VARCHAR | Devise de la commande |
| exchange_rate | DECIMAL | Taux vers l'USD |
| order_amount | DECIMAL | Montant total de la commande |
| paid_amount | DECIMAL | Montant payé |
| unpaid_amount | DECIMAL | Montant impayé |
| shipping_address | TEXT | Adresse de livraison |
| logistics_company | VARCHAR | Société de logistique |
| tracking_no | VARCHAR | Numéro de suivi |
| terms_condition | TEXT | Termes et conditions |
| description | TEXT | Description |

#### nb_crm_order_items

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| order_id | FK | Commande parente |
| product_id | FK | Référence produit |
| product_name | VARCHAR | Capture du nom du produit |
| quantity | INT | Quantité commandée |
| unit_price | DECIMAL | Prix unitaire |
| discount_percent | DECIMAL | Pourcentage de remise |
| line_total | DECIMAL | Total de la ligne |
| notes | TEXT | Notes de la ligne |

### 7.4 Suivi des paiements

#### nb_crm_payments

| Champ | Type | Description |
|-----|------|------|
| id | BIGINT | Clé primaire |
| order_id | BIGINT | Commande associée (FK, Requis) |
| customer_id | BIGINT | Client (FK) |
| payment_no | VARCHAR | N° de paiement (Généré automatiquement, Unique) |
| amount | DECIMAL | Montant du paiement (Requis) |
| currency | VARCHAR | Devise du paiement |
| payment_method | VARCHAR | Méthode : transfer/check/cash/credit_card/lc |
| payment_date | DATE | Date du paiement |
| bank_account | VARCHAR | Numéro de compte bancaire |
| bank_name | VARCHAR | Nom de la banque |
| notes | TEXT | Notes de paiement |

---

## 8. Cycle de vie du client

### 8.1 Aperçu du client

Les clients sont créés lors de la conversion d'un lead ou lorsqu'une opportunité est gagnée. Le système suit le cycle de vie complet, de l'acquisition à la recommandation.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Définitions des statuts clients

| Statut | Code | Santé | Description |
|-----|------|--------|------|
| Prospect | `prospect` | N/A | Lead converti, pas encore de commande |
| Actif | `active` | ≥70 | Client payant, bonne interaction |
| En croissance | `growing` | ≥80 | Client avec des opportunités d'expansion |
| À risque | `at_risk` | <50 | Client montrant des signes d'attrition |
| Perdu | `churned` | N/A | Plus actif |
| Reconquête | `win_back` | N/A | Ancien client en cours de réactivation |
| Ambassadeur | `advocate` | ≥90 | Haute satisfaction, fournit des recommandations |

### 8.3 Scoring de santé client

La santé du client est calculée en fonction de plusieurs facteurs :

| Facteur | Poids | Métrique |
|-----|------|---------|
| Récence d'achat | 25% | Jours depuis la dernière commande |
| Fréquence d'achat | 20% | Nombre de commandes par période |
| Valeur monétaire | 20% | Valeur totale et moyenne des commandes |
| Engagement | 15% | Taux d'ouverture d'e-mails, participation aux réunions |
| Santé du support | 10% | Volume de tickets et taux de résolution |
| Utilisation du produit | 10% | Métriques d'utilisation active (si applicable) |

**Seuils de santé :**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentation client

#### Segmentation automatisée

| Segment | Condition | Action suggérée |
|-----|------|---------|
| VIP | LTV > 100 000 $ | Service personnalisé, parrainage de la direction |
| Entreprise | Taille de l'entreprise > 500 | Gestionnaire de compte dédié |
| Marché moyen | Taille de l'entreprise 50-500 | Points réguliers, support à l'échelle |
| Start-up | Taille de l'entreprise < 50 | Ressources en libre-service, communauté |
| Dormant | 90+ jours sans activité | Marketing de réactivation |

---

## 9. Intégration d'e-mails

### 9.1 Aperçu

NocoBase fournit un plugin d'intégration d'e-mails intégré prenant en charge Gmail et Outlook. Une fois les e-mails synchronisés, les flux de travail peuvent déclencher automatiquement une analyse IA du sentiment et de l'intention de l'e-mail, aidant les commerciaux à comprendre rapidement l'attitude du client.

### 9.2 Synchronisation des e-mails

**Fournisseurs pris en charge :**
- Gmail (via OAuth 2.0)
- Outlook/Microsoft 365 (via OAuth 2.0)

**Comportement de synchronisation :**
- Synchronisation bidirectionnelle des e-mails envoyés et reçus.
- Association automatique des e-mails aux enregistrements CRM (Leads, Contacts, Opportunités).
- Pièces jointes stockées dans le système de fichiers NocoBase.

### 9.3 Association E-mail-CRM (À finaliser)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Modèles d'e-mails

Les commerciaux peuvent utiliser des modèles prédéfinis :

| Catégorie de modèle | Exemples |
|---------|------|
| Premier contact | E-mail à froid, Introduction chaleureuse, Suivi d'événement |
| Suivi | Suivi de réunion, Suivi de proposition, Relance sans réponse |
| Devis | Devis joint, Révision de devis, Devis expirant bientôt |
| Commande | Confirmation de commande, Notification d'expédition, Confirmation de livraison |
| Succès client | Bienvenue, Point de situation, Demande d'avis |

---

## 10. Capacités assistées par l'IA

### 10.1 Équipe d'employés IA

Le système CRM intègre le plugin NocoBase AI, utilisant les employés IA intégrés suivants configurés avec des tâches spécifiques au CRM :

| ID | Nom | Rôle intégré | Capacités d'extension CRM |
|----|------|---------|-------------|
| viz | Viz | Analyste de données | Analyse des données de vente, prévision du pipeline |
| dara | Dara | Expert en graphiques | Visualisation de données, développement de rapports, conception de tableaux de bord |
| ellis | Ellis | Éditeur | Rédaction de réponses aux e-mails, résumés de communication, rédaction d'e-mails professionnels |
| lexi | Lexi | Traducteur | Communication client multilingue, traduction de contenu |
| orin | Orin | Organisateur | Priorités quotidiennes, suggestions de l'étape suivante, planification du suivi |

### 10.2 Liste des tâches IA

Les capacités d'IA sont divisées en deux catégories indépendantes :

#### I. Employés IA (Déclenchés par bloc frontal)

Les utilisateurs interagissent directement avec l'IA via des blocs frontaux "Employé IA" pour obtenir des analyses et des suggestions.

| Employé | Tâche | Description |
|------|------|------|
| Viz | Analyse des données de vente | Analyser les tendances du pipeline et les taux de conversion |
| Viz | Prévision du pipeline | Prédire les revenus en fonction du pipeline pondéré |
| Dara | Génération de graphiques | Générer des graphiques de rapports de vente |
| Dara | Conception de tableaux de bord | Concevoir des mises en page de tableaux de bord de données |
| Ellis | Rédaction de réponses | Générer des réponses professionnelles aux e-mails |
| Ellis | Résumé de communication | Résumer les fils de discussion des e-mails |
| Ellis | Rédaction d'e-mails pro | Invitations à des réunions, suivis, e-mails de remerciement, etc. |
| Orin | Priorités quotidiennes | Générer une liste de tâches prioritaires pour la journée |
| Orin | Meilleure action suivante | Recommander les prochaines étapes pour chaque opportunité |
| Lexi | Traduction de contenu | Traduire des supports marketing, des propositions et des e-mails |

#### II. Nœuds LLM de flux de travail (Exécution automatisée en arrière-plan)

Nœuds LLM imbriqués dans les flux de travail, déclenchés automatiquement par des événements de collection, des événements d'action ou des tâches planifiées, indépendamment des employés IA.

| Tâche | Méthode de déclenchement | Description | Champ cible |
|------|---------|------|---------|
| Scoring de lead | Événement de collection (Création/Mise à jour) | Évaluer la qualité du lead | ai_score, ai_convert_prob |
| Prédiction de probabilité de gain | Événement de collection (Changement d'étape) | Prédire la probabilité de succès de l'opportunité | ai_win_probability, ai_risk_factors |

> **Note** : Les nœuds LLM de flux de travail utilisent des invites (prompts) et une sortie Schema pour un JSON structuré, qui est analysé et écrit dans les champs de données métier sans intervention de l'utilisateur.

### 10.3 Champs IA dans la base de données

| Table | Champ IA | Description |
|----|--------|------|
| nb_crm_leads | ai_score | Score IA 0-100 |
| | ai_convert_prob | Probabilité de conversion |
| | ai_best_contact_time | Meilleur moment de contact |
| | ai_tags | Étiquettes générées par l'IA (JSONB) |
| | ai_scored_at | Heure du scoring |
| | ai_next_best_action | Suggestion de la meilleure action suivante |
| | ai_nba_generated_at | Heure de génération de la suggestion |
| nb_crm_opportunities | ai_win_probability | Probabilité de gain prédite par l'IA |
| | ai_analyzed_at | Heure de l'analyse |
| | ai_confidence | Confiance de la prédiction |
| | ai_trend | Tendance : up/stable/down |
| | ai_risk_factors | Facteurs de risque (JSONB) |
| | ai_recommendations | Liste de recommandations (JSONB) |
| | ai_predicted_close | Date de clôture prédite |
| | ai_next_best_action | Suggestion de la meilleure action suivante |
| | ai_nba_generated_at | Heure de génération de la suggestion |
| nb_crm_customers | ai_health_score | Score de santé 0-100 |
| | ai_health_grade | Grade de santé : A/B/C/D |
| | ai_churn_risk | Risque d'attrition 0-100% |
| | ai_churn_risk_level | Niveau de risque d'attrition : low/medium/high |
| | ai_health_dimensions | Scores des dimensions (JSONB) |
| | ai_recommendations | Liste de recommandations (JSONB) |
| | ai_health_assessed_at | Heure de l'évaluation de santé |
| | ai_tags | Étiquettes générées par l'IA (JSONB) |
| | ai_best_contact_time | Meilleur moment de contact |
| | ai_next_best_action | Suggestion de la meilleure action suivante |
| | ai_nba_generated_at | Heure de génération de la suggestion |

---

## 11. Moteur de flux de travail

### 11.1 Flux de travail implémentés

| Nom du flux de travail | Type de déclencheur | Statut | Description |
|-----------|---------|------|------|
| Leads Created | Événement de collection | Activé | Déclenché lorsqu'un lead est créé |
| CRM Overall Analytics | Événement d'employé IA | Activé | Analyse globale des données CRM |
| Lead Conversion | Événement post-action | Activé | Processus de conversion de lead |
| Lead Assignment | Événement de collection | Activé | Attribution automatisée des leads |
| Lead Scoring | Événement de collection | Désactivé | Scoring des leads (À finaliser) |
| Follow-up Reminder | Tâche planifiée | Désactivé | Rappels de suivi (À finaliser) |

### 11.2 Flux de travail à implémenter

| Flux de travail | Type de déclencheur | Description |
|-------|---------|------|
| Avancement de l'étape d'opportunité | Événement de collection | Mettre à jour la probabilité de gain et enregistrer l'heure lors du changement d'étape |
| Détection de stagnation d'opportunité | Tâche planifiée | Détecter les opportunités inactives et envoyer des rappels |
| Approbation de devis | Événement post-action | Processus d'approbation à plusieurs niveaux |
| Génération de commande | Événement post-action | Générer automatiquement une commande après l'acceptation du devis |

---

## 12. Conception du menu et de l'interface

### 12.1 Structure d'administration

| Menu | Type | Description |
|------|------|------|
| **Tableaux de bord** | Groupe | Tableaux de bord |
| - Tableau de bord | Page | Tableau de bord par défaut |
| - Manager des ventes | Page | Vue Manager des ventes |
| - Commercial | Page | Vue Commercial |
| - Direction | Page | Vue Direction |
| **Leads** | Page | Gestion des leads |
| **Clients** | Page | Gestion des clients |
| **Opportunités** | Page | Gestion des opportunités |
| - Tableau | Onglet | Liste des opportunités |
| **Produits** | Page | Gestion des produits |
| - Catégories | Onglet | Catégories de produits |
| **Commandes** | Page | Gestion des commandes |
| **Paramètres** | Groupe | Paramètres |
| - Étapes | Page | Configuration des étapes d'opportunité |
| - Taux de change | Page | Paramètres des taux de change |
| - Activités | Page | Enregistrements d'activités |
| - E-mails | Page | Gestion des e-mails |
| - Contacts | Page | Gestion des contacts |
| - Analyse de données | Page | Analyse de données |

### 12.2 Vues des tableaux de bord

#### Vue Manager des ventes

| Composant | Type | Données |
|-----|------|------|
| Valeur du pipeline | Carte KPI | Montant total du pipeline par étape |
| Classement de l'équipe | Tableau | Classement des performances des commerciaux |
| Alertes de risque | Liste d'alertes | Opportunités à haut risque |
| Tendance du taux de gain | Graphique linéaire | Taux de gain mensuel |
| Affaires stagnantes | Liste | Affaires nécessitant une attention particulière |

#### Vue Commercial

| Composant | Type | Données |
|-----|------|------|
| Progression de mon quota | Barre de progression | Réel mensuel vs Quota |
| Opportunités en attente | Carte KPI | Nombre de mes opportunités en attente |
| Clôtures cette semaine | Liste | Affaires devant être clôturées bientôt |
| Activités en retard | Alerte | Tâches expirées |
| Actions rapides | Boutons | Consigner une activité, Créer une opportunité |

#### Vue Direction

| Composant | Type | Données |
|-----|------|------|
| Revenu annuel | Carte KPI | Revenu depuis le début de l'année |
| Valeur du pipeline | Carte KPI | Montant total du pipeline |
| Taux de gain | Carte KPI | Taux de gain global |
| Santé client | Distribution | Distribution des scores de santé |
| Prévisions | Graphique | Prévisions de revenus mensuels |

---

*Version du document : v2.0 | Mise à jour : 06-02-2026*