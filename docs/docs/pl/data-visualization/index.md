---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Przegląd

Wtyczka do wizualizacji danych NocoBase zapewnia wizualne zapytania danych i bogaty zestaw komponentów wykresów. Dzięki prostej konfiguracji mogą Państwo szybko tworzyć panele wizualizacyjne, prezentować wnioski z danych oraz wspierać wielowymiarową analizę i prezentację.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Podstawowe koncepcje
- Blok wykresu: Konfigurowalny komponent wykresu na stronie, który obsługuje zapytania danych, opcje wykresu i zdarzenia interakcji.
- Zapytanie danych (Builder / SQL): Konfiguracja wizualna za pomocą Buildera lub pisanie zapytań SQL w celu pobrania danych.
- Miary (Measures) i Wymiary (Dimensions): Miary służą do agregacji numerycznej; Wymiary grupują dane (np. data, kategoria, region).
- Mapowanie pól: Mapowanie kolumn wyników zapytania do głównych pól wykresu, takich jak `xField`, `yField`, `seriesField` lub `Category / Value`.
- Opcje wykresu (Podstawowe / Niestandardowe): Podstawowe konfiguruje wspólne właściwości wizualnie; Niestandardowe zwraca pełną opcję ECharts `option` za pomocą JS.
- Uruchom zapytanie: Uruchom zapytanie i pobierz dane w panelu konfiguracji; przełącz na Table / JSON, aby sprawdzić zwrócone dane.
- Podgląd i Zapisz: Podgląd jest tymczasowy; kliknięcie „Zapisz” zapisuje konfigurację do bazy danych i ją stosuje.
- Zmienne kontekstowe: Ponowne wykorzystanie kontekstu strony, użytkownika i filtrów (np. `{{ ctx.user.id }}`) w zapytaniach i konfiguracji wykresów.
- Filtry i powiązania na poziomie strony: Bloki filtrów na poziomie strony zbierają ujednolicone warunki, automatycznie łączą się z zapytaniami wykresów i odświeżają powiązane wykresy.
- Zdarzenia interakcji: Rejestrowanie zdarzeń za pomocą `chart.on` w celu włączenia podświetlania, nawigacji i drążenia danych.

## Instalacja
Wizualizacja danych to wbudowana wtyczka NocoBase; działa od razu po wyjęciu z pudełka i nie wymaga oddzielnej instalacji.