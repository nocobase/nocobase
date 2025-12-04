---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Klucze API

## Wprowadzenie

## Instrukcja użycia

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Dodawanie klucza API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Uwagi**

- Dodany klucz API jest przypisany do bieżącego użytkownika i dziedziczy jego rolę.
- Proszę upewnić się, że zmienna środowiskowa `APP_KEY` została skonfigurowana i jest utrzymywana w poufności. W przypadku zmiany `APP_KEY` wszystkie dodane klucze API staną się nieprawidłowe.

### Jak skonfigurować APP_KEY

Dla wersji Docker, należy zmodyfikować plik `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

W przypadku instalacji z kodu źródłowego lub za pomocą `create-nocobase-app`, mogą Państwo bezpośrednio zmodyfikować `APP_KEY` w pliku `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```