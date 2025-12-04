:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Blok formularza

## Wprowadzenie

Blok formularza to ważny element służący do tworzenia interfejsów wprowadzania i edycji danych. Jest wysoce konfigurowalny i wykorzystuje odpowiednie komponenty do wyświetlania wymaganych pól w oparciu o model danych. Dzięki przepływom zdarzeń, takim jak reguły powiązań, blok formularza może dynamicznie wyświetlać pola. Ponadto, można go połączyć z przepływami pracy, aby uruchamiać zautomatyzowane procesy i przetwarzać dane, co dodatkowo zwiększa efektywność pracy lub umożliwia orkiestrację logiki.

## Dodawanie bloku formularza

- **Edytuj formularz**: Służy do modyfikowania istniejących danych.
- **Dodaj formularz**: Służy do tworzenia nowych wpisów danych.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Ustawienia bloku

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Reguła powiązania bloku

Kontroluj zachowanie bloku (np. czy ma być wyświetlany lub czy ma wykonywać JavaScript) za pomocą reguł powiązań.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Więcej szczegółów znajdą Państwo w [Reguła powiązania bloku](/interface-builder/blocks/block-settings/block-linkage-rule)

### Reguła powiązania pola

Kontroluj zachowanie pól formularza za pomocą reguł powiązań.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Więcej szczegółów znajdą Państwo w [Reguła powiązania pola](/interface-builder/blocks/block-settings/field-linkage-rule)

### Układ

Blok formularza obsługuje dwa tryby układu, które można ustawić za pomocą atrybutu `layout`:

- **horizontal** (układ poziomy): Ten układ wyświetla etykietę i zawartość w jednej linii, oszczędzając przestrzeń pionową. Jest odpowiedni dla prostych formularzy lub sytuacji z mniejszą ilością informacji.
- **vertical** (układ pionowy) (domyślny): Etykieta znajduje się nad polem. Ten układ sprawia, że formularz jest łatwiejszy do czytania i wypełniania, szczególnie w przypadku formularzy zawierających wiele pól lub złożonych elementów wejściowych.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfiguracja pól

### Pola tej kolekcji

> **Uwaga**: Pola z dziedziczonych kolekcji (tj. pola kolekcji nadrzędnych) są automatycznie łączone i wyświetlane na bieżącej liście pól.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Inne pola

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Pisanie kodu JavaScript pozwala dostosować wyświetlaną zawartość i prezentować złożone informacje.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Konfiguracja akcji

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Prześlij](/interface-builder/actions/types/submit)
- [Uruchom przepływ pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)