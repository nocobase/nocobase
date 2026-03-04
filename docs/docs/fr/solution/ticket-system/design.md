:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/solution/ticket-system/design).
:::

# Conception détaillée de la solution de tickets

> **Version** : v2.0-beta

> **Date de mise à jour** : 05-01-2026

> **Statut** : Aperçu

## 1. Présentation du système et philosophie de conception

### 1.1 Positionnement du système

Ce système est une **plateforme de gestion de tickets intelligente pilotée par l'IA**, construite sur la plateforme low-code NocoBase. L'objectif principal est le suivant :

```
Permettre au service client de se concentrer sur la résolution des problèmes, plutôt que sur des opérations de processus fastidieuses.
```

### 1.2 Philosophie de conception

#### Philosophie 1 : Architecture de données en T

**Qu'est-ce que l'architecture en T ?**

Inspirée du concept de "profil en T" (compétences en T) — largeur horizontale + profondeur verticale :

- **Horizontal (Table principale)** : Couvre les capacités universelles communes à tous les types d'activités — numéro de ticket, statut, responsable, SLA et autres champs de base.
- **Vertical (Tables d'extension)** : Champs spécialisés pour des activités spécifiques — la réparation d'équipement possède des numéros de série, les réclamations ont des plans de compensation.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Pourquoi cette conception ?**

| Approche traditionnelle | Architecture en T |
|-------------------------|-------------------|
| Une table par type d'activité, champs dupliqués | Champs communs unifiés, champs métiers étendus à la demande |
| Les rapports statistiques nécessitent de fusionner plusieurs tables | Une seule table principale pour toutes les statistiques de tickets |
| Les changements de processus nécessitent des modifications à plusieurs endroits | Les changements de processus de base se font à un seul endroit |
| Les nouveaux types d'activités nécessitent de nouvelles tables | Il suffit d'ajouter des tables d'extension, le flux principal reste inchangé |

#### Philosophie 2 : Équipe d'employés IA

Il ne s'agit pas de "fonctionnalités IA", mais d'"employés IA". Chaque IA a un rôle, une personnalité et des responsabilités clairs :

| Employé IA | Poste | Responsabilités clés | Scénario de déclenchement |
|------------|-------|----------------------|---------------------------|
| **Sam** | Superviseur du centre de services | Routage des tickets, évaluation de la priorité, décisions d'escalade | Automatique à la création du ticket |
| **Grace** | Experte en succès client | Génération de réponses, ajustement du ton, gestion des réclamations | Lorsque l'agent clique sur "Réponse IA" |
| **Max** | Assistant de connaissances | Cas similaires, recommandations de connaissances, synthèse de solutions | Automatique sur la page de détails du ticket |
| **Lexi** | Traductrice | Traduction multilingue, traduction des commentaires | Automatique lorsqu'une langue étrangère est détectée |

**Pourquoi le modèle "Employé IA" ?**

- **Responsabilités claires** : Sam gère le routage, Grace gère les réponses, pas de confusion.
- **Facile à comprendre** : Dire "Laissez Sam analyser cela" est plus convivial que "Appeler l'API de classification".
- **Extensible** : Ajouter de nouvelles capacités IA revient à recruter de nouveaux employés.

#### Philosophie 3 : Auto-circulation des connaissances

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Cela forme une boucle fermée **Accumulation de connaissances - Application de connaissances**.

---

## 2. Entités de base et modèle de données

### 2.1 Aperçu des relations entre entités

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Détails des tables de base

#### 2.2.1 Table principale des tickets (nb_tts_tickets)

C'est le cœur du système, utilisant une conception de "table large" incluant tous les champs couramment utilisés.

**Informations de base**

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| id | BIGINT | Clé primaire | 1001 |
| ticket_no | VARCHAR | Numéro de ticket | TKT-20251229-0001 |
| title | VARCHAR | Titre | Connexion réseau lente |
| description | TEXT | Description du problème | Depuis ce matin, le réseau du bureau... |
| biz_type | VARCHAR | Type d'activité | it_support |
| priority | VARCHAR | Priorité | P1 |
| status | VARCHAR | Statut | processing |

**Suivi de la source**

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| source_system | VARCHAR | Système source | crm / email / iot |
| source_channel | VARCHAR | Canal source | web / phone / wechat |
| external_ref_id | VARCHAR | ID de référence externe | CRM-2024-0001 |

**Informations de contact**

| Champ | Type | Description |
|-------|------|-------------|
| customer_id | BIGINT | ID Client |
| contact_name | VARCHAR | Nom du contact |
| contact_phone | VARCHAR | Téléphone du contact |
| contact_email | VARCHAR | Email du contact |
| contact_company | VARCHAR | Nom de l'entreprise |

**Informations sur le responsable**

| Champ | Type | Description |
|-------|------|-------------|
| assignee_id | BIGINT | ID du responsable |
| assignee_department_id | BIGINT | ID du département responsable |
| transfer_count | INT | Nombre de transferts |

**Noeuds temporels**

| Champ | Type | Description | Moment du déclenchement |
|-------|------|-------------|-------------------------|
| submitted_at | TIMESTAMP | Heure de soumission | À la création du ticket |
| assigned_at | TIMESTAMP | Heure d'attribution | Quand le responsable est désigné |
| first_response_at | TIMESTAMP | Heure de première réponse | Lors de la première réponse au client |
| resolved_at | TIMESTAMP | Heure de résolution | Quand le statut passe à "résolu" |
| closed_at | TIMESTAMP | Heure de fermeture | Quand le statut passe à "fermé" |

**Relatif au SLA**

| Champ | Type | Description |
|-------|------|-------------|
| sla_config_id | BIGINT | ID de configuration SLA |
| sla_response_due | TIMESTAMP | Échéance de réponse |
| sla_resolve_due | TIMESTAMP | Échéance de résolution |
| sla_paused_at | TIMESTAMP | Heure de début de pause SLA |
| sla_paused_duration | INT | Durée cumulée de pause (minutes) |
| is_sla_response_breached | BOOLEAN | Non-respect du délai de réponse |
| is_sla_resolve_breached | BOOLEAN | Non-respect du délai de résolution |

**Résultats d'analyse IA**

| Champ | Type | Description | Rempli par |
|-------|------|-------------|------------|
| ai_category_code | VARCHAR | Catégorie identifiée par l'IA | Sam |
| ai_sentiment | VARCHAR | Analyse de sentiment | Sam |
| ai_urgency | VARCHAR | Niveau d'urgence | Sam |
| ai_keywords | JSONB | Mots-clés | Sam |
| ai_reasoning | TEXT | Processus de raisonnement | Sam |
| ai_suggested_reply | TEXT | Suggestion de réponse | Sam/Grace |
| ai_confidence_score | NUMERIC | Score de confiance | Sam |
| ai_analysis | JSONB | Résultat d'analyse complet | Sam |

**Support multilingue**

| Champ | Type | Description | Rempli par |
|-------|------|-------------|------------|
| source_language_code | VARCHAR | Langue d'origine | Sam/Lexi |
| target_language_code | VARCHAR | Langue cible | EN par défaut |
| is_translated | BOOLEAN | Si traduit | Lexi |
| description_translated | TEXT | Description traduite | Lexi |

#### 2.2.2 Tables d'extension métier

**Réparation d'équipement (nb_tts_biz_repair)**

| Champ | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | ID du ticket associé |
| equipment_model | VARCHAR | Modèle d'équipement |
| serial_number | VARCHAR | Numéro de série |
| fault_code | VARCHAR | Code d'erreur |
| spare_parts | JSONB | Liste des pièces de rechange |
| maintenance_type | VARCHAR | Type de maintenance |

**Support informatique (nb_tts_biz_it_support)**

| Champ | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | ID du ticket associé |
| asset_number | VARCHAR | Numéro d'actif |
| os_version | VARCHAR | Version de l'OS |
| software_name | VARCHAR | Logiciel concerné |
| remote_address | VARCHAR | Adresse distante |
| error_code | VARCHAR | Code d'erreur |

**Réclamation client (nb_tts_biz_complaint)**

| Champ | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | ID du ticket associé |
| related_order_no | VARCHAR | Numéro de commande associé |
| complaint_level | VARCHAR | Niveau de réclamation |
| compensation_amount | DECIMAL | Montant de la compensation |
| compensation_type | VARCHAR | Mode de compensation |
| root_cause | TEXT | Cause racine |

#### 2.2.3 Table des commentaires (nb_tts_ticket_comments)

**Champs de base**

| Champ | Type | Description |
|-------|------|-------------|
| id | BIGINT | Clé primaire |
| ticket_id | BIGINT | ID du ticket |
| parent_id | BIGINT | ID du commentaire parent (structure en arbre) |
| content | TEXT | Contenu du commentaire |
| direction | VARCHAR | Direction : inbound (client) / outbound (agent) |
| is_internal | BOOLEAN | Note interne ou non |
| is_first_response | BOOLEAN | S'il s'agit de la première réponse |

**Champs de révision IA (pour l'outbound)**

| Champ | Type | Description |
|-------|------|-------------|
| source_language_code | VARCHAR | Langue source |
| content_translated | TEXT | Contenu traduit |
| is_translated | BOOLEAN | Si traduit |
| is_ai_blocked | BOOLEAN | Si bloqué par l'IA |
| ai_block_reason | VARCHAR | Raison du blocage |
| ai_block_detail | TEXT | Explication détaillée |
| ai_quality_score | NUMERIC | Score de qualité |
| ai_suggestions | TEXT | Suggestions d'amélioration |

#### 2.2.4 Table des évaluations (nb_tts_ratings)

| Champ | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | ID du ticket (unique) |
| overall_rating | INT | Satisfaction globale (1-5) |
| response_rating | INT | Vitesse de réponse (1-5) |
| professionalism_rating | INT | Professionnalisme (1-5) |
| resolution_rating | INT | Résolution du problème (1-5) |
| nps_score | INT | Score NPS (0-10) |
| tags | JSONB | Étiquettes rapides |
| comment | TEXT | Commentaire écrit |

#### 2.2.5 Table des articles de connaissances (nb_tts_qa_articles)

| Champ | Type | Description |
|-------|------|-------------|
| article_no | VARCHAR | Numéro d'article KB-T0001 |
| title | VARCHAR | Titre |
| content | TEXT | Contenu (Markdown) |
| summary | TEXT | Résumé |
| category_code | VARCHAR | Code de catégorie |
| keywords | JSONB | Mots-clés |
| source_type | VARCHAR | Source : ticket/faq/manuel |
| source_ticket_id | BIGINT | ID du ticket source |
| ai_generated | BOOLEAN | Si généré par l'IA |
| ai_quality_score | NUMERIC | Score de qualité |
| status | VARCHAR | Statut : draft/published/archived |
| view_count | INT | Nombre de vues |
| helpful_count | INT | Nombre de votes utiles |

### 2.3 Liste des tables de données

| N° | Nom de la table | Description | Type d'enregistrement |
|----|-----------------|-------------|-----------------------|
| 1 | nb_tts_tickets | Table principale des tickets | Données métier |
| 2 | nb_tts_biz_repair | Extension réparation équipement | Données métier |
| 3 | nb_tts_biz_it_support | Extension support informatique | Données métier |
| 4 | nb_tts_biz_complaint | Extension réclamation client | Données métier |
| 5 | nb_tts_customers | Table principale des clients | Données métier |
| 6 | nb_tts_customer_contacts | Contacts clients | Données métier |
| 7 | nb_tts_ticket_comments | Commentaires des tickets | Données métier |
| 8 | nb_tts_ratings | Évaluations de satisfaction | Données métier |
| 9 | nb_tts_qa_articles | Articles de connaissances | Données de connaissance |
| 10 | nb_tts_qa_article_relations | Relations entre articles | Données de connaissance |
| 11 | nb_tts_faqs | FAQ | Données de connaissance |
| 12 | nb_tts_tickets_categories | Catégories de tickets | Données de configuration |
| 13 | nb_tts_sla_configs | Configuration SLA | Données de configuration |
| 14 | nb_tts_skill_configs | Configuration des compétences | Données de configuration |
| 15 | nb_tts_business_types | Types d'activités | Données de configuration |

---

## 3. Cycle de vie du ticket

### 3.1 Définition des statuts

| Statut | Nom | Description | Chronométrage SLA | Couleur |
|--------|-----|-------------|-------------------|---------|
| new | Nouveau | Vient d'être créé, en attente d'attribution | Démarrer | 🔵 Bleu |
| assigned | Assigné | Responsable désigné, en attente de prise en charge | Continuer | 🔷 Cyan |
| processing | En cours | En cours de traitement | Continuer | 🟠 Orange |
| pending | En attente | En attente d'un retour client | **Pause** | ⚫ Gris |
| transferred | Transféré | Transféré à une autre personne | Continuer | 🟣 Violet |
| resolved | Résolu | En attente de confirmation du client | Arrêter | 🟢 Vert |
| closed | Fermé | Ticket terminé | Arrêter | ⚫ Gris |
| cancelled | Annulé | Ticket annulé | Arrêter | ⚫ Gris |

### 3.2 Diagramme de flux des statuts

**Flux principal (de gauche à droite)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Flux secondaires**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**Machine à états complète**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Règles clés de transition de statut

| De | À | Condition de déclenchement | Action système |
|----|---|----------------------------|----------------|
| new | assigned | Désignation du responsable | Enregistrer assigned_at |
| assigned | processing | Le responsable clique sur "Accepter" | Aucune |
| processing | pending | Clic sur "Mettre en attente" | Enregistrer sla_paused_at |
| pending | processing | Réponse client / Reprise manuelle | Calculer la durée de pause, vider paused_at |
| processing | resolved | Clic sur "Résoudre" | Enregistrer resolved_at |
| resolved | closed | Confirmation client / Délai de 3 jours | Enregistrer closed_at |
| * | cancelled | Annuler le ticket | Aucune |


---

## 4. Gestion des niveaux de service SLA

### 4.1 Configuration des priorités et du SLA

| Priorité | Nom | Temps de réponse | Temps de résolution | Seuil d'alerte | Scénario typique |
|----------|-----|------------------|---------------------|----------------|------------------|
| P0 | Critique | 15 minutes | 2 heures | 80% | Système en panne, ligne de production arrêtée |
| P1 | Élevé | 1 heure | 8 heures | 80% | Dysfonctionnement d'une fonctionnalité importante |
| P2 | Moyen | 4 heures | 24 heures | 80% | Problèmes généraux |
| P3 | Faible | 8 heures | 72 heures | 80% | Demandes d'information, suggestions |

### 4.2 Logique de calcul du SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### À la création du ticket

```
Échéance de réponse = Heure de soumission + Délai de réponse (minutes)
Échéance de résolution = Heure de soumission + Délai de résolution (minutes)
```

#### Lors de la mise en attente (pending)

```
Heure de début de pause SLA = Heure actuelle
```

#### Lors de la reprise (de pending à processing)

```
-- Calculer la durée de cette pause
Durée de cette pause = Heure actuelle - Heure de début de pause SLA

-- Ajouter à la durée totale de pause
Durée cumulée de pause = Durée cumulée de pause + Durée de cette pause

-- Prolonger les échéances (la période de pause n'est pas comptée dans le SLA)
Échéance de réponse = Échéance de réponse + Durée de cette pause
Échéance de résolution = Échéance de résolution + Durée de cette pause

-- Vider l'heure de début de pause
Heure de début de pause SLA = Vide
```

#### Détermination du non-respect du SLA

```
-- Détermination du non-respect de la réponse
Réponse hors délai = (Heure de première réponse est vide ET Heure actuelle > Échéance de réponse)
                    OU (Heure de première réponse > Échéance de réponse)

-- Détermination du non-respect de la résolution
Résolution hors délai = (Heure de résolution est vide ET Heure actuelle > Échéance de résolution)
                       OU (Heure de résolution > Échéance de résolution)
```

### 4.3 Mécanisme d'alerte SLA

| Niveau d'alerte | Condition | Destinataire | Mode de notification |
|-----------------|-----------|--------------|----------------------|
| Alerte jaune | Temps restant < 20% | Responsable | Message interne |
| Alerte rouge | Déjà hors délai | Responsable + Superviseur | Message interne + Email |
| Alerte d'escalade | Hors délai de 1 heure | Responsable de département | Email + SMS |

### 4.4 Indicateurs du tableau de bord SLA

| Indicateur | Formule de calcul | Seuil de santé |
|------------|-------------------|----------------|
| Taux de respect de la réponse | Tickets conformes / Nombre total de tickets | > 95% |
| Taux de respect de la résolution | Résolutions conformes / Tickets résolus | > 90% |
| Temps de réponse moyen | SOMME(Temps de réponse) / Nombre de tickets | < 50% du SLA |
| Temps de résolution moyen | SOMME(Temps de résolution) / Nombre de tickets | < 80% du SLA |

---

## 5. Capacités IA et système d'employés

### 5.1 Équipe d'employés IA

Le système configure 8 employés IA, répartis en deux catégories :

**Employés dédiés (Spécifiques au système de tickets)**

| ID | Nom | Poste | Capacités clés |
|----|-----|-------|----------------|
| sam | Sam | Superviseur du centre de services | Routage des tickets, évaluation de la priorité, décisions d'escalade, identification des risques SLA |
| grace | Grace | Experte en succès client | Génération de réponses professionnelles, ajustement du ton, gestion des réclamations, restauration de la satisfaction |
| max | Max | Assistant de connaissances | Recherche de cas similaires, recommandation de connaissances, synthèse de solutions |

**Employés réutilisés (Capacités générales)**

| ID | Nom | Poste | Capacités clés |
|----|-----|-------|----------------|
| dex | Dex | Organisateur de données | Extraction de tickets par email, conversion d'appels en tickets, nettoyage de données par lots |
| ellis | Ellis | Expert Email | Analyse de sentiment des emails, résumé de fils de discussion, rédaction de réponses |
| lexi | Lexi | Traductrice | Traduction de tickets, traduction de réponses, traduction de conversations en temps réel |
| cole | Cole | Expert NocoBase | Guide d'utilisation du système, aide à la configuration des flux de travail |
| vera | Vera | Analyste de recherche | Recherche de solutions techniques, vérification des informations produit |

### 5.2 Liste des tâches IA

Chaque employé IA est configuré avec 4 tâches spécifiques :

#### Tâches de Sam

| ID de tâche | Nom | Mode de déclenchement | Description |
|-------------|-----|-----------------------|-------------|
| SAM-01 | Analyse et routage des tickets | Flux de travail auto | Analyse automatique à la création d'un ticket |
| SAM-02 | Réévaluation de la priorité | Interaction front-end | Ajustement de la priorité selon les nouvelles infos |
| SAM-03 | Décision d'escalade | Front-end / Flux de travail | Déterminer si une escalade est nécessaire |
| SAM-04 | Évaluation des risques SLA | Flux de travail auto | Identifier les risques de dépassement de délai |

#### Tâches de Grace

| ID de tâche | Nom | Mode de déclenchement | Description |
|-------------|-----|-----------------------|-------------|
| GRACE-01 | Génération de réponse pro | Interaction front-end | Générer une réponse basée sur le contexte |
| GRACE-02 | Ajustement du ton | Interaction front-end | Optimiser le ton d'une réponse existante |
| GRACE-03 | Désamorçage de réclamation | Front-end / Flux de travail | Résoudre les réclamations clients |
| GRACE-04 | Restauration de satisfaction | Front-end / Flux de travail | Suivi après une expérience négative |

#### Tâches de Max

| ID de tâche | Nom | Mode de déclenchement | Description |
|-------------|-----|-----------------------|-------------|
| MAX-01 | Recherche de cas similaires | Front-end / Flux de travail | Trouver des tickets historiques similaires |
| MAX-02 | Recommandation d'articles | Front-end / Flux de travail | Recommander des articles de connaissances pertinents |
| MAX-03 | Synthèse de solutions | Interaction front-end | Synthétiser des solutions de sources multiples |
| MAX-04 | Guide de dépannage | Interaction front-end | Créer un processus de dépannage systématique |

#### Tâches de Lexi

| ID de tâche | Nom | Mode de déclenchement | Description |
|-------------|-----|-----------------------|-------------|
| LEXI-01 | Traduction de ticket | Flux de travail auto | Traduire le contenu du ticket |
| LEXI-02 | Traduction de réponse | Interaction front-end | Traduire les réponses du service client |
| LEXI-03 | Traduction par lots | Flux de travail auto | Traitement de traductions en masse |
| LEXI-04 | Traduction de dialogue | Interaction front-end | Traduction de conversation en temps réel |

### 5.3 Employés IA et cycle de vie du ticket

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Exemples de réponses IA

#### SAM-01 Réponse d'analyse de ticket

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "échec de connexion", "temps d'attente", "clôture mensuelle"],
  "confidence": 0.92,
  "reasoning": "Ce ticket décrit un problème de connexion au système ERP affectant la clôture mensuelle du département financier, urgence élevée",
  "suggested_reply": "Cher client, merci de nous avoir signalé ce problème...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Bonjour, notre système ERP ne permet pas de se connecter..."
}
```

#### GRACE-01 Réponse de génération de message

```
Cher Monsieur Zhang,

