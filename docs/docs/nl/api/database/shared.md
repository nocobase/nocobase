:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Parameters

| Parameternaam          | Type          | Standaardwaarde | Beschrijving                                                              |
| :--------------------- | :------------ | :-------------- | :------------------------------------------------------------------------ |
| `options.values`       | `M`           | `{}`            | Het in te voegen data-object                                              |
| `options.whitelist?`   | `string[]`    | -               | Whitelist van velden voor `values`. Alleen velden die in deze lijst staan, worden opgeslagen. |
| `options.blacklist?`   | `string[]`    | -               | Blacklist van velden voor `values`. Velden die in deze lijst staan, worden niet opgeslagen.   |
| `options.transaction?` | `Transaction` | -               | Transactie                                                                |