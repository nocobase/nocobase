:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
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

**Dettagli**

- `filter`: Specifica le condizioni di filtro per i record da eliminare. Per l'utilizzo dettagliato di Filter, può fare riferimento al metodo [`find()`](#find).
- `filterByTk`: Specifica le condizioni di filtro per i record da eliminare tramite TargetKey.
- `truncate`: Indica se troncare i dati della collezione. Questo parametro è efficace solo quando i parametri `filter` o `filterByTk` non vengono forniti.
- `transaction`: Oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.