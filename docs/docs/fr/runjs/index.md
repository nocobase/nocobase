:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/index).
:::

# Présentation de RunJS

RunJS est l'environnement d'exécution JavaScript utilisé dans NocoBase pour des scénarios tels que les **blocs JS**, les **champs JS** et les **actions JS**. Le code s'exécute dans un bac à sable (sandbox) restreint, offrant un accès sécurisé à l'API `ctx` (contexte) et dispose des capacités suivantes :

- `await` au niveau supérieur (Top-level `await`)
- Importation de modules externes
- Rendu à l'intérieur des conteneurs
- Variables globales

## `await` au niveau supérieur (Top-level `await`)

RunJS prend en charge l' `await` au niveau supérieur, éliminant ainsi le besoin d'envelopper le code dans une IIFE.

**Non recommandé**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Recommandé**

```js
async function test() {}
await test();
```

## Importation de modules externes

- Utilisez `ctx.importAsync()` pour les modules ESM (recommandé)
- Utilisez `ctx.requireAsync()` pour les modules UMD/AMD

## Rendu à l'intérieur des conteneurs

Utilisez `ctx.render()` pour restituer du contenu dans le conteneur actuel (`ctx.element`). Il prend en charge les trois formats suivants :

### Rendu JSX

```jsx
ctx.render(<button>Bouton</button>);
```

### Rendu de nœuds DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Rendu de chaînes HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Variables globales

- `window`
- `document`
- `navigator`
- `ctx`