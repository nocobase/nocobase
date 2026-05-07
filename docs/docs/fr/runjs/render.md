:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/render).
:::

# Rendu dans le conteneur

Utilisez `ctx.render()` pour effectuer le rendu du contenu dans le conteneur actuel (`ctx.element`). Il prend en charge les trois formes suivantes :

## `ctx.render()`

### Rendu de JSX

```jsx
ctx.render(<button>Button</button>);
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

## Description du JSX

RunJS peut effectuer le rendu du JSX directement. Vous pouvez utiliser les bibliothèques React/composants intégrées ou charger des dépendances externes à la demande.

### Utilisation de React et des bibliothèques de composants intégrées

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Utilisation de React et des bibliothèques de composants externes

Chargez des versions spécifiques à la demande via `ctx.importAsync()` :

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Adapté aux scénarios nécessitant des versions spécifiques ou des composants tiers.

## ctx.element

Utilisation non recommandée (obsolète) :

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Méthode recommandée :

```js
ctx.render(<h1>Hello World</h1>);
```