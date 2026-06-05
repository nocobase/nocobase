:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Détails**

- `filter` : Spécifie les conditions de filtrage des enregistrements à supprimer. Pour en savoir plus sur l'utilisation détaillée de `Filter`, veuillez consulter la méthode [`find()`](#find).
- `filterByTk` : Spécifie les conditions de filtrage des enregistrements à supprimer en fonction de `TargetKey`.
- `truncate` : Indique s'il faut tronquer les données de la collection. Cette option n'est effective que si les paramètres `filter` ou `filterByTk` ne sont pas fournis.
- `transaction` : Objet de transaction. Si vous ne fournissez pas de paramètre de transaction, la méthode créera automatiquement une transaction interne.