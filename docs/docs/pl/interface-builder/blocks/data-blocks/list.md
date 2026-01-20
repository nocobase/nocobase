---
pkg: "@nocobase/plugin-block-list"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Blok listy

## Wprowadzenie

Blok listy wyświetla dane w formie listy, co sprawia, że jest idealny do prezentacji danych takich jak listy zadań, aktualności czy informacje o produktach.

## Konfiguracja bloku

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Ustawianie zakresu danych

Jak pokazano na ilustracji: Filtrowanie zamówień o statusie „Anulowane”.

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Więcej szczegółów znajdą Państwo w sekcji [Ustawianie zakresu danych](/interface-builder/blocks/block-settings/data-scope).

### Ustawianie reguł sortowania

Jak pokazano na ilustracji: Sortowanie według kwoty zamówienia w kolejności malejącej.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Więcej szczegółów znajdą Państwo w sekcji [Ustawianie reguł sortowania](/interface-builder/blocks/block-settings/sorting-rule).

## Konfiguracja pól

### Pola z bieżącej kolekcji

> **Uwaga**: Pola z dziedziczonych kolekcji (czyli pól kolekcji nadrzędnych) są automatycznie łączone i wyświetlane na bieżącej liście pól.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Pola z powiązanych kolekcji

> **Uwaga**: Możliwe jest wyświetlanie pól z powiązanych kolekcji (obecnie obsługiwane są tylko relacje jeden-do-jednego).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Konfigurację pól listy znajdą Państwo w sekcji [Pole szczegółów](/interface-builder/fields/generic/detail-form-item).

## Konfiguracja akcji

### Akcje globalne

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Filtrowanie](/interface-builder/actions/types/filter)
- [Dodawanie](/interface-builder/actions/types/add-new)
- [Usuwanie](/interface-builder/actions/types/delete)
- [Odświeżanie](/interface-builder/actions/types/refresh)
- [Importowanie](/interface-builder/actions/types/import)
- [Eksportowanie](/interface-builder/actions/types/export)
- [Drukowanie z szablonu](/template-print/index)
- [Masowa aktualizacja](/interface-builder/actions/types/bulk-update)
- [Eksportowanie załączników](/interface-builder/actions/types/export-attachments)
- [Uruchamianie przepływu pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)

### Akcje wierszy

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Edycja](/interface-builder/actions/types/edit)
- [Usuwanie](/interface-builder/actions/types/delete)
- [Linkowanie](/interface-builder/actions/types/link)
- [Wyskakujące okienko](/interface-builder/actions/types/pop-up)
- [Aktualizacja rekordu](/interface-builder/actions/types/update-record)
- [Drukowanie z szablonu](/template-print/index)
- [Uruchamianie przepływu pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)