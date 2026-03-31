:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

**Tipo**

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

**Detalhes**

- `values`: O objeto de dados para o registro a ser atualizado.
- `filter`: Especifica as condições de filtro para os registros a serem atualizados. Para detalhes sobre o uso de `Filter`, consulte o método [`find()`](#find).
- `filterByTk`: Especifica as condições de filtro para os registros a serem atualizados por `TargetKey`.
- `whitelist`: Uma lista de permissões (`whitelist`) para os campos de `values`. Apenas os campos nesta lista serão gravados.
- `blacklist`: Uma lista de bloqueio (`blacklist`) para os campos de `values`. Os campos nesta lista não serão gravados.
- `transaction`: O objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.

Pelo menos um dos parâmetros, `filterByTk` ou `filter`, deve ser fornecido.