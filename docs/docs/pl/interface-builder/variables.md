:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zmienne

## Wprowadzenie

Zmienne to zestaw znaczników służących do identyfikacji wartości w bieżącym kontekście. Można ich używać w różnych scenariuszach, takich jak konfigurowanie zakresów danych bloków, wartości domyślnych pól, reguł powiązań oraz przepływów pracy.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Obecnie obsługiwane zmienne

### Bieżący użytkownik

Reprezentuje dane aktualnie zalogowanego użytkownika.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Bieżąca rola

Reprezentuje identyfikator roli (nazwę roli) aktualnie zalogowanego użytkownika.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Bieżący formularz

Wartości bieżącego formularza, używane wyłącznie w blokach formularzy. Przykładowe zastosowania to:

- Reguły powiązań dla bieżącego formularza
- Wartości domyślne dla pól formularza (skuteczne tylko podczas dodawania nowych danych)
- Ustawienia zakresu danych dla pól powiązanych
- Konfiguracja przypisywania wartości pól dla akcji wysyłania

#### Reguły powiązań dla bieżącego formularza

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Wartości domyślne dla pól formularza (tylko formularz dodawania)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Ustawienia zakresu danych dla pól powiązanych

Służy do dynamicznego filtrowania opcji pola podrzędnego na podstawie pola nadrzędnego, co zapewnia dokładne wprowadzanie danych.

**Przykład:**

1. Użytkownik wybiera wartość dla pola **Właściciel**.
2. System automatycznie filtruje opcje dla pola **Konto** na podstawie **nazwy użytkownika** wybranego Właściciela.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Bieżący rekord

Rekord odnosi się do wiersza w kolekcji, gdzie każdy wiersz reprezentuje pojedynczy rekord. Zmienna „Bieżący rekord” jest dostępna w **regułach powiązań dla akcji wierszy** bloków typu wyświetlania.

Przykład: Wyłączenie przycisku usuwania dla dokumentów o statusie „Opłacone”.

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Bieżący rekord wyskakującego okienka

Akcje wyskakujących okienek odgrywają bardzo ważną rolę w konfiguracji interfejsu NocoBase.

- Wyskakujące okienko dla akcji wierszy: Każde wyskakujące okienko posiada zmienną „Bieżący rekord wyskakującego okienka”, która reprezentuje rekord bieżącego wiersza.
- Wyskakujące okienko dla pól powiązanych: Każde wyskakujące okienko posiada zmienną „Bieżący rekord wyskakującego okienka”, która reprezentuje aktualnie kliknięty rekord powiązania.

Bloki w wyskakującym okienku mogą używać zmiennej „Bieżący rekord wyskakującego okienka”. Powiązane zastosowania to:

- Konfigurowanie zakresu danych bloku
- Konfigurowanie zakresu danych pola powiązanego
- Konfigurowanie wartości domyślnych dla pól (w formularzu dodawania nowych danych)
- Konfigurowanie reguł powiązań dla akcji

### Parametry zapytania URL

Ta zmienna reprezentuje parametry zapytania w adresie URL bieżącej strony. Jest dostępna tylko wtedy, gdy w adresie URL strony istnieje ciąg zapytania. Wygodniej jest używać jej razem z [akcją Link](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### Token API

Wartość tej zmiennej to ciąg znaków, który stanowi poświadczenie dostępu do API NocoBase. Może być używany do weryfikacji tożsamości użytkownika.

### Bieżący typ urządzenia

Przykład: Nie wyświetlaj akcji „Drukuj szablon” na urządzeniach innych niż komputery stacjonarne.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)