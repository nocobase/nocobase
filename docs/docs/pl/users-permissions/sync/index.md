---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Synchronizacja Danych Użytkowników

## Wprowadzenie

Ta funkcja pozwala na rejestrowanie i zarządzanie źródłami synchronizacji danych użytkowników. Domyślnie dostępny jest interfejs HTTP API, ale mogą Państwo rozszerzyć obsługę o inne źródła danych za pomocą wtyczek. Domyślnie obsługiwana jest synchronizacja danych z kolekcjami **Użytkownicy** i **Działy**, z możliwością rozszerzenia synchronizacji na inne zasoby docelowe za pomocą wtyczek.

## Zarządzanie źródłami danych i synchronizacja danych

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Jeśli nie zainstalowano żadnych wtyczek dostarczających źródła synchronizacji danych użytkowników, mogą Państwo synchronizować dane użytkowników za pomocą interfejsu HTTP API. Proszę zapoznać się z [Źródło danych - HTTP API](./sources/api.md).
:::

## Dodawanie źródła danych

Po zainstalowaniu wtyczki, która dostarcza źródło synchronizacji danych użytkowników, mogą Państwo dodać odpowiednie źródło danych. Tylko włączone źródła danych będą wyświetlać przyciski „Synchronizuj” i „Zadanie”.

> Przykład: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Synchronizacja danych

Proszę kliknąć przycisk **Synchronizuj**, aby rozpocząć synchronizację danych.

![](https://static-docs.nocobase.com/202412041055022.png)

Proszę kliknąć przycisk **Zadanie**, aby wyświetlić status synchronizacji. Po pomyślnej synchronizacji mogą Państwo przeglądać dane na listach Użytkowników i Działów.

![](https://static-docs.nocobase.com/202412041202337.png)

W przypadku nieudanych zadań synchronizacji mogą Państwo kliknąć **Ponów próbę**.

![](https://static-docs.nocobase.com/202412041058337.png)

W przypadku niepowodzeń synchronizacji mogą Państwo rozwiązać problem, korzystając z dzienników systemowych. Dodatkowo, oryginalne rekordy synchronizacji danych są przechowywane w katalogu `user-data-sync` w folderze dzienników aplikacji.

![](https://static-docs.nocobase.com/202412041205655.png)