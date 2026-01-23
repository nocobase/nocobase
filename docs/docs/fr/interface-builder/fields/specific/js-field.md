:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champ JS

## Introduction

Le Champ JS permet de personnaliser le rendu du contenu à l'emplacement d'un champ en utilisant JavaScript. On le trouve fréquemment dans les blocs de détails, les éléments en lecture seule des formulaires, ou comme « Autres éléments personnalisés » dans les colonnes de tableau. Il est idéal pour des affichages personnalisés, la combinaison d'informations dérivées, le rendu de badges de statut, de texte enrichi ou de graphiques.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Types

- **En lecture seule** : Utilisé pour un affichage non modifiable, il lit `ctx.value` pour générer le rendu.
- **Modifiable** : Utilisé pour des interactions d'entrée personnalisées. Il fournit `ctx.getValue()`/`ctx.setValue(v)` et un événement de conteneur `js-field:value-change`, facilitant la synchronisation bidirectionnelle avec les valeurs du formulaire.

## Cas d'utilisation

- **En lecture seule**
  - **Bloc de détails** : Affichage de contenu en lecture seule tel que des résultats de calcul, des badges de statut, des extraits de texte enrichi, des graphiques, etc.
  - **Bloc de tableau** : Utilisé comme « Autre colonne personnalisée > Champ JS » pour un affichage en lecture seule. (Si vous avez besoin d'une colonne non liée à un champ, veuillez utiliser la [Colonne JS](#)).

- **Modifiable**
  - **Bloc de formulaire (CreateForm/EditForm)** : Utilisé pour des contrôles de saisie personnalisés ou des entrées composites, qui sont validés et soumis avec le formulaire.
  - **Convient aux scénarios tels que** : composants d'entrée de bibliothèques externes, éditeurs de texte enrichi/code, composants dynamiques complexes, etc.

## API de contexte d'exécution

Le code d'exécution du Champ JS peut directement utiliser les capacités de contexte suivantes :

- `ctx.element` : Le conteneur DOM du champ (ElementProxy), supportant `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.value` : La valeur actuelle du champ (en lecture seule).
- `ctx.record` : L'objet enregistrement actuel (en lecture seule).
- `ctx.collection` : Les métadonnées de la **collection** à laquelle le champ appartient (en lecture seule).
- `ctx.requireAsync(url)` : Charge une bibliothèque AMD/UMD de manière asynchrone via une URL.
- `ctx.importAsync(url)` : Importe dynamiquement un module ESM via une URL.
- `ctx.openView(options)` : Ouvre une vue configurée (fenêtre contextuelle/tiroir/page).
- `ctx.i18n.t()` / `ctx.t()` : Internationalisation.
- `ctx.onRefReady(ctx.ref, cb)` : Effectue le rendu une fois le conteneur prêt.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` : Bibliothèques génériques intégrées telles que React, ReactDOM, Ant Design, Ant Design Icons et dayjs, utilisées pour le rendu JSX et la gestion du temps. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sont conservés pour la compatibilité.)
- `ctx.render(vnode)` : Rend un élément React, une chaîne HTML ou un nœud DOM dans le conteneur par défaut `ctx.element`. Un rendu répété réutilisera le Root et écrasera le contenu existant du conteneur.

Spécifique au type modifiable (JSEditableField) :

- `ctx.getValue()` : Récupère la valeur actuelle du formulaire (priorise l'état du formulaire, puis revient aux props du champ).
- `ctx.setValue(v)` : Définit la valeur du formulaire et les props du champ, en maintenant une synchronisation bidirectionnelle.
- Événement de conteneur `js-field:value-change` : Déclenché lorsque la valeur externe change, ce qui facilite la mise à jour de l'affichage de l'entrée par le script.

## Éditeur et extraits de code

L'éditeur de script du Champ JS prend en charge la coloration syntaxique, les indications d'erreurs et les extraits de code (Snippets) intégrés.

- `Snippets` : Ouvre une liste d'extraits de code intégrés, qui peuvent être recherchés et insérés en un clic à la position actuelle du curseur.
- `Run` : Exécute directement le code actuel. Le journal d'exécution est affiché dans le panneau `Logs` en bas, supportant `console.log/info/warn/error` et la mise en évidence des erreurs pour une localisation facile.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Vous pouvez également générer du code avec l'employé IA :

- [Employé IA · Nathan : Ingénieur Frontend](/ai-employees/built-in/ai-coding)

## Utilisations courantes

### 1) Rendu de base (lecture de la valeur du champ)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Utilisation de JSX pour rendre un composant React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Chargement de bibliothèques tierces (AMD/UMD ou ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Clic pour ouvrir une fenêtre contextuelle/un tiroir (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Voir les détails</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Saisie modifiable (JSEditableFieldModel)

```js
// Rend un simple champ de saisie en utilisant JSX et synchronise la valeur du formulaire
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Synchronise l'entrée lorsque la valeur externe change (facultatif)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Remarques

- Il est recommandé d'utiliser un CDN de confiance pour charger les bibliothèques externes et de prévoir un mécanisme de repli en cas d'échec (par exemple, `if (!lib) return;`).
- Pour les sélecteurs, il est conseillé de privilégier l'utilisation de `class` ou `[name=...]` et d'éviter les `id` fixes afin de prévenir les doublons d' `id` dans plusieurs blocs ou fenêtres contextuelles.
- Nettoyage des événements : Un champ peut être rendu plusieurs fois en raison de changements de données ou de basculements de vue. Avant de lier un événement, vous devez le nettoyer ou le dédupliquer pour éviter les déclenchements répétés. Vous pouvez « d'abord supprimer, puis ajouter ».