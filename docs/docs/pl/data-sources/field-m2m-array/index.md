---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Wiele-do-wielu (tablicowa)

## Wprowadzenie

Ta funkcja pozwala na wykorzystanie pól tablicowych w **kolekcji** danych do przechowywania wielu unikalnych kluczy z tabeli docelowej. W ten sposób tworzy się relację wiele-do-wielu między dwiema tabelami. Na przykład, proszę sobie wyobrazić encje takie jak 'Artykuły' i 'Tagi'. Jeden artykuł może być powiązany z wieloma tagami, a tabela artykułów będzie przechowywać identyfikatory odpowiadających rekordów z tabeli tagów w polu tablicowym.

:::warning{title=Uwaga}

- Proszę, w miarę możliwości, używać **kolekcji** pośredniczącej (tabeli łączącej) do ustanawiania standardowej relacji [wiele-do-wielu](../data-modeling/collection-fields/associations/m2m/index.md), zamiast polegać na tej metodzie.
- Obecnie tylko PostgreSQL obsługuje filtrowanie danych **kolekcji** źródłowej przy użyciu pól z tabeli docelowej dla relacji wiele-do-wielu ustanowionych za pomocą pól tablicowych. Na przykład, w powyższym scenariuszu, mogą Państwo filtrować artykuły na podstawie innych pól w tabeli tagów, takich jak tytuł.
  :::

### Konfiguracja pola

![Konfiguracja pola wiele-do-wielu (tablicowego)](https://static-docs.nocobase.com/202407051108180.png)

## Opis parametrów

### Kolekcja źródłowa

**Kolekcja** źródłowa, czyli **kolekcja**, w której znajduje się bieżące pole.

### Kolekcja docelowa

**Kolekcja** docelowa, z którą ustanawiana jest relacja.

### Klucz obcy

Pole tablicowe w **kolekcji** źródłowej, które przechowuje klucz docelowy z tabeli docelowej.

Poniżej przedstawiono odpowiadające sobie typy pól tablicowych:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Klucz docelowy

Pole w **kolekcji** docelowej, które odpowiada wartościom przechowywanym w polu tablicowym **kolekcji** źródłowej. To pole musi być unikalne.