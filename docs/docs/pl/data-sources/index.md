:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

Modelowanie danych to kluczowy etap w projektowaniu baz danych, obejmujący dogłębną analizę i abstrakcję różnych typów danych oraz ich wzajemnych relacji w świecie rzeczywistym. W tym procesie staramy się odkryć wewnętrzne powiązania między danymi i sformalizować je w modele danych, kładąc podwaliny pod strukturę bazy danych systemu informacyjnego. NocoBase to platforma oparta na modelach danych, oferująca następujące funkcje:

## Obsługuje dostęp do danych z różnych źródeł

NocoBase obsługuje źródła danych z różnych miejsc, w tym popularne bazy danych, platformy API/SDK oraz pliki.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase udostępnia [wtyczkę do zarządzania źródłami danych](/data-sources/data-source-manager), służącą do zarządzania różnymi źródłami danych i ich kolekcjami. Wtyczka do zarządzania źródłami danych zapewnia jedynie interfejs do zarządzania wszystkimi źródłami danych i nie oferuje możliwości bezpośredniego dostępu do nich. Musi być używana w połączeniu z różnymi wtyczkami źródeł danych. Obecnie obsługiwane źródła danych to:

- [Główna baza danych](/data-sources/data-source-main): Główna baza danych NocoBase, obsługująca relacyjne bazy danych, takie jak MySQL, PostgreSQL i MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Użycie bazy danych KingbaseES jako źródła danych, które może służyć zarówno jako główna, jak i zewnętrzna baza danych.
- [Zewnętrzny MySQL](/data-sources/data-source-external-mysql): Użycie zewnętrznej bazy danych MySQL jako źródła danych.
- [Zewnętrzny MariaDB](/data-sources/data-source-external-mariadb): Użycie zewnętrznej bazy danych MariaDB jako źródła danych.
- [Zewnętrzny PostgreSQL](/data-sources/data-source-external-postgres): Użycie zewnętrznej bazy danych PostgreSQL jako źródła danych.
- [Zewnętrzny MSSQL](/data-sources/data-source-external-mssql): Użycie zewnętrznej bazy danych MSSQL (SQL Server) jako źródła danych.
- [Zewnętrzny Oracle](/data-sources/data-source-external-oracle): Użycie zewnętrznej bazy danych Oracle jako źródła danych.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Oferuje różnorodne narzędzia do modelowania danych

**Prosty interfejs do zarządzania kolekcjami**: Służy do tworzenia różnych modeli (kolekcji) lub łączenia się z istniejącymi.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Wizualny interfejs w stylu diagramów ER**: Służy do wydobywania encji i ich relacji z wymagań użytkowników i biznesowych. Zapewnia intuicyjny i łatwy do zrozumienia sposób opisywania modeli danych. Dzięki diagramom ER można jaśniej zrozumieć główne encje danych w systemie i ich wzajemne relacje.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Obsługuje różne typy kolekcji

| Kolekcja | Opis |
| - | - |
| [Ogólna kolekcja](/data-sources/data-source-main/general-collection) | Zawiera wbudowane typowe pola systemowe. |
| [Kolekcja kalendarza](/data-sources/calendar/calendar-collection) | Służy do tworzenia kolekcji zdarzeń związanych z kalendarzem. |
| Kolekcja komentarzy | Służy do przechowywania komentarzy lub opinii dotyczących danych. |
| [Kolekcja drzewiasta](/data-sources/collection-tree) | Kolekcja o strukturze drzewa, obecnie obsługuje tylko model listy sąsiedztwa. |
| [Kolekcja plików](/data-sources/file-manager/file-collection) | Służy do zarządzania przechowywaniem plików. |
| [Kolekcja SQL](/data-sources/collection-sql) | Nie jest rzeczywistą kolekcją bazy danych, lecz strukturalnie wizualizuje zapytania SQL. |
| [Połączenie z widokiem bazy danych](/data-sources/collection-view) | Łączy się z istniejącymi widokami bazy danych. |
| Kolekcja wyrażeń | Używana w scenariuszach dynamicznych wyrażeń w przepływach pracy. |
| [Połączenie z danymi zewnętrznymi](/data-sources/collection-fdw) | Umożliwia systemowi bazy danych bezpośredni dostęp i odpytywanie danych w zewnętrznych źródłach danych w oparciu o technologię FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Więcej informacji znajdą Państwo w sekcji „[Kolekcja / Przegląd](/data-sources/data-modeling/collection)”.

## Oferuje bogatą różnorodność typów pól

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Więcej informacji znajdą Państwo w sekcji „[Pola kolekcji / Przegląd](/data-sources/data-modeling/collection-fields)”.