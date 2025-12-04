:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd rozszerzeń bloków

W NocoBase 2.0 mechanizm rozszerzeń bloków został znacznie uproszczony. Deweloperzy, aby szybko dostosować bloki, muszą jedynie dziedziczyć po odpowiedniej klasie bazowej **FlowModel** i zaimplementować powiązane metody interfejsu (głównie metodę `renderComponent()`).

## Kategorie bloków

NocoBase dzieli bloki na trzy typy, które są wyświetlane w grupach w interfejsie konfiguracji:

- **Bloki danych** (Data blocks): Bloki, które dziedziczą po `DataBlockModel` lub `CollectionBlockModel`.
- **Bloki filtrowania** (Filter blocks): Bloki, które dziedziczą po `FilterBlockModel`.
- **Inne bloki** (Other blocks): Bloki, które bezpośrednio dziedziczą po `BlockModel`.

> Grupowanie bloków jest określane przez odpowiadającą im klasę bazową. Logika klasyfikacji opiera się na relacjach dziedziczenia i nie wymaga dodatkowej konfiguracji.

## Opis klas bazowych

System udostępnia cztery klasy bazowe do rozszerzeń:

### BlockModel

**Podstawowy model bloku**, najbardziej wszechstronna klasa bazowa bloku.

- Odpowiedni dla bloków służących wyłącznie do wyświetlania, które nie zależą od danych.
- Kategoryzowany do grupy **Inne bloki** (Other blocks).
- Ma zastosowanie w spersonalizowanych scenariuszach.

### DataBlockModel

**Model bloku danych (niepowiązany z tabelą danych)**, przeznaczony dla bloków z niestandardowymi źródłami danych.

- Nie jest bezpośrednio powiązany z tabelą danych; pozwala na dostosowanie logiki pobierania danych.
- Kategoryzowany do grupy **Bloki danych** (Data blocks).
- Ma zastosowanie w scenariuszach takich jak: wywoływanie zewnętrznych API, niestandardowe przetwarzanie danych, wykresy statystyczne itp.

### CollectionBlockModel

**Model bloku kolekcji**, dla bloków, które muszą być powiązane z tabelą danych.

- Wymaga powiązania z klasą bazową modelu tabeli danych.
- Kategoryzowany do grupy **Bloki danych** (Data blocks).
- Ma zastosowanie w: listach, formularzach, tablicach Kanban i innych blokach, które wyraźnie zależą od konkretnej tabeli danych.

### FilterBlockModel

**Model bloku filtrowania**, służący do budowania bloków warunków filtrowania.

- Klasa bazowa modelu do budowania warunków filtrowania.
- Kategoryzowany do grupy **Bloki filtrowania** (Filter blocks).
- Zazwyczaj działa w połączeniu z blokami danych.

## Jak wybrać klasę bazową

Przy wyborze klasy bazowej mogą Państwo kierować się następującymi zasadami:

- **Potrzeba powiązania z tabelą danych**: Proszę priorytetowo wybrać `CollectionBlockModel`.
- **Niestandardowe źródło danych**: Proszę wybrać `DataBlockModel`.
- **Do ustawiania warunków filtrowania i współpracy z blokami danych**: Proszę wybrać `FilterBlockModel`.
- **Niepewność co do kategoryzacji**: Proszę wybrać `BlockModel`.

## Szybki start

Tworzenie niestandardowego bloku wymaga tylko trzech kroków:

1. Dziedziczenie po odpowiedniej klasie bazowej (np. `BlockModel`).
2. Implementacja metody `renderComponent()`, aby zwrócić komponent React.
3. Rejestracja modelu bloku we wtyczce.

Szczegółowe przykłady znajdą Państwo w [pisaniu wtyczki bloku](./write-a-block-plugin).