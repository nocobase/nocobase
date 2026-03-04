:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/integration/fdw/index).
:::

# Łączenie zewnętrznych tabel danych (FDW)

## Wprowadzenie

Funkcja ta umożliwia łączenie się ze zdalnymi tabelami danych w oparciu o mechanizm Foreign Data Wrapper (FDW) bazy danych. Obecnie obsługiwane są bazy danych MySQL oraz PostgreSQL.

:::info{title="Łączenie źródeł danych vs Łączenie zewnętrznych tabel danych"}
- **Łączenie źródeł danych** odnosi się do nawiązywania połączenia z konkretną bazą danych lub usługą API, co pozwala na pełne wykorzystanie funkcji bazy danych lub usług oferowanych przez API;
- **Łączenie zewnętrznych tabel danych** odnosi się do pobierania danych z zewnątrz i mapowania ich do użytku lokalnego. W terminologii bazodanowej nazywa się to FDW (Foreign Data Wrapper). Jest to technologia bazodanowa, która koncentruje się na traktowaniu zdalnych tabel jak tabel lokalnych i umożliwia łączenie tylko jednej tabeli naraz. Ze względu na dostęp zdalny, podczas korzystania z tej funkcji mogą występować różne ograniczenia.

Obie metody mogą być stosowane łącznie. Pierwsza służy do ustanowienia połączenia ze źródłem danych, a druga do dostępu między różnymi źródłami danych. Na przykład, jeśli połączono się z określonym źródłem danych PostgreSQL, jedna z tabel w tym źródle może być zewnętrzną tabelą utworzoną na podstawie FDW.
:::

### MySQL

MySQL wykorzystuje silnik `federated`, który musi zostać aktywowany. Obsługuje on połączenia ze zdalnymi bazami MySQL oraz bazami kompatybilnymi z tym protokołem, takimi jak MariaDB. Szczegółową dokumentację można znaleźć w sekcji [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

W PostgreSQL można używać różnych typów rozszerzeń `fdw` do obsługi różnych typów zdalnych danych. Obecnie obsługiwane rozszerzenia to:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Łączenie ze zdalną bazą danych PostgreSQL wewnątrz PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Łączenie ze zdalną bazą danych MySQL wewnątrz PostgreSQL.
- Pozostałe typy rozszerzeń fdw można znaleźć w [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Integracja z NocoBase wymaga zaimplementowania odpowiedniego interfejsu adaptacyjnego w kodzie.

## Wymagania wstępne

- Jeśli główną bazą danych NocoBase jest MySQL, należy aktywować silnik `federated`. Patrz: [Jak włączyć silnik federated w MySQL](./enable-federated)

Następnie należy zainstalować i aktywować wtyczkę za pomocą menedżera wtyczek.

![Instalacja i aktywacja wtyczki](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Instrukcja obsługi

W sekcji „Zarządzanie kolekcjami > Utwórz kolekcję” z menu rozwijanego należy wybrać „Połącz z danymi zewnętrznymi”.

![Połącz dane zewnętrzne](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

W menu rozwijanym „Serwer bazy danych” proszę wybrać istniejącą usługę bazy danych lub kliknąć „Utwórz serwer bazy danych”.

![Usługa bazy danych](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Tworzenie serwera bazy danych:

![Utwórz usługę bazy danych](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Po wybraniu serwera bazy danych, w menu rozwijanym „Zdalna tabela” proszę wybrać tabelę danych, którą chcą Państwo połączyć.

![Wybierz tabelę danych do połączenia](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfiguracja informacji o polach:

![Konfiguracja informacji o polach](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Jeśli struktura zdalnej tabeli ulegnie zmianie, można również skorzystać z opcji „Synchronizuj ze zdalnej tabeli”.

![Synchronizacja ze zdalnej tabeli](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronizacja zdalnej tabeli:

![Synchronizacja zdalnej tabeli](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Na koniec tabela zostanie wyświetlona w interfejsie:

![Wyświetlanie w interfejsie](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)