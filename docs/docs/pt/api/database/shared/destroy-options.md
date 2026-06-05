:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

**Tipo**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detalhes**

- `filter`: Especifica as condições de filtro para os registros a serem excluídos. Para uso detalhado de `Filter`, consulte o método [`find()`](#find).
- `filterByTk`: Especifica as condições de filtro para os registros a serem excluídos por `TargetKey`.
- `truncate`: Se deve truncar (limpar) os dados da coleção. Isso é eficaz apenas quando os parâmetros `filter` ou `filterByTk` não são fornecidos.
- `transaction`: Objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.