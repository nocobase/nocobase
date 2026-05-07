:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/require-async).
:::

# ctx.requireAsync()

Charge de manière asynchrone des scripts **UMD/AMD** ou montés globalement via une URL, ainsi que du **CSS**. Cette méthode est adaptée aux scénarios RunJS nécessitant des bibliothèques UMD/AMD telles que ECharts, Chart.js, FullCalendar (version UMD) ou des plugins jQuery. Si une bibliothèque propose également une version ESM, privilégiez l'utilisation de [ctx.importAsync()](./import-async.md).

## Scénarios d'utilisation

Peut être utilisé dans n'importe quel scénario RunJS où des scripts UMD/AMD/globaux ou du CSS doivent être chargés à la demande, tels que JSBlock, JSField, JSItem, JSColumn, flux de travail, JSAction, etc. Utilisations typiques : graphiques ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugins jQuery, etc.

## Définition du type

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `url` | `string` | L'adresse du script ou du CSS. Prend en charge le **format abrégé** `<nom-du-paquet>@<version>/<chemin-du-fichier>` (ajoute `?raw` pour obtenir le fichier UMD original lors de la résolution via le CDN ESM) ou une **URL complète**. Charge et injecte les styles si un fichier `.css` est passé. |

## Valeur de retour

- L'objet de la bibliothèque chargée (la première valeur de module du rappel UMD/AMD). De nombreuses bibliothèques UMD s'attachent à l'objet `window` (par exemple, `window.echarts`), la valeur de retour peut donc être `undefined`. Dans ce cas, accédez à la variable globale conformément à la documentation de la bibliothèque.
- Retourne le résultat de `loadCSS` lorsqu'un fichier `.css` est passé.

## Description du format d'URL

- **Chemin abrégé** : par exemple, `echarts@5/dist/echarts.min.js`. Avec le CDN ESM par défaut (esm.sh), il interroge `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Le paramètre `?raw` est utilisé pour récupérer le fichier UMD original au lieu d'un wrapper ESM.
- **URL complète** : n'importe quelle adresse CDN peut être utilisée directement, telle que `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS** : une URL se terminant par `.css` sera chargée et injectée dans la page.

## Différence avec ctx.importAsync()

- **ctx.requireAsync()** : Charge des scripts **UMD/AMD/globaux**. Convient pour ECharts, Chart.js, FullCalendar (UMD), les plugins jQuery, etc. Les bibliothèques s'attachent souvent à `window` après le chargement ; la valeur de retour peut être l'objet de la bibliothèque ou `undefined`.
- **ctx.importAsync()** : Charge des **modules ESM** et retourne l'espace de noms du module. Si une bibliothèque fournit de l'ESM, utilisez `ctx.importAsync()` pour une meilleure sémantique de module et le Tree-shaking.

## Exemples

### Utilisation de base

```javascript
// Chemin abrégé (résolu via le CDN ESM comme ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL complète
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Charger le CSS et l'injecter dans la page
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Graphique ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('La bibliothèque ECharts n\'a pas pu être chargée');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Aperçu des ventes') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Graphique à barres Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js n\'a pas pu être chargé');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Quantité'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Précautions

- **Format de la valeur de retour** : Les méthodes d'exportation UMD varient ; la valeur de retour peut être l'objet de la bibliothèque ou `undefined`. Si elle est `undefined`, accédez-y via `window` selon la documentation de la bibliothèque.
- **Dépendance réseau** : Nécessite un accès au CDN. Dans les environnements réseau internes, vous pouvez pointer vers un service auto-hébergé via la variable **ESM_CDN_BASE_URL**.
- **Choix entre importAsync** : Si une bibliothèque fournit à la fois ESM et UMD, privilégiez `ctx.importAsync()`.

## Voir aussi

- [ctx.importAsync()](./import-async.md) - Charge des modules ESM, adapté à Vue, dayjs (ESM), etc.
- [ctx.render()](./render.md) - Rend des graphiques et d'autres composants dans un conteneur.
- [ctx.libs](./libs.md) - React, antd, dayjs intégrés, etc., aucun chargement asynchrone requis.