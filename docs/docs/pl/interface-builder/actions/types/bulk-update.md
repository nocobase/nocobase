---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zbiorcza aktualizacja

## Wprowadzenie

Operacja zbiorczej aktualizacji jest używana, gdy potrzebuje Pan/Pani zastosować tę samą zmianę do grupy rekordów. Przed wykonaniem zbiorczej aktualizacji, należy wcześniej zdefiniować logikę przypisywania wartości do pól. Ta logika zostanie zastosowana do wszystkich wybranych rekordów, gdy Pan/Pani kliknie przycisk aktualizacji.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Konfiguracja akcji

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Dane do aktualizacji

Wybrane/Wszystkie, domyślnie: Wybrane.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Przypisanie wartości pól

Proszę ustawić pola do zbiorczej aktualizacji. Zaktualizowane zostaną tylko te pola, które Pan/Pani wskaże.

Jak pokazano na rysunku, konfigurując akcję zbiorczej aktualizacji w tabeli zamówień, może Pan/Pani zbiorczo zaktualizować wybrane dane na status „Oczekujące na zatwierdzenie”.

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Edytuj przycisk](/interface-builder/actions/action-settings/edit-button): Edycja tytułu, typu i ikony przycisku;
- [Zasada powiązania](/interface-builder/actions/action-settings/linkage-rule): Dynamiczne wyświetlanie/ukrywanie przycisku;
- [Podwójne potwierdzenie](/interface-builder/actions/action-settings/double-check)