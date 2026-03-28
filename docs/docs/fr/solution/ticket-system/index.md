:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/solution/ticket-system/index).
:::

# Présentation de la solution de tickets

> **Note** : Il s'agit d'une version préliminaire (early preview). Les fonctionnalités sont encore en cours d'amélioration et nous travaillons continuellement à leur perfectionnement. Vos commentaires sont les bienvenus !

## 1. Contexte (Pourquoi)

### Problèmes sectoriels, de rôles ou de gestion résolus

Les entreprises font face à divers types de demandes de services au quotidien : maintenance d'équipements, support informatique, plaintes clients, demandes de conseils, etc. Ces demandes proviennent de sources dispersées (systèmes CRM, ingénieurs de terrain, e-mails, formulaires publics, etc.), suivent des processus de traitement différents et manquent de mécanismes de suivi et de gestion unifiés.

**Exemples de scénarios métier typiques :**

- **Maintenance d'équipement** : L'équipe après-vente traite les demandes de réparation, doit enregistrer des informations spécifiques comme les numéros de série, les codes d'erreur et les pièces de rechange.
- **Support informatique** : Le département IT gère les demandes internes des employés pour la réinitialisation de mots de passe, l'installation de logiciels ou les problèmes de réseau.
- **Plaintes clients** : L'équipe de service client gère les plaintes multi-canaux ; certains clients mécontents nécessitent un traitement prioritaire.
- **Libre-service client** : Les clients finaux souhaitent soumettre facilement des demandes de service et suivre l'avancement du traitement.

### Profil des utilisateurs cibles

| Dimension | Description |
|-----------|-------------|
| Taille de l'entreprise | PME à grandes entreprises ayant des besoins importants en service client |
| Structure des rôles | Équipes de service client, support IT, équipes après-vente, gestionnaires opérationnels |
| Maturité numérique | Débutante à intermédiaire, cherchant à passer d'une gestion par Excel/e-mail à une gestion systématisée |

### Points de douleur des solutions actuelles du marché

- **Coût élevé / Personnalisation lente** : Les systèmes de tickets SaaS sont onéreux et les cycles de développement sur mesure sont longs.
- **Fragmentation du système, silos de données** : Les données métier sont dispersées dans différents systèmes, rendant l'analyse et la prise de décision difficiles.
- **Évolution difficile face aux changements** : Lorsque les besoins métier changent, les systèmes sont difficiles à ajuster rapidement.
- **Réponse lente du service** : Les demandes circulant entre différents systèmes ne peuvent pas être réparties rapidement.
- **Processus opaque** : Les clients ne peuvent pas suivre l'avancement de leur ticket, et les demandes fréquentes augmentent la pression sur le service client.
- **Qualité difficile à garantir** : Manque de surveillance SLA, les dépassements de délais et les retours négatifs ne peuvent pas être signalés à temps.

---

## 2. Analyse comparative (Benchmark)

### Produits phares du marché

- **SaaS** : Salesforce, Zendesk, Odoo, etc.
- **Systèmes sur mesure / Systèmes internes**

### Dimensions de comparaison

- Couverture des fonctionnalités
- Flexibilité
- Extensibilité
- Utilisation de l'IA

### Points de différenciation de la solution NocoBase

**Avantages au niveau de la plateforme :**

- **Priorité à la configuration** : Des tables de données sous-jacentes aux types de services, SLA et routage des compétences, tout est géré par configuration.
- **Développement rapide en Low-code** : Plus rapide qu'un développement sur mesure, plus flexible qu'un SaaS.

**Ce que les systèmes traditionnels ne peuvent pas faire ou à un coût prohibitif :**

- **Intégration native de l'IA** : Utilisation des plugins d'IA de NocoBase pour la classification intelligente, l'aide au remplissage de formulaires et les recommandations de connaissances.
- **Conception reproductible par les utilisateurs** : Les utilisateurs peuvent étendre la solution à partir de modèles.
- **Architecture de données en "T"** : Table principale + tables d'extension métier ; l'ajout d'un nouveau type de service nécessite uniquement l'ajout d'une table d'extension.

---

## 3. Principes de conception

- **Faible coût cognitif**
- **Le métier avant la technologie**
- **Évolutif, pas une réalisation unique**
- **Configuration d'abord, code en dernier recours**
- **Collaboration Humain-IA, pas de remplacement de l'humain par l'IA**
- **Toutes les conceptions doivent être reproductibles par les utilisateurs**

---

## 4. Aperçu de la solution

### Présentation générale

Un centre de tickets universel construit sur la plateforme low-code NocoBase, permettant :

