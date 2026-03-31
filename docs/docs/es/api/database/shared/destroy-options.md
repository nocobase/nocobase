:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
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

**Detalles**

- `filter`: Especifica las condiciones de filtro para los registros que se van a eliminar. Para obtener más detalles sobre el uso de `Filter`, consulte el método [`find()`](#find).
- `filterByTk`: Especifica las condiciones de filtro para los registros que se van a eliminar por `TargetKey`.
- `truncate`: Indica si se deben truncar (vaciar) los datos de la tabla. Esto solo es efectivo cuando no se proporcionan los parámetros `filter` o `filterByTk`.
- `transaction`: Objeto de transacción. Si no se proporciona un parámetro de transacción, el método creará automáticamente una transacción interna.