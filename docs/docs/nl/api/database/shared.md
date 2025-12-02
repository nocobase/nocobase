:::tip AI-vertaalmelding
Deze documentatie is automatisch vertaald door AI.
:::


## Parameters

| Parameternaam          | Type          | Standaardwaarde | Beschrijving                                                              |
| :--------------------- | :------------ | :-------------- | :------------------------------------------------------------------------ |
| `options.values`       | `M`           | `{}`            | Het in te voegen data-object                                              |
| `options.whitelist?`   | `string[]`    | -               | Whitelist van velden voor `values`. Alleen velden die in deze lijst staan, worden opgeslagen. |
| `options.blacklist?`   | `string[]`    | -               | Blacklist van velden voor `values`. Velden die in deze lijst staan, worden niet opgeslagen.   |
| `options.transaction?` | `Transaction` | -               | Transactie                                                                |