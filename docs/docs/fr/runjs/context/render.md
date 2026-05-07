:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/render).
:::

# ctx.render()

Rend des éléments React, des chaînes HTML ou des nœuds DOM dans un conteneur spécifié. Si le paramètre `container` n'est pas fourni, le rendu s'effectue par défaut dans `ctx.element` et hérite automatiquement du contexte de l'application, tel que le ConfigProvider et les thèmes.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock** | Rendu du contenu personnalisé d'un bloc (graphiques, listes, cartes, etc.) |
| **JSField / JSItem / JSColumn** | Rendu d'affichages personnalisés pour des champs modifiables ou des colonnes de tableau |
| **Bloc de détails** | Personnalisation du format d'affichage des champs dans les pages de détails |

> Remarque : `ctx.render()` nécessite un conteneur de rendu. Si `container` n'est pas transmis et que `ctx.element` n'existe pas (par exemple, dans des scénarios de logique pure sans interface utilisateur), une erreur sera générée.

## Définition du type

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Paramètre | Type | Description |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Contenu à rendre |
| `container` | `Element` \| `DocumentFragment` (Optionnel) | Conteneur de rendu cible, par défaut `ctx.element` |

**Valeur de retour** :

- Lors du rendu d'un **élément React** : Retourne `ReactDOMClient.Root`, facilitant l'appel ultérieur à `root.render()` pour les mises à jour.
- Lors du rendu d'une **chaîne HTML** ou d'un **nœud DOM** : Retourne `null`.

## Description du type vnode

| Type | Comportement |
|------|------|
| `React.ReactElement` (JSX) | Rendu via le `createRoot` de React, offrant toutes les capacités de React et héritant automatiquement du contexte de l'application. |
| `string` | Définit l' `innerHTML` du conteneur après nettoyage avec DOMPurify ; toute racine React existante sera d'abord démontée. |
| `Node` (Élément, Texte, etc.) | Ajout via `appendChild` après avoir vidé le conteneur ; toute racine React existante sera d'abord démontée. |
| `DocumentFragment` | Ajout des nœuds enfants du fragment au conteneur ; toute racine React existante sera d'abord démontée. |

## Exemples

### Rendu d'éléments React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Titre')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Cliqué'))}>
      {ctx.t('Bouton')}
    </Button>
  </Card>
);
```

### Rendu de chaînes HTML

```ts
ctx.render('<h1>Hello World</h1>');

// Combinaison avec ctx.t pour l'internationalisation
ctx.render('<div style="padding:16px">' + ctx.t('Contenu') + '</div>');

// Rendu conditionnel
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### Rendu de nœuds DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Rendre d'abord un conteneur vide, puis le confier à une bibliothèque tierce (ex: ECharts) pour l'initialisation
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Spécification d'un conteneur personnalisé

```ts
// Rendu vers un élément DOM spécifique
const customEl = document.getElementById('my-container');
ctx.render(<div>Contenu</div>, customEl);
```

### Les appels multiples remplacent le contenu

```ts
// Le second appel remplacera le contenu existant dans le conteneur
ctx.render(<div>Premier</div>);
ctx.render(<div>Second</div>);  // Seul "Second" sera affiché
```

## Remarques

- **Les appels multiples remplacent le contenu** : Chaque appel à `ctx.render()` remplace le contenu existant dans le conteneur au lieu de s'y ajouter.
- **Sécurité des chaînes HTML** : Le HTML transmis est nettoyé via DOMPurify pour réduire les risques XSS, mais il est tout de même recommandé d'éviter la concaténation d'entrées utilisateur non fiables.
- **Ne pas manipuler ctx.element directement** : `ctx.element.innerHTML` est obsolète ; `ctx.render()` doit être utilisé systématiquement à la place.
- **Passer un conteneur lorsqu'aucun par défaut n'existe** : Dans les scénarios où `ctx.element` est `undefined` (par exemple, dans des modules chargés via `ctx.importAsync`), un `container` doit être explicitement fourni.

## Relatif

- [ctx.element](./element.md) - Conteneur de rendu par défaut, utilisé lorsqu'aucun conteneur n'est passé à `ctx.render()`.
- [ctx.libs](./libs.md) - Bibliothèques intégrées comme React et Ant Design, utilisées pour le rendu JSX.
- [ctx.importAsync()](./import-async.md) - Utilisé en conjonction avec `ctx.render()` après le chargement à la demande de bibliothèques React ou de composants externes.