:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Colonne JS

## Introduction

La colonne JS est utilisée pour les « colonnes personnalisées » dans les tableaux, permettant de rendre le contenu de chaque cellule d'une ligne via JavaScript. Elle n'est pas liée à un champ spécifique et convient parfaitement aux scénarios tels que les colonnes dérivées, les affichages combinés de plusieurs champs, les badges de statut, les boutons d'action et l'agrégation de données distantes.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API de Contexte d'Exécution

Lors du rendu de chaque cellule, la colonne JS met à votre disposition les API de contexte suivantes :

-   `ctx.element` : Le conteneur DOM de la cellule actuelle (ElementProxy), prenant en charge `innerHTML`, `querySelector`, `addEventListener`, etc. ;
-   `ctx.record` : L'objet d'enregistrement de la ligne actuelle (lecture seule) ;
-   `ctx.recordIndex` : L'index de la ligne dans la page actuelle (commence à 0, peut être affecté par la pagination) ;
-   `ctx.collection` : Les métadonnées de la collection liée au tableau (lecture seule) ;
-   `ctx.requireAsync(url)` : Charge de manière asynchrone une bibliothèque AMD/UMD via une URL ;
-   `ctx.importAsync(url)` : Importe dynamiquement un module ESM via une URL ;
-   `ctx.openView(options)` : Ouvre une vue configurée (modale/tiroir/page) ;
-   `ctx.i18n.t()` / `ctx.t()` : Internationalisation ;
-   `ctx.onRefReady(ctx.ref, cb)` : Effectue le rendu une fois le conteneur prêt ;
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` : Les bibliothèques intégrées React, ReactDOM, Ant Design, les icônes Ant Design et dayjs, utilisées pour le rendu JSX et les utilitaires de date/heure. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sont conservées pour la compatibilité.)
-   `ctx.render(vnode)` : Rend un élément React/HTML/DOM dans le conteneur par défaut `ctx.element` (la cellule actuelle). Plusieurs rendus réutiliseront la racine et écraseront le contenu existant du conteneur.

## Éditeur et Snippets

L'éditeur de script de la colonne JS prend en charge la coloration syntaxique, les indications d'erreur et les extraits de code (snippets) intégrés.

-   `Snippets` : Ouvre la liste des extraits de code intégrés, vous permettant de les rechercher et de les insérer à la position actuelle du curseur en un seul clic.
-   `Run` : Exécute directement le code actuel. Le journal d'exécution est affiché dans le panneau `Logs` en bas, prenant en charge `console.log/info/warn/error` et la mise en évidence des erreurs.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Vous pouvez également utiliser un employé IA pour générer du code :

-   [Employé IA · Nathan : Ingénieur Frontend](/ai-employees/built-in/ai-coding)

## Cas d'utilisation courants

### 1) Rendu de base (lecture de l'enregistrement de la ligne actuelle)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Utilisation de JSX pour rendre des composants React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Ouverture d'une modale/d'un tiroir depuis une cellule (Afficher/Modifier)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Afficher</a>
);
```

### 4) Chargement de bibliothèques tierces (AMD/UMD ou ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Remarques importantes

-   Il est recommandé d'utiliser un CDN de confiance pour le chargement des bibliothèques externes et de prévoir un mécanisme de secours en cas d'échec (par exemple, `if (!lib) return;`).
-   Il est conseillé de privilégier les sélecteurs `class` ou `[name=...]` plutôt que des `id` fixes, afin d'éviter les doublons d'`id` dans plusieurs blocs ou modales.
-   Nettoyage des événements : Les lignes de tableau peuvent changer dynamiquement avec la pagination ou l'actualisation, entraînant plusieurs rendus des cellules. Vous devez nettoyer ou dédupliquer les écouteurs d'événements avant de les lier pour éviter les déclenchements répétés.
-   Conseil de performance : Évitez de charger des bibliothèques volumineuses à plusieurs reprises dans chaque cellule. Mieux vaut mettre en cache la bibliothèque à un niveau supérieur (par exemple, via une variable globale ou de niveau tableau) et la réutiliser.