# Tutoriel de prise en main de NocoBase 2.0

Ce tutoriel vous accompagne, à partir de zéro, dans la construction d'un **système de tickets IT minimaliste (HelpDesk)** avec NocoBase 2.0. L'ensemble du système ne nécessite que **2 tables de données**, sans écrire la moindre ligne de code, et permet la soumission de tickets, la gestion des catégories, le suivi des modifications, le contrôle des permissions et un tableau de bord de données.

## Public visé

- **Lecteurs cibles** : utilisateurs métier, profils techniques, ou toute personne intéressée par NocoBase (des connaissances informatiques de base sont recommandées)
- **Projet d'exemple** : système de tickets IT minimaliste (HelpDesk), avec seulement 2 tables
- **Durée estimée** : 2-3 heures (non technique), 1-1,5 heure (technique)
- **Prérequis** : un environnement Docker ou la [démo en ligne](https://demo-cn.nocobase.com/new) (valide 24 heures, sans installation)
- **Version** : NocoBase 2.0

## Ce que vous allez apprendre

À travers 7 chapitres pratiques, vous maîtriserez les concepts clés de NocoBase et le processus de construction :

| # | Chapitre | Points clés |
|---|------|------|
| 1 | [Découvrir NocoBase — démarrer en 5 minutes](./01-getting-started) | Installation Docker, mode configuration vs mode utilisation |
| 2 | [Modélisation des données — la charpente du système de tickets](./02-data-modeling) | Collection/Field, relations |
| 3 | [Construire des pages — rendre les données visibles](./03-building-pages) | Block, blocs de tableau, filtre et tri |
| 4 | [Formulaires et détails — saisir les données](./04-forms-and-details) | Bloc de formulaire, règles de liaison de champs, historique des enregistrements |
| 5 | [Utilisateurs et permissions — qui voit quoi](./05-roles-and-permissions) | Rôles, permissions de menu, permissions de données |
| 6 | [Workflows — laisser le système agir tout seul](./06-workflows) | Notifications automatiques, déclencheurs sur changement de statut |
| 7 | [Tableau de bord — une vue d'ensemble](./07-dashboard) | Camembert / courbe / histogramme, bloc Markdown |

## Aperçu du modèle de données

Ce tutoriel s'articule autour d'un modèle de données minimaliste — seulement **2 tables**, mais cela suffit à couvrir la modélisation des données, la construction de pages, la conception de formulaires, le contrôle des permissions, les workflows et le tableau de bord.

| Table | Champs principaux |
|--------|---------|
| Tickets (tickets) | titre, description, statut, priorité |
| Catégories de tickets (categories) | nom de la catégorie, couleur |

## Questions fréquentes

### Pour quels scénarios NocoBase est-il adapté ?

NocoBase convient aux outils internes d'entreprise, aux systèmes de gestion de données, aux processus d'approbation, au CRM, à l'ERP et à tout scénario nécessitant une personnalisation flexible, avec prise en charge du déploiement on-premise.

### Quelles sont les bases requises pour suivre ce tutoriel ?

Aucune compétence en programmation n'est nécessaire, mais des connaissances informatiques de base sont recommandées. Le tutoriel introduit progressivement les concepts de tables de données, champs et relations. Une expérience préalable avec une base de données ou Excel facilite la prise en main.

### Le système présenté dans le tutoriel peut-il être étendu ?

Oui. Ce tutoriel n'utilise que 2 tables, mais NocoBase prend en charge des relations multi-tables complexes, l'intégration d'API externes, les plugins personnalisés, etc.

### Quel environnement de déploiement est requis ?

Docker est recommandé (Docker Desktop ou un serveur Linux), avec au minimum 2 cœurs et 4 Go de RAM. Le déploiement depuis le code source via Git est également pris en charge. Pour un usage purement pédagogique, vous pouvez demander une [démo en ligne](https://demo-cn.nocobase.com/new), sans installation, valide 24 heures.

### Quelles sont les limites de la version gratuite ?

Les fonctionnalités essentielles sont entièrement gratuites et open source. La version commerciale propose des plugins avancés supplémentaires et un support technique. Voir les [tarifs de la version commerciale](https://www.nocobase.com/cn/commercial).

## Stack technique associée

NocoBase 2.0 est construit sur les technologies suivantes :

- **Framework front-end** : React + [Ant Design](https://ant.design/) 5.0
- **Back-end** : Node.js + Koa
- **Base de données** : PostgreSQL (également [MySQL](/get-started/installation/docker) et MariaDB)
- **Déploiement** : [Docker](/get-started/installation/docker), Kubernetes

## Plateformes comparables

Si vous évaluez les plateformes no-code / low-code, voici quelques points de comparaison :

| Plateforme | Caractéristiques | Différences avec NocoBase |
|------|------|-------------------|
| [Appsmith](https://www.appsmith.com/) | No-code open source, forte personnalisation front-end | NocoBase est davantage axé sur le modèle de données |
| [Retool](https://retool.com/) | Plateforme d'outils internes | NocoBase est totalement open source, sans restrictions d'usage |
| [Airtable](https://airtable.com/) | Base de données collaborative en ligne | NocoBase prend en charge le déploiement on-premise, avec contrôle total des données |
| [Budibase](https://budibase.com/) | Low-code open source, auto-hébergeable | NocoBase repose sur une architecture plug-in, plus extensible |

## Documentation associée

### Guide de démarrage
- [Comment fonctionne NocoBase](/get-started/how-nocobase-works) — présentation des concepts clés
- [Démarrage rapide](/get-started/quickstart) — installation et configuration initiale
- [Configuration requise](/get-started/system-requirements) — prérequis matériels et logiciels

### Autres tutoriels
- [Tutoriel NocoBase 1.x](/tutorials/v1/index.md) — tutoriel avancé autour d'un système de gestion de tâches

### Solutions de référence
- [Solution de système de tickets](/solution/ticket-system/index.md) — gestion intelligente de tickets pilotée par l'IA
- [Solution CRM](/solution/crm/index.md) — base de gestion de la relation client
- [AI Employees](/ai-employees/quick-start) — intégrer des capacités IA dans votre système

Prêt ? Démarrez avec le [Chapitre 1 : Découvrir NocoBase](./01-getting-started) !
