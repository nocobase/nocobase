:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

**Type**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Détails**

- `values` : L'objet de données pour l'enregistrement à créer.
- `whitelist` : Spécifie les champs de l'objet de données de l'enregistrement à créer qui **peuvent être écrits**. Si ce paramètre n'est pas fourni, tous les champs sont autorisés par défaut.
- `blacklist` : Spécifie les champs de l'objet de données de l'enregistrement à créer qui **ne peuvent pas être écrits**. Si ce paramètre n'est pas fourni, tous les champs sont autorisés par défaut.
- `transaction` : L'objet de transaction. Si aucun paramètre de transaction n'est fourni, cette méthode créera automatiquement une transaction interne.