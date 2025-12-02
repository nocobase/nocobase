:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Bloc JS

## Introduction

Le Bloc JS est un "bloc de rendu personnalisé" très flexible qui vous permet d'écrire directement du code JavaScript pour générer des interfaces, lier des événements, appeler des API de données ou intégrer des bibliothèques tierces. Il est idéal pour les visualisations personnalisées, les expérimentations temporaires et les scénarios d'extension légers que les blocs intégrés ne peuvent pas couvrir.

## API du contexte d'exécution

Le contexte d'exécution du Bloc JS intègre des fonctionnalités courantes que vous pouvez utiliser directement :

- `ctx.element` : Le conteneur DOM du bloc (encapsulé de manière sécurisée en tant qu'ElementProxy), prenant en charge `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.requireAsync(url)` : Charge de manière asynchrone une bibliothèque AMD/UMD via une URL.
- `ctx.importAsync(url)` : Importe dynamiquement un module ESM via une URL.
- `ctx.openView` : Ouvre une vue configurée (fenêtre modale/tiroir latéral/page).
- `ctx.useResource(...)` + `ctx.resource` : Accède aux données en tant que ressource.
- `ctx.i18n.t()` / `ctx.t()` : Fonctionnalité d'internationalisation intégrée.
- `ctx.onRefReady(ctx.ref, cb)` : Effectue le rendu une fois le conteneur prêt pour éviter les problèmes de synchronisation.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` : Bibliothèques génériques intégrées telles que React, ReactDOM, Ant Design, les icônes Ant Design et dayjs, utilisées pour le rendu JSX et la gestion des dates/heures. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sont conservés pour des raisons de compatibilité.)
- `ctx.render(vnode)` : Rend un élément React, une chaîne HTML ou un nœud DOM dans le conteneur par défaut `ctx.element`. Les appels multiples réutilisent la même racine React et écrasent le contenu existant du conteneur.

## Ajout d'un bloc

Vous pouvez ajouter un Bloc JS à une page ou à une fenêtre modale.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Éditeur et extraits de code

L'éditeur de script du Bloc JS prend en charge la coloration syntaxique, les indications d'erreur et les extraits de code (Snippets) intégrés, vous permettant d'insérer rapidement des exemples courants tels que le rendu de graphiques, la liaison d'événements de bouton, le chargement de bibliothèques externes, le rendu de composants React/Vue, les chronologies, les cartes d'information, etc.

- `Snippets` : Ouvre la liste des extraits de code intégrés. Vous pouvez rechercher et insérer un extrait sélectionné dans l'éditeur de code à la position actuelle du curseur en un seul clic.
- `Run` : Exécute directement le code de l'éditeur actuel et affiche les journaux d'exécution dans le panneau `Logs` en bas. Il prend en charge l'affichage de `console.log/info/warn/error`, et les erreurs sont mises en évidence avec la possibilité de les localiser à la ligne et à la colonne spécifiques.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

De plus, vous pouvez directement invoquer l'employé IA "Ingénieur Frontend · Nathan" depuis le coin supérieur droit de l'éditeur. Nathan peut vous aider à écrire ou à modifier des scripts en fonction du contexte actuel. Vous pouvez ensuite "Apply to editor" (Appliquer à l'éditeur) en un clic et exécuter le code pour en voir l'effet. Pour plus de détails, consultez :

- [Employé IA · Nathan : Ingénieur Frontend](/ai-employees/built-in/ai-coding)

## Environnement d'exécution et sécurité

- **Conteneur** : Le système fournit un conteneur DOM sécurisé `ctx.element` (ElementProxy) pour le script, qui n'affecte que le bloc actuel et n'interfère pas avec les autres zones de la page.
- **Bac à sable** : Le script s'exécute dans un environnement contrôlé. `window`/`document`/`navigator` utilisent des objets proxy sécurisés, permettant l'utilisation des API courantes tout en restreignant les comportements à risque.
- **Re-rendu** : Le bloc se re-rend automatiquement lorsqu'il est masqué puis affiché à nouveau (pour éviter de réexécuter le script de montage initial).

## Cas d'utilisation courants (exemples simplifiés)

### 1) Rendre React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Modèle de requête API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Charger ECharts et effectuer le rendu

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Ouvrir une vue (tiroir latéral)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Lire une ressource et rendre du JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Notes

- Il est recommandé d'utiliser des CDN fiables pour charger des bibliothèques externes.
- **Conseils d'utilisation des sélecteurs** : Privilégiez l'utilisation des sélecteurs de classe (`class`) ou d'attribut (`[name=...]`). Évitez d'utiliser des `id` fixes pour prévenir les conflits de styles ou d'événements en cas de `id` dupliqués dans plusieurs blocs ou fenêtres modales.
- **Nettoyage des événements** : Le bloc pouvant être re-rendu plusieurs fois, les écouteurs d'événements doivent être nettoyés ou dédupliqués avant d'être liés pour éviter les déclenchements répétés. Vous pouvez adopter une approche "supprimer puis ajouter", utiliser un écouteur à usage unique, ou ajouter un drapeau pour éviter les doublons.

## Documentation connexe

- [Variables et contexte](/interface-builder/variables)
- [Règles de liaison](/interface-builder/linkage-rule)
- [Vues et fenêtres modales](/interface-builder/actions/types/view)