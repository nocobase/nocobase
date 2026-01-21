:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wybór kaskadowy

## Wprowadzenie

Selektor kaskadowy jest przeznaczony dla pól relacji, których docelowa kolekcja jest kolekcją drzewiastą. Umożliwia on użytkownikom wybieranie danych zgodnie z hierarchiczną strukturą kolekcji drzewiastej, a także obsługuje wyszukiwanie rozmyte (fuzzy search) w celu szybkiego filtrowania.

## Instrukcja użycia

- Dla relacji **jeden-do-jednego** (to-one), selektor kaskadowy jest **jednokrotnego wyboru**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Dla relacji **jeden-do-wielu** (to-many), selektor kaskadowy jest **wielokrotnego wyboru**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Opcje konfiguracji pola

### Pole tytułowe

Pole tytułowe określa etykietę wyświetlaną dla każdej opcji.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Obsługuje szybkie wyszukiwanie na podstawie pola tytułowego.

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Więcej szczegółów znajdą Państwo w: [Pole tytułowe](/interface-builder/fields/field-settings/title-field)

### Zakres danych

Kontroluje zakres danych listy drzewiastej (jeśli rekord podrzędny spełnia warunki, jego rekord nadrzędny również zostanie uwzględniony).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Więcej szczegółów znajdą Państwo w: [Zakres danych](/interface-builder/fields/field-settings/data-scope)

[Komponenty pól](/interface-builder/fields/association-field)