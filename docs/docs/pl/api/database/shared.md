:::tip Powiadomienie o tłumaczeniu AI
Ta dokumentacja została automatycznie przetłumaczona przez AI.
:::


## Parametry

| Nazwa parametru        | Typ           | Wartość domyślna | Opis                                                              |
| :--------------------- | :------------ | :--------------- | :---------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`             | Obiekt danych do wstawienia.                                      |
| `options.whitelist?`   | `string[]`    | -                | Biała lista pól dla `values`. Zapisane zostaną tylko pola znajdujące się na liście. |
| `options.blacklist?`   | `string[]`    | -                | Czarna lista pól dla `values`. Pola znajdujące się na liście nie zostaną zapisane.   |
| `options.transaction?` | `Transaction` | -                | Transakcja.                                                       |