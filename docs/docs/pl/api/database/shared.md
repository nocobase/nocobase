:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Parametry

| Nazwa parametru        | Typ           | Wartość domyślna | Opis                                                              |
| :--------------------- | :------------ | :--------------- | :---------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`             | Obiekt danych do wstawienia.                                      |
| `options.whitelist?`   | `string[]`    | -                | Biała lista pól dla `values`. Zapisane zostaną tylko pola znajdujące się na liście. |
| `options.blacklist?`   | `string[]`    | -                | Czarna lista pól dla `values`. Pola znajdujące się na liście nie zostaną zapisane.   |
| `options.transaction?` | `Transaction` | -                | Transakcja.                                                       |