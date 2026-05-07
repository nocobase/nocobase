:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/import-modules).
:::

# Importation de modules

Dans RunJS, vous pouvez utiliser deux types de modules : les **modules intégrés** (utilisés directement via `ctx.libs`, sans `import`) et les **modules externes** (chargés à la demande via `ctx.importAsync()` ou `ctx.requireAsync()`).

---

## Modules intégrés - ctx.libs (aucun import requis)

RunJS inclut des bibliothèques courantes accessibles directement via `ctx.libs`. Vous n'avez **pas besoin** d'utiliser `import` ou de chargement asynchrone pour celles-ci.

| Propriété | Description |
|------|------|
| **ctx.libs.React** | React lui-même, utilisé pour le JSX et les Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (peut être utilisé avec `createRoot`, etc.) |
| **ctx.libs.antd** | Bibliothèque de composants Ant Design |
| **ctx.libs.antdIcons** | Icônes Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/) : expressions mathématiques, opérations matricielles, etc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/) : formules de type Excel (SUM, AVERAGE, etc.) |

### Exemple : React et antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Cliquez ici</Button>);
```

### Exemple : ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Exemple : ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Modules externes

Lorsque vous avez besoin de bibliothèques tierces, choisissez la méthode de chargement en fonction du format du module :

- **Modules ESM** → Utilisez `ctx.importAsync()`
- **Modules UMD/AMD** → Utilisez `ctx.requireAsync()`

---

### Importer des modules ESM

Utilisez **`ctx.importAsync()`** pour charger dynamiquement des modules ESM par URL. Cela convient aux blocs JS, aux champs JS, aux actions JS, etc.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url** : Adresse du module ESM. Prend en charge les formats abrégés comme `<nom-du-paquet>@<version>` ou des sous-chemins comme `<nom-du-paquet>@<version>/<chemin-du-fichier>` (ex : `vue@3.4.0`, `lodash@4/lodash.js`). Le préfixe CDN configuré sera ajouté automatiquement. Les URLs complètes sont également prises en charge.
- **Retourne** : L'objet d'espace de noms (namespace) du module résolu.

#### Par défaut : https://esm.sh

Si aucune configuration n'est définie, les formes abrégées utiliseront **https://esm.sh** comme préfixe CDN. Par exemple :

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Équivalent au chargement depuis https://esm.sh/vue@3.4.0
```

#### Service esm.sh auto-hébergé

Si vous avez besoin d'un réseau interne ou d'un CDN auto-hébergé, vous pouvez déployer un service compatible avec le protocole esm.sh et le spécifier via des variables d'environnement :

- **ESM_CDN_BASE_URL** : Adresse de base du CDN ESM (par défaut `https://esm.sh`)
- **ESM_CDN_SUFFIX** : Suffixe optionnel (ex : `/+esm` pour jsDelivr)

Pour l'auto-hébergement, reportez-vous à : [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importer des modules UMD/AMD

Utilisez **`ctx.requireAsync()`** pour charger de manière asynchrone des modules UMD/AMD ou des scripts attachés à l'objet global via une URL.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url** : Prend en charge deux formes :
  - **Chemin abrégé** : `<nom-du-paquet>@<version>/<chemin-du-fichier>`, identique à `ctx.importAsync()`, résolu selon la configuration actuelle du CDN ESM. Lors de la résolution, `?raw` est ajouté pour demander directement le fichier brut (généralement un build UMD). Par exemple, `echarts@5/dist/echarts.min.js` demande en réalité `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (lorsque esm.sh est utilisé par défaut).
  - **URL complète** : Toute adresse CDN complète (ex : `https://cdn.jsdelivr.net/npm/xxx`).
- **Retourne** : L'objet de la bibliothèque chargée (la forme spécifique dépend de la manière dont la bibliothèque exporte son contenu).

Après le chargement, de nombreuses bibliothèques UMD s'attachent à l'objet global (ex : `window.xxx`). Utilisez-les conformément à la documentation de la bibliothèque.

**Exemple**

```ts
// Chemin abrégé (résolu via esm.sh avec ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL complète
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Remarque** : Si une bibliothèque fournit une version ESM, utilisez de préférence `ctx.importAsync()` pour bénéficier d'une meilleure sémantique de module et du Tree-shaking.