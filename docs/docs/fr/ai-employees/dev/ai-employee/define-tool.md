---
title: "Définir un Tool côté serveur"
description: "Découvrez defineTools, scope, schema, invoke, les permissions et l’enregistrement par convention de répertoire pour les Tools côté serveur des employés IA NocoBase."
keywords: "NocoBase,Tool employé IA,defineTools,ToolsOptions,Zod,invoke"
---

# Définir un Tool côté serveur

Dans NocoBase, un **Tool (outil)** exécute une opération précise, comme interroger des données, effectuer une écriture ou appeler un service externe. Un Tool côté serveur se définit généralement avec `defineTools()` fourni par `@nocobase/ai`, puis se place dans le répertoire `src/ai/**/tools/` du plugin.

## Structure minimale d’un Tool

L'outil côté serveur utilise la définition `defineTools()` fournie par `@nocobase/ai`. L'outil suivant prend un nom et renvoie un message d'accueil :

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Si le chemin du fichier est `src/ai/tools/greetDeveloper.ts`, le chargeur utilisera le nom de fichier `greetDeveloper` comme nom final de l'outil. Même si `definition.name` est écrit avec d'autres valeurs, il sera écrasé par le nom du fichier lors de l'enregistrement.

Par conséquent, par défaut, le nom référencé dans le nom de fichier, `definition.name` et Skill, est cohérent avec le nom enregistré dans le frontal.

## Options de configuration d’un Tool

La configuration principale du `defineTools()` est la suivante :

| Configuration | Rôle | Valeur par défaut |
| --- | --- | --- |
| `scope` | Déterminer la portée disponible de Tool | Obligatoire |
| `execution` | Spécifie si la logique est exécutée dans `backend` ou `frontend` | `backend` |
| `defaultPermission` | S'il faut autoriser directement ou demander une confirmation avant d'appeler Tool | `ASK` |
| `silence` | S'il faut masquer l'invite d'appel de l'outil dans la conversation | `false` |
| `introduction` | Titre et description affichés sur l'interface de gestion | Utiliser le nom de l'outil |
| `definition` | Nom, description et schéma de paramètres fournis au modèle | Obligatoire |
| `invoke` | Logique d'exécution réelle de Tool | Obligatoire |

Le choix de `scope` affectera directement la manière dont Tool entre dans le contexte des employés IA :

| `scope` | Comment utiliser |
| --- | --- |
| `GENERAL` | Partagé par tous les employés de l'IA, généralement utilisé pour les capacités de base communes |
| `SPECIFIED` | Seuls les employés Skill ou AI liés à cet outil peuvent utiliser |
| `CUSTOM` | L'administrateur peut l'ajouter manuellement dans la configuration des employés AI et définir "Demander" ou "Autoriser" |

La recommandation par défaut est `SPECIFIED`. Utilisez `GENERAL` uniquement lorsque vous êtes sûr que chaque employé d'IA a besoin de cette capacité ; utilisez `CUSTOM` lorsque vous souhaitez que les administrateurs effectuent une sélection par employé.

## `definition` s’adresse au modèle

`definition.description` et `definition.schema` affecteront si le modèle sélectionne cet outil et comment construire les paramètres. La description doit clarifier trois choses :

- Dans quelles circonstances est-il appelé ?
-Que représente chaque paramètre ?
- Quelles choses ne doivent pas être gérées par cet outil

Il est recommandé d'utiliser Zod pour le schéma de paramètres :

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Les noms d’outils doivent également rester stables. Les compétences, le personnel IA, les cartes frontales et les messages de discussion enregistrés le trouveront tous par leur nom.

## Paramètres disponibles dans `invoke()`

Le serveur `invoke()` reçoit trois paramètres :

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

L'application actuelle, la base de données, les informations d'authentification et les paramètres d'action sont accessibles via `ctx`. Par exemple:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

L'outil doit renvoyer une structure qui détermine le succès ou l'échec. Les outils intégrés utilisent généralement les formes suivantes :

```ts
return {
  status: 'success',
  content: result,
};
```

En cas d'échec commercial prévisible, un statut et une raison clairs doivent également être renvoyés, et ne pas laisser le modèle deviner si l'opération a réussi.

## Utiliser un répertoire pour les descriptions longues

En plus du formulaire de fichier unique, Tool peut également utiliser des répertoires :

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` exporte les résultats de `defineTools()` par défaut. Lorsque `description.md` existe, son contenu complet écrasera `definition.description`, ce qui convient à l'enregistrement de longues instructions d'outil.

Le nom du répertoire `documentSearch` deviendra le nom final enregistré.


## Exemple d'outil intégré : `subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` montre un outil serveur complet :

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

Cette implémentation a plusieurs pratiques réutilisables :

- Utilisez `SPECIFIED` pour limiter l'accès aux outils à des employés ou des compétences spécifiés
- Utiliser Zod pour contraindre les paramètres générés par le modèle
- Lire la configuration actuelle de la session AI depuis `ctx.action.params.values`
- Mettez plusieurs requêtes indépendantes dans un seul ToolCall et exécutez-les en parallèle via `Promise.all()`
- Renvoie des résultats structurés avec des sources claires, permettant au modèle de couche supérieure de continuer à s'organiser

## Liens connexes

- [Développement de plug-ins pour employés AI](./index.md) — Sélectionnez le niveau de capacité qui doit être étendu
- [Définir la compétence](./define-skill.md) — Utilisez la compétence pour organiser le processus d'appel de plusieurs outils
- [Exemple complet : créer un employé IA intégré](./complete-example.md) — Voir des exemples d'outils exécutables
- [Ajouter une interaction frontend à un Tool](./frontend-tool-ui.md) — Ajouter une interface de confirmation et de sélection pour ToolCall
