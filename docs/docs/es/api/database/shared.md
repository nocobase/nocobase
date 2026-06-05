:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

**Parámetros**

| Nombre del parámetro   | Tipo          | Valor predeterminado | Descripción                                                                 |
| :--------------------- | :------------ | :------------------- | :-------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`                 | El objeto de datos a insertar.                                              |
| `options.whitelist?`   | `string[]`    | -                    | Lista blanca de campos para `values`. Solo se almacenarán los campos incluidos en esta lista. |
| `options.blacklist?`   | `string[]`    | -                    | Lista negra de campos para `values`. Los campos incluidos en esta lista no se almacenarán.    |
| `options.transaction?` | `Transaction` | -                    | Transacción.                                                                |