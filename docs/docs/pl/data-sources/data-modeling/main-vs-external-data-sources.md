:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Porównanie głównych i zewnętrznych baz danych

Różnice między głównymi a zewnętrznymi bazami danych w NocoBase widoczne są przede wszystkim w czterech obszarach: obsłudze typów baz danych, obsłudze typów kolekcji, obsłudze typów pól oraz możliwościach tworzenia kopii zapasowych i migracji.

## 1. Obsługa typów baz danych

Więcej szczegółów znajdą Państwo w: [Zarządzanie źródłami danych](https://docs.nocobase.com/data-sources/data-source-manager)

### Typy baz danych

| Typ bazy danych | Obsługa przez główną bazę danych | Obsługa przez zewnętrzną bazę danych |
|------------------|----------------------------------|--------------------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Zarządzanie kolekcjami

| Zarządzanie kolekcjami | Obsługa przez główną bazę danych | Obsługa przez zewnętrzną bazę danych |
|------------------------|----------------------------------|--------------------------------------|
| Podstawowe zarządzanie | ✅ | ✅ |
| Zarządzanie wizualne | ✅ | ❌ |

## 2. Obsługa typów kolekcji

Więcej szczegółów znajdą Państwo w: [Kolekcje](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Typ kolekcji | Główna baza danych | Zewnętrzna baza danych | Opis |
|--------------|--------------------|-------------------------|----------------------------------------------------------------|
| Podstawowa | ✅ | ✅ | Kolekcja podstawowa |
| Widok | ✅ | ✅ | Widok źródła danych |
| Dziedziczenie | ✅ | ❌ | Obsługuje dziedziczenie modeli danych, tylko dla głównego źródła danych |
| Plik | ✅ | ❌ | Obsługuje przesyłanie plików, tylko dla głównego źródła danych |
| Komentarz | ✅ | ❌ | Wbudowany system komentarzy, tylko dla głównego źródła danych |
| Kalendarz | ✅ | ❌ | Kolekcja dla widoków kalendarza |
| Wyrażenie | ✅ | ❌ | Obsługuje obliczenia formuł |
| Drzewo | ✅ | ❌ | Do modelowania danych w strukturze drzewiastej |
| SQL | ✅ | ❌ | Kolekcja definiowana za pomocą SQL |
| Połączenie zewnętrzne | ✅ | ❌ | Kolekcja połączeń dla zewnętrznych źródeł danych, ograniczona funkcjonalność |

## 3. Obsługa typów pól

Więcej szczegółów znajdą Państwo w: [Pola kolekcji](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Typy podstawowe

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|--------------------|--------------------|-------------------------|
| Tekst jednowierszowy | ✅ | ✅ |
| Tekst wielowierszowy | ✅ | ✅ |
| Numer telefonu | ✅ | ✅ |
| Adres e-mail | ✅ | ✅ |
| URL | ✅ | ✅ |
| Liczba całkowita | ✅ | ✅ |
| Liczba | ✅ | ✅ |
| Procent | ✅ | ✅ |
| Hasło | ✅ | ✅ |
| Kolor | ✅ | ✅ |
| Ikona | ✅ | ✅ |

### Typy wyboru

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|-----------------------------------|--------------------|-------------------------|
| Pole wyboru (Checkbox) | ✅ | ✅ |
| Lista rozwijana (jednokrotny wybór) | ✅ | ✅ |
| Lista rozwijana (wielokrotny wybór) | ✅ | ✅ |
| Przycisk radiowy (Radio button) | ✅ | ✅ |
| Grupa pól wyboru (Checkbox group) | ✅ | ✅ |
| Region Chin | ✅ | ❌ |

### Typy multimedialne

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|---------------------------|--------------------|-------------------------|
| Multimedia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Tekst sformatowany (Rich Text) | ✅ | ✅ |
| Załącznik (relacja) | ✅ | ❌ |
| Załącznik (URL) | ✅ | ✅ |

### Typy daty i czasu

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|---------------------------------|--------------------|-------------------------|
| Data i czas (ze strefą czasową) | ✅ | ✅ |
| Data i czas (bez strefy czasowej) | ✅ | ✅ |
| Znacznik czasu Unix | ✅ | ✅ |
| Data (bez czasu) | ✅ | ✅ |
| Czas | ✅ | ✅ |

### Typy geometryczne

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|----------|--------------------|-------------------------|
| Punkt | ✅ | ✅ |
| Linia | ✅ | ✅ |
| Okrąg | ✅ | ✅ |
| Wielokąt | ✅ | ✅ |

### Typy zaawansowane

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|---------------------|--------------------|-------------------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sortowanie | ✅ | ✅ |
| Formuła obliczeniowa | ✅ | ✅ |
| Automatyczne kodowanie | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Selektor kolekcji | ✅ | ❌ |
| Szyfrowanie | ✅ | ✅ |

### Pola informacji systemowych

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|--------------------------|--------------------|-------------------------|
| Data utworzenia | ✅ | ✅ |
| Data ostatniej modyfikacji | ✅ | ✅ |
| Utworzone przez | ✅ | ❌ |
| Ostatnio zmodyfikowane przez | ✅ | ❌ |
| OID tabeli | ✅ | ❌ |

### Typy relacji

| Typ pola | Główna baza danych | Zewnętrzna baza danych |
|-----------------------|--------------------|-------------------------|
| Jeden do jednego | ✅ | ✅ |
| Jeden do wielu | ✅ | ✅ |
| Wiele do jednego | ✅ | ✅ |
| Wiele do wielu | ✅ | ✅ |
| Wiele do wielu (tablica) | ✅ | ✅ |

:::info
Pola załączników zależą od kolekcji plików, które są obsługiwane tylko przez główne bazy danych. Z tego powodu zewnętrzne bazy danych obecnie nie obsługują pól załączników.
:::

## 4. Porównanie obsługi kopii zapasowych i migracji

| Funkcja | Główna baza danych | Zewnętrzna baza danych |
|--------------------------|--------------------|-----------------------------|
| Kopia zapasowa i przywracanie | ✅ | ❌ (wymaga samodzielnego zarządzania) |
| Zarządzanie migracjami | ✅ | ❌ (wymaga samodzielnego zarządzania) |

:::info
NocoBase zapewnia możliwość tworzenia kopii zapasowych, przywracania i migracji struktury dla głównych baz danych. W przypadku zewnętrznych baz danych operacje te muszą być wykonane niezależnie przez użytkowników, zgodnie z ich własnym środowiskiem bazodanowym. NocoBase nie oferuje wbudowanego wsparcia w tym zakresie.
:::

## Podsumowanie porównania

| Element porównania | Główna baza danych | Zewnętrzna baza danych |
|--------------------|------------------------------------------|----------------------------------------------------------|
| Typy baz danych | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Obsługa typów kolekcji | Wszystkie typy kolekcji | Tylko kolekcje podstawowe i widoki |
| Obsługa typów pól | Wszystkie typy pól | Wszystkie typy pól z wyjątkiem pól załączników |
| Kopia zapasowa i migracja | Wbudowane wsparcie | Wymaga samodzielnego zarządzania |

## Zalecenia

- **Jeśli budują Państwo nowy system biznesowy za pomocą NocoBase**, prosimy o użycie **głównej bazy danych**. Dzięki temu będą Państwo mogli korzystać z pełnej funkcjonalności NocoBase.
- **Jeśli używają Państwo NocoBase do łączenia się z bazami danych innych systemów w celu wykonywania podstawowych operacji CRUD**, wówczas prosimy o użycie **zewnętrznych baz danych**.