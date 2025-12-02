:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Parameter

| Parametername          | Typ           | Standardwert | Beschreibung                                                                |
| :--------------------- | :------------ | :----------- | :-------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`         | Das einzufügende Datenobjekt.                                               |
| `options.whitelist?`   | `string[]`    | -            | Die Whitelist der Felder für `values`. Nur die Felder, die in dieser Liste enthalten sind, werden gespeichert. |
| `options.blacklist?`   | `string[]`    | -            | Die Blacklist der Felder für `values`. Die Felder, die in dieser Liste enthalten sind, werden nicht gespeichert. |
| `options.transaction?` | `Transaction` | -            | Die Transaktion.                                                            |