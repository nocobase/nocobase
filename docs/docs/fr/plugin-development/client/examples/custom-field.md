---
title: "Faire un composant de champ personnalisé"
description: "Pratique des plugins NocoBase : créer un composant d'affichage de champ personnalisé avec ClickableFieldModel, lié à une interface de champ."
keywords: "champ personnalisé,FieldModel,ClickableFieldModel,bindModelToInterface,extension de champ,NocoBase"
---

# Faire un composant de champ personnalisé

Dans NocoBase, les composants de champ servent à afficher et éditer les données dans les tableaux et formulaires. Cet exemple montre comment créer un composant d'affichage de champ personnalisé avec `ClickableFieldModel` — il ajoute des crochets `[]` autour de la valeur du champ et est lié à l'interface `input`.

:::tip Lecture préalable

Il est conseillé de connaître les contenus suivants pour faciliter le développement :

- [Écrire votre premier plugin](../../write-your-first-plugin) — création d'un plugin et structure du répertoire
- [Plugin](../plugin) — point d'entrée du plugin et cycle de vie `load()`
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
- [FlowEngine → Extension de champ](../flow-engine/field) — présentation des classes parentes FieldModel et ClickableFieldModel
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de `tExpr()` pour la traduction différée

:::

## Résultat final

Nous allons créer un composant d'affichage de champ personnalisé :

- Étend `ClickableFieldModel` avec une logique de rendu personnalisée
- Affiche `[]` autour de la valeur du champ
- Lie le composant à l'interface `input` (texte sur une ligne) via `bindModelToInterface`

Une fois le plugin activé, dans un bloc tableau, trouvez la colonne d'un champ texte sur une ligne, cliquez sur le bouton de configuration de la colonne et, dans le menu déroulant « Composant de champ », vous verrez l'option `DisplaySimpleFieldModel`. En basculant dessus, la valeur sera affichée au format `[value]`.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Code source complet : [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Pour le faire tourner directement en local :

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

Construisons ce plugin pas à pas, à partir de zéro.

## Étape 1 : créer le squelette du plugin

À la racine du dépôt :

```bash
yarn pm create @my-project/plugin-field-simple
```

Voir [Écrire votre premier plugin](../../write-your-first-plugin) pour les détails.

## Étape 2 : créer le modèle de champ

Créez `src/client-v2/models/DisplaySimpleFieldModel.tsx`. C'est le cœur du plugin — il définit le rendu du champ et l'interface à laquelle il est lié.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record permet de récupérer l'enregistrement complet de la ligne courante
    console.log('Enregistrement courant :', this.context.record);
    console.log('Index de l\'enregistrement courant :', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Définit le nom affiché dans le menu déroulant « Composant de champ »
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// Lie le modèle à l'interface 'input' (texte sur une ligne)
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Quelques points clés :

- **`renderComponent(value)`** — reçoit la valeur courante du champ en paramètre et renvoie le JSX
- **`this.context.record`** — récupère l'enregistrement complet de la ligne courante
- **`this.context.recordIndex`** — récupère l'index de la ligne courante
- **`ClickableFieldModel`** — étend `FieldModel` avec la capacité d'interaction au clic
- **`define({ label })`** — définit le nom affiché dans le menu déroulant « Composant de champ » ; sans ce label, le nom de classe serait affiché à la place
- **`DisplayItemModel.bindModelToInterface()`** — lie le modèle de champ à un type d'interface de champ (par exemple `input` pour les champs texte sur une ligne) ; ce composant d'affichage devient alors sélectionnable sur les champs du type correspondant

## Étape 3 : ajouter les fichiers de traduction

Modifiez les fichiers de traduction sous `src/locale/` du plugin et ajoutez les clés utilisées par `tExpr()` :

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
}
```

:::warning Attention

L'ajout initial des fichiers de langue nécessite un redémarrage de l'application pour prendre effet.

:::

Pour l'écriture des fichiers de traduction et plus d'utilisations de `tExpr()`, voir [Internationalisation i18n](../component/i18n).

## Étape 4 : enregistrer dans le plugin

Modifiez `src/client-v2/plugin.tsx` et utilisez `registerModelLoaders` pour le chargement à la demande :

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Étape 5 : activer le plugin

```bash
yarn pm enable @my-project/plugin-field-simple
```

Une fois activé, dans un bloc tableau, trouvez la colonne d'un champ texte sur une ligne, cliquez sur le bouton de configuration de la colonne et, dans le menu déroulant « Composant de champ », vous pourrez basculer vers ce composant d'affichage personnalisé.

## Code source complet

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — exemple complet de composant de champ personnalisé

## Récapitulatif

Capacités utilisées dans cet exemple :

| Capacité | Utilisation | Documentation |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| Rendu de champ | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → Extension de champ](../flow-engine/field) |
| Liaison à une interface de champ | `DisplayItemModel.bindModelToInterface()` | [FlowEngine → Extension de champ](../flow-engine/field) |
| Enregistrement de modèle | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin) |

## Liens connexes

- [Écrire votre premier plugin](../../write-your-first-plugin) — créer le squelette d'un plugin de zéro
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
- [FlowEngine → Extension de champ](../flow-engine/field) — FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine → Extension de bloc](../flow-engine/block) — bloc personnalisé
- [Component vs FlowModel](../component-vs-flow-model) — quand utiliser FlowModel
- [Plugin](../plugin) — point d'entrée et cycle de vie load()
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de tExpr
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète FlowModel, Flow, Context
