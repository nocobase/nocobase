:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Blok tabeli

## Wprowadzenie

Blok tabeli to jeden z podstawowych, wbudowanych bloków danych w **NocoBase**, służący głównie do wyświetlania i zarządzania ustrukturyzowanymi danymi w formie tabelarycznej. Oferuje elastyczne opcje konfiguracji, dzięki którym mogą Państwo dostosować kolumny tabeli, ich szerokość, zasady sortowania oraz zakres danych do swoich potrzeb, aby wyświetlane dane odpowiadały konkretnym wymaganiom biznesowym.

#### Główne funkcje:
- **Elastyczna konfiguracja kolumn**: Mogą Państwo dostosować kolumny i ich szerokość w tabeli, aby odpowiadały różnym potrzebom prezentacji danych.
- **Zasady sortowania**: Obsługuje sortowanie danych w tabeli. Mogą Państwo sortować dane rosnąco lub malejąco według różnych pól.
- **Ustawianie zakresu danych**: Poprzez ustawienie zakresu danych mogą Państwo kontrolować wyświetlany zakres, unikając zakłóceń ze strony nieistotnych informacji.
- **Konfiguracja operacji**: Blok tabeli posiada wbudowane różne opcje operacji. Mogą Państwo łatwo skonfigurować takie działania jak filtrowanie, dodawanie nowych pozycji, edycja czy usuwanie, aby szybko zarządzać danymi.
- **Szybka edycja**: Obsługuje bezpośrednią edycję danych w tabeli, co upraszcza proces i zwiększa efektywność pracy.

## Ustawienia bloku

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Reguły powiązania bloków

Kontrolują zachowanie bloku (np. czy ma być wyświetlany lub wykonywać JavaScript) za pomocą reguł powiązania.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Więcej informacji znajdą Państwo w [Regułach powiązania](/interface-builder/linkage-rule)

### Ustawianie zakresu danych

Przykład: Domyślnie filtruj zamówienia ze „Statusem” „Opłacone”.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Więcej informacji znajdą Państwo w [Ustawianiu zakresu danych](/interface-builder/blocks/block-settings/data-scope)

### Ustawianie zasad sortowania

Przykład: Wyświetlanie zamówień według daty w kolejności malejącej.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Więcej informacji znajdą Państwo w [Ustawianiu zasad sortowania](/interface-builder/blocks/block-settings/sorting-rule)

### Włączanie szybkiej edycji

Aktywując opcję „Włącz szybką edycję” w ustawieniach bloku i konfiguracji kolumn tabeli, mogą Państwo dostosować, które kolumny będą dostępne do szybkiej edycji.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Włączanie tabeli drzewiastej

Gdy tabela danych ma strukturę drzewiastą, blok tabeli może włączyć funkcję „Włącz tabelę drzewiastą”. Domyślnie opcja ta jest wyłączona. Po włączeniu blok będzie wyświetlał dane w strukturze drzewiastej i obsługiwał odpowiednie opcje konfiguracji oraz funkcje operacyjne.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Domyślne rozwijanie wszystkich wierszy

Gdy tabela drzewiasta jest włączona, blok obsługuje domyślne rozwijanie wszystkich podrzędnych danych podczas ładowania.

## Konfiguracja pól

### Pola tej kolekcji

> **Uwaga**: Pola z dziedziczonych kolekcji (tj. pola kolekcji nadrzędnej) są automatycznie łączone i wyświetlane na bieżącej liście pól.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Pola powiązanych kolekcji

> **Uwaga**: Obsługiwane jest wyświetlanie pól z powiązanych kolekcji (obecnie tylko dla relacji jeden-do-jednego).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Inne niestandardowe kolumny

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [Pole JS](/interface-builder/fields/specific/js-field)
- [Kolumna JS](/interface-builder/fields/specific/js-column)

## Konfiguracja operacji

### Operacje globalne

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrowanie](/interface-builder/actions/types/filter)
- [Dodaj nowy](/interface-builder/actions/types/add-new)
- [Usuń](/interface-builder/actions/types/delete)
- [Odśwież](/interface-builder/actions/types/refresh)
- [Importuj](/interface-builder/actions/types/import)
- [Eksportuj](/interface-builder/actions/types/export)
- [Drukuj szablon](/template-print/index)
- [Masowa aktualizacja](/interface-builder/actions/types/bulk-update)
- [Eksportuj załączniki](/interface-builder/actions/types/export-attachments)
- [Uruchom przepływ pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)

### Operacje na wierszach

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Podgląd](/interface-builder/actions/types/view)
- [Edytuj](/interface-builder/actions/types/edit)
- [Usuń](/interface-builder/actions/types/delete)
- [Wyskakujące okno](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Aktualizuj rekord](/interface-builder/actions/types/update-record)
- [Drukuj szablon](/template-print/index)
- [Uruchom przepływ pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)