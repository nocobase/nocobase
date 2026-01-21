:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Logi serwera, logi audytu i historia zmian danych

## Logi serwera

### Logi systemowe

> Zobacz [Logi systemowe](#)

- Rejestrują informacje o działaniu systemu aplikacji, śledzą ścieżki wykonania logiki kodu oraz pomagają w identyfikacji błędów wykonania kodu i innych anomalii.
- Logi są kategoryzowane według poziomów ważności i modułów funkcjonalnych.
- Są wyprowadzane do terminala lub przechowywane w plikach.
- Głównie służą do diagnozowania i rozwiązywania problemów z systemem podczas jego działania.

### Logi żądań

> Zobacz [Logi żądań](#)

- Rejestrują szczegóły żądań i odpowiedzi HTTP API, koncentrując się na identyfikatorze żądania, ścieżce API, nagłówkach, kodzie statusu odpowiedzi oraz czasie trwania.
- Są wyprowadzane do terminala lub przechowywane w plikach.
- Głównie służą do śledzenia wywołań API i ich wydajności.

## Logi audytu

> Zobacz [Logi audytu](../security/audit-logger/index.md)

- Rejestrują działania użytkowników (lub API) na zasobach systemowych, koncentrując się na typie zasobu, obiekcie docelowym, typie operacji, informacjach o użytkowniku oraz statusie operacji.
- Aby lepiej śledzić, co użytkownicy zrobili i jakie wyniki zostały uzyskane, parametry żądania i odpowiedzi są przechowywane jako metadane. Informacje te częściowo pokrywają się z logami żądań, ale nie są identyczne — na przykład, logi żądań zazwyczaj nie zawierają pełnych treści żądań.
- Parametry żądania i odpowiedzi **nie są równoważne** migawkom danych. Mogą one ujawnić, jakie operacje miały miejsce, ale nie dokładne dane przed modyfikacją, dlatego nie mogą być używane do kontroli wersji ani przywracania danych po błędnych operacjach.
- Przechowywane są zarówno w plikach, jak i w tabelach baz danych.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historia zmian danych

> Zobacz [Historia zmian danych](/record-history/index.md)

- Rejestruje **historię zmian** treści danych.
- Śledzi typ zasobu, obiekt zasobu, typ operacji, zmienione pola oraz wartości przed i po zmianie.
- Przydatne do **porównywania i audytowania danych**.
- Przechowywane w tabelach baz danych.

![](https://static-docs.nocobase.com/202511011338499.png)