:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Komponenty pól relacji

## Wprowadzenie

Komponenty pól relacji w NocoBase zostały zaprojektowane, aby pomóc Państwu lepiej wyświetlać i przetwarzać powiązane dane. Niezależnie od typu relacji, komponenty te są elastyczne i uniwersalne, co pozwala Państwu wybierać i konfigurować je zgodnie z Państwa specyficznymi potrzebami.

### Lista rozwijana

Dla wszystkich pól relacji, z wyjątkiem sytuacji, gdy docelowa **kolekcja** jest **kolekcją** plików, domyślnym komponentem w trybie edycji jest lista rozwijana. Opcje listy rozwijanej wyświetlają wartość pola tytułowego, co sprawia, że jest to idealne rozwiązanie do szybkiego wyboru powiązanych danych poprzez wyświetlenie kluczowych informacji o polu.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Więcej szczegółów znajdą Państwo w [Lista rozwijana](/interface-builder/fields/specific/select)

### Selektor danych

Selektor danych prezentuje dane w formie wyskakującego okna modalnego. Mogą Państwo skonfigurować pola do wyświetlenia w selektorze danych (w tym pola z zagnieżdżonych relacji), co pozwala na bardziej precyzyjny wybór powiązanych danych.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Więcej szczegółów znajdą Państwo w [Selektor danych](/interface-builder/fields/specific/picker)

### Podformularz

Podczas pracy ze złożonymi danymi relacyjnymi, użycie listy rozwijanej lub selektora danych może być niewygodne. W takich przypadkach często trzeba otwierać wyskakujące okna. Właśnie dla takich scenariuszy można zastosować podformularz. Pozwala on Państwu bezpośrednio zarządzać polami powiązanej **kolekcji** na bieżącej stronie lub w bieżącym bloku wyskakującego okna, bez konieczności wielokrotnego otwierania nowych okien, co sprawia, że **przepływ pracy** jest płynniejszy. Relacje wielopoziomowe są wyświetlane w postaci zagnieżdżonych formularzy.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Więcej szczegółów znajdą Państwo w [Podformularz](/interface-builder/fields/specific/sub-form)

### Podtabela

Podtabela wyświetla rekordy relacji jeden do wielu lub wiele do wielu w formacie tabelarycznym. Zapewnia ona przejrzysty, ustrukturyzowany sposób wyświetlania i zarządzania powiązanymi danymi, a także obsługuje masowe tworzenie nowych danych lub wybieranie istniejących danych do powiązania.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Więcej szczegółów znajdą Państwo w [Podtabela](/interface-builder/fields/specific/sub-table)

### Podgląd szczegółów

Podgląd szczegółów to komponent odpowiadający podformularzowi w trybie tylko do odczytu. Obsługuje wyświetlanie danych z zagnieżdżonymi relacjami wielopoziomowymi.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Więcej szczegółów znajdą Państwo w [Podgląd szczegółów](/interface-builder/fields/specific/sub-detail)

### Menedżer plików

Menedżer plików to komponent pola relacji, specjalnie przeznaczony do użycia, gdy docelowa **kolekcja** relacji jest **kolekcją** plików.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Więcej szczegółów znajdą Państwo w [Menedżer plików](/interface-builder/fields/specific/file-manager)

### Tytuł

Komponent pola tytułowego to komponent pola relacji używany w trybie tylko do odczytu. Konfigurując pole tytułowe, mogą Państwo skonfigurować odpowiadający mu komponent pola.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Więcej szczegółów znajdą Państwo w [Tytuł](/interface-builder/fields/specific/title)