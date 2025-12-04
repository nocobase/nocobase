:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

Modelowanie danych to kluczowy etap w projektowaniu baz danych. Polega ono na dogłębnej analizie i abstrakcji różnorodnych typów danych z rzeczywistego świata oraz ich wzajemnych relacji. W tym procesie staramy się odkryć wewnętrzne powiązania między danymi i sformalizować je w modele danych, co stanowi podstawę struktury baz danych dla systemów informatycznych. NocoBase to platforma oparta na modelach danych, charakteryzująca się następującymi cechami:

## Obsługa danych z różnych źródeł

NocoBase może łączyć się ze źródłami danych z różnych źródeł, w tym z popularnymi bazami danych, platformami API (SDK) oraz plikami.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase oferuje [wtyczkę do zarządzania źródłami danych](/data-sources/data-source-manager), która służy do zarządzania różnymi źródłami danych i ich kolekcjami. Wtyczka ta zapewnia jedynie interfejs do zarządzania wszystkimi źródłami danych i nie umożliwia bezpośredniego dostępu do nich. Musi być używana w połączeniu z innymi wtyczkami do obsługi konkretnych źródeł danych. Obecnie obsługiwane źródła danych to:

-   [Główna baza danych](/data-sources/data-source-main): Główna baza danych NocoBase, obsługująca relacyjne bazy danych, takie jak MySQL, PostgreSQL i MariaDB.
-   [KingbaseES](/data-sources/data-source-kingbase): Baza danych KingbaseES jako źródło danych, którą można wykorzystać zarówno jako bazę główną, jak i zewnętrzną.
-   [Zewnętrzny MySQL](/data-sources/data-source-external-mysql): Zewnętrzna baza danych MySQL jako źródło danych.
-   [Zewnętrzny MariaDB](/data-sources/data-source-external-mariadb): Zewnętrzna baza danych MariaDB jako źródło danych.
-   [Zewnętrzny PostgreSQL](/data-sources/data-source-external-postgres): Zewnętrzna baza danych PostgreSQL jako źródło danych.
-   [Zewnętrzny MSSQL](/data-sources/data-source-external-mssql): Zewnętrzna baza danych MSSQL (SQL Server) jako źródło danych.
-   [Zewnętrzny Oracle](/data-sources/data-source-external-oracle): Zewnętrzna baza danych Oracle jako źródło danych.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Oferuje różnorodne narzędzia do modelowania danych

**Prosty interfejs zarządzania kolekcjami**: Służy do tworzenia różnych modeli (kolekcji) lub łączenia się z istniejącymi.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Wizualny interfejs w stylu diagramów ER**: Służy do ekstrakcji encji i ich relacji z wymagań użytkowników i biznesowych. Zapewnia intuicyjny i łatwy do zrozumienia sposób opisywania modeli danych. Dzięki diagramom ER można jaśniej zrozumieć główne encje danych w systemie i ich wzajemne powiązania.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Obsługuje różne typy kolekcji

| Kolekcja | Opis |
| - | - |
| [Kolekcja ogólna](/data-sources/data-source-main/general-collection) | Zawiera wbudowane, często używane pola systemowe. |
| [Kolekcja kalendarza](/data-sources/calendar/calendar-collection) | Służy do tworzenia kolekcji zdarzeń związanych z kalendarzem. |
| Kolekcja komentarzy | Służy do przechowywania komentarzy lub opinii dotyczących danych. |
| [Kolekcja drzewiasta](/data-sources/collection-tree) | Kolekcja o strukturze drzewa, obecnie obsługuje tylko model listy sąsiedztwa. |
| [Kolekcja plików](/data-sources/file-manager/file-collection) | Służy do zarządzania przechowywaniem plików. |
| [Kolekcja SQL](/data-sources/collection-sql) | Nie jest to rzeczywista tabela bazy danych, lecz służy do szybkiego, ustrukturyzowanego wyświetlania wyników zapytań SQL. |
| [Połączenie z widokiem bazy danych](/data-sources/collection-view) | Łączy się z istniejącymi widokami bazy danych. |
| Kolekcja wyrażeń | Używana w scenariuszach dynamicznych wyrażeń w przepływach pracy. |
| [Połączenie z danymi zewnętrznymi (FDW)](/data-sources/collection-fdw) | Umożliwia systemowi baz danych bezpośredni dostęp i wykonywanie zapytań do danych w zewnętrznych źródłach danych, bazując na technologii FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Więcej informacji znajdą Państwo w sekcji „[Kolekcja / Przegląd](/data-sources/data-modeling/collection)”.

## Oferuje bogactwo typów pól

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Więcej informacji znajdą Państwo w sekcji „[Pola kolekcji / Przegląd](/data-sources/data-modeling/collection-fields)”.