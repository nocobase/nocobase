---
title: "Tutoriel : développer un plugin de filigrane"
description: "Développez un plugin de filigrane NocoBase avec l'IA en une phrase : superposition de filigrane sur la page, détection anti-altération, paramètres de filigrane configurables."
keywords: "AI Development, plugin de filigrane, plugin NocoBase, cas pratique, programmation IA"
---

# Tutoriel : développer un plugin de filigrane

Ce cas montre comment, avec une seule phrase, faire développer par l'IA un plugin de filigrane NocoBase complet — de la création du scaffold à la vérification de l'activation, le tout réalisé par l'IA.

## Résultat final

Une fois le plugin activé :

- Un filigrane semi-transparent est superposé sur les pages NocoBase, affichant le nom de l'utilisateur connecté
- Le filigrane ne peut pas être supprimé en supprimant le DOM — une détection périodique le régénère automatiquement
- Vous pouvez ajuster le texte du filigrane, son opacité et la taille de police dans «Configuration des plugins»

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## Prérequis

:::tip Lecture préalable

- [NocoBase CLI](../ai/quick-start.md) — Installer et démarrer NocoBase
- [Démarrage rapide du plugin AI Development](./index.md) — Installer les Skills

:::

Assurez-vous d'avoir :

1. Un environnement de développement NocoBase qui fonctionne (lors de l'initialisation de la NocoBase CLI, NocoBase Skills est installé automatiquement)
2. Un éditeur prenant en charge AI Agent ouvert (par exemple Claude Code, Codex, Cursor, etc.)

:::warning Attention

- NocoBase est en cours de migration de `client` (v1) vers `client-v2`. Actuellement, `client-v2` est encore en développement. Le code client généré par AI Development est basé sur `client-v2` et ne peut être utilisé que sous le chemin `/v2/`. Il est destiné à un aperçu et n'est pas recommandé pour une mise en production directe.
- Le code généré par l'IA n'est pas nécessairement correct à 100 %. Il est recommandé de le revoir avant de l'activer. Si vous rencontrez un problème à l'exécution, vous pouvez transmettre le message d'erreur à l'IA pour qu'elle continue le diagnostic et la correction — généralement quelques tours de dialogue suffisent à résoudre le problème.

:::

## Démarrer

À la racine de votre projet NocoBase, envoyez le prompt suivant à l'IA :

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

## Ce que l'IA a fait

Après avoir reçu le besoin, l'IA exécutera automatiquement les étapes suivantes :

### 1. Analyser le besoin et confirmer le plan

L'IA commence par analyser quels points d'extension NocoBase ce plugin nécessite, puis vous propose un plan de développement. Par exemple :

> **Côté serveur :**
> - Une table `watermarkSettings` pour stocker la configuration du filigrane (texte, opacité, taille de police)
> - Une API personnalisée pour lire et écrire la configuration du filigrane
> - Configuration ACL : utilisateurs connectés en lecture, administrateurs en écriture
>
> **Côté client :**
> - Page de configuration du plugin : un formulaire pour configurer les paramètres du filigrane
> - Logique de rendu du filigrane : lecture de la configuration puis superposition sur la page
> - Détection anti-altération : un timer qui surveille le DOM du filigrane

Une fois le plan confirmé, l'IA commence à écrire le code.

<!-- 需要一张 AI 输出开发计划的终端截图 -->

### 2. Créer le scaffold du plugin

```bash
yarn pm create @my-project/plugin-watermark
```

L'IA a généré l'arborescence standard du plugin sous `packages/plugins/@my-project/plugin-watermark/`.

### 3. Écrire le code côté serveur

L'IA générera les fichiers suivants :

- **Définition de table de données** — La table `watermarkSettings`, comprenant les fields `text`, `opacity`, `fontSize`
- **API personnalisée** — Interfaces de lecture et de mise à jour de la configuration du filigrane
- **Configuration ACL** — Les utilisateurs connectés peuvent lire la configuration du filigrane, les administrateurs peuvent la modifier

<!-- 需要一张终端截图，展示 AI 正在生成服务端代码的过程 -->

### 4. Écrire le code côté client

- **Page de configuration du plugin** — Un formulaire Ant Design pour configurer le texte du filigrane, l'opacité (slider) et la taille de police
- **Rendu du filigrane** — Création d'une couche canvas/div plein écran sur la page, affichant le nom de l'utilisateur connecté
- **Détection anti-altération** — Double sécurité avec `MutationObserver` + timer ; si le DOM est supprimé, il est immédiatement régénéré

<!-- 需要一张终端截图，展示 AI 正在生成客户端代码的过程 -->

### 5. Internationalisation

L'IA génère automatiquement les paquets de langues chinois et anglais, sans intervention de votre part :

- `src/locale/zh-CN.json` — Traduction chinoise
- `src/locale/en-US.json` — Traduction anglaise

### 6. Activer le plugin

```bash
yarn pm enable @my-project/plugin-watermark
```

Une fois activé, ouvrez une page NocoBase et vous verrez le filigrane superposé au-dessus du contenu.

<!-- 需要一段视频：从输入提示词 → AI 生成代码 → 启用插件 → 页面出现水印 → 打开设置页调整参数 → 水印跟着变化 的完整流程 -->

## Combien de temps a duré l'ensemble du processus

De la saisie du prompt au plugin utilisable, environ **3 à 5 minutes**. L'IA a réalisé le travail suivant :

| Tâche                              | Estimation en développement manuel | Réalisé par l'IA |
| ---------------------------------- | ---------------------------------- | ---------------- |
| Créer le scaffold                  | 2 minutes                          | Automatique      |
| Table de données + API             | 20 minutes                         | Automatique      |
| Page de configuration du plugin    | 30 minutes                         | Automatique      |
| Rendu du filigrane + anti-altération | 40 minutes                       | Automatique      |
| Configuration ACL                  | 10 minutes                         | Automatique      |
| Internationalisation               | 15 minutes                         | Automatique      |
| **Total**                          | **~2 heures**                      | **~5 minutes**   |


## Envie de développer plus de plugins ?

Le plugin de filigrane porte principalement sur le rendu front-end et un stockage back-end simple. Si vous voulez savoir ce que l'IA peut encore faire pour vous — par exemple les blocks personnalisés, les relations complexes entre tables, les extensions de workflow, etc. — consultez [Capacités prises en charge](./capabilities).

## Liens connexes

- [Démarrage rapide du plugin AI Development](./index.md) — Démarrage rapide et vue d'ensemble des capacités
- [Capacités prises en charge](./capabilities) — Tout ce que l'IA peut faire pour vous, avec exemples de prompts
- [Développement de plugins](../plugin-development/index.md) — Guide complet du développement de plugins NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Outil en ligne de commande pour installer et gérer NocoBase