- **Entrée unifiée** : Intégration multi-sources, traitement standardisé.
- **Distribution intelligente** : Classification assistée par IA, répartition avec équilibrage de charge.
- **Activités polymorphes** : Table principale centrale + tables d'extension métier, extension flexible.
- **Boucle de rétroaction fermée** : Surveillance SLA, évaluations clients, suivi des avis négatifs.

### Flux de traitement des tickets

```
Entrée multi-sources → Pré-traitement / Analyse IA → Affectation intelligente → Exécution manuelle → Boucle de rétroaction
          ↓                        ↓                          ↓                    ↓                ↓
 Vérif. des doublons      Reconnaissance d'intention   Corr. compétences    Flux de statuts   Éval. satisfaction
                          Analyse de sentiment         Équilibrage charge   Surveillance SLA  Suivi avis négatifs
                          Réponse automatique          Gestion des files    Commentaires      Archivage données
```

### Liste des modules principaux

| Module | Description |
|--------|-------------|
| Réception des tickets | Formulaires publics, portail client, saisie par agent, API/Webhook, analyse d'e-mails |
| Gestion des tickets | CRUD des tickets, flux de statuts, affectation/transfert, communication par commentaires, journaux d'opérations |
| Extension métier | Tables d'extension pour la maintenance d'équipement, le support IT, les plaintes clients, etc. |
| Gestion des SLA | Configuration des SLA, alertes de dépassement, escalade en cas de retard |
| Gestion des clients | Table principale des clients, gestion des contacts, portail client |
| Système d'évaluation | Notation multidimensionnelle, étiquettes rapides, NPS, alertes d'avis négatifs |
| Assistance IA | Classification d'intention, analyse de sentiment, recommandation de connaissances, aide à la réponse, polissage du ton |

### Aperçu de l'interface principale

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Employés IA (AI Employee)

### Types d'employés IA et scénarios

- **Assistant service client**, **Assistant commercial**, **Analyste de données**, **Auditeur**
- Assister les humains, pas les remplacer.

### Quantification de la valeur des employés IA

Dans cette solution, les employés IA peuvent :

| Dimension de valeur | Effets spécifiques |
|---------------------|--------------------|
| Améliorer l'efficacité | La classification automatique réduit le temps de tri manuel de plus de 50 % ; les recommandations de connaissances accélèrent la résolution des problèmes. |
| Réduire les coûts | Réponses automatiques aux questions simples, réduisant la charge de travail du service client humain. |
| Valoriser les employés | Les alertes de sentiment aident les agents à se préparer ; le polissage des réponses améliore la qualité de la communication. |
| Améliorer la satisfaction | Réponse plus rapide, affectation plus précise, réponses plus professionnelles. |

---

## 6. Points forts (Highlights)

### 1. Architecture de données en "T"

- Tous les tickets partagent une table principale avec une logique de flux unifiée.
- Les tables d'extension portent les champs spécifiques à chaque type de métier, permettant une extension flexible.
- L'ajout d'un nouveau type de service nécessite uniquement l'ajout d'une table d'extension, sans affecter le flux principal.

### 2. Cycle de vie complet du ticket

- Nouveau → Affecté → En cours → En attente → Résolu → Fermé.
- Supporte les scénarios complexes comme le transfert, le retour ou la réouverture.
- Chronométrage SLA précis incluant les pauses lors des mises en attente.

### 3. Intégration unifiée multi-canaux

- Formulaires publics, portail client, API, e-mail, saisie par agent.
- Vérification d'idempotence pour éviter la création de doublons.

### 4. Intégration native de l'IA

- L'IA n'est pas un simple bouton ajouté, elle est intégrée à chaque étape.
- Reconnaissance d'intention, analyse de sentiment, recommandation de connaissances et polissage des réponses.

---

## 7. Feuille de route (Mises à jour continues)

- **Intégration système** : Support de l'intégration du module de tickets dans différents systèmes métier tels que les ERP, CRM, etc.
- **Interconnexion de tickets** : Intégration des tickets des systèmes amont/aval et rappels de statut pour une collaboration inter-systèmes.
- **Automatisation par l'IA** : Employés IA intégrés aux flux de travail, supportant l'exécution automatique en arrière-plan pour un traitement sans intervention humaine.
- **Support multi-entité** : Extension horizontale via une architecture multi-espaces/multi-applications, permettant la distribution à différentes équipes de service pour une exploitation indépendante.
- **Base de connaissances RAG** : Vectorisation automatique de l'ensemble des données (tickets, clients, produits, etc.) pour une recherche intelligente et des recommandations de connaissances.
- **Support multilingue** : Interface et contenu supportant le changement de langue pour répondre aux besoins de collaboration des équipes internationales ou régionales.