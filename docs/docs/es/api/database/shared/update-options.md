:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
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

**Detalles**

- `values`: El objeto de datos para el registro que se va a actualizar.
- `filter`: Especifica las condiciones de filtro para los registros que se van a actualizar. Para obtener más detalles sobre el uso de `Filter`, consulte el método [`find()`](#find).
- `filterByTk`: Especifica las condiciones de filtro para los registros que se van a actualizar, utilizando `TargetKey`.
- `whitelist`: Una lista blanca para los campos de `values`. Solo se escribirán los campos incluidos en esta lista.
- `blacklist`: Una lista negra para los campos de `values`. Los campos incluidos en esta lista no se escribirán.
- `transaction`: El objeto de transacción. Si no se pasa ningún parámetro de transacción, el método creará automáticamente una transacción interna.

Debe pasar al menos uno de los parámetros: `filterByTk` o `filter`.