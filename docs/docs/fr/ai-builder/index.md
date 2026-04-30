---
title: "Démarrage rapide de la construction par IA"
description: "La construction par IA est la capacité d'assistance à la construction par IA de NocoBase. Elle permet d'effectuer la modélisation des données, la configuration de l'interface, l'orchestration des workflows et d'autres opérations en langage naturel, offrant une expérience de construction plus moderne et plus efficace."
keywords: "construction par IA, AI Builder, NocoBase AI, Agent Skills, construction en langage naturel, low-code IA, démarrage rapide"
---

# Démarrage rapide de la construction par IA

La construction par IA est la capacité d'assistance à la construction par IA fournie par NocoBase — vous pouvez décrire vos besoins en langage naturel, et l'IA effectue automatiquement la modélisation des données, la configuration des pages, le paramétrage des permissions et d'autres opérations. Elle offre une expérience de construction plus moderne et plus efficace.

## Démarrage rapide

Si vous avez déjà installé le [NocoBase CLI](../ai/quick-start.md), vous pouvez ignorer cette étape.

### Installation IA en une étape

Copiez le prompt ci-dessous vers votre assistant IA (Claude Code, Codex, Cursor, Trae, etc.) pour effectuer automatiquement l'installation et la configuration :

```
Aide-moi à installer NocoBase CLI et à terminer l'initialisation : https://docs.nocobase.com/fr/ai/ai-quick-start.md (veuillez accéder directement au contenu du lien)
```

### Installation manuelle

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Le navigateur ouvrira automatiquement la page de configuration visuelle, qui vous guidera pour installer les NocoBase Skills, configurer la base de données et démarrer l'application. Pour les étapes détaillées, consultez le [Démarrage rapide](../ai/quick-start.md).

## Remplacer la configuration manuelle par la conversation

Une fois le NocoBase CLI installé, vous pouvez utiliser directement le langage naturel dans votre assistant IA pour exploiter NocoBase. Voici quelques scénarios concrets, allant de la création d'une table à la mise en place d'un système complet, pour découvrir les capacités de la construction par IA.

### Décrivez les besoins métier, l'IA conçoit les tables et les relations

Dites à l'IA quel système vous voulez construire, et elle concevra automatiquement les tables, les types de champs et les relations — pas besoin de dessiner vous-même un diagramme ER.

```
Je suis en train de construire un CRM, aide-moi à concevoir et à mettre en place le modèle de données
```

![L'IA conçoit le modèle de données CRM](https://static-docs.nocobase.com/202604162126729.png)

L'IA a généré automatiquement les tables Clients, Contacts, Opportunités, Commandes ainsi que les relations entre elles :

![Résultat du modèle de données CRM](https://static-docs.nocobase.com/202604162201867.png)

Pour en savoir plus sur la modélisation des données, consultez [Modélisation des données](./data-modeling).

### Décrivez les pages en langage métier, l'IA les construit pour vous

Pas besoin d'apprendre les règles de configuration : décrivez simplement le type de page que vous voulez — barre de recherche, tableau, conditions de filtrage, dites-le et c'est fait.

```
Aide-moi à créer une page de gestion des clients, avec une barre de recherche par nom et un tableau des clients affichant le nom, le téléphone, l'email et la date de création
```

![Page de gestion des clients](https://static-docs.nocobase.com/20260420100608.png)

Pour en savoir plus sur la configuration de l'interface, consultez [Configuration de l'interface](./ui-builder).

### Orchestrer un workflow automatisé en une phrase

Décrivez les conditions de déclenchement et la logique de traitement d'un processus métier, et l'IA créera automatiquement les déclencheurs et la chaîne de nœuds.

```
Aide-moi à orchestrer un workflow qui décrémente automatiquement le stock après la création d'une commande
```

![Workflow de décrémentation de stock après création de commande](https://static-docs.nocobase.com/20260419234303.png)

Pour en savoir plus sur les workflows, consultez [Gestion des workflows](./workflow).

### Tables, pages, tableaux de bord : tout en une seule étape

:::warning Attention

La fonctionnalité Solutions est encore en phase de test, sa stabilité est limitée, elle est uniquement destinée à un usage exploratoire.

:::

Décrivez votre scénario métier en une phrase, et l'IA construira pour vous l'ensemble des tables, pages de gestion, tableaux de bord et graphiques.

```
Aide-moi à utiliser le skill nocobase-dsl-reconciler pour construire un système de gestion de tickets, comprenant un tableau de bord, une liste de tickets, la gestion des utilisateurs et la configuration SLA
```

L'IA produit d'abord un plan de conception, et après confirmation, elle effectue la construction complète en une seule fois :

![Plan de conception du système de tickets](https://static-docs.nocobase.com/20260420100420.png)

![Résultat de la construction du système de tickets](https://static-docs.nocobase.com/20260420100450.png)

Pour en savoir plus sur la construction d'un système complet, consultez [Solutions](./dsl-reconciler).

## Sécurité et audit

Avant de laisser un AI Agent opérer sur NocoBase, il est recommandé de comprendre les méthodes d'authentification, le contrôle des permissions et l'audit des opérations — pour vous assurer que l'IA ne fait que ce qu'elle doit faire, et que chaque étape est tracée. Consultez [Sécurité et audit](./security).

## NocoBase Skills

Les [NocoBase Skills](https://github.com/nocobase/skills) sont des packs de connaissances métier installables dans votre AI Agent, qui permettent à l'IA de comprendre le système de configuration de NocoBase. NocoBase fournit 8 Skills couvrant l'ensemble du processus de construction :

- [Gestion des environnements](./env-bootstrap) — vérification d'environnement, installation, déploiement, mise à niveau et diagnostic
- [Modélisation des données](./data-modeling) — création et gestion des tables, champs et relations
- [Configuration de l'interface](./ui-builder) — création et édition de pages, blocs, popups et interactions
- [Gestion des workflows](./workflow) — création, édition, activation et diagnostic des workflows
- [Configuration des permissions](./acl) — gestion des rôles, des stratégies de permission, de l'association des utilisateurs et de l'évaluation des risques
- [Solutions](./dsl-reconciler) — construction par lots de systèmes métier complets à partir de YAML
- [Gestion des plugins](./plugin-manage) — consultation, activation et désactivation des plugins
- [Gestion des publications](./publish) — publication multi-environnements, sauvegarde, restauration et migration

:::tip Astuce

Le NocoBase CLI installe automatiquement les Skills lors de l'initialisation (`nb init`), aucune installation manuelle n'est requise.

:::

## Liens connexes

- [NocoBase CLI](../ai/quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [Référence du NocoBase CLI](../api/cli/index.md) — description complète des paramètres de toutes les commandes
- [Plugin de développement IA](../ai-dev/index.md) — développer des plugins NocoBase avec l'aide de l'IA
- [Sécurité et audit](./security) — méthodes d'authentification, contrôle des permissions et audit des opérations
- [AI Employees](../ai-employees/index.md) — capacités d'agents intelligents de NocoBase, prenant en charge la collaboration et l'exécution d'opérations dans les interfaces métier
