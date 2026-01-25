---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Akcja SQL

## Wprowadzenie

W niektórych specyficznych scenariuszach, gdy proste węzły operacji na kolekcjach nie są w stanie obsłużyć złożonych operacji, mogą Państwo bezpośrednio użyć węzła SQL, aby baza danych bezpośrednio wykonywała złożone zapytania SQL do manipulacji danymi.

Różnica w porównaniu do bezpośredniego łączenia się z bazą danych i wykonywania operacji SQL poza aplikacją polega na tym, że w ramach przepływu pracy mogą Państwo używać zmiennych z kontekstu procesu jako parametrów w zapytaniu SQL.

## Instalacja

Jest to wbudowana wtyczka, więc instalacja nie jest wymagana.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Akcja SQL”:

![Dodaj Akcję SQL](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Konfiguracja węzła

![Węzeł SQL_Konfiguracja węzła](https://static-docs.nocobase.com/20240904002334.png)

### Źródło danych

Proszę wybrać źródło danych, w którym zostanie wykonane zapytanie SQL.

Źródło danych musi być typu bazodanowego, takiego jak główne źródło danych, typ PostgreSQL lub inne źródła danych kompatybilne z Sequelize.

### Treść SQL

Proszę edytować zapytanie SQL. Obecnie obsługiwane jest tylko jedno zapytanie SQL.

Proszę wstawić wymagane zmienne za pomocą przycisku zmiennych w prawym górnym rogu edytora. Przed wykonaniem, zmienne te zostaną zastąpione ich odpowiednimi wartościami poprzez podstawienie tekstu. Powstały tekst zostanie następnie użyty jako ostateczne zapytanie SQL i wysłany do bazy danych w celu wykonania zapytania.

## Wynik wykonania węzła

Od wersji `v1.3.15-beta` wynik wykonania węzła SQL to tablica czystych danych. Wcześniej była to natywna struktura zwracana przez Sequelize, zawierająca metadane zapytania (zob.: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Na przykład, poniższe zapytanie:

```sql
select count(id) from posts;
```

Wynik przed `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Wynik po `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Często zadawane pytania

### Jak używać wyników węzła SQL?

Jeśli użyto instrukcji `SELECT`, wynik zapytania zostanie zapisany w węźle w formacie JSON Sequelize. Można go parsować i używać za pomocą wtyczki [JSON-query](./json-query.md).

### Czy akcja SQL wywołuje zdarzenia kolekcji?

**Nie**. Akcja SQL bezpośrednio wysyła zapytanie SQL do bazy danych w celu przetworzenia. Powiązane operacje `CREATE` / `UPDATE` / `DELETE` odbywają się w bazie danych, natomiast zdarzenia kolekcji występują na warstwie aplikacji Node.js (obsługiwane przez ORM), dlatego zdarzenia kolekcji nie zostaną wywołane.