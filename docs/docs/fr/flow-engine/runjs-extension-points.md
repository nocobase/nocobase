:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/flow-engine/runjs-extension-points).
:::

# Points d'extension du plugin RunJS (documentation ctx / snippets / mappage de scènes)

Lorsqu'un plugin ajoute ou étend les capacités de RunJS, il est recommandé d'enregistrer le « mappage de contexte / documentation `ctx` / exemples de code » via les **points d'extension officiels**. Cela garantit que :

- CodeEditor peut proposer l'auto-complétion pour `ctx.xxx.yyy`.
- Le codage par IA peut obtenir des références d'API `ctx` structurées et des exemples.

Ce chapitre présente deux points d'extension :

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Utilisé pour enregistrer des « contributions » RunJS. Les cas d'utilisation typiques incluent :

- Ajouter/remplacer les mappages `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, y compris les `scenes`).
- Étendre `RunJSDocMeta` (descriptions/exemples/modèles de complétion pour l'API `ctx`) pour `FlowRunJSContext` ou un `RunJSContext` personnalisé.

### Description du comportement

- Les contributions sont exécutées collectivement pendant la phase `setupRunJSContexts()`.
- Si `setupRunJSContexts()` est déjà terminé, **les enregistrements tardifs seront exécutés immédiatement** (pas besoin de relancer la configuration).
- Chaque contribution sera exécutée **au plus une fois** pour chaque `RunJSVersion`.

### Exemple : Ajout d'un contexte de modèle scriptable en JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Documentation/complétion ctx (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'Contexte RunJS MyPlugin',
    properties: {
      myPlugin: {
        description: 'Espace de noms de mon plugin',
        detail: 'object',
        properties: {
          hello: {
            description: 'Dire bonjour',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Mappage modèle -> contexte (la scène affecte la complétion de l'éditeur et le filtrage des snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Utilisé pour enregistrer des extraits de code (snippets) d'exemple pour RunJS, utilisés pour :

- La complétion de snippets dans CodeEditor.
- Servir d'exemples/matériel de référence pour le codage par IA (peut être filtré par scène/version/langue).

### Nommage ref recommandé

Il est suggéré d'utiliser : `plugin/<pluginName>/<topic>`, par exemple :

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Évitez les conflits avec les espaces de noms `global/*` ou `scene/*` du cœur (core).

### Stratégie de conflit

- Par défaut, les entrées `ref` existantes ne sont pas écrasées (retourne `false` sans lever d'erreur).
- Pour écraser explicitement, passez `{ override: true }`.

### Exemple : Enregistrement d'un snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Bonjour (Mon Plugin)',
    description: 'Exemple minimal pour mon plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Snippet de mon plugin
ctx.message.success('Bonjour depuis le plugin');
`,
  },
}));
```

## 3. Bonnes pratiques

- **Maintenance par couches de la documentation + snippets** :
  - `RunJSDocMeta` : Descriptions/modèles de complétion (courts, structurés).
  - Snippets : Exemples longs (réutilisables, filtrables par scène/version).
- **Éviter une longueur excessive des prompts** : Les exemples doivent être concis ; privilégiez les « modèles minimaux exécutables ».
- **Priorité des scènes** : Si votre code JS s'exécute principalement dans des scénarios tels que des formulaires ou des tableaux, assurez-vous que le champ `scenes` est correctement rempli pour améliorer la pertinence des complétions et des exemples.

## 4. Masquer les complétions basées sur le ctx réel : `hidden(ctx)`

Certaines API `ctx` sont très spécifiques au contexte (par exemple, `ctx.popup` n'est disponible que lorsqu'une fenêtre contextuelle ou un tiroir est ouvert). Si vous souhaitez masquer ces API indisponibles lors de la complétion, vous pouvez définir `hidden(ctx)` pour l'entrée correspondante dans `RunJSDocMeta` :

- Retourne `true` : Masque le nœud actuel et sa sous-arborescence.
- Retourne `string[]` : Masque des sous-chemins spécifiques sous le nœud actuel (prend en charge le retour de plusieurs chemins ; les chemins sont relatifs ; les sous-arborescences sont masquées en fonction de la correspondance de préfixe).

`hidden(ctx)` prend en charge `async` : vous pouvez utiliser `await ctx.getVar('ctx.xxx')` pour déterminer la visibilité (à la discrétion de l'utilisateur). Il est recommandé de garder cette logique rapide et sans effets secondaires (par exemple, éviter les requêtes réseau).

Exemple : Afficher les complétions `ctx.popup.*` uniquement lorsque `popup.uid` existe.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Contexte de popup (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'UID de la popup',
      },
    },
  },
});
```

Exemple : La popup est disponible mais certains sous-chemins sont masqués (chemins relatifs uniquement ; par exemple, masquer `record` et `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Contexte de popup (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'UID de la popup',
        record: 'Enregistrement de la popup',
        parent: {
          properties: {
            record: 'Enregistrement parent',
          },
        },
      },
    },
  },
});
```

Remarque : CodeEditor active toujours le filtrage de complétion basé sur le `ctx` réel (mode « fail-open », ne lève pas d'erreurs).

## 5. `info/meta` d'exécution et API d'information de contexte (pour les complétions et les LLM)

En plus de maintenir la documentation `ctx` de manière statique via `FlowRunJSContext.define()`, vous pouvez également injecter des **info/meta** au moment de l'exécution via `FlowContext.defineProperty/defineMethod`. Vous pouvez ensuite extraire des informations de contexte **sérialisables** pour CodeEditor ou les LLM en utilisant les API suivantes :

- `await ctx.getApiInfos(options?)` : Informations statiques sur l'API.
- `await ctx.getVarInfos(options?)` : Informations sur la structure des variables (provenant de `meta`, prend en charge l'expansion par chemin/profondeur maximale).
- `await ctx.getEnvInfos()` : Instantané de l'environnement d'exécution.

### 5.1 `defineMethod(name, fn, info?)`

`info` prend en charge (tous facultatifs) :

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (style JSDoc)

> Remarque : `getApiInfos()` produit une documentation d'API statique et n'inclura pas de champs tels que `deprecated`, `disabled` ou `disabledReason`.

Exemple : Fournir des liens de documentation pour `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Actualiser les données des blocs cibles',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta` : Utilisé pour l'interface utilisateur du sélecteur de variables (`getPropertyMetaTree` / `FlowContextSelector`). Il détermine la visibilité, la structure de l'arborescence, la désactivation, etc. (prend en charge les fonctions/async).
  - Champs communs : `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info` : Utilisé pour la documentation statique de l'API (`getApiInfos`) et les descriptions pour les LLM. Il n'affecte pas l'interface utilisateur du sélecteur de variables (prend en charge les fonctions/async).
  - Champs communs : `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Lorsque seul `meta` est fourni (sans `info`) :

- `getApiInfos()` ne retournera pas cette clé (car les docs d'API statiques ne sont pas déduites de `meta`).
- `getVarInfos()` construira la structure de la variable basée sur `meta` (utilisé pour les sélecteurs de variables/arborescences de variables dynamiques).

### 5.3 API d'information de contexte

Utilisée pour extraire les « informations sur les capacités de contexte disponibles ».

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Peut être utilisé directement dans await ctx.getVar(getVar), recommandé de commencer par "ctx."
  value?: any; // Valeur statique résolue (sérialisable, retournée uniquement si déductible)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Documentation statique (niveau supérieur)
type FlowContextVarInfos = Record<string, any>; // Structure des variables (extensible par chemin/profondeur maximale)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Paramètres communs :

- `getApiInfos({ version })` : Version de la documentation RunJS (par défaut `v1`).
- `getVarInfos({ path, maxDepth })` : Découpage et profondeur d'expansion maximale (par défaut 3).

Remarque : Les résultats retournés par les API ci-dessus ne contiennent pas de fonctions et conviennent à une sérialisation directe vers les LLM.

### 5.4 `await ctx.getVar(path)`

Lorsque vous disposez d'une « chaîne de chemin de variable » (par exemple, provenant de la configuration ou d'une saisie utilisateur) et que vous souhaitez récupérer directement la valeur d'exécution de cette variable, utilisez `getVar` :

- Exemple : `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` est un chemin d'expression commençant par `ctx.` (par exemple, `ctx.record.id` / `ctx.record.roles[0].id`).

De plus : les méthodes ou propriétés commençant par un souligné `_` sont traitées comme des membres privés et n'apparaîtront pas dans la sortie de `getApiInfos()` ou `getVarInfos()`.