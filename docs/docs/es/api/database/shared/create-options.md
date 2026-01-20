:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
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

## Detalles

- `values`: El objeto de datos para el registro que se va a crear.
- `whitelist`: Especifica qué campos del objeto de datos del registro que se va a crear **se pueden escribir**. Si no se pasa este parámetro, por defecto se permite la escritura en todos los campos.
- `blacklist`: Especifica qué campos del objeto de datos del registro que se va a crear **no se pueden escribir**. Si no se pasa este parámetro, por defecto se permite la escritura en todos los campos.
- `transaction`: El objeto de transacción. Si no se pasa ningún parámetro de transacción, este método creará automáticamente una transacción interna.