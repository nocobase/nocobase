:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Créez votre premier plugin de bloc

Avant de commencer, nous vous recommandons de lire « [Créez votre premier plugin](../plugin-development/write-your-first-plugin.md) » pour apprendre à créer rapidement un plugin de base. Ensuite, nous allons l'étendre en ajoutant une fonctionnalité de bloc simple.

## Étape 1 : Créez le fichier du modèle de bloc

Créez un nouveau fichier dans le répertoire de votre plugin : `client/models/SimpleBlockModel.tsx`

## Étape 2 : Rédigez le contenu du modèle

Définissez et implémentez un modèle de bloc de base dans le fichier, y compris sa logique de rendu :

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Étape 3 : Enregistrez le modèle de bloc

Exportez le modèle nouvellement créé dans le fichier `client/models/index.ts` :

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Étape 4 : Activez et testez le bloc

Après avoir activé le plugin, vous verrez la nouvelle option de bloc **Hello block** dans le menu déroulant « Ajouter un bloc ».

Démonstration :

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Étape 5 : Ajoutez des capacités de configuration au bloc

Ensuite, nous allons ajouter des fonctionnalités configurables au bloc via un **flux de travail** (Flow), permettant aux utilisateurs de modifier le contenu du bloc directement dans l'interface.

Continuez à modifier le fichier `SimpleBlockModel.tsx` :

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Démonstration :

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Résumé

Cet article vous a montré comment créer un plugin de bloc simple, notamment :

- Comment définir et implémenter un modèle de bloc
- Comment enregistrer un modèle de bloc
- Comment ajouter des fonctionnalités configurables à un bloc via un flux de travail (Flow)

Référence du code source complet : [Exemple de bloc simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)