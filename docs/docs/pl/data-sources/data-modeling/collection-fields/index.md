:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pola kolekcji

## Typy interfejsów pól

NocoBase klasyfikuje pola według następujących typów interfejsów:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Typy danych pól

Każdy interfejs pola ma domyślny typ danych. Na przykład, dla pól, których interfejs to Liczba (Number), domyślny typ danych to `double`, ale może to być również `float`, `decimal` itp. Obecnie obsługiwane typy danych to:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mapowanie typów pól

Proces dodawania nowych pól do głównej bazy danych wygląda następująco:

1. Wybierz typ interfejsu.
2. Skonfiguruj opcjonalny typ danych dla wybranego interfejsu.

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Proces mapowania pól z zewnętrznych źródeł danych wygląda następująco:

1. Automatycznie mapuj odpowiedni typ danych (`Field type`) i typ interfejsu użytkownika (`Field Interface`) na podstawie typu pola w zewnętrznej bazie danych.
2. W razie potrzeby zmodyfikuj na bardziej odpowiedni typ danych i typ interfejsu.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)