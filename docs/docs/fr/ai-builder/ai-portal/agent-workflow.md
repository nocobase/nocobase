---
title: "Construire avec un AI Agent"
description: "Piloter un AI Agent en langage naturel pour écrire les pages front-end d'un AI Portal : comment rédiger les prompts, conseils de collaboration et traitement des problèmes courants."
keywords: "AI Portal, AI Agent, construction collaborative, prompts, nocobase-portal-manage, Skills"
---

# Construire avec un AI Agent

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir un premier Portal en fonctionnement en suivant le [Démarrage rapide de l'AI Portal](./index.md).

:::

Le développement quotidien d'un AI Portal est une conversation avec un AI Agent — vous décrivez la page que vous voulez, il écrit le code, vous vérifiez le résultat dans le navigateur.

## Travaillez dans le répertoire du Portal

Avant de commencer, placez-vous dans le répertoire du code source du Portal et ouvrez-y votre AI Agent. L'Agent démarre ainsi dans le bon contexte, avec accès à `AGENTS.md` et au code existant.

Repérez d'abord où se trouve ce répertoire :

```bash
nb portal info main
```

Le chemin de développement indiqué dans la sortie est l'emplacement du code source du Portal. Faites un `cd` vers ce répertoire, puis ouvrez votre AI Agent :

```bash
cd <répertoire de l'espace de travail de développement>
```

Ensuite, il vous suffit de décrire votre besoin :

```
Ajoute une page de liste des commandes au portal main de mon application nocobase
```

## Faites lire l'IA avant qu'elle n'écrive

Un fichier `AGENTS.md` se trouve à la racine du modèle et décrit les conventions du projet : réutiliser en priorité ce qui existe déjà dans `src/extensions`, personnaliser les composants d'interface par composition plutôt qu'en modifiant les composants de base, et ne pas introduire Ant Design. Les AI Agents qui lisent ce fichier respectent ces conventions automatiquement.

Vous pouvez aussi ajouter à `AGENTS.md` les conventions propres à votre projet — habitudes de nommage, terminologie métier, répertoires à ne pas toucher. Une fois qu'elles y figurent, elles s'appliquent à chaque conversation, sans que vous ayez à les répéter.

`src/extensions` contient quelques extensions intégrées. Parmi elles, `nocobase-users-example` est une page CRUD complète avec vues liste, création, édition et détail. Y renvoyer l'IA est plus efficace que de décrire une nouvelle page de zéro :

```
Construis une page de gestion des produits en suivant le modèle de nocobase-users-example
```

## Exemples de prompts

### Scénario A : Créer une nouvelle page métier

Trois éléments suffisent — ce que contient la page, d'où viennent les données et comment elle se comporte :

```
Ajoute une page de gestion des clients :
le tableau affiche le nom, le téléphone, l'email et la date de création, avec une recherche par nom,
un clic sur une ligne ouvre un tiroir de détails où l'enregistrement peut être édité et enregistré
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Scénario B : Modifier une page existante

Pour une demande de modification, soyez précis sur ce qui change. Inutile de redécrire toute la page :

```
Ajoute un filtre par statut à la liste des clients,
avec les options « En cours », « Gagné » et « Perdu », sans filtre par défaut
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Scénario C : Raccorder une nouvelle table

Une fois qu'une table existe, demandez à l'IA de générer les pages correspondantes. Elle lit les définitions de champs et choisit en conséquence les contrôles de formulaire et les colonnes de liste :

```
Je viens de créer une table contracts, construis-moi l'ensemble des pages CRUD correspondantes
```

Si la table n'existe pas encore, utilisez [Modélisation des données](../data-modeling.md) pour faire concevoir la structure de données par l'IA, avant de revenir aux pages.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Scénario D : Reproduire une maquette

Lorsque vous disposez d'un fichier de design ou d'un prototype HTML existant, transmettez-le à l'IA :

```
Construis la page d'accueil à partir de ce prototype,
en conservant les couleurs et la mise en page, et en raccordant les données à la table orders
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Scénario E : Ajouter une méthode d'authentification

Une fois une méthode d'authentification activée côté serveur, la page de connexion a besoin de la prise en charge front-end correspondante :

```
La connexion DingTalk est activée dans NocoBase, ajoute un bouton de connexion DingTalk à la page de connexion
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Conseils de collaboration

**Itérez par petits pas.** Faites traiter à l'IA une page ou une modification à la fois, et vérifiez le résultat avant de passer à la suite. Si vous décrivez cinq pages d'un coup, il devient difficile de savoir quelle étape a dérapé lorsque quelque chose casse.

**Laissez le serveur de développement tourner.** `nb portal dev main` recharge à chaud, vous voyez donc le résultat juste après chaque modification de l'IA. C'est la boucle de retour la plus courte possible.

**Donnez-lui l'erreur exacte.** Une page blanche, une compilation en échec, un 403 renvoyé par une API — collez le message d'erreur complet et une capture d'écran à l'IA au lieu de la laisser deviner. Quelques échanges suffisent généralement à régler le problème. Vous n'avez pas besoin d'identifier d'abord la couche concernée.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Questions fréquentes

**Comment revenir en arrière quand l'IA se trompe ?**

Si le code source du Portal est dans Git, un `git checkout` suffit. Avec le source storage `nocobase` par défaut, vous pouvez récupérer une copie fraîche depuis le source storage par-dessus la copie locale :

```bash
nb portal pull main --force
```

`--force` supprime l'espace de travail de développement et récupère à nouveau le code source : assurez-vous donc qu'il ne reste rien que vous souhaitez conserver avant de l'exécuter. Pour éviter ce compromis, placez le code source dans Git dès le début — voir [Déploiement et gestion des sources](./deploy.md).

**Comment diagnostiquer une compilation en échec ?**

Lancez d'abord une compilation en local pour voir l'erreur complète :

```bash
nb portal deploy main
```

Les erreurs de types TypeScript et les dépendances manquantes sont les deux causes les plus fréquentes. Collez l'erreur à l'IA et laissez-la les corriger.

**Mes modifications manuelles entrent-elles en conflit avec celles de l'IA ?**

Non. Le code source du Portal est un projet front-end ordinaire — vous pouvez le modifier vous-même quand vous voulez, puis laisser l'IA prendre le relais. Tant que vous n'éditez pas le même fichier au même moment, il n'y a pas de problème.

## Liens connexes

- [Démarrage rapide de l'AI Portal](./index.md) — mettre en route votre premier point d'entrée front-end écrit par l'IA
- [Déploiement et gestion des sources](./deploy.md) — placer le code source du Portal dans Git, et le processus de déploiement
- [Structure du projet et stack technique](./project-structure.md) — les conventions de répertoires du modèle, pour vérifier si l'IA a vu juste
- [Composants standard et extensions](./components.md) — la base de composants shadcn/ui et le mécanisme d'extension
- [Modélisation des données](../data-modeling.md) — faire concevoir les tables par l'IA avant de construire les pages
- [`nb portal info`](../../api/cli/portal/info.md) — vérifier où se trouve l'espace de travail de développement d'un Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — récupérer à nouveau le code source depuis le source storage
