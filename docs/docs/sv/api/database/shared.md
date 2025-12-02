:::tip AI-översättningsmeddelande
Denna dokumentation har översatts automatiskt av AI.
:::


## Parametrar

| Parameternamn          | Typ           | Standardvärde | Beskrivning                                                                 |
| :--------------------- | :------------ | :------------ | :-------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`          | Dataobjektet som ska infogas.                                               |
| `options.whitelist?`   | `string[]`    | -             | Vitlista för fält i `values`. Endast fält som finns med i listan kommer att lagras. |
| `options.blacklist?`   | `string[]`    | -             | Svartlista för fält i `values`. Fält som finns med i listan kommer inte att lagras. |
| `options.transaction?` | `Transaction` | -             | Transaktion                                                                 |