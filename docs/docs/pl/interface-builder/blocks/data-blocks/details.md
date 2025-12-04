:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Blok szczegółów

## Wprowadzenie

Blok szczegółów służy do wyświetlania wartości poszczególnych pól każdego rekordu danych. Obsługuje elastyczne układy pól i ma wbudowane funkcje operacji na danych, co ułatwia Państwu przeglądanie i zarządzanie informacjami.

## Ustawienia bloku

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Reguły powiązań bloku

Kontrolują Państwo zachowanie bloku (np. czy ma być wyświetlany, czy ma wykonywać JavaScript) za pomocą reguł powiązań.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Więcej szczegółów znajdą Państwo w [Regułach powiązań](/interface-builder/linkage-rule).

### Ustawianie zakresu danych

Przykład: Wyświetlaj tylko opłacone zamówienia.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Więcej szczegółów znajdą Państwo w [Ustawianiu zakresu danych](/interface-builder/blocks/block-settings/data-scope).

### Reguły powiązań pól

Reguły powiązań w bloku szczegółów umożliwiają dynamiczne ustawianie pól, aby je pokazywać lub ukrywać.

Przykład: Nie wyświetlaj kwoty, gdy status zamówienia to „Anulowano”.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Więcej szczegółów znajdą Państwo w [Regułach powiązań](/interface-builder/linkage-rule).

## Konfigurowanie pól

### Pola z bieżącej kolekcji

> **Uwaga**: Pola z dziedziczonych kolekcji (tj. pola kolekcji nadrzędnej) są automatycznie scalane i wyświetlane na bieżącej liście pól.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Pola z powiązanych kolekcji

> **Uwaga**: Obsługiwane jest wyświetlanie pól z powiązanych kolekcji (obecnie tylko dla relacji jeden do jednego).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Inne pola
- JS Field
- JS Item
- Separator
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Wskazówka**: Mogą Państwo napisać kod JavaScript, aby zaimplementować niestandardową zawartość wyświetlaną, co pozwoli na pokazanie bardziej złożonych informacji.  
> Na przykład, mogą Państwo renderować różne efekty wyświetlania w zależności od typów danych, warunków lub logiki.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Konfigurowanie akcji

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Edytuj](/interface-builder/actions/types/edit)
- [Usuń](/interface-builder/actions/types/delete)
- [Link](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Aktualizuj rekord](/interface-builder/actions/types/update-record)
- [Uruchom przepływ pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)