---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Łączenie z zewnętrznymi kolekcjami danych (FDW)

## Wprowadzenie

To jest wtyczka, która umożliwia łączenie się ze zdalnymi kolekcjami danych (tabelami) za pomocą technologii Foreign Data Wrapper (FDW) w bazie danych. Obecnie obsługuje bazy danych MySQL i PostgreSQL.

:::info{title="Łączenie ze źródłami danych a łączenie z zewnętrznymi kolekcjami danych"}
- **Łączenie ze źródłami danych** oznacza nawiązanie połączenia z konkretną bazą danych lub usługą API, co pozwala na pełne wykorzystanie funkcji bazy danych lub usług oferowanych przez API;
- **Łączenie z zewnętrznymi kolekcjami danych** polega na pobieraniu danych z zewnątrz i mapowaniu ich do użytku lokalnego. W kontekście baz danych nazywa się to FDW (Foreign Data Wrapper) – jest to technologia bazodanowa, która koncentruje się na traktowaniu zdalnych tabel jako lokalnych, umożliwiając łączenie ich tylko pojedynczo. Ze względu na zdalny dostęp, podczas korzystania z tej funkcji mogą występować różne ograniczenia i uwarunkowania.

Obie metody mogą być również używane w połączeniu: pierwsza służy do nawiązywania połączenia ze źródłem danych, a druga do dostępu między źródłami danych. Na przykład, jeśli połączą Państwo określone źródło danych PostgreSQL, może ono zawierać tabelę zewnętrzną utworzoną w oparciu o FDW.
:::

### MySQL

MySQL korzysta z silnika `federated`, który wymaga aktywacji. Umożliwia on łączenie się ze zdalnymi bazami danych MySQL oraz bazami danych kompatybilnymi z protokołem MySQL, takimi jak MariaDB. Więcej szczegółów znajdą Państwo w dokumentacji [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

W PostgreSQL różne typy rozszerzeń `fdw` mogą być używane do obsługi różnych typów zdalnych danych. Obecnie obsługiwane rozszerzenia to:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Umożliwia połączenie ze zdalną bazą danych PostgreSQL z poziomu PostgreSQL.
- [mysql_fdw (w trakcie rozwoju)](https://github.com/EnterpriseDB/mysql_fdw): Umożliwia połączenie ze zdalną bazą danych MySQL z poziomu PostgreSQL.
- W przypadku innych typów rozszerzeń fdw, prosimy zapoznać się z [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Aby zintegrować je z NocoBase, należy zaimplementować odpowiedni interfejs adaptacyjny w kodzie.

## Instalacja

Wymagania wstępne

- Jeśli główna baza danych NocoBase to MySQL, należy aktywować silnik `federated`. Prosimy zapoznać się z instrukcją [Jak włączyć silnik federated w MySQL](./enable-federated.md).

Następnie należy zainstalować i aktywować wtyczkę za pomocą menedżera wtyczek.

![Zainstaluj i aktywuj wtyczkę](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Instrukcja obsługi

W menu rozwijanym „Zarządzanie kolekcjami > Utwórz kolekcję” proszę wybrać opcję „Połącz z danymi zewnętrznymi”.

![Połącz z danymi zewnętrznymi](https://static-docs.nocobase.com/029d946a6d067d1c35a397551219d623c.png)

W menu rozwijanym „Usługa bazy danych” proszę wybrać istniejącą usługę bazy danych lub opcję „Utwórz usługę bazy danych”.

![Usługa bazy danych](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Utwórz usługę bazy danych

![Utwórz usługę bazy danych](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Po wybraniu usługi bazy danych, w menu rozwijanym „Tabela zdalna” proszę wybrać kolekcję danych do połączenia.

![Wybierz kolekcję danych do połączenia](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Skonfiguruj informacje o polach

![Skonfiguruj informacje o polach](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jeśli zdalna kolekcja danych uległa zmianie strukturalnej, mogą Państwo również „Synchronizować ze zdalnej kolekcji danych”.

![Synchronizuj ze zdalnej kolekcji danych](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronizacja zdalnej kolekcji danych

![Synchronizacja zdalnej kolekcji danych](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Na koniec, wyświetlanie w interfejsie.

![Wyświetlanie w interfejsie](https://static-docs.nocobase.com/368fca27a9938080530949357.png)