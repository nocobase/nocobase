:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Tipo

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

## Dettagli

- `values`: L'oggetto dati per il record da aggiornare.
- `filter`: Specifica le condizioni di filtro per i record da aggiornare. Per un uso dettagliato di `Filter`, si prega di fare riferimento al metodo [`find()`](#find).
- `filterByTk`: Specifica le condizioni di filtro per i record da aggiornare tramite `TargetKey`.
- `whitelist`: Una whitelist per i campi `values`. Solo i campi presenti in questo elenco verranno scritti.
- `blacklist`: Una blacklist per i campi `values`. I campi presenti in questo elenco non verranno scritti.
- `transaction`: L'oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.

È necessario passare almeno uno tra `filterByTk` o `filter`.