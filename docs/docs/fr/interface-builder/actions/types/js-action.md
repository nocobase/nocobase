:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/actions/types/js-action).
:::

# JS Action

## Introduction

JS Action est utilisé pour exécuter du JavaScript lors du clic sur un bouton, permettant de personnaliser n'importe quel comportement métier. Il peut être utilisé dans les barres d'outils de formulaire, les barres d'outils de tableau (au niveau de la collection), les lignes de tableau (au niveau de l'enregistrement) et d'autres emplacements pour réaliser des opérations telles que la validation, les messages, les appels d'interface, l'ouverture de fenêtres contextuelles/tiroirs, l'actualisation des données, etc.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API de contexte d'exécution (couramment utilisées)

- `ctx.api.request(options)` : Effectue une requête HTTP ;
- `ctx.openView(viewUid, options)` : Ouvre une vue configurée (tiroir/boîte de dialogue/page) ;
- `ctx.message` / `ctx.notification` : Messages et notifications globaux ;
- `ctx.t()` / `ctx.i18n.t()` : Internationalisation ;
- `ctx.resource` : Ressource de données du contexte au niveau de la collection (par exemple, barre d'outils de tableau, incluant `getSelectedRows()`, `refresh()`, etc.) ;
- `ctx.record` : Enregistrement de la ligne actuelle du contexte au niveau de l'enregistrement (par exemple, bouton de ligne de tableau) ;
- `ctx.form` : Instance AntD Form du contexte au niveau du formulaire (par exemple, bouton de barre d'outils de formulaire) ;
- `ctx.collection` : Méta-informations de la collection actuelle ;
- L'éditeur de code prend en charge les extraits `Snippets` et la pré-exécution `Run` (voir ci-dessous).


- `ctx.requireAsync(url)` : Charge de manière asynchrone une bibliothèque AMD/UMD via une URL ;
- `ctx.importAsync(url)` : Importe dynamiquement un module ESM via une URL ;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula` : Bibliothèques intégrées telles que React, ReactDOM, Ant Design, icônes Ant Design, dayjs, lodash, math.js et formula.js, utilisées pour le rendu JSX, le traitement du temps, la manipulation de données et les calculs mathématiques.

> Les variables réellement disponibles varient en fonction de l'emplacement du bouton ; ce qui précède est un aperçu des capacités courantes.

## Éditeur et extraits de code

- `Snippets` : Ouvre la liste des extraits de code intégrés, permet de rechercher et d'insérer en un clic à la position actuelle du curseur.
- `Run` : Exécute directement le code actuel et affiche les journaux d'exécution dans le panneau `Logs` en bas ; prend en charge `console.log/info/warn/error` et la localisation des erreurs par surbrillance.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Vous pouvez utiliser les employés IA pour générer/modifier des scripts : [Employé IA · Nathan : Ingénieur Frontend](/ai-employees/features/built-in-employee)

## Cas d'utilisation courants (exemples simplifiés)

### 1) Requête d'interface et messages

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Bouton de collection : valider la sélection et traiter

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO : Exécuter la logique métier…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Bouton d'enregistrement : lire l'enregistrement de la ligne actuelle

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Ouvrir une vue (tiroir/boîte de dialogue)

```js
const popupUid = ctx.model.uid + '-open'; // Lié au bouton actuel pour la stabilité
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Actualiser les données après soumission

```js
// Actualisation générale : priorité aux ressources de tableau/liste, puis à la ressource du bloc où se trouve le formulaire
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Remarques

- Idempotence du comportement : Évitez les soumissions multiples causées par des clics répétés ; vous pouvez ajouter un commutateur d'état dans la logique ou désactiver le bouton.
- Gestion des erreurs : Ajoutez try/catch pour les appels d'interface et fournissez des messages à l'utilisateur.
- Liaison de vue : Lors de l'ouverture d'une fenêtre contextuelle/tiroir via `ctx.openView`, il est recommandé de passer les paramètres explicitement et, si nécessaire, d'actualiser activement la ressource parente après une soumission réussie.

## Documentation associée

- [Variables et contexte](/interface-builder/variables)
- [Règles de liaison](/interface-builder/linkage-rule)
- [Vues et fenêtres contextuelles](/interface-builder/actions/types/view)