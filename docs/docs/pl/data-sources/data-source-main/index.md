---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Główna baza danych

## Wprowadzenie

Główna baza danych NocoBase służy do przechowywania zarówno danych biznesowych, jak i metadanych aplikacji, w tym danych tabel systemowych oraz niestandardowych. Obsługuje relacyjne bazy danych, takie jak MySQL, PostgreSQL i inne. Jest instalowana wraz z aplikacją NocoBase i nie można jej usunąć.

## Instalacja

To wbudowana wtyczka, więc nie wymaga osobnej instalacji.

## Zarządzanie kolekcjami

Główne źródło danych oferuje pełną funkcjonalność zarządzania kolekcjami. Mogą Państwo tworzyć nowe kolekcje bezpośrednio w NocoBase lub synchronizować istniejące struktury tabel z bazy danych.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Synchronizacja istniejących tabel z bazy danych

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Ważną cechą głównego źródła danych jest możliwość synchronizacji tabel już istniejących w bazie danych z NocoBase w celu ich zarządzania. Oznacza to, że:

- **Ochrona istniejących inwestycji**: Jeśli w Państwa bazie danych znajduje się już wiele tabel biznesowych, nie ma potrzeby ich ponownego tworzenia – można je bezpośrednio synchronizować i używać.
- **Elastyczna integracja**: Tabele utworzone za pomocą innych narzędzi (takich jak skrypty SQL, narzędzia do zarządzania bazami danych itp.) mogą być włączone do zarządzania w NocoBase.
- **Stopniowa migracja**: Obsługa stopniowej migracji istniejących systemów do NocoBase, zamiast jednorazowej przebudowy.

Dzięki funkcji „Wczytaj z bazy danych” mogą Państwo:
1. Przeglądać wszystkie tabele w bazie danych
2. Wybierać tabele do synchronizacji
3. Automatycznie identyfikować struktury tabel i typy pól
4. Importować je do NocoBase w celu zarządzania, za pomocą jednego kliknięcia.

### Obsługa wielu typów kolekcji

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase umożliwia tworzenie i zarządzanie różnymi typami kolekcji:
- **Kolekcja ogólna**: zawiera wbudowane, często używane pola systemowe;
- **Kolekcja dziedzicząca**: pozwala na utworzenie tabeli nadrzędnej, z której można wyprowadzić tabele podrzędne. Tabele podrzędne dziedziczą strukturę tabeli nadrzędnej, a jednocześnie mogą definiować własne kolumny.
- **Kolekcja drzewiasta**: tabela o strukturze drzewa, obecnie obsługuje tylko projektowanie listy sąsiedztwa;
- **Kolekcja kalendarza**: służy do tworzenia tabel zdarzeń związanych z kalendarzem;
- **Kolekcja plików**: do zarządzania przechowywaniem plików;
- **Kolekcja wyrażeń**: do scenariuszy dynamicznych wyrażeń w przepływach pracy;
- **Kolekcja SQL**: nie jest rzeczywistą tabelą bazy danych, lecz szybko prezentuje zapytania SQL w ustrukturyzowany sposób;
- **Kolekcja widoków bazy danych**: łączy się z istniejącymi widokami bazy danych;
- **Kolekcja FDW**: umożliwia systemowi bazy danych bezpośredni dostęp i wykonywanie zapytań do danych w zewnętrznych źródłach danych, w oparciu o technologię FDW;

### Obsługa zarządzania kolekcjami według kategorii

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Bogate typy pól

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Elastyczna konwersja typów pól

NocoBase umożliwia elastyczną konwersję typów pól w ramach tego samego typu bazy danych.

**Przykład: Opcje konwersji pola typu String**

Gdy pole w bazie danych jest typu String, można je przekonwertować w NocoBase na dowolną z poniższych form:

- **Podstawowe**: Tekst jednowierszowy, Tekst wielowierszowy, Numer telefonu, Adres e-mail, URL, Hasło, Kolor, Ikona
- **Wybór**: Lista rozwijana (jednokrotny wybór), Grupa przycisków radiowych
- **Multimedia**: Markdown, Markdown (Vditor), Tekst sformatowany, Załącznik (URL)
- **Data i czas**: Data i czas (ze strefą czasową), Data i czas (bez strefy czasowej)
- **Zaawansowane**: Sekwencja, Selektor kolekcji, Szyfrowanie

Ten elastyczny mechanizm konwersji oznacza, że:
- **Brak konieczności modyfikacji struktury bazy danych**: Podstawowy typ przechowywania pola pozostaje niezmieniony; zmienia się jedynie jego reprezentacja w NocoBase.
- **Dostosowanie do zmian biznesowych**: W miarę ewolucji potrzeb biznesowych mogą Państwo szybko dostosowywać sposób wyświetlania i interakcji z polami.
- **Bezpieczeństwo danych**: Proces konwersji nie wpływa na integralność istniejących danych.

### Elastyczna synchronizacja na poziomie pól

NocoBase umożliwia synchronizację nie tylko całych tabel, ale także precyzyjne zarządzanie synchronizacją na poziomie poszczególnych pól:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Cechy synchronizacji pól:

1. **Synchronizacja w czasie rzeczywistym**: Gdy struktura tabeli bazy danych ulegnie zmianie, nowo dodane pola można zsynchronizować w dowolnym momencie.
2. **Selektywna synchronizacja**: Mogą Państwo selektywnie synchronizować tylko potrzebne pola, zamiast wszystkich.
3. **Automatyczne rozpoznawanie typów**: Automatycznie identyfikuje typy pól bazy danych i mapuje je na typy pól NocoBase.
4. **Zachowanie integralności danych**: Proces synchronizacji nie wpływa na istniejące dane.

#### Scenariusze użycia:

- **Ewolucja schematu bazy danych**: Gdy zmieniają się potrzeby biznesowe i konieczne jest dodanie nowych pól do bazy danych, można je szybko zsynchronizować z NocoBase.
- **Współpraca zespołowa**: Gdy inni członkowie zespołu lub administratorzy baz danych (DBA) dodają pola do bazy danych, można je natychmiast zsynchronizować.
- **Hybrydowy tryb zarządzania**: Niektóre pola są zarządzane za pośrednictwem NocoBase, inne za pomocą tradycyjnych metod – elastyczne kombinacje.

Ten elastyczny mechanizm synchronizacji pozwala NocoBase doskonale integrować się z istniejącymi architekturami technicznymi, bez konieczności zmiany dotychczasowych praktyk zarządzania bazami danych, jednocześnie czerpiąc korzyści z wygody, jaką oferuje NocoBase w zakresie rozwoju low-code.

Więcej informacji znajdą Państwo w sekcji „[Pola kolekcji / Przegląd](/data-sources/data-modeling/collection-fields)”.