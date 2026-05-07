:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/model).
:::

# ctx.model

L'instance `FlowModel` où se trouve le contexte d'exécution RunJS actuel. Il s'agit du point d'entrée par défaut pour des scénarios tels que JSBlock, JSField et JSAction. Le type spécifique varie selon le contexte : il peut s'agir d'une sous-classe telle que `BlockModel`, `ActionModel` ou `JSEditableFieldModel`.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock** | `ctx.model` est le modèle de bloc actuel. Vous pouvez accéder à `resource`, `collection`, `setProps`, etc. |
| **JSField / JSItem / JSColumn** | `ctx.model` est le modèle de champ. Vous pouvez accéder à `setProps`, `dispatchEvent`, etc. |
| **Événements d'action / ActionModel** | `ctx.model` est le modèle d'action. Vous pouvez lire/écrire les paramètres d'étape, émettre des événements, etc. |

> Astuce : Si vous avez besoin d'accéder au **bloc parent contenant le JS actuel** (par exemple, un bloc Formulaire ou Tableau), utilisez `ctx.blockModel` ; pour accéder à **d'autres modèles**, utilisez `ctx.getModel(uid)`.

## Définition du type

```ts
model: FlowModel;
```

`FlowModel` est la classe de base. À l'exécution, il s'agit d'une instance de diverses sous-classes (telles que `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, etc.). Les propriétés et méthodes disponibles dépendent du type spécifique.

## Propriétés communes

| Propriété | Type | Description |
|------|------|------|
| `uid` | `string` | Identifiant unique du modèle. Peut être utilisé pour `ctx.getModel(uid)` ou la liaison d'UID de fenêtre contextuelle (popup). |
| `collection` | `Collection` | La collection liée au modèle actuel (existe lorsque le bloc ou le champ est lié à des données). |
| `resource` | `Resource` | Instance de ressource associée, utilisée pour rafraîchir, obtenir les lignes sélectionnées, etc. |
| `props` | `object` | Configuration de l'interface utilisateur (UI) ou du comportement du modèle. Peut être mis à jour via `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Collection de modèles enfants (par exemple, les champs dans un formulaire, les colonnes dans un tableau). |
| `parent` | `FlowModel` | Modèle parent (le cas échéant). |

## Méthodes communes

| Méthode | Description |
|------|------|
| `setProps(partialProps: any): void` | Met à jour la configuration du modèle et déclenche un nouveau rendu (ex : `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Émet un événement vers le modèle, déclenchant les flux de travail configurés sur ce modèle qui écoutent ce nom d'événement. Le `payload` optionnel est transmis au gestionnaire du flux de travail ; `options.debounce` permet d'activer l'anti-rebond. |
| `getStepParams?.(flowKey, stepKey)` | Lit les paramètres d'étape du flux de configuration (utilisé dans les panneaux de réglages, les actions personnalisées, etc.). |
| `setStepParams?.(flowKey, stepKey, params)` | Écrit les paramètres d'étape du flux de configuration. |

## Relation avec ctx.blockModel et ctx.getModel

| Besoin | Utilisation recommandée |
|------|----------|
| **Modèle du contexte d'exécution actuel** | `ctx.model` |
| **Bloc parent du JS actuel** | `ctx.blockModel`. Souvent utilisé pour accéder à `resource`, `form` ou `collection`. |
| **Obtenir n'importe quel modèle par UID** | `ctx.getModel(uid)` ou `ctx.getModel(uid, true)` (recherche à travers les piles de vues). |

Dans un JSField, `ctx.model` est le modèle de champ, tandis que `ctx.blockModel` est le bloc Formulaire ou Tableau contenant ce champ.

## Exemples

### Mise à jour de l'état d'un bloc ou d'une action

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Émission d'événements de modèle

```ts
// Émet un événement pour déclencher un flux de travail configuré sur ce modèle qui écoute ce nom d'événement
await ctx.model.dispatchEvent('remove');

// Lorsqu'un payload est fourni, il est transmis au ctx.inputArgs du gestionnaire de flux de travail
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Utilisation de l'UID pour la liaison de popup ou l'accès inter-modèles

```ts
const myUid = ctx.model.uid;
// Dans la configuration d'une popup, vous pouvez passer openerUid: myUid pour l'association
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Relatif à

- [ctx.blockModel](./block-model.md) : Le modèle de bloc parent où se trouve le JS actuel.
- [ctx.getModel()](./get-model.md) : Obtenir d'autres modèles par UID.