:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
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

## Dettagli

- `values`: L'oggetto dati per il record da creare.
- `whitelist`: Specifica quali campi nell'oggetto dati del record da creare **possono essere scritti**. Se questo parametro non viene fornito, per impostazione predefinita tutti i campi possono essere scritti.
- `blacklist`: Specifica quali campi nell'oggetto dati del record da creare **non possono essere scritti**. Se questo parametro non viene fornito, per impostazione predefinita tutti i campi possono essere scritti.
- `transaction`: L'oggetto transazione. Se non viene passato alcun parametro di transazione, questo metodo creerà automaticamente una transazione interna.