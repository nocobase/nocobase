---
title: "Faire un bloc d'affichage personnalisé"
description: "Pratique des plugins NocoBase : créer un bloc d'affichage HTML configurable avec BlockModel + registerFlow + uiSchema."
keywords: "bloc personnalisé,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Faire un bloc d'affichage personnalisé

Dans NocoBase, un bloc est une zone de contenu sur la page. Cet exemple montre comment créer un bloc personnalisé minimal avec `BlockModel` — il prend en charge l'édition de contenu HTML directement dans l'interface, l'utilisateur pouvant modifier le contenu affiché via le panneau de configuration.

C'est le premier exemple impliquant FlowEngine ; il fait intervenir `BlockModel`, `renderComponent`, `registerFlow` et `uiSchema`.

:::tip Lecture préalable

Il est conseillé de connaître les contenus suivants pour faciliter le développement :

- [Écrire votre premier plugin](../../write-your-first-plugin) — création d'un plugin et structure du répertoire
- [Plugin](../plugin) — point d'entrée du plugin et cycle de vie `load()`
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel, renderComponent, registerFlow
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de `tExpr()` pour la traduction différée

:::

## Résultat final

Nous allons créer un bloc « Simple block » :

- Apparaît dans le menu « Ajouter un bloc »
- Affiche le contenu HTML configuré par l'utilisateur
- Permet à l'utilisateur d'éditer le HTML via le panneau de configuration (registerFlow + uiSchema)

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Code source complet : [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Pour le faire tourner directement en local :

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

Construisons ce plugin pas à pas, à partir de zéro.

## Étape 1 : créer le squelette du plugin

À la racine du dépôt :

```bash
yarn pm create @my-project/plugin-simple-block
```

Cela génère la structure de fichiers de base sous `packages/plugins/@my-project/plugin-simple-block`. Voir [Écrire votre premier plugin](../../write-your-first-plugin) pour les détails.

## Étape 2 : créer le modèle de bloc

Créez `src/client-v2/models/SimpleBlockModel.tsx`. C'est le cœur du plugin — il définit la façon dont le bloc s'affiche et se configure.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// Définit le nom affiché du bloc dans le menu « Ajouter un bloc »
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// Enregistre le panneau de configuration pour permettre à l'utilisateur d'éditer le HTML
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // S'exécute avant le rendu
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema définit l'UI du formulaire du panneau de configuration
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Valeurs par défaut du panneau de configuration
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Écrit la valeur du panneau de configuration dans les props du modèle
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Quelques points clés :

- **`renderComponent()`** — rend l'UI du bloc en lisant `this.props.html`
- **`define()`** — définit le nom affiché dans le menu « Ajouter un bloc ». `tExpr()` sert à la traduction différée car `define()` s'exécute au chargement du module, alors qu'i18n n'est pas encore initialisé
- **`registerFlow()`** — ajoute un panneau de configuration. `uiSchema` définit le formulaire avec JSON Schema (syntaxe : voir [UI Schema](../../../../flow-engine/ui-schema)), `handler` écrit la valeur saisie par l'utilisateur dans `ctx.model.props`, lue ensuite par `renderComponent()`

## Étape 3 : ajouter les fichiers de traduction

Modifiez les fichiers de traduction sous `src/locale/` du plugin pour ajouter les clés utilisées par `tExpr()` :

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
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

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // Chargement à la demande : ne charge le module qu'à la première utilisation
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` utilise l'import dynamique : le code du modèle ne se charge qu'à la première utilisation effective — c'est la méthode d'enregistrement recommandée.

## Étape 5 : activer le plugin

```bash
yarn pm enable @my-project/plugin-simple-block
```

Une fois activé, créez une nouvelle page, cliquez sur « Ajouter un bloc » et vous verrez « Simple block ». Après ajout, cliquez sur le bouton de configuration du bloc pour éditer le contenu HTML.

## Code source complet

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — exemple complet de bloc d'affichage personnalisé

## Récapitulatif

Capacités utilisées dans cet exemple :

| Capacité | Utilisation | Documentation |
| -------- | ---------------------------------- | --------------------------------------------- |
| Rendu du bloc | `BlockModel` + `renderComponent()` | [FlowEngine → Extension de bloc](../flow-engine/block) |
| Inscription au menu | `define({ label })` | [Aperçu de FlowEngine](../flow-engine/index.md) |
| Panneau de configuration | `registerFlow()` + `uiSchema` | [Aperçu de FlowEngine](../flow-engine/index.md) |
| Enregistrement de modèle | `registerModelLoaders` (chargement à la demande) | [Plugin](../plugin) |
| Traduction différée | `tExpr()` | [Internationalisation i18n](../component/i18n) |

## Liens connexes

- [Écrire votre premier plugin](../../write-your-first-plugin) — créer le squelette d'un plugin de zéro
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel et registerFlow
- [FlowEngine → Extension de bloc](../flow-engine/block) — BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — référence syntaxique uiSchema
- [Component vs FlowModel](../component-vs-flow-model) — quand utiliser FlowModel
- [Plugin](../plugin) — point d'entrée et cycle de vie load()
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de tExpr
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète FlowModel, Flow, Context
