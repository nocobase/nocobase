---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zarządzanie źródłami danych

## Wprowadzenie

NocoBase oferuje wtyczkę do zarządzania źródłami danych, służącą do zarządzania źródłami danych i ich kolekcjami. Wtyczka do zarządzania źródłami danych zapewnia jedynie interfejs do zarządzania wszystkimi źródłami danych i nie oferuje możliwości bezpośredniego dostępu do nich. Należy jej używać w połączeniu z różnymi wtyczkami źródeł danych. Obecnie obsługiwane źródła danych to:

- [Główna Baza Danych](/data-sources/data-source-main): Główna baza danych NocoBase, obsługująca relacyjne bazy danych, takie jak MySQL, PostgreSQL i MariaDB.
- [Zewnętrzny MySQL](/data-sources/data-source-external-mysql): Używa zewnętrznej bazy danych MySQL jako źródła danych.
- [Zewnętrzny MariaDB](/data-sources/data-source-external-mariadb): Używa zewnętrznej bazy danych MariaDB jako źródła danych.
- [Zewnętrzny PostgreSQL](/data-sources/data-source-external-postgres): Używa zewnętrznej bazy danych PostgreSQL jako źródła danych.
- [Zewnętrzny MSSQL](/data-sources/data-source-external-mssql): Używa zewnętrznej bazy danych MSSQL (SQL Server) jako źródła danych.
- [Zewnętrzny Oracle](/data-sources/data-source-external-oracle): Używa zewnętrznej bazy danych Oracle jako źródła danych.

Dodatkowo, za pomocą wtyczek można rozszerzyć obsługę o inne typy źródeł danych. Mogą to być zarówno popularne typy baz danych, jak i platformy udostępniające API (SDK).

## Instalacja

Jest to wbudowana wtyczka, więc nie wymaga oddzielnej instalacji.

## Instrukcja użytkowania

Podczas inicjalizacji i instalacji aplikacji, domyślnie udostępniane jest źródło danych do przechowywania danych NocoBase, nazywane główną bazą danych. Więcej informacji znajdą Państwo w dokumentacji [Głównej Bazy Danych](/data-sources/data-source-main/).

### Zewnętrzne źródła danych

Obsługiwane są zewnętrzne bazy danych jako źródła danych. Więcej informacji znajdą Państwo w dokumentacji [Zewnętrzne Bazy Danych / Wprowadzenie](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Obsługa synchronizacji niestandardowych tabel baz danych

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Mogą Państwo również uzyskiwać dostęp do danych pochodzących ze źródeł HTTP API. Więcej informacji znajdą Państwo w dokumentacji [Źródło Danych REST API](/data-sources/data-source-rest-api/).