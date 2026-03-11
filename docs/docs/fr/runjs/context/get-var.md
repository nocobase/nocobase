:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/get-var).
:::

# ctx.getVar()

Lit de manière **asynchrone** les valeurs des variables du contexte d'exécution actuel. La résolution des variables est cohérente avec `{{ctx.xxx}}` dans le SQL et les modèles, provenant généralement de l'utilisateur actuel, de l'enregistrement actuel, des paramètres de vue, du contexte de la fenêtre contextuelle (popup), etc.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField** | Obtenir des informations sur l'enregistrement actuel, l'utilisateur, la ressource, etc., pour le rendu ou la logique. |
| **Règles d'interaction / Flux de travail** | Lire `ctx.record`, `ctx.formValues`, etc., pour la logique conditionnelle. |
| **Formules / Modèles** | Utilise les mêmes règles de résolution de variables que `{{ctx.xxx}}`. |

## Définition du type

```ts
getVar(path: string): Promise<any>;
```

| Paramètre | Type | Description |
|------|------|------|
| `path` | `string` | Chemin de la variable ; **doit commencer par `ctx.`**. Supporte la notation par points et les indices de tableau. |

**Valeur de retour** : `Promise<any>`. Utilisez `await` pour obtenir la valeur résolue ; retourne `undefined` si la variable n'existe pas.

> Si un chemin ne commençant pas par `ctx.` est passé, une erreur sera levée : `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Chemins de variables courants

| Chemin | Description |
|------|------|
| `ctx.record` | Enregistrement actuel (disponible lorsqu'un bloc de formulaire/détails est lié à un enregistrement) |
| `ctx.record.id` | Clé primaire de l'enregistrement actuel |
| `ctx.formValues` | Valeurs du formulaire actuel (couramment utilisé dans les règles d'interaction et les flux de travail ; dans les scénarios de formulaire, préférez `ctx.form.getFieldsValue()` pour une lecture en temps réel) |
| `ctx.user` | Utilisateur actuellement connecté |
| `ctx.user.id` | ID de l'utilisateur actuel |
| `ctx.user.nickname` | Pseudonyme de l'utilisateur actuel |
| `ctx.user.roles.name` | Noms des rôles de l'utilisateur actuel (tableau) |
| `ctx.popup.record` | Enregistrement à l'intérieur d'une fenêtre contextuelle (popup) |
| `ctx.popup.record.id` | Clé primaire de l'enregistrement dans une fenêtre contextuelle |
| `ctx.urlSearchParams` | Paramètres de requête URL (analysés à partir de `?key=value`) |
| `ctx.token` | Jeton API actuel |
| `ctx.role` | Rôle actuel |

## ctx.getVarInfos()

Obtient les **informations structurelles** (type, titre, sous-propriétés, etc.) des variables résolvables dans le contexte actuel, facilitant l'exploration des chemins disponibles. La valeur de retour est une description statique basée sur `meta` et n'inclut pas les valeurs d'exécution réelles.

### Définition du type

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Dans la valeur de retour, chaque clé est un chemin de variable, et la valeur est l'information structurelle pour ce chemin (incluant `type`, `title`, `properties`, etc.).

### Paramètres

| Paramètre | Type | Description |
|------|------|------|
| `path` | `string \| string[]` | Chemin de troncature ; collecte uniquement la structure de la variable sous ce chemin. Supporte `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'` ; un tableau représente la fusion de plusieurs chemins. |
| `maxDepth` | `number` | Profondeur maximale d'expansion, par défaut `3`. Lorsque `path` n'est pas fourni, les propriétés de premier niveau ont une profondeur `depth=1`. Lorsque `path` est fourni, le nœud correspondant au chemin a une profondeur `depth=1`. |

### Exemple

```ts
// Obtenir la structure des variables sous record (développée jusqu'à 3 niveaux)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Obtenir la structure de popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Obtenir la structure complète des variables de premier niveau (maxDepth=3 par défaut)
const vars = await ctx.getVarInfos();
```

## Différence avec ctx.getValue

| Méthode | Scénario | Description |
|------|----------|------|
| `ctx.getValue()` | Champs modifiables comme JSField ou JSItem | Récupère de manière synchrone la valeur du **champ actuel** ; nécessite une liaison au formulaire. |
| `ctx.getVar(path)` | N'importe quel contexte RunJS | Récupère de manière asynchrone **n'importe quelle variable ctx** ; le chemin doit commencer par `ctx.`. |

Dans un JSField, utilisez `getValue`/`setValue` pour lire/écrire le champ actuel ; utilisez `getVar` pour accéder aux autres variables de contexte (telles que `record`, `user`, `formValues`).

## Remarques

- **Le chemin doit commencer par `ctx.`** : par exemple, `ctx.record.id`, sinon une erreur sera levée.
- **Méthode asynchrone** : Vous devez utiliser `await` pour obtenir le résultat, par exemple, `const id = await ctx.getVar('ctx.record.id')`.
- **Variable inexistante** : Retourne `undefined`. Vous pouvez utiliser `??` après le résultat pour définir une valeur par défaut : `(await ctx.getVar('ctx.user.nickname')) ?? 'Invité'`.
- **Valeurs de formulaire** : `ctx.formValues` doit être récupéré via `await ctx.getVar('ctx.formValues')` ; il n'est pas directement exposé en tant que `ctx.formValues`. Dans un contexte de formulaire, préférez utiliser `ctx.form.getFieldsValue()` pour lire les dernières valeurs en temps réel.

## Exemples

### Obtenir l'ID de l'enregistrement actuel

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Enregistrement actuel : ${recordId}`);
}
```

### Obtenir l'enregistrement dans une fenêtre contextuelle (popup)

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Enregistrement de la popup actuelle : ${recordId}`);
}
```

### Lire les sous-éléments d'un champ de type tableau

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Retourne un tableau de noms de rôles, ex: ['admin', 'member']
```

### Définir une valeur par défaut

```ts
// getVar n'a pas de paramètre defaultValue ; utilisez ?? après le résultat
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Invité';
```

### Lire les valeurs des champs de formulaire

```ts
// ctx.formValues et ctx.form concernent tous deux les scénarios de formulaire ; utilisez getVar pour lire les champs imbriqués
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Lire les paramètres de requête URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Correspond à ?id=xxx
```

### Explorer les variables disponibles

```ts
// Obtenir la structure des variables sous record (développée jusqu'à 3 niveaux)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars ressemble à { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Voir aussi

- [ctx.getValue()](./get-value.md) - Récupère de manière synchrone la valeur du champ actuel (JSField/JSItem uniquement)
- [ctx.form](./form.md) - Instance de formulaire ; `ctx.form.getFieldsValue()` peut lire les valeurs du formulaire en temps réel
- [ctx.model](./model.md) - Le modèle où réside le contexte d'exécution actuel
- [ctx.blockModel](./block-model.md) - Le bloc parent où se trouve le JS actuel
- [ctx.resource](./resource.md) - L'instance de ressource dans le contexte actuel
- `{{ctx.xxx}}` dans SQL / Modèles - Utilise les mêmes règles de résolution que `ctx.getVar('ctx.xxx')`