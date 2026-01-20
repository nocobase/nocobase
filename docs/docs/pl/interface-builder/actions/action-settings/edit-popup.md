:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Edycja okna modalnego

## Wprowadzenie

Każda akcja lub pole, które po kliknięciu otwiera okno modalne, umożliwia konfigurację sposobu otwierania, rozmiaru i innych ustawień tego okna.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Sposób otwierania

- Panel boczny

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Okno dialogowe

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Podstrona

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Rozmiar okna modalnego

- Duży
- Średni (domyślny)
- Mały

## Popup UID

„Popup UID” to unikalny identyfikator (UID) komponentu, który otwiera dane okno modalne. Odpowiada on również segmentowi `viewUid` w adresie URL (`view/:viewUid`). Mogą Państwo szybko go uzyskać, klikając „Kopiuj Popup UID” w menu ustawień pola lub przycisku, które wywołuje okno modalne.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

Ustawienie „Popup UID” umożliwia ponowne wykorzystanie okna modalnego.

### Wewnętrzne okno modalne (domyślne)
- „Popup UID” jest równy UID bieżącego przycisku akcji (domyślnie używany jest UID tego przycisku).

### Zewnętrzne okno modalne (ponowne wykorzystanie istniejącego okna)
- W polu „Popup UID” należy wprowadzić UID przycisku wyzwalającego z innej lokalizacji (czyli „Popup UID”), aby ponownie wykorzystać to okno modalne.
- Typowe zastosowanie: wiele stron/bloków może współdzielić ten sam interfejs i logikę okna modalnego, co pozwala uniknąć powielania konfiguracji.
- W przypadku korzystania z zewnętrznego okna modalnego, niektóre opcje stają się tylko do odczytu (szczegóły poniżej).

## Inne powiązane opcje

- `Data source / Collection`: Tylko do odczytu. Wskazuje źródło danych i kolekcję, do której jest przypisane okno modalne; domyślnie używana jest kolekcja bieżącego bloku. W trybie zewnętrznego okna modalnego konfiguracja jest dziedziczona z docelowego okna i nie można jej zmienić.
- `Association name`: Opcjonalne. Służy do otwierania okna modalnego z pola powiązanego; wyświetlane tylko wtedy, gdy istnieje wartość domyślna. W trybie zewnętrznego okna modalnego konfiguracja jest dziedziczona z docelowego okna i nie można jej zmienić.
- `Source ID`: Pojawia się tylko wtedy, gdy ustawiono `Association name`; domyślnie używa `sourceId` z bieżącego kontekstu; można zmienić na zmienną lub stałą wartość w zależności od potrzeb.
- `filterByTk`: Może być puste, zmienną (opcjonalnie) lub stałą wartością, służącą do ograniczenia rekordów danych ładowanych do okna modalnego.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)