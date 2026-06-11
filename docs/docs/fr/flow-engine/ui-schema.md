---
title: "UI Schema"
description: "Référence de syntaxe UI Schema NocoBase : protocole de description de composants basé sur Formily Schema, description des attributs type, x-component, x-decorator, x-pattern, etc."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema est le protocole utilisé par NocoBase pour décrire les composants frontend. Il est basé sur [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema), dans un style proche de JSON Schema. Dans FlowEngine, le champ `uiSchema` de `registerFlow` utilise cette syntaxe pour définir l'UI du panneau de configuration.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // Composant wrapper
  ['x-decorator']?: string;
  // Propriétés du composant wrapper
  ['x-decorator-props']?: any;
  // Composant
  ['x-component']?: string;
  // Propriétés du composant
  ['x-component-props']?: any;
  // État d'affichage, par défaut 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // Nœuds enfants du composant
  ['x-content']?: any;
  // Schema des nœuds children
  properties?: Record<string, ISchema>;

  // Les éléments suivants ne s'utilisent que pour les composants de champ

  // Réactions de champ
  ['x-reactions']?: SchemaReactions;
  // Mode d'interaction UI du champ, par défaut 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // Validation du champ
  ['x-validator']?: Validator;
  // Données par défaut
  default?: any;
}
```

## Utilisation de base

### Le composant le plus simple

Toutes les balises HTML natives peuvent être converties en notation schema :

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Équivalent JSX :

```tsx
<h1>Hello, world!</h1>
```

### Composants enfants

Les composants children sont écrits dans `properties` :

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

Équivalent JSX :

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Description des attributs

### type

Type du nœud :

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

Nom du schema. Le name d'un nœud enfant correspond à la clé dans `properties` :

```ts
{
  name: 'root',
  properties: {
    child1: {
      // Pas besoin d'écrire name ici
    },
  },
}
```

### title

Titre du nœud, généralement utilisé comme étiquette de champ de formulaire.

### x-component

Nom du composant. Peut être une balise HTML native ou un composant React enregistré :

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Propriétés du composant :

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

Composant wrapper. La combinaison `x-decorator` + `x-component` permet de placer deux composants dans un même nœud schema, ce qui réduit la complexité de structure et améliore la réutilisation.

Par exemple, dans le contexte d'un formulaire, `FormItem` est un decorator :

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

Équivalent JSX :

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

État d'affichage du composant :

| Valeur | Description |
|----|------|
| `'visible'` | Affiche le composant (par défaut) |
| `'hidden'` | Masque le composant, mais les données ne sont pas masquées |
| `'none'` | Masque le composant et les données |

### x-pattern

Mode d'interaction d'un composant de champ :

| Valeur | Description |
|----|------|
| `'editable'` | Modifiable (par défaut) |
| `'disabled'` | Non modifiable |
| `'readPretty'` | Mode lecture conviviale — par exemple, le composant texte sur une ligne est `<input />` en mode édition et `<div />` en mode lecture conviviale |

## Utilisation dans registerFlow

Dans le développement de plugins, uiSchema est principalement utilisé dans le panneau de configuration de `registerFlow`. Chaque champ est généralement enveloppé avec `'x-decorator': 'FormItem'` :

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'Modifier le titre',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Titre',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'Afficher la bordure',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: 'Couleur',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: 'Rouge', value: 'red' },
            { label: 'Bleu', value: 'blue' },
            { label: 'Vert', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip Astuce

V2 reste compatible avec la syntaxe uiSchema, mais les cas d'usage sont limités — principalement pour décrire l'UI des formulaires dans les panneaux de configuration de Flow. Pour le rendu de composants à l'exécution, il est recommandé d'utiliser directement les [composants Antd](https://5x.ant.design/components/overview).

:::

## Aide-mémoire des composants courants

| Composant | x-component | type | Description |
|------|-------------|------|------|
| Texte ligne unique | `Input` | `string` | Saisie texte de base |
| Texte multilignes | `Input.TextArea` | `string` | Zone de texte multilignes |
| Nombre | `InputNumber` | `number` | Saisie numérique |
| Interrupteur | `Switch` | `boolean` | Booléen on/off |
| Liste déroulante | `Select` | `string` | À combiner avec `enum` pour fournir les options |
| Bouton radio | `Radio.Group` | `string` | À combiner avec `enum` pour fournir les options |
| Cases à cocher | `Checkbox.Group` | `string` | À combiner avec `enum` pour fournir les options |
| Date | `DatePicker` | `string` | Sélecteur de date |

## Liens connexes

- [Aperçu de FlowEngine (développement de plugins)](../plugin-development/client/flow-engine/index.md) — Utilisation pratique de uiSchema dans registerFlow
- [FlowDefinition](./definitions/flow-definition.md) — Description complète des paramètres de registerFlow
- [Documentation Formily Schema](https://react.formilyjs.org/api/shared/schema) — Protocole Formily sous-jacent à uiSchema
