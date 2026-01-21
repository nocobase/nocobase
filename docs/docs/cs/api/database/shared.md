:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


**Parametry**

| Název parametru        | Typ           | Výchozí hodnota | Popis                                                       |
| ---------------------- | ------------- | --------------- | ----------------------------------------------------------- |
| `options.values`       | `M`           | `{}`            | Objekt dat, která se mají vložit.                          |
| `options.whitelist?`   | `string[]`    | -               | Whitelist polí pro `values`. Uložena budou pouze pole uvedená v seznamu. |
| `options.blacklist?`   | `string[]`    | -               | Blacklist polí pro `values`. Pole uvedená v seznamu nebudou uložena. |
| `options.transaction?` | `Transaction` | -               | Transakce                                                   |