:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Type

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## Détails

- `values` : L'objet de données de l'enregistrement à mettre à jour.
- `filter` : Spécifie les conditions de filtrage pour les enregistrements à mettre à jour. Pour une utilisation détaillée de `Filter`, veuillez consulter la méthode [`find()`](#find).
- `filterByTk` : Spécifie les conditions de filtrage pour les enregistrements à mettre à jour par `TargetKey`.
- `whitelist` : Une liste blanche pour les champs `values`. Seuls les champs figurant dans cette liste seront écrits.
- `blacklist` : Une liste noire pour les champs `values`. Les champs figurant dans cette liste ne seront pas écrits.
- `transaction` : L'objet de transaction. Si aucun paramètre de transaction n'est fourni, la méthode créera automatiquement une transaction interne.

Vous devez fournir au moins l'un des paramètres `filterByTk` ou `filter`.