Merci de nous avoir contactés concernant le problème de connexion à l'ERP. Je comprends parfaitement que ce problème affecte les travaux de clôture mensuelle de votre entreprise, et nous avons classé ce ticket en priorité haute.

État actuel :
- L'équipe technique recherche actuellement des problèmes de connexion au serveur
- Nous prévoyons de vous donner une mise à jour d'ici 30 minutes

En attendant, vous pouvez essayer :
1. Accéder via l'adresse de secours : https://erp-backup.company.com
2. Si vous avez besoin de rapports urgents, contactez-nous pour une aide à l'exportation

N'hésitez pas à me contacter pour toute autre question.

Cordialement,
L'équipe de support technique
```

### 5.5 Pare-feu d'intelligence émotionnelle IA

La révision de qualité des réponses gérée par Grace intercepte les problèmes suivants :

| Type de problème | Exemple original | Suggestion IA |
|------------------|------------------|---------------|
| Ton négatif | "Non, ce n'est pas couvert par la garantie" | "Cette panne n'est pas couverte par la garantie gratuite, nous pouvons proposer un devis de réparation" |
| Accuser le client | "C'est vous qui l'avez cassé" | "Après vérification, cette panne correspond à un dommage accidentel" |
| Rejeter la responsabilité | "Ce n'est pas notre problème" | "Laissez-moi vous aider à identifier davantage la cause du problème" |
| Expression froide | "Je ne sais pas" | "Je vais me renseigner pour vous fournir les informations nécessaires" |
| Infos sensibles | "Votre mot de passe est abc123" | [Interception] Contient des informations sensibles, envoi non autorisé |

---

## 6. Système de base de connaissances

### 6.1 Sources de connaissances

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Flux de conversion Ticket vers Connaissance

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Dimensions d'évaluation** :
- **Généralité** : Est-ce un problème courant ?
- **Complétude** : La solution est-elle claire et complète ?
- **Reproductibilité** : Les étapes sont-elles réutilisables ?

### 6.3 Mécanisme de recommandation de connaissances

Lorsque l'agent ouvre les détails d'un ticket, Max recommande automatiquement les connaissances associées :

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Connaissances recommandées                 [Déplier/Replier] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Guide diag. pannes système servo CNC  Match: 94% │ │
│ │ Inclut : Interprétation codes alarme, étapes vérif. drive │ │
│ │ [Voir] [Appliquer à la réponse] [Marquer comme utile]    │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manuel maintenance série XYZ-CNC3000  Match: 87% │ │
│ │ Inclut : Pannes courantes, plan de maintenance préventive │ │
│ │ [Voir] [Appliquer à la réponse] [Marquer comme utile]    │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Moteur de flux de travail

### 7.1 Classification des flux de travail

| Code | Catégorie | Description | Mode de déclenchement |
|------|-----------|-------------|-----------------------|
| WF-T | Flux Ticket | Gestion du cycle de vie du ticket | Événements de formulaire |
| WF-S | Flux SLA | Calcul et alertes SLA | Événements / Planifié |
| WF-C | Flux Commentaire | Traitement et traduction des commentaires | Événements de formulaire |
| WF-R | Flux Évaluation | Invitations et statistiques d'évaluation | Événements / Planifié |
| WF-N | Flux Notification | Envoi de notifications | Piloté par événements |
| WF-AI | Flux IA | Analyse et génération par IA | Événements de formulaire |

### 7.2 Flux de travail de base

#### WF-T01 : Flux de création de ticket

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01 : Analyse IA du ticket

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04 : Traduction et révision des commentaires

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03 : Génération de connaissances

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Tâches planifiées

| Tâche | Fréquence | Description |
|-------|-----------|-------------|
| Vérification alerte SLA | Toutes les 5 min | Vérifier les tickets proches de l'échéance |
| Fermeture auto des tickets | Quotidien | Fermer auto les tickets résolus après 3 jours |
| Envoi invitation évaluation | Quotidien | Envoyer l'invitation 24h après la fermeture |
| Mise à jour statistiques | Horaire | Mettre à jour les stats des tickets clients |

---

## 8. Conception des menus et des interfaces

### 8.1 Interface d'administration (Back-end)

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Portail client (Front-end)

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Conception des tableaux de bord

#### Vue Exécutive

| Composant | Type | Description des données |
|-----------|------|-------------------------|
| Taux de respect SLA | Jauge | Taux de réponse/résolution du mois |
| Tendance satisfaction | Graphique linéaire | Évolution sur les 30 derniers jours |
| Tendance volume tickets | Histogramme | Volume sur les 30 derniers jours |
| Répartition par métier | Graphique en secteurs | Part de chaque type d'activité |

#### Vue Superviseur

| Composant | Type | Description des données |
|-----------|------|-------------------------|
| Alertes de délai | Liste | Tickets proches de l'échéance ou hors délai |
| Charge de travail équipe | Histogramme | Nombre de tickets par membre de l'équipe |
| Répartition du backlog | Graphique empilé | Nombre de tickets par statut |
| Délai de traitement | Carte thermique | Répartition du temps de traitement moyen |

#### Vue Agent

| Composant | Type | Description des données |
|-----------|------|-------------------------|
| Mes tâches à faire | Carte numérique | Nombre de tickets en attente |
| Répartition priorités | Graphique en secteurs | Répartition P0/P1/P2/P3 |
| Statistiques du jour | Carte d'indicateurs | Nombre de tickets traités/résolus aujourd'hui |
| Compte à rebours SLA | Liste | Les 5 tickets les plus urgents |

---

## Appendice

### A. Configuration des types d'activités

| Code type | Nom | Icône | Table d'extension associée |
|-----------|-----|-------|----------------------------|
| repair | Réparation équipement | 🔧 | nb_tts_biz_repair |
| it_support | Support informatique | 💻 | nb_tts_biz_it_support |
| complaint | Réclamation client | 📢 | nb_tts_biz_complaint |
| consultation | Conseil / Suggestion | ❓ | Aucune |
| other | Autre | 📝 | Aucune |

### B. Codes de catégories

| Code | Nom | Description |
|------|-----|-------------|
| CONVEYOR | Système de convoyage | Problèmes de convoyeurs |
| PACKAGING | Machine d'emballage | Problèmes de machines d'emballage |
| WELDING | Équipement de soudage | Problèmes d'équipement de soudage |
| COMPRESSOR | Compresseur d'air | Problèmes de compresseurs |
| COLD_STORE | Chambre froide | Problèmes de chambres froides |
| CENTRAL_AC | Clim centrale | Problèmes de climatisation centrale |
| FORKLIFT | Chariot élévateur | Problèmes de chariots élévateurs |
| COMPUTER | Ordinateur | Problèmes matériels informatiques |
| PRINTER | Imprimante | Problèmes d'imprimantes |
| PROJECTOR | Projecteur | Problèmes de projecteurs |
| INTERNET | Réseau | Problèmes de connexion réseau |
| EMAIL | Email | Problèmes de système de messagerie |
| ACCESS | Accès | Problèmes de permissions de compte |
| PROD_INQ | Demande produit | Demandes d'informations produit |
| COMPLAINT | Réclamation générale | Réclamations générales |
| DELAY | Retard logistique | Réclamations sur les retards de livraison |
| DAMAGE | Emballage endommagé | Réclamations sur les colis endommagés |
| QUANTITY | Erreur de quantité | Réclamations sur les articles manquants |
| SVC_ATTITUDE | Attitude de service | Réclamations sur le comportement du personnel |
| PROD_QUALITY | Qualité produit | Réclamations sur la qualité des produits |
| TRAINING | Formation | Demandes de formation |
| RETURN | Retour | Demandes de retour produit |

---

*Version du document : 2.0 | Dernière mise à jour : 05-01-2026*