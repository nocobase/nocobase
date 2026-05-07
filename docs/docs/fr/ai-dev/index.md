---
title: "Démarrage rapide du plugin AI Development"
description: "Développez des plugins NocoBase avec l'aide de l'IA : décrivez votre besoin en une phrase et générez automatiquement le code front-end et back-end, les tables de données, la configuration des permissions et l'internationalisation."
keywords: "AI Development, Développement IA, NocoBase AI, développement de plugins, programmation IA, Skills, démarrage rapide"
---

# Démarrage rapide du plugin AI Development

Le plugin AI Development est la capacité de développement de plugins assistée par l'IA fournie par NocoBase — vous pouvez décrire votre besoin en langage naturel et l'IA génère automatiquement un code complet front-end et back-end, comprenant les tables de données, les API, les blocks front-end, les permissions et l'internationalisation. Il offre une expérience de développement de plugins plus moderne et plus efficace.

La capacité du plugin AI Development repose sur la Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Si vous avez déjà initialisé via la NocoBase CLI (`nb init`), cette Skill est installée automatiquement.

## Démarrage rapide

Si vous avez déjà installé la [NocoBase CLI](../ai/quick-start.md), vous pouvez sauter cette étape.

### Installation IA en un clic

Copiez le prompt ci-dessous dans votre assistant IA (Claude Code, Codex, Cursor, Trae, etc.) pour effectuer automatiquement l'installation et la configuration :

```
帮我安装 NocoBase CLI 并完成初始化：https://docs.nocobase.com/cn/ai/ai-quick-start.md （请直接访问链接内容）
```

### Installation manuelle

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Le navigateur ouvrira automatiquement la page de configuration visuelle, qui vous guidera pour installer NocoBase Skills, configurer la base de données et démarrer l'application. Pour les étapes détaillées, consultez le [démarrage rapide](../ai/quick-start.md).

:::warning Attention

- NocoBase est en cours de migration de `client` (v1) vers `client-v2`. Actuellement, `client-v2` est encore en développement. Le code client généré par AI Development est basé sur `client-v2` et ne peut être utilisé que sous le chemin `/v2/`. Il est destiné à un aperçu et n'est pas recommandé pour une mise en production directe.
- Le code généré par l'IA n'est pas nécessairement correct à 100 %. Il est recommandé de le revoir avant de l'activer. Si vous rencontrez un problème à l'exécution, vous pouvez transmettre le message d'erreur à l'IA pour qu'elle continue le diagnostic et la correction — généralement quelques tours de dialogue suffisent à résoudre le problème.
- Il est recommandé d'utiliser les modèles GPT ou Claude pour le développement, qui donnent les meilleurs résultats. D'autres modèles fonctionnent également, mais la qualité de la génération peut varier.

:::

## D'une phrase à un plugin complet

Une fois l'installation terminée, vous pouvez directement dire à l'IA, en langage naturel, le plugin que vous voulez développer. Voici quelques scénarios réels qui illustrent la capacité du plugin AI Development.

### Développer un plugin de filigrane en une phrase

Avec un seul prompt, l'IA peut générer pour vous un plugin de filigrane complet — incluant la logique de rendu front-end, la détection anti-altération, l'API back-end de stockage des paramètres et la page de configuration du plugin.

```
帮我用 nocobase-plugin-development skill 开发一个 NocoBase 的水印插件，
要求：在页面上覆盖半透明水印，显示当前登录用户名，防止截图泄密。
定时检测水印 DOM 是否被删除，被删除则重新生成。
在插件设置页里支持配置水印文字、透明度和字号。
插件名叫 @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

Tout au long du processus, vous n'avez qu'à décrire vos besoins et prendre les décisions. L'IA s'occupe du reste automatiquement. Envie de voir le processus complet ? → [Tutoriel : développer un plugin de filigrane](./watermark-plugin)

### Créer un composant de field personnalisé en une phrase

Vous voulez afficher un field integer sous forme de notation par étoiles ? Décrivez à l'IA l'effet d'affichage souhaité, et elle générera pour vous un FieldModel personnalisé qui remplacera le composant de rendu de field par défaut.

```
请你用 nocobase-plugin-development skill 帮我开发一个 NocoBase 插件，名叫 @my-scope/plugin-rating，
做一个自定义字段显示组件（FieldModel），将 integer 类型的字段渲染成星星图标，
支持 1-5 分，点击星星可以直接修改评分值并保存到数据库。
```

![Aperçu du composant Rating](https://static-docs.nocobase.com/20260422170712.png)

Pour en savoir plus sur l'utilisation des différentes capacités, consultez [Capacités prises en charge](./capabilities).

## Ce que l'IA peut faire pour vous

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

Pour la description détaillée de chaque capacité et les exemples de prompts → [Capacités prises en charge](./capabilities)

## Liens connexes

- [Tutoriel : développer un plugin de filigrane](./watermark-plugin) — Cas pratique complet de développement de plugin avec l'IA, d'une phrase à un plugin utilisable
- [Capacités prises en charge](./capabilities) — Tout ce que l'IA peut faire pour vous, avec exemples de prompts
- [NocoBase CLI](../ai/quick-start.md) — Outil en ligne de commande pour installer et gérer NocoBase
- [Référence NocoBase CLI](../api/cli/index.md) — Description complète des paramètres de toutes les commandes
- [Développement de plugins](../plugin-development/index.md) — Guide complet du développement de plugins NocoBase
- [Démarrage rapide d'AI Builder](../ai-builder/index.md) — Construire des applications NocoBase avec l'IA (sans écrire de code)
