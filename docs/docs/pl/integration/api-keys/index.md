:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Klucz API

## Wprowadzenie

## Instalacja

## Instrukcja użytkowania

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Dodawanie klucza API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Uwagi**

-   Dodany klucz API należy do bieżącego użytkownika i dziedziczy jego rolę.
-   Proszę upewnić się, że zmienna środowiskowa `APP_KEY` jest skonfigurowana i pozostaje poufna. Jeśli `APP_KEY` ulegnie zmianie, wszystkie wcześniej dodane klucze API staną się nieprawidłowe.

### Jak skonfigurować APP_KEY

W przypadku wersji Docker należy zmodyfikować plik `docker-compose.yml`.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

W przypadku instalacji z kodu źródłowego lub za pomocą `create-nocobase-app` wystarczy bezpośrednio zmodyfikować `APP_KEY` w pliku `.env`.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```