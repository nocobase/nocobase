:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# FlowModel : Flux et configuration

FlowModel offre une approche basée sur le « flux » pour implémenter la logique de configuration des composants, rendant le comportement et la configuration des composants plus extensibles et visuels.

## Modèle personnalisé

Vous pouvez créer un modèle de composant personnalisé en étendant `FlowModel`. Le modèle doit implémenter la méthode `render()` pour définir la logique de rendu du composant.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Enregistrer un flux

Chaque modèle peut enregistrer un ou plusieurs **flux** pour décrire la logique de configuration et les étapes d'interaction du composant.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Paramètres du bouton',
  steps: {
    general: {
      title: 'Configuration générale',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Titre du bouton',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Description

-   `key` : L'identifiant unique du flux.
-   `title` : Le nom du flux, utilisé pour l'affichage dans l'interface utilisateur.
-   `steps` : Définit les étapes de configuration (Step). Chaque étape comprend :
    -   `title` : Le titre de l'étape.
    -   `uiSchema` : La structure du formulaire de configuration (compatible avec Formily Schema).
    -   `defaultParams` : Les paramètres par défaut.
    -   `handler(ctx, params)` : Déclenché lors de la sauvegarde pour mettre à jour l'état du modèle.

## Rendu du modèle

Lors du rendu d'un modèle de composant, vous pouvez utiliser le paramètre `showFlowSettings` pour contrôler si la fonctionnalité de configuration doit être activée. Si `showFlowSettings` est activé, une entrée de configuration (telle qu'une icône de paramètres ou un bouton) apparaîtra automatiquement dans le coin supérieur droit du composant.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Ouvrir manuellement le formulaire de configuration avec openFlowSettings

En plus d'ouvrir le formulaire de configuration via l'entrée d'interaction intégrée, vous pouvez également appeler manuellement `openFlowSettings()` dans votre code.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Définition des paramètres

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Obligatoire, l'instance du modèle auquel il appartient
  preset?: boolean;               // Rend uniquement les étapes marquées comme preset=true (par défaut false)
  flowKey?: string;               // Spécifie un seul flux
  flowKeys?: string[];            // Spécifie plusieurs flux (ignoré si flowKey est également fourni)
  stepKey?: string;               // Spécifie une seule étape (généralement utilisé avec flowKey)
  uiMode?: 'dialog' | 'drawer';   // Le conteneur d'affichage du formulaire, par défaut 'dialog'
  onCancel?: () => void;          // Rappel lorsque l'utilisateur clique sur Annuler
  onSaved?: () => void;           // Rappel après la sauvegarde réussie de la configuration
}
```

### Exemple : Ouvrir le formulaire de configuration d'un flux spécifique en mode Tiroir

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Paramètres du bouton enregistrés');
  },
});
```