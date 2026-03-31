:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Tipo

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

## Detalhes

- `values`: O objeto de dados para o registro a ser criado.
- `whitelist`: Especifica quais campos no objeto de dados do registro a ser criado **podem ser gravados**. Se você não passar este parâmetro, todos os campos serão permitidos por padrão.
- `blacklist`: Especifica quais campos no objeto de dados do registro a ser criado **não podem ser gravados**. Se você não passar este parâmetro, todos os campos serão permitidos por padrão.
- `transaction`: O objeto de transação. Se nenhum parâmetro de transação for passado, este método criará automaticamente uma transação interna.