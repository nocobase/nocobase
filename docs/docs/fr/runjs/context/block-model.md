:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/block-model).
:::

# ctx.blockModel

Le modèle de bloc parent (instance de `BlockModel`) dans lequel se trouve le champ JS ou le bloc JS actuel. Dans des scénarios tels que `JSField`, `JSItem` et `JSColumn`, `ctx.blockModel` pointe vers le bloc de formulaire ou le bloc de tableau portant la logique JS actuelle. Dans un `JSBlock` indépendant, il peut être `null` ou identique à `ctx.model`.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSField** | Accéder à `form`, `collection` et `resource` du bloc de formulaire parent au sein d'un champ de formulaire pour implémenter une liaison ou une validation. |
| **JSItem** | Accéder aux informations de ressource et de collection du bloc de tableau/formulaire parent au sein d'un élément de sous-tableau. |
| **JSColumn** | Accéder à `resource` (ex: `getSelectedRows`) et `collection` du bloc de tableau parent au sein d'une colonne de tableau. |
| **Actions de formulaire / Flux de travail** | Accéder à `form` pour la validation avant soumission, `resource` pour le rafraîchissement, etc. |

> Remarque : `ctx.blockModel` n'est disponible que dans les contextes RunJS où un bloc parent existe. Dans les `JSBlock` indépendants (sans formulaire/tableau parent), il peut être `null`. Il est recommandé d'effectuer une vérification de valeur nulle avant utilisation.

## Définition du type

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Le type spécifique dépend du type de bloc parent : les blocs de formulaire sont principalement des `FormBlockModel` ou `EditFormModel`, tandis que les blocs de tableau sont principalement des `TableBlockModel`.

## Propriétés courantes

| Propriété | Type | Description |
|------|------|------|
| `uid` | `string` | Identifiant unique du modèle de bloc. |
| `collection` | `Collection` | La collection liée au bloc actuel. |
| `resource` | `Resource` | L'instance de ressource utilisée par le bloc (`SingleRecordResource` / `MultiRecordResource`, etc.). |
| `form` | `FormInstance` | Bloc de formulaire : Instance de formulaire Ant Design, prenant en charge `getFieldsValue`, `validateFields`, `setFieldsValue`, etc. |
| `emitter` | `EventEmitter` | Émetteur d'événements, utilisé pour écouter `formValuesChange`, `onFieldReset`, etc. |

## Relation avec ctx.model et ctx.form

| Besoin | Usage recommandé |
|------|----------|
| **Bloc parent du JS actuel** | `ctx.blockModel` |
| **Lire/Écrire des champs de formulaire** | `ctx.form` (équivalent à `ctx.blockModel?.form`, plus pratique dans les blocs de formulaire) |
| **Modèle du contexte d'exécution actuel** | `ctx.model` (Modèle de champ dans JSField, modèle de bloc dans JSBlock) |

Dans un `JSField`, `ctx.model` est le modèle de champ, et `ctx.blockModel` est le bloc de formulaire ou de tableau portant ce champ ; `ctx.form` est généralement `ctx.blockModel.form`.

## Exemples

### Tableau : Obtenir les lignes sélectionnées et les traiter

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Veuillez d\'abord sélectionner des données');
  return;
}
```

### Scénario de formulaire : Valider et rafraîchir

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Écouter les changements du formulaire

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implémenter la liaison ou le rendu basé sur les dernières valeurs du formulaire
});
```

### Déclencher le rendu du bloc

```ts
ctx.blockModel?.rerender?.();
```

## Précautions

- Dans un **JSBlock indépendant** (sans bloc de formulaire ou de tableau parent), `ctx.blockModel` peut être `null`. Il est recommandé d'utiliser le chaînage optionnel lors de l'accès à ses propriétés : `ctx.blockModel?.resource?.refresh?.()`.
- Dans **JSField / JSItem / JSColumn**, `ctx.blockModel` fait référence au bloc de formulaire ou de tableau portant le champ actuel. Dans un **JSBlock**, il peut s'agir de lui-même ou d'un bloc de niveau supérieur, selon la hiérarchie réelle.
- `resource` n'existe que dans les blocs de données ; `form` n'existe que dans les blocs de formulaire. Les blocs de tableau n'ont généralement pas de `form`.

## Relatif à

- [ctx.model](./model.md) : Le modèle du contexte d'exécution actuel.
- [ctx.form](./form.md) : Instance de formulaire, couramment utilisée dans les blocs de formulaire.
- [ctx.resource](./resource.md) : Instance de ressource (équivalent à `ctx.blockModel?.resource`, à utiliser directement si disponible).
- [ctx.getModel()](./get-model.md) : Obtenir d'autres modèles de blocs par UID.