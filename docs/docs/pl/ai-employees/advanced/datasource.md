---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zaawansowane

## Wprowadzenie

We wtyczce AI Pracownik mogą Państwo skonfigurować źródła danych i wstępnie ustawić zapytania do kolekcji. Są one następnie wysyłane jako kontekst aplikacji podczas rozmowy z AI Pracownikiem, który odpowiada na podstawie wyników tych zapytań.

## Konfiguracja źródła danych

Proszę przejść do strony konfiguracji wtyczki AI Pracownik, a następnie kliknąć zakładkę `Data source`, aby otworzyć stronę zarządzania źródłami danych AI Pracownika.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Proszę kliknąć przycisk `Add data source`, aby przejść do strony tworzenia źródła danych.

Krok 1: Proszę wprowadzić podstawowe informacje o `kolekcji`:
- W polu `Title` proszę wprowadzić łatwą do zapamiętania nazwę dla źródła danych;
- W polu `Collection` proszę wybrać `kolekcję`, z której mają być pobierane dane;
- W polu `Description` proszę wprowadzić opis źródła danych;
- W polu `Limit` proszę wprowadzić limit zapytań dla źródła danych, aby uniknąć zwracania zbyt dużej ilości danych, która mogłaby przekroczyć kontekst rozmowy z AI.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Krok 2: Proszę wybrać pola do zapytania:

Na liście `Fields` proszę zaznaczyć pola, które mają być uwzględnione w zapytaniu.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Krok 3: Proszę ustawić warunki zapytania:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Krok 4: Proszę ustawić warunki sortowania:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Na koniec, przed zapisaniem źródła danych, mogą Państwo wyświetlić podgląd wyników zapytania.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Wysyłanie źródeł danych w rozmowach

W oknie dialogowym AI Pracownika proszę kliknąć przycisk `Add work context` w lewym dolnym rogu, wybrać `Data source`, a następnie zobaczą Państwo właśnie dodane źródło danych.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Proszę zaznaczyć źródło danych, które chcą Państwo wysłać, a wybrane źródło danych zostanie dołączone do okna dialogowego.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Po wprowadzeniu pytania, tak jak w przypadku wysyłania zwykłej wiadomości, proszę kliknąć przycisk wysyłania, a AI Pracownik odpowie na podstawie źródła danych.

Źródło danych pojawi się również na liście wiadomości.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Uwagi

Źródło danych automatycznie filtruje dane na podstawie uprawnień ACL bieżącego użytkownika, pokazując tylko te dane, do których użytkownik ma dostęp.