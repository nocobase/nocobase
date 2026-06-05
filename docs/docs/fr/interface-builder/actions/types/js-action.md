:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Action JS

## Introduction

L'action JS est utilisée pour exécuter du JavaScript lors du clic sur un bouton, permettant de personnaliser n'importe quel comportement métier. Vous pouvez l'utiliser dans les barres d'outils de formulaire, les barres d'outils de tableau (au niveau de la collection), les lignes de tableau (au niveau de l'enregistrement) et d'autres emplacements pour effectuer des opérations telles que la validation, l'affichage de notifications, les appels d'API, l'ouverture de fenêtres contextuelles/tiroirs et l'actualisation des données.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API de contexte d'exécution (couramment utilisées)

-   `ctx.api.request(options)` : Effectue une requête HTTP.
-   `ctx.openView(viewUid, options)` : Ouvre une vue configurée (tiroir/boîte de dialogue/page).
-   `ctx.message` / `ctx.notification` : Messages et notifications globales.
-   `ctx.t()` / `ctx.i18n.t()` : Internationalisation.
-   `ctx.resource` : Ressource de données pour le contexte au niveau de la **collection** (par exemple, barre d'outils de tableau), incluant des méthodes comme `getSelectedRows()` et `refresh()`.
-   `ctx.record` : L'enregistrement de la ligne actuelle pour le contexte au niveau de l'enregistrement (par exemple, bouton de ligne de tableau).
-   `ctx.form` : L'instance du formulaire AntD pour le contexte au niveau du formulaire (par exemple, bouton de barre d'outils de formulaire).
-   `ctx.collection` : Métadonnées de la **collection** actuelle.
-   L'éditeur de code prend en charge les `Snippets` (extraits de code) et l'exécution préalable (`Run`) (voir ci-dessous).

-   `ctx.requireAsync(url)` : Charge de manière asynchrone une bibliothèque AMD/UMD à partir d'une URL.
-   `ctx.importAsync(url)` : Importe dynamiquement un module ESM à partir d'une URL.

> Les variables réellement disponibles peuvent varier en fonction de l'emplacement du bouton. La liste ci-dessus est un aperçu des capacités courantes.

## Éditeur et extraits de code

-   `Snippets` : Ouvre une liste d'extraits de code intégrés que vous pouvez rechercher et insérer en un clic à la position actuelle du curseur.
-   `Run` : Exécute directement le code actuel et affiche les journaux d'exécution dans le panneau `Logs` en bas. Il prend en charge `console.log/info/warn/error` et la mise en évidence des erreurs pour une localisation facile.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

-   Vous pouvez utiliser les employés IA pour générer/modifier des scripts : [Employé IA · Nathan : Ingénieur Frontend](/ai-employees/built-in/ai-coding)

## Cas d'utilisation courants (exemples simplifiés)

### 1) Requête API et notification

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Requête terminée'));
console.log(ctx.t('Données de réponse :'), resp?.data);
```

### 2) Bouton de collection : Valider la sélection et traiter

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Veuillez sélectionner des enregistrements'));
  return;
}
// TODO: Implémenter la logique métier...
ctx.message.success(ctx.t('{n} éléments sélectionnés', { n: rows.length }));
```

### 3) Bouton d'enregistrement : Lire l'enregistrement de la ligne actuelle

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('Aucun enregistrement'));
} else {
  ctx.message.success(ctx.t('ID de l\'enregistrement : {id}', { id: ctx.record.id }))
}
```

### 4) Ouvrir une vue (tiroir/boîte de dialogue)

```js
const popupUid = ctx.model.uid + '-open'; // Lié au bouton actuel pour la stabilité
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Détails'), size: 'large' });
```

### 5) Actualiser les données après soumission

```js
// Actualisation générale : Priorise les ressources de tableau/liste, puis la ressource du bloc contenant le formulaire
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Remarques

-   **Actions idempotentes** : Pour éviter les soumissions multiples dues à des clics répétés, vous pouvez ajouter un drapeau d'état dans votre logique ou désactiver le bouton.
-   **Gestion des erreurs** : Ajoutez des blocs `try/catch` pour les appels d'API et fournissez un retour d'information convivial à l'utilisateur.
-   **Interaction des vues** : Lorsque vous ouvrez une fenêtre contextuelle/un tiroir avec `ctx.openView`, il est recommandé de passer les paramètres explicitement et, si nécessaire, d'actualiser activement la ressource parente après une soumission réussie.

## Documentation associée

-   [Variables et contexte](/interface-builder/variables)
-   [Règles de liaison](/interface-builder/linkage-rule)
-   [Vues et fenêtres contextuelles](/interface-builder/actions/types/view)