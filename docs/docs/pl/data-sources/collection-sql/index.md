---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Kolekcja SQL

## Wprowadzenie

Kolekcja SQL oferuje potężną metodę pobierania danych za pomocą zapytań SQL. Poprzez ekstrakcję pól danych za pomocą zapytań SQL i konfigurację powiązanych metadanych pól, mogą Państwo wykorzystywać te pola tak, jakby pracowali ze standardową tabelą. Funkcja ta jest szczególnie korzystna w scenariuszach obejmujących złożone zapytania łączące, analizy statystyczne i wiele innych.

## Instrukcja obsługi

### Tworzenie nowej kolekcji SQL

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Proszę wprowadzić zapytanie SQL w polu wejściowym i kliknąć przycisk Wykonaj (Execute). System przeanalizuje zapytanie, aby określić użyte tabele i pola, automatycznie wyodrębniając odpowiednie metadane pól z tabel źródłowych.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Jeśli automatyczna analiza tabel i pól źródłowych przez system jest nieprawidłowa, mogą Państwo ręcznie wybrać odpowiednie tabele i pola, aby zapewnić użycie prawidłowych metadanych. Najpierw proszę wybrać tabelę źródłową, a następnie wybrać odpowiadające jej pola w sekcji źródeł pól poniżej.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. W przypadku pól, które nie mają bezpośredniego źródła, system wywnioskuje typ pola na podstawie typu danych. Jeśli to wnioskowanie jest nieprawidłowe, mogą Państwo ręcznie wybrać właściwy typ pola.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Podczas konfigurowania każdego pola, mogą Państwo podglądać jego wyświetlanie w obszarze podglądu, co pozwala od razu zobaczyć wpływ Państwa ustawień.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Po zakończeniu konfiguracji i upewnieniu się, że wszystko jest poprawne, proszę kliknąć przycisk Potwierdź (Confirm) poniżej pola wejściowego SQL, aby sfinalizować przesłanie.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Edycja

1. Jeśli chcą Państwo zmodyfikować zapytanie SQL, proszę kliknąć przycisk Edytuj (Edit), aby bezpośrednio zmienić instrukcję SQL i ponownie skonfigurować pola według potrzeb.

2. Aby dostosować metadane pól, proszę użyć opcji Konfiguruj pola (Configure fields), co pozwala aktualizować ustawienia pól tak, jak w przypadku zwykłej tabeli.

### Synchronizacja

Jeśli zapytanie SQL pozostaje niezmienione, ale struktura bazowej tabeli bazy danych została zmodyfikowana, mogą Państwo zsynchronizować i ponownie skonfigurować pola, wybierając Konfiguruj pola (Configure fields) - Synchronizuj z bazy danych (Sync from database).

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Kolekcja SQL a połączone widoki bazy danych

| Typ szablonu | Najlepiej nadaje się do | Metoda implementacji | Obsługa operacji CRUD |
| :--- | :--- | :--- | :--- |
| SQL | Proste modele, lekkie przypadki użycia<br />Ograniczona interakcja z bazą danych<br />Unikanie utrzymywania widoków<br />Preferowanie operacji sterowanych interfejsem użytkownika | Podzapytanie SQL | Nieobsługiwane |
| Połącz z widokiem bazy danych | Złożone modele<br />Wymaga interakcji z bazą danych<br />Wymagana modyfikacja danych<br />Wymaga silniejszego i stabilniejszego wsparcia bazy danych | Widok bazy danych | Częściowo obsługiwane |

:::warning
Podczas korzystania z kolekcji SQL, proszę upewnić się, że wybrano tabele, którymi można zarządzać w NocoBase. Użycie tabel z tej samej bazy danych, które nie są połączone z NocoBase, może prowadzić do niedokładnego parsowania zapytań SQL. Jeśli jest to problem, proszę rozważyć utworzenie i połączenie z widokiem.
:::