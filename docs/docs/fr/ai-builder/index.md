---
title: "Démarrage rapide de la construction par IA"
description: "La construction par IA est la capacité d'assistance à la construction par IA de NocoBase : utilisez le langage naturel pour la modélisation des données, la construction de l'interface, l'orchestration des workflows et la configuration des permissions, via la configuration no-code ou via du code écrit par l'IA."
keywords: "construction par IA, AI Builder, NocoBase AI, Agent Skills, construction en langage naturel, low-code IA, AI Portal, démarrage rapide"
---

# Démarrage rapide de la construction par IA

La construction par IA est la capacité d'assistance à la construction par IA fournie par NocoBase — vous décrivez vos besoins métier en langage naturel, et un AI Agent construit le système pour vous. Elle couvre toute la chaîne, de la modélisation des données à la mise en production, en passant par la construction de l'interface, l'orchestration des workflows et la configuration des permissions.

Concrètement, pour **construire l'interface**, il existe deux approches :

- **IA + construction avec un Portal no-code** — l'IA construit l'interface de votre système en s'appuyant sur les capacités de configuration no-code de NocoBase, et le résultat est une configuration enregistrée en base de données. Cette approche convient au CRUD standard et aux back-offices internes ; les utilisateurs métier peuvent ensuite continuer à ajuster l'interface eux-mêmes
- **Construction avec un AI Portal** — NocoBase fournit le socle (données, authentification, permissions, etc.) et l'AI Agent écrit le code directement en local, avec un résultat que vous pouvez versionner tel quel dans Git. Une fois construit et déployé, l'accès se fait via l'[AI Portal](./ai-portal/index.md). Cette approche convient aux interactions sur mesure, aux systèmes métier complexes et aux scénarios ayant des exigences visuelles particulières

Quelle que soit l'approche retenue, les tables, les permissions et les workflows reposent sur le même ensemble de Skills — pendant que l'AI Agent écrit les pages, il peut aussi créer vos tables et configurer les permissions, et construire progressivement, par la conversation, un système métier complet.

## Comment choisir entre les deux approches

Chacune de ces deux approches correspond à un point d'entrée. Une application NocoBase peut avoir plusieurs points d'entrée qui partagent les mêmes données, et le chemin d'accès permet de reconnaître lequel est lequel :

```text
/v/<name>    Portal no-code
/x/<name>    AI Portal
```

![two types of portal](https://static-docs.nocobase.com/20260804091849.png)

Les différences :

| | Portal no-code | AI Portal |
| --- | --- | --- |
| Chemin d'accès | `/v/<name>` | `/x/<name>` |
| D'où viennent les pages | Configurées dans l'interface, l'IA pouvant aider à modifier la configuration | Code source React écrit par l'AI Agent |
| Résultat produit | Configuration enregistrée en base de données | Code source versionnable dans Git |
| Mode d'itération | Clics dans l'interface, ou modification de la configuration par l'IA | Modification du code, `dev` → `deploy` |
| Gestion des versions | Instantanés via le [contrôle de version](./version-control.md) | Git, ou le source storage de NocoBase |
| Liberté sur l'interface | Limitée par les capacités des blocs, avec des schémas établis de mise en page et d'interaction | Tout ce que vous voulez en faire |
| Capacités déjà disponibles | Tableaux de bord, calendrier, vue kanban et autres blocs prêts à l'emploi | Le code du modèle standard que nous fournissons, ou ce que l'AI Agent implémente lui-même |
| Prise en main | Nécessite de connaître les blocs, les champs et autres notions NocoBase | Nécessite une certaine familiarité avec l'usage des AI Agents |
| Convient à | CRUD standard, back-offices internes | Interactions sur mesure, systèmes métier complexes, exigences visuelles particulières |

Un Portal no-code suffit dans les cas suivants :

- La structure de la page est très standard : un tableau et un formulaire classiques, où la configuration est plus rapide que l'écriture de code
- Des utilisateurs métier qui n'écrivent pas de code doivent pouvoir ajuster les pages eux-mêmes
- Vous voulez uniquement utiliser les capacités de blocs intégrées à NocoBase, comme les tableaux de bord, les vues calendrier et les vues kanban
- Vous construisez seul, ou vous n'avez pas besoin de construire à plusieurs

Pour tous les autres cas, nous recommandons de construire avec l'[AI Portal](./ai-portal/index.md). Avec la construction par Portal no-code, l'IA a trop de contexte à assimiler — types de blocs, structures de configuration, règles d'interaction — et pour les systèmes métier qui exigent une construction complexe, l'efficacité, la maintenabilité et la collaboration en équipe restent insuffisantes.

Nous avons donc changé d'approche : **écrire du code front-end est ce que l'IA fait le mieux**, autant la laisser faire ce qu'elle sait faire. NocoBase joue le rôle de socle du noyau système, et le front-end est laissé à l'IA. Mêmes besoins, résultat plus rapide et de meilleure qualité. **L'IA construit librement, NocoBase garantit la fiabilité.**

Les deux modes peuvent aussi être combinés : configurez rapidement le back-office interne avec un Portal no-code, et affinez le portail destiné aux clients avec un AI Portal — les deux vivent dans la même application et partagent les mêmes données et les mêmes utilisateurs.

## Démarrage rapide

::: warning Attention
Pour essayer la construction avec un AI Portal, installez la version alpha du NocoBase CLI (`npm install -g @nocobase/cli@alpha`).
:::

Si vous avez déjà installé le [NocoBase CLI](../ai/quick-start.md), vous pouvez ignorer cette étape.

### Installation IA en une étape

Copiez le prompt ci-dessous vers votre assistant IA (Claude Code, Codex, Cursor, Trae, etc.) pour effectuer automatiquement l'installation et la configuration :

```
Aide-moi à installer NocoBase CLI et à terminer l'initialisation : https://docs.nocobase.com/fr/ai/ai-quick-start.md (veuillez accéder directement au contenu du lien)
```

### Installation manuelle

```bash
npm install -g @nocobase/cli@alpha
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

### Construisez un jalon, et l'IA enregistre une version restaurable pour vous

Après avoir terminé une page, un ensemble de tables de données ou un workflow, laissez l'IA enregistrer l'état actuel comme version — si une configuration tourne mal, vous pouvez toujours revenir au dernier jalon clair.

```
Enregistre la construction actuelle comme version : page de gestion des clients, zone de filtres et formulaire d'édition terminés
```

![L'IA crée une version après la construction](https://static-docs.nocobase.com/20260611115804.png)

L'IA n'enregistre pas une version à chaque modification de champ ; elle n'enregistre qu'après avoir terminé et vérifié un jalon clair, ce qui rend la liste des versions plus lisible et facilite le choix du point de retour.

Pour en savoir plus sur le contrôle de version, consultez [Contrôle de version](./version-control).

### Orchestrer un workflow automatisé en une phrase

Décrivez les conditions de déclenchement et la logique de traitement d'un processus métier, et l'IA créera automatiquement les déclencheurs et la chaîne de nœuds.

```
Aide-moi à orchestrer un workflow qui décrémente automatiquement le stock après la création d'une commande
```

![Workflow de décrémentation de stock après création de commande](https://static-docs.nocobase.com/20260419234303.png)

Pour en savoir plus sur les workflows, consultez [Gestion des workflows](./workflow).

### Décrivez les pages en langage métier, l'IA les construit pour vous

NocoBase fournit par défaut un **AI Portal** et un **Portal no-code**. Pas besoin d'apprendre les règles de configuration : décrivez simplement le type de page que vous voulez — barre de recherche, tableau, conditions de filtrage, dites-le et c'est fait.

![portal manage](https://static-docs.nocobase.com/20260804104517.png)

Pour une construction via un Portal no-code (le Portal par défaut s'appelle admin) :

```
Aide-moi à créer dans admin une page de gestion des clients, avec une barre de recherche par nom et un tableau des clients affichant le nom, le téléphone, l'email et la date de création
```

![Page de gestion des clients](https://static-docs.nocobase.com/20260420100608.png)

Pour une construction via un AI Portal (le Portal par défaut s'appelle main) :

```
Aide-moi à créer dans le portal main une page de gestion des clients, avec une barre de recherche et un tableau des clients affichant le nom, le téléphone et le secteur d'activité
```

![portal page](https://static-docs.nocobase.com/20260803204422.png)

Pour en savoir plus sur la configuration de l'interface, consultez [Configuration de l'interface](./ui-builder) ou [Construction avec AI Portal](./ai-portal/index.md).

## Sécurité et audit

Avant de laisser un AI Agent opérer sur NocoBase, il est recommandé de comprendre les méthodes d'authentification, le contrôle des permissions et l'audit des opérations — pour vous assurer que l'IA ne fait que ce qu'elle doit faire, et que chaque étape est tracée. Consultez [Sécurité et audit](./security).

## NocoBase Skills

Les [NocoBase Skills](https://github.com/nocobase/skills) sont des packs de connaissances métier installables dans votre AI Agent, qui permettent à l'IA de comprendre le système de configuration de NocoBase. NocoBase fournit plusieurs Skills couvrant l'ensemble du processus de construction :

- [Gestion des environnements](./env-bootstrap) — vérification d'environnement, installation, déploiement, mise à niveau et diagnostic
- [Modélisation des données](./data-modeling) — création et gestion des tables, champs et relations
- [Configuration de l'interface](./ui-builder) — création et édition de pages, blocs, popups et interactions
- [Gestion des workflows](./workflow) — création, édition, activation et diagnostic des workflows
- [Configuration des permissions](./acl) — gestion des rôles, des stratégies de permission, de l'association des utilisateurs et de l'évaluation des risques
- [Solutions](./dsl-reconciler) — construction par lots de systèmes métier complets à partir de YAML
- [Gestion des plugins](./plugin-manage) — consultation, activation et désactivation des plugins
- [Gestion des publications](./publish) — publication multi-environnements, sauvegarde, restauration et migration
- [Contrôle de version](./version-control) — enregistrer des versions restaurables après des jalons terminés
- [Construction avec AI Portal](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - laisser l'AI Agent écrire du code dans un AI Portal pour construire les interfaces du système

:::tip Astuce

Le NocoBase CLI installe automatiquement les Skills lors de l'initialisation (`nb init`), aucune installation manuelle n'est requise.

:::

## Liens connexes

- [AI Portal](./ai-portal/index.md) — l'autre approche de construction, où l'AI Agent écrit directement le code front-end
- [NocoBase CLI](../ai/quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [Référence du NocoBase CLI](../api/cli/index.md) — description complète des paramètres de toutes les commandes
- [Plugin de développement IA](../ai-dev/index.md) — développer des plugins NocoBase avec l'aide de l'IA
- [Sécurité et audit](./security) — méthodes d'authentification, contrôle des permissions et audit des opérations
- [AI Employees](../ai-employees/index.md) — capacités d'agents intelligents de NocoBase, prenant en charge la collaboration et l'exécution d'opérations dans les interfaces métier
