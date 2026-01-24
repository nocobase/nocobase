:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Parametrar

| Parameternamn          | Typ           | Standardvärde | Beskrivning                                                                 |
| :--------------------- | :------------ | :------------ | :-------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`          | Dataobjektet som ska infogas.                                               |
| `options.whitelist?`   | `string[]`    | -             | Vitlista för fält i `values`. Endast fält som finns med i listan kommer att lagras. |
| `options.blacklist?`   | `string[]`    | -             | Svartlista för fält i `values`. Fält som finns med i listan kommer inte att lagras. |
| `options.transaction?` | `Transaction` | -             | Transaktion                                                                 |