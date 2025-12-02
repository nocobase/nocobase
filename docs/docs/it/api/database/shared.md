:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

**Parametri**

| Nome parametro         | Tipo          | Valore predefinito | Descrizione                                                                 |
| ---------------------- | ------------- | ------------------ | --------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`               | L'oggetto dati da inserire.                                                 |
| `options.whitelist?`   | `string[]`    | -                  | Whitelist dei campi per `values`. Solo i campi inclusi in questa lista verranno memorizzati. |
| `options.blacklist?`   | `string[]`    | -                  | Blacklist dei campi per `values`. I campi inclusi in questa lista non verranno memorizzati. |
| `options.transaction?` | `Transaction` | -                  | Transazione                                                                 |