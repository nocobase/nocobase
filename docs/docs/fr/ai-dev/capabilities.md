---
title: "Capacités prises en charge"
description: "Toutes les capacités prises en charge par AI Development : scaffold, tables de données, blocks, fields, actions, pages de configuration, API, permissions, internationalisation, scripts de mise à niveau."
keywords: "AI Development, capacités, développement de plugins, scaffold, tables de données, blocks, fields, actions, permissions, internationalisation"
---

# Capacités prises en charge

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir préparé votre environnement en suivant le [Démarrage rapide du plugin AI Development](./index.md).

:::

La capacité du plugin AI Development repose sur la Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Si vous avez déjà initialisé via la [NocoBase CLI](../ai/quick-start.md) (`nb init`), cette Skill est installée automatiquement.

Vous trouverez ci-dessous toutes les choses que l'IA peut faire pour vous. Chaque capacité est accompagnée d'un exemple de prompt que vous pouvez copier directement et adapter à votre besoin.

:::warning Attention

- NocoBase est en cours de migration de `client` (v1) vers `client-v2`. Actuellement, `client-v2` est encore en développement. Le code client généré par AI Development est basé sur `client-v2` et ne peut être utilisé que sous le chemin `/v2/`. Il est destiné à un aperçu et n'est pas recommandé pour une mise en production directe.
- Le code généré par l'IA n'est pas nécessairement correct à 100 %. Il est recommandé de le revoir avant de l'activer. Si vous rencontrez un problème à l'exécution, vous pouvez transmettre le message d'erreur à l'IA pour qu'elle continue le diagnostic et la correction — généralement quelques tours de dialogue suffisent à résoudre le problème.
- Il est recommandé d'utiliser les modèles GPT ou Claude pour le développement, qui donnent les meilleurs résultats. D'autres modèles fonctionnent également, mais la qualité de la génération peut varier.

:::

## Bonnes pratiques

- **Indiquez clairement à l'IA que vous voulez créer ou modifier un plugin NocoBase, et fournissez le nom du plugin** — par exemple « Veuillez utiliser la skill nocobase-plugin-development pour m'aider à développer un plugin NocoBase nommé @my-scope/plugin-rating ». Sans le nom du plugin, l'IA risque de ne pas savoir où générer le code.
- **Précisez explicitement dans le prompt l'utilisation de la skill nocobase-plugin-development** — par exemple « Veuillez utiliser la skill nocobase-plugin-development pour m'aider à développer un plugin NocoBase… ». Ainsi, l'AI Agent peut lire directement les capacités de la Skill et éviter d'entrer en mode plan en ignorant les Skills.
- **Exécutez l'AI Agent à la racine du dépôt source de NocoBase** — ainsi l'IA peut trouver automatiquement la structure du projet, les dépendances et les plugins existants. Si vous n'êtes pas à la racine du dépôt source, vous devez indiquer en plus à l'AI Agent le chemin du dépôt source.

## Index rapide

| Je veux…                                     | L'IA peut faire pour vous                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Créer un nouveau plugin                      | Générer un scaffold complet, incluant l'arborescence front-end et back-end           |
| Définir une table de données                 | Générer une définition de Collection, prenant en charge tous les types de fields et de relations |
| Créer un block personnalisé                  | Générer un BlockModel + un panneau de configuration + l'enregistrement dans le menu « Ajouter un block » |
| Créer un field personnalisé                  | Générer un FieldModel + le lier à l'interface du field                               |
| Ajouter un bouton d'action personnalisé      | Générer un ActionModel + popup / drawer / boîte de confirmation                      |
| Créer une page de configuration de plugin    | Générer un formulaire front-end + une API back-end + le stockage                     |
| Écrire une API personnalisée                 | Générer une Resource Action + l'enregistrement de la route + la configuration ACL    |
| Configurer les permissions                   | Générer des règles ACL, avec un contrôle d'accès par rôle                            |
| Support multilingue                          | Générer automatiquement les paquets de langues chinois et anglais                    |
| Écrire un script de mise à niveau            | Générer une Migration prenant en charge le DDL et la migration de données            |

## Scaffold de plugin

L'IA peut, à partir de la description de votre besoin, générer une arborescence complète de plugin NocoBase — incluant les fichiers d'entrée front-end et back-end, les définitions de types et la configuration de base.

Exemple de prompt :

```
帮我创建一个 NocoBase 插件，插件名叫 @my-scope/plugin-todo
```

L'IA exécutera `yarn pm create @my-scope/plugin-todo` et générera l'arborescence standard :

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Définition de table de données

L'IA prend en charge la génération de définitions de Collection pour tous les types de fields NocoBase, y compris les relations (un-à-plusieurs, plusieurs-à-plusieurs, etc.).

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-order，
然后在里面定义一张"订单"表，字段包括：订单编号（自增）、客户名称（字符串）、
金额（小数）、状态（单选：待处理/处理中/已完成）、创建时间。
订单和客户是多对一关系。
```

L'IA générera une définition `defineCollection` comprenant les types de fields, les valeurs par défaut, la configuration des relations, etc.

## Block personnalisé

Le block est le mode d'extension front-end le plus important de NocoBase. L'IA peut vous aider à générer le modèle de block, le panneau de configuration et l'enregistrement dans le menu.

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-simple-block，
做一个自定义展示区块（BlockModel），用户可以在配置面板里输入 HTML 内容，
区块把这些 HTML 渲染出来。把这个区块注册到「添加区块」菜单里。
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

L'IA générera un `BlockModel`, créera un panneau de configuration via `registerFlow` + `uiSchema`, et l'enregistrera dans le menu « Ajouter un block ».

Pour un exemple complet, consultez [Créer un block d'affichage personnalisé](../plugin-development/client/examples/custom-block).

## Composant de field personnalisé

Si les composants de rendu de field intégrés à NocoBase ne répondent pas à vos besoins, l'IA peut vous aider à créer un composant d'affichage personnalisé pour remplacer le rendu de field par défaut.

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-rating，
做一个自定义字段显示组件（FieldModel），将 integer 类型的字段渲染成星星图标，
支持 1-5 分，点击星星可以直接修改评分值并保存到数据库。
```

![Aperçu du composant Rating](https://static-docs.nocobase.com/20260422170712.png)

L'IA générera un `FieldModel` personnalisé qui remplacera le composant de rendu par défaut du field integer.

## Action personnalisée

Les boutons d'action peuvent apparaître en haut d'un block (au niveau collection), dans la colonne d'action de chaque ligne d'un tableau (au niveau record), ou simultanément aux deux endroits. Au clic, ils peuvent afficher une notification, ouvrir un popup de formulaire, appeler une API, etc.

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-simple-action，
做三个自定义操作按钮（ActionModel）：
1. 一个 collection 级别的按钮，出现在区块顶部，点击后弹出成功提示
2. 一个 record 级别的按钮，出现在表格每行的操作列，点击后显示当前记录的 ID
3. 一个 both 级别的按钮，同时出现在两个位置，点击后弹出信息提示
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

L'IA générera un `ActionModel`, contrôlera la position d'affichage du bouton via `ActionSceneEnum`, et gérera les événements de clic via `registerFlow({ on: 'click' })`.

Pour un exemple complet, consultez [Créer un bouton d'action personnalisé](../plugin-development/client/examples/custom-action).

## Page de configuration de plugin

De nombreux plugins ont besoin d'une page de configuration permettant aux utilisateurs de paramétrer — par exemple une API Key d'un service tiers, une URL de Webhook, etc.

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-settings-page，
做一个插件设置页，在「插件配置」菜单下注册一个「外部服务配置」入口，包含两个 Tab：
1.「API 配置」Tab：表单包含 API Key（字符串，必填）、API Secret（密码，必填）、Endpoint（字符串，选填），通过后端 API 保存到数据库
2.「关于」Tab：展示插件名称和版本信息
前端用 Ant Design 表单组件，后端定义 externalApi:get 和 externalApi:set 两个接口。
```

![Aperçu de la page de configuration du plugin](https://static-docs.nocobase.com/20260415160006.png)

L'IA générera le composant front-end de la page de configuration, la Resource Action back-end, la définition de la table de données et la configuration ACL.

Pour un exemple complet, consultez [Créer une page de configuration de plugin](../plugin-development/client/examples/settings-page).

## API personnalisée

Si les interfaces CRUD intégrées ne suffisent pas, l'IA peut vous aider à écrire une API REST personnalisée. Voici un exemple complet d'intégration front-end et back-end — le back-end définit la table de données et l'API, le front-end crée un block personnalisé pour afficher les données.

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-todo，
做一个前后端联动的 Todo 数据管理插件：
1. 后端定义一张 todoItems 表，字段包括 title（字符串）、completed（布尔）、priority（字符串，默认 medium）
2. 前端做一个自定义 TableBlock，只显示 todoItems 的数据
3. priority 字段用彩色 Tag 展示（high 红色、medium 橙色、low 绿色）
4. 加一个"新建 Todo"按钮，点击弹出表单创建记录
5. 已登录用户可以进行所有 CRUD 操作
```

![Aperçu du plugin de gestion de données Todo](https://static-docs.nocobase.com/20260408164204.png)

L'IA générera la définition de Collection, la Resource Action et la configuration ACL côté serveur, ainsi que le `TableBlockModel`, le `FieldModel` personnalisé et l'`ActionModel` côté client.

Pour un exemple complet, consultez [Créer un plugin de gestion de données front-end et back-end](../plugin-development/client/examples/fullstack-plugin).

## Configuration des permissions

L'IA configurera automatiquement des règles ACL pertinentes pour les API et les ressources générées. Vous pouvez aussi spécifier explicitement vos exigences de permissions dans le prompt :

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-todo，
定义一张 todoItems 数据表（title、completed、priority 字段），
权限要求：已登录用户可以查看、创建和编辑，只有 admin 角色可以删除。
```

L'IA configurera les règles d'accès correspondantes côté serveur via `this.app.acl.allow()`.

## Internationalisation

Par défaut, l'IA génère deux paquets de langues, chinois et anglais (`zh-CN.json` et `en-US.json`), sans que vous ayez à le préciser.

Si vous avez besoin d'autres langues :

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-order，
需要支持中文、英文和日文三个语言包
```

## Script de mise à niveau

Lorsqu'un plugin doit mettre à jour la structure de la base de données ou migrer des données, l'IA peut vous aider à générer un script de Migration.

Exemple de prompt :

```
请你用 nocobase-plugin-development skill 帮我给 NocoBase 插件 @my-scope/plugin-order 写一个升级脚本，
给"订单"表新增一个"备注"字段（长文本，选填），并且把现有订单的备注字段默认填上"无"。
```

L'IA générera un fichier de Migration versionné, comprenant les opérations DDL et la logique de migration des données.

## Liens connexes

- [Démarrage rapide du plugin AI Development](./index.md) — Démarrage rapide et vue d'ensemble des capacités
- [Tutoriel : développer un plugin de filigrane](./watermark-plugin) — Cas pratique complet de développement de plugin avec l'IA
- [Développement de plugins](../plugin-development/index.md) — Guide complet du développement de plugins NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Outil en ligne de commande pour installer et gérer NocoBase
