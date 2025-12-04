:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Baza Danych Wektorowych

## Wprowadzenie

W bazie wiedzy, baza danych wektorowych przechowuje zwektoryzowane dokumenty. Zwektoryzowane dokumenty pełnią funkcję indeksu dla tych dokumentów.

Gdy w rozmowie z agentem AI włączone jest wyszukiwanie RAG, wiadomość użytkownika jest wektoryzowana. Następnie z bazy danych wektorowych pobierane są fragmenty dokumentów bazy wiedzy, aby dopasować odpowiednie akapity i oryginalny tekst dokumentu.

Obecnie wtyczka bazy wiedzy AI wbudowanie obsługuje tylko PGVector, czyli wtyczkę bazy danych PostgreSQL.

## Zarządzanie Bazą Danych Wektorowych

Proszę przejść do strony konfiguracji wtyczki agenta AI, kliknąć zakładkę `Vector store` i wybrać `Vector database`, aby przejść do strony zarządzania bazą danych wektorowych.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Proszę kliknąć przycisk `Add new` w prawym górnym rogu, aby dodać nowe połączenie z bazą danych wektorowych `PGVector`:

- W polu `Name` proszę wprowadzić nazwę połączenia.
- W polu `Host` proszę wprowadzić adres IP bazy danych wektorowych.
- W polu `Port` proszę wprowadzić numer portu bazy danych wektorowych.
- W polu `Username` proszę wprowadzić nazwę użytkownika bazy danych wektorowych.
- W polu `Password` proszę wprowadzić hasło do bazy danych wektorowych.
- W polu `Database` proszę wprowadzić nazwę bazy danych.
- W polu `Table name` proszę wprowadzić nazwę tabeli, która zostanie użyta podczas tworzenia nowej tabeli do przechowywania danych wektorowych.

Po wprowadzeniu wszystkich niezbędnych informacji proszę kliknąć przycisk `Test`, aby sprawdzić dostępność usługi bazy danych wektorowych, a następnie kliknąć przycisk `Submit`, aby zapisać dane połączenia.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)