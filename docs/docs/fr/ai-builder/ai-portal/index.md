---
title: "Démarrage rapide de l'AI Portal"
description: "La construction avec un AI Portal consiste à laisser un AI Agent écrire le code de votre système métier, NocoBase fournissant l'authentification, la base de données, l'API et les permissions comme socle. Le code vit dans un point d'entrée applicatif appelé AI Portal."
keywords: "construction AI Portal, construction par IA, AI Portal, NocoBase AI, socle NocoBase, développement front-end, React, shadcn/ui, AI Agent, démarrage rapide"
---

# Démarrage rapide de l'AI Portal

Nous avons constaté que le vibe coding avec l'IA sait produire une page à l'apparence soignée, mais qu'il a du mal à se raccorder à un vrai système métier — ou qu'il finit par réimplémenter de zéro l'authentification, les permissions et la conception des tables.

NocoBase, en tant que plateforme low-code/no-code, fournit déjà tout cela. Vous pouvez le considérer comme le socle du noyau de votre système : l'AI Agent se concentre sur la logique métier pendant que NocoBase apporte une infrastructure fiable d'authentification, de base de données, d'API et de permissions.

Pour cela, nous proposons un point d'entrée applicatif appelé **AI Portal**. Son code source réside en local et est réservé à l'écriture par l'AI Agent. Le code écrit dans ce point d'entrée accède directement aux capacités intégrées de NocoBase, et les pages construites sont immédiatement accessibles.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## Les capacités fournies par NocoBase

Quand vous construisez un système métier, le temps ne part généralement pas dans les pages, mais dans tout ce qui se trouve derrière — connexion des utilisateurs, vérification des permissions, conception des tables, API CRUD, envoi et téléchargement de fichiers. Tout système en a besoin, et les refaire de zéro à chaque fois n'est pas rentable.

NocoBase fournit déjà tout cela :

- **Authentification** — la connexion par identifiant et mot de passe fonctionne d'emblée. OIDC, SAML, CAS, LDAP, SMS, DingTalk, WeCom et d'autres méthodes fonctionnent dès qu'elles sont activées côté serveur, le front-end n'ayant plus qu'à s'y raccorder
- **Base de données et sources de données multiples** — gestion des tables intégrée, plus la connexion à des sources de données externes comme MySQL ou PostgreSQL
- **REST API** — dès qu'une table existe, ses endpoints CRUD viennent avec, avec prise en charge du filtrage, du tri, de la pagination et des champs relationnels
- **Contrôle des permissions** — ACL par rôle, jusqu'au niveau du champ et de l'enregistrement. Le front-end peut lire les permissions de l'utilisateur courant pour décider quoi afficher
- **Workflow** — automatisation des processus métier, déclenchée depuis le front-end ou par des modifications de données
- **Stockage de fichiers** — envoi et téléchargement

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

Sur la base de ces capacités, nous avons construit un [modèle de système](https://github.com/nocobase/portal-template-default) standard que l'AI Agent peut copier pour obtenir une application fonctionnelle. NocoBase fournit par ailleurs un ensemble de Skills tels que [Modélisation des données](../data-modeling.md) et [Configuration des permissions](../acl.md) : une fois vos besoins métier décrits, l'AI Agent ne se contente pas de générer les pages front-end, il crée aussi les tables et configure les permissions, pour vous livrer un système métier complet.

## Prérequis

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation) — le modèle de Portal s'en sert pour installer les dépendances et démarrer le serveur de développement
- La version alpha de `nocobase cli` (**attention : seule la version alpha est prise en charge pour l'instant**)
  - `npm install -g @nocobase/cli@alpha`
  - Ainsi qu'une application NocoBase déjà initialisée via `nb init --ui`. Voir le [Guide d'intégration pour AI Agent](../../ai/quick-start.md)
- Un AI Agent, par exemple Claude Code, Codex ou Cursor

## Première étape : vérifier que vous avez déjà un AI Portal

Vérifiez d'abord que le Portal `main` par défaut est bien présent :

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

La sortie liste le nom du Portal, l'URL d'accès, le type de Portal, le source storage, le chemin de développement, l'état d'activation et l'état par défaut.

Après avoir récupéré le code source, `info` vous donne plus de détails, par exemple où pointent respectivement le chemin de développement et le chemin de déploiement :

```bash
nb portal info main
```

## Deuxième étape : démarrer le mode développement

```bash
# Récupérer le code source du portal
nb portal pull main
# Démarrer le serveur de développement
nb portal dev main
```

Le serveur de développement tourne par défaut sur `http://localhost:5173`.

Le modèle est livré avec une page de gestion des utilisateurs bâtie sur la table `users` de NocoBase. Connectez-vous pour y jeter un œil — elle constitue aussi un bon exemple de départ à faire suivre à l'IA.

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## Troisième étape : laisser l'IA modifier une page

Placez-vous dans l'espace de travail de développement du Portal (`pull` le place par défaut dans `./main` ; en cas de doute, vérifiez le chemin de développement avec `nb portal info main`), ouvrez-y votre AI Agent — Claude Code, Codex, Cursor, peu importe — puis donnez-lui un prompt :

```
Ajoute une page de gestion des clients,
avec une liste de clients, une recherche par nom et un tiroir de détails qui s'ouvre au clic sur une ligne
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

L'IA parcourt les pages et les extensions existantes, écrit la nouvelle page en suivant les conventions du modèle, et vous voyez le résultat sur `http://localhost:5173`.

Pour savoir comment collaborer efficacement avec un AI Agent, consultez [Construire avec un AI Agent](./agent-workflow.md).

## Quatrième étape : déployer

Une fois les modifications locales satisfaisantes, poussez le code source vers le distant, puis construisez et déployez :

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

L'endroit où `push` envoie le code source dépend de la configuration source storage de ce Portal. Par défaut il s'agit de `nocobase`, où le code source est géré par NocoBase. Si vous le configurez en `git` avec [`nb portal config`](../../api/cli/portal/config.md), `push` commite et pousse le code source vers le dépôt Git que vous avez indiqué, et `--message` devient le message de commit Git. Voir [Déploiement et gestion des sources](./deploy.md#source-storage) pour le détail.

Une fois le déploiement terminé, rendez-vous sur `/x/main/` pour voir vos modifications.

La boucle complète est ainsi bouclée — décrire le besoin, l'IA écrit le code, vous vérifiez en local, puis vous poussez et déployez.

## Quand vous avez besoin de plusieurs points d'entrée

Une application peut avoir plusieurs Portals. Un pour les collaborateurs internes, un autre pour les clients externes : les pages et les permissions restent totalement séparées, tandis que les données sont partagées :

```bash
nb portal create customer
```

La création génère `./customer` dans le répertoire courant comme espace de travail de développement, ou vous pouvez le placer ailleurs avec `--path`. Un nouveau Portal se développe avec `nb portal dev` et se déploie avec `nb portal deploy` exactement comme le premier — placez-vous dans son espace de travail et ouvrez-y votre AI Agent. Voir [Déploiement et gestion des sources](./deploy.md) pour le détail.

## Essayer la démo

Si vous voulez voir la construction avec un AI Portal à l'œuvre, demandez un environnement de démonstration sur https://demo.nocobase.com/new . Une fois le formulaire rempli, nous vous générons un environnement de démonstration dédié, contenant plusieurs applications AI Portal bâties sur le socle NocoBase.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

Vous pouvez ensuite choisir un AI Portal et y entrer :

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

La page d'accueil du Portal vous fournit également un prompt qui permet à votre AI Agent de se connecter directement à cette application AI Portal, de récupérer le code de l'application, de démarrer un serveur de développement en local, de modifier les pages, puis de pousser et déployer vers l'environnement de démonstration. Rafraîchissez la page après un déploiement réussi et vous verrez le résultat.

## Et après ?

- [Construire avec un AI Agent](./agent-workflow.md) — comment écrire les prompts, et comment revenir en arrière quand l'IA se trompe
- [Structure du projet et stack technique](./project-structure.md) — les conventions de répertoires du modèle et les commandes courantes
- [Déploiement et gestion des sources](./deploy.md) — placer le code source du Portal dans Git, et le déploiement multi-environnements

## Liens connexes

- [Construire avec un AI Agent](./agent-workflow.md) — piloter l'IA en langage naturel pour écrire les pages du Portal
- [Structure du projet et stack technique](./project-structure.md) — les conventions de répertoires du modèle et les commandes courantes
- [Composants standard et extensions](./components.md) — la base de composants shadcn/ui et le mécanisme d'extension
- [Déploiement et gestion des sources](./deploy.md) — le processus complet de développement, de push et de déploiement
- [Guide d'intégration pour AI Agent](../../ai/quick-start.md) — installer le NocoBase CLI et terminer l'initialisation
- [Démarrage rapide de la construction par IA](../index.md) — l'autre approche de construction, sans écrire de code
- [Contrôle de version](../version-control.md) — les instantanés de version de la construction no-code
- [Référence des commandes `nb portal`](../../api/cli/portal/index.md) — description complète des paramètres de toutes les commandes Portal
