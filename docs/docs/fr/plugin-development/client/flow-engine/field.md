---
title: "Extension de champ"
description: "Développement d'extensions de champ NocoBase : classes parentes FieldModel et ClickableFieldModel, rendu de champ, liaison à une interface de champ."
keywords: "extension de champ,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Extension de champ

Dans NocoBase, les **composants de champ (Field)** servent à afficher et éditer les données dans les tableaux et formulaires. En étendant les classes parentes liées à FieldModel, vous pouvez personnaliser le rendu d'un champ — par exemple afficher un type de données dans un format spécifique ou utiliser un composant personnalisé pour l'éditer.

## Exemple : champ d'affichage personnalisé

L'exemple suivant crée un champ d'affichage simple — il ajoute des crochets `[]` autour de la valeur du champ :

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record permet de récupérer l'enregistrement complet de la ligne courante
    console.log('Enregistrement courant :', this.context.record);
    console.log('Index de l\'enregistrement courant :', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Lie au type d'interface de champ 'input'
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Quelques points clés :

- **`renderComponent(value)`** — reçoit la valeur courante du champ en paramètre et renvoie le JSX
- **`this.context.record`** — récupère l'enregistrement complet de la ligne courante
- **`this.context.recordIndex`** — récupère l'index de la ligne courante
- **`ClickableFieldModel`** — étend `FieldModel` avec la capacité d'interaction au clic
- **`DisplayItemModel.bindModelToInterface()`** — lie le modèle de champ à un type d'interface de champ (par exemple `input` pour les champs texte) ; ce composant d'affichage devient alors sélectionnable sur les champs du type correspondant

## Enregistrer un champ

Dans `load()` du Plugin, utilisez `registerModelLoaders` pour le chargement à la demande :

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

Une fois enregistré, dans un bloc tableau, trouvez la colonne d'un champ d'un type correspondant (ici `input` pour les champs texte sur une ligne), cliquez sur le bouton de configuration de la colonne et, dans le menu déroulant « Composant de champ », vous pourrez basculer vers ce composant d'affichage personnalisé. Voir [Faire un composant de champ personnalisé](../examples/custom-field) pour un exemple pratique complet.

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Code source complet

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — exemple de composant de champ personnalisé

## Liens connexes

- [Pratique : faire un composant de champ personnalisé](../examples/custom-field) — construire un composant d'affichage de champ personnalisé de zéro
- [Pratique : faire un plugin de gestion de données front+back](../examples/fullstack-plugin) — application réelle du champ personnalisé dans un plugin complet
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
- [Extension de bloc](./block) — bloc personnalisé
- [Extension d'action](./action) — bouton d'action personnalisé
- [Définition de Flow FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — paramètres complets de registerFlow et types d'événements
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète
