:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/jsx).
:::

# JSX

RunJS prend en charge la syntaxe JSX, ce qui vous permet d'écrire du code de la même manière que des composants React. Le JSX est automatiquement compilé avant l'exécution.

## Notes de compilation

- Utilise [sucrase](https://github.com/alangpierce/sucrase) pour transformer le JSX.
- Le JSX est compilé en `ctx.libs.React.createElement` et `ctx.libs.React.Fragment`.
- **Pas besoin d'importer React** : vous pouvez écrire du JSX directement ; il utilisera automatiquement `ctx.libs.React` après compilation.
- Lors du chargement d'un React externe via `ctx.importAsync('react@x.x.x')`, le JSX passera à l'utilisation de la méthode `createElement` de cette instance spécifique.

## Utilisation de React et des composants intégrés

RunJS inclut React et des bibliothèques UI courantes de manière intégrée. Vous pouvez y accéder directement via `ctx.libs` sans utiliser `import` :

- **ctx.libs.React** — Le cœur de React
- **ctx.libs.ReactDOM** — ReactDOM (peut être utilisé avec `createRoot` si nécessaire)
- **ctx.libs.antd** — Composants Ant Design
- **ctx.libs.antdIcons** — Icônes Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Cliquez ici</Button>);
```

Lorsque vous écrivez du JSX directement, vous n'avez pas besoin de déstructurer React. Vous ne devez déstructurer à partir de `ctx.libs` que lors de l'utilisation de **Hooks** (tels que `useState`, `useEffect`) ou de **Fragment** (`<>...</>`) :

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Compteur : {count}</div>;
};

ctx.render(<Counter />);
```

**Note** : Le React intégré et le React externe importé via `ctx.importAsync()` **ne peuvent pas être mélangés**. Si vous utilisez une bibliothèque UI externe, React doit également être importé depuis la même source externe.

## Utilisation de React et de composants externes

Lors du chargement d'une version spécifique de React et de bibliothèques UI via `ctx.importAsync()`, le JSX utilisera cette instance de React :

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Cliquez ici</Button>);
```

Si antd dépend de react/react-dom, vous pouvez spécifier la même version via `deps` pour éviter les instances multiples :

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Bouton</Button>);
```

**Note** : Lors de l'utilisation d'un React externe, les bibliothèques UI comme antd doivent également être importées via `ctx.importAsync()`. Ne les mélangez pas avec `ctx.libs.antd`.

## Points clés de la syntaxe JSX

- **Composants et props** : `<Button type="primary">Texte</Button>`
- **Fragment** : `<>...</>` ou `<React.Fragment>...</React.Fragment>` (nécessite la déstructuration `const { React } = ctx.libs` lors de l'utilisation de Fragment)
- **Expressions** : Utilisez `{expression}` dans le JSX pour insérer des variables ou des opérations, comme `{ctx.user.name}` ou `{count + 1}`. N'utilisez pas la syntaxe de template `{{ }}`.
- **Rendu conditionnel** : `{flag && <span>Contenu</span>}` ou `{flag ? <A /> : <B />}`
- **Rendu de liste** : Utilisez `array.map()` pour retourner une liste d'éléments, et assurez-vous que chaque élément possède une `key` stable.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```