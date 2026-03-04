:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` est l'espace de noms unifié pour les bibliothèques intégrées dans RunJS, contenant des bibliothèques couramment utilisées telles que React, Ant Design, dayjs et lodash. **Aucun `import` ou chargement asynchrone n'est requis** ; elles peuvent être utilisées directement via `ctx.libs.xxx`.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Utilisez React + Ant Design pour restituer l'interface utilisateur, dayjs pour la gestion des dates et lodash pour le traitement des données. |
| **Formule / Calcul** | Utilisez formula ou math pour des formules de type Excel et des opérations d'expressions mathématiques. |
| **Flux de travail / Règles de liaison** | Appelez des bibliothèques utilitaires comme lodash, dayjs et formula dans des scénarios de logique pure. |

## Aperçu des bibliothèques intégrées

| Propriété | Description | Documentation |
|------|------|------|
| `ctx.libs.React` | Cœur de React, utilisé pour le JSX et les Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API client ReactDOM (incluant `createRoot`), utilisée avec React pour le rendu | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Bibliothèque de composants Ant Design (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Bibliothèque d'icônes Ant Design (ex : PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Bibliothèque utilitaire de date et d'heure | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Bibliothèque utilitaire (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Bibliothèque de fonctions de formules de type Excel (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Bibliothèque d'expressions mathématiques et de calcul | [Math.js](https://mathjs.org/docs/) |

## Alias de niveau supérieur

Pour la compatibilité avec le code hérité, certaines bibliothèques sont également exposées au niveau supérieur : `ctx.React`, `ctx.ReactDOM`, `ctx.antd` et `ctx.dayjs`. **Il est recommandé d'utiliser systématiquement `ctx.libs.xxx`** pour faciliter la maintenance et la recherche dans la documentation.

## Chargement différé (Lazy Loading)

`lodash`, `formula` et `math` utilisent le **chargement différé** : un import dynamique est déclenché uniquement lors du premier accès à `ctx.libs.lodash`, et le cache est réutilisé par la suite. `React`, `antd`, `dayjs` et `antdIcons` sont pré-configurés par le contexte et sont disponibles immédiatement.

## Exemples

### Rendu avec React et Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Titre">
    <Button type="primary">Cliquez ici</Button>
  </Card>
);
```

### Utilisation des Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### Utilisation des icônes

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Utilisateur</Button>);
```

### Traitement des dates avec dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Fonctions utilitaires avec lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Inconnu');
```

### Calculs de formules

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Expressions mathématiques avec math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// résultat === 14
```

## Précautions

- **Mélange avec ctx.importAsync** : Si un React externe est chargé via `ctx.importAsync('react@19')`, le JSX utilisera cette instance. Dans ce cas, **ne le mélangez pas** avec `ctx.libs.antd`. Ant Design doit être chargé pour correspondre à cette version de React (ex : `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Instances multiples de React** : Si l'erreur "Invalid hook call" se produit ou si le dispatcher de hook est nul, cela est généralement causé par la présence de plusieurs instances de React. Avant de lire `ctx.libs.React` ou d'appeler des Hooks, exécutez d'abord `await ctx.importAsync('react@version')` pour vous assurer que la même instance React est partagée avec la page.

## Voir aussi

- [ctx.importAsync()](./import-async.md) - Charger des modules ESM externes à la demande (ex : versions spécifiques de React, Vue)
- [ctx.render()](./render.md) - Rendre le contenu dans un conteneur