:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/blocks/data-blocks/form).
:::

# Blok formularza

## Wprowadzenie

Blok formularza jest ważnym blokiem służącym do budowania interfejsów wprowadzania i edycji danych. Jest on wysoce konfigurowalny i wykorzystuje odpowiednie komponenty do wyświetlania wymaganych pól w oparciu o model danych. Poprzez przepływy zdarzeń, takie jak reguły powiązań, blok formularza może dynamicznie wyświetlać pola. Ponadto można go łączyć z przepływami pracy, aby realizować automatyczne wyzwalanie procesów i przetwarzanie danych, co dodatkowo zwiększa wydajność pracy lub umożliwia orkiestrację logiki.

## Dodawanie bloku formularza

- **Edytuj formularz**: Służy do modyfikowania istniejących danych.
- **Dodaj formularz**: Służy do tworzenia nowych wpisów danych.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Opcje konfiguracji bloku

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Reguły powiązań bloku

Kontroluj zachowanie bloku (np. czy ma być wyświetlany lub czy ma wykonywać JavaScript) za pomocą reguł powiązań.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Więcej informacji znajdą Państwo w sekcji [Reguły powiązań bloku](/interface-builder/blocks/block-settings/block-linkage-rule)

### Reguły powiązań pól

Kontroluj zachowanie pól formularza za pomocą reguł powiązań.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Więcej informacji znajdą Państwo w sekcji [Reguły powiązań pól](/interface-builder/blocks/block-settings/field-linkage-rule)

### Układ

Blok formularza obsługuje dwa sposoby układu, ustawiane za pomocą atrybutu `layout`:

- **horizontal** (układ poziomy): Ten układ sprawia, że etykieta i zawartość są wyświetlane w jednym wierszu, co oszczędza przestrzeń pionową i jest odpowiednie dla prostych formularzy lub przypadków z mniejszą ilością informacji.
- **vertical** (układ pionowy) (domyślny): Etykieta znajduje się nad polem. Ten układ sprawia, że formularz jest łatwiejszy do czytania i wypełniania, szczególnie w przypadku formularzy zawierających wiele pól lub złożone elementy wejściowe.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfiguracja pól

### Pola tej kolekcji

> **Uwaga**: Pola z dziedziczonych kolekcji (tj. pola kolekcji nadrzędnych) są automatycznie scalane i wyświetlane na bieżącej liście pól.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Pola powiązanej kolekcji

> Pola powiązanej kolekcji są w formularzu tylko do odczytu i zazwyczaj są używane w połączeniu z polami powiązań, aby wyświetlić wiele wartości pól powiązanych danych.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Obecnie obsługiwane są tylko relacje typu „do jednego” (takie jak belongsTo / hasOne itp.).
- Zazwyczaj jest używane w połączeniu z polami powiązań (służącymi do wyboru powiązanych rekordów): komponent pola powiązania odpowiada za wybór/zmianę powiązanego rekordu, natomiast pole powiązanej kolekcji odpowiada za wyświetlanie dodatkowych informacji o tym rekordzie (tylko do odczytu).

**Przykład**: Po wybraniu „Osoby odpowiedzialnej”, w formularzu wyświetlany jest numer telefonu, adres e-mail i inne informacje o tej osobie.

> Jeśli w formularzu edycji nie skonfigurowano pola powiązania „Osoba odpowiedzialna”, odpowiednie informacje o powiązaniu nadal mogą być wyświetlane. Po skonfigurowaniu pola powiązania „Osoba odpowiedzialna”, zmiana tej osoby spowoduje aktualizację informacji o powiązaniu do odpowiedniego rekordu.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Inne pola

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Pisanie kodu JavaScript pozwala na realizację niestandardowej zawartości wyświetlania i prezentację złożonych treści.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Szablon pola

Szablony pól służą do ponownego wykorzystania konfiguracji obszaru pól w blokach formularzy. Szczegóły w [Szablon pola](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Konfiguracja akcji

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Prześlij](/interface-builder/actions/types/submit)
- [Uruchom przepływ pracy](/interface-builder/actions/types/trigger-workflow)
- [Akcja JS](/interface-builder/actions/types/js-action)
- [Pracownik AI](/interface-builder/actions/types/ai-employee)