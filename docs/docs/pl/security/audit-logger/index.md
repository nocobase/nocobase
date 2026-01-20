---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Dziennik Audytu

## Wprowadzenie

Dziennik audytu służy do rejestrowania i śledzenia aktywności użytkowników oraz historii operacji na zasobach w systemie.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Opis parametrów

| Parametr                                  | Opis                                                                                                                              |
| :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Zasób**                                 | Docelowy typ zasobu operacji                                                                                                      |
| **Akcja**                                 | Typ wykonanej operacji                                                                                                            |
| **Użytkownik**                            | Użytkownik wykonujący operację                                                                                                    |
| **Rola**                                  | Rola użytkownika podczas operacji                                                                                                 |
| **Źródło danych**                         | Źródło danych                                                                                                                     |
| **Docelowa kolekcja**                     | Docelowa kolekcja                                                                                                                 |
| **Unikalny identyfikator rekordu docelowego** | Unikalny identyfikator docelowej kolekcji                                                                                         |
| **Źródłowa kolekcja**                     | Źródłowa kolekcja pola powiązanego                                                                                                |
| **Unikalny identyfikator rekordu źródłowego** | Unikalny identyfikator źródłowej kolekcji pola powiązanego                                                                        |
| **Status**                                | Kod statusu HTTP odpowiedzi na żądanie operacji                                                                                   |
| **Utworzono o**                           | Czas operacji                                                                                                                     |
| **UUID**                                  | Unikalny identyfikator operacji, zgodny z ID żądania operacji; może być użyty do wyszukiwania logów aplikacji.                    |
| **IP**                                    | Adres IP użytkownika                                                                                                              |
| **UA**                                    | Informacje UA użytkownika                                                                                                         |
| **Metadane**                              | Metadane, takie jak parametry żądania, treść żądania i zawartość odpowiedzi operacji.                                             |

## Opis zasobów audytowanych

Obecnie następujące operacje na zasobach są rejestrowane w dzienniku audytu:

### Główna aplikacja

| Operacja         | Opis                       |
| :--------------- | :------------------------- |
| `app:restart`    | Restart aplikacji          |
| `app:clearCache` | Wyczyść pamięć podręczną aplikacji |

### Menedżer wtyczek

| Operacja     | Opis          |
| :----------- | :------------ |
| `pm:add`     | Dodaj wtyczkę |
| `pm:update`  | Zaktualizuj wtyczkę |
| `pm:enable`  | Włącz wtyczkę |
| `pm:disable` | Wyłącz wtyczkę |
| `pm:remove`  | Usuń wtyczkę  |

### Uwierzytelnianie użytkownika

| Operacja              | Opis          |
| :-------------------- | :------------ |
| `auth:signIn`         | Zaloguj się   |
| `auth:signUp`         | Zarejestruj się |
| `auth:signOut`        | Wyloguj się   |
| `auth:changePassword` | Zmień hasło   |

### Użytkownik

| Operacja              | Opis           |
| :-------------------- | :------------- |
| `users:updateProfile` | Zaktualizuj profil |

### Konfiguracja interfejsu użytkownika

| Operacja                   | Opis               |
| :------------------------- | :----------------- |
| `uiSchemas:insertAdjacent` | Wstaw schemat UI   |
| `uiSchemas:patch`          | Modyfikuj schemat UI |
| `uiSchemas:remove`         | Usuń schemat UI    |

### Operacje na kolekcjach

| Operacja         | Opis                       |
| :--------------- | :------------------------- |
| `create`         | Utwórz rekord              |
| `update`         | Zaktualizuj rekord         |
| `destroy`        | Usuń rekord                |
| `updateOrCreate` | Zaktualizuj lub utwórz rekord |
| `firstOrCreate`  | Znajdź lub utwórz rekord   |
| `move`           | Przenieś rekord            |
| `set`            | Ustaw rekord pola powiązanego |
| `add`            | Dodaj rekord pola powiązanego |
| `remove`         | Usuń rekord pola powiązanego |
| `export`         | Eksportuj rekord           |
| `import`         | Importuj rekord            |

## Dodawanie innych zasobów audytowanych

Jeśli rozszerzyli Państwo operacje na zasobach za pomocą wtyczek i chcą Państwo rejestrować te działania w dzienniku audytu, prosimy zapoznać się z [API](/api/server/audit-manager.md).