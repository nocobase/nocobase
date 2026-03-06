:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/log-and-monitor/logger/overview).
:::

# Logi serwera, logi audytowe i historia rekordów

## Logi serwera

### Logi systemowe

> Zobacz [Logi systemowe](./index.md#system-logs)

- Rejestrują informacje o działaniu systemu aplikacji, śledzą łańcuchy wykonywania kodu oraz pozwalają na tropienie wyjątków i błędów wykonawczych.
- Logi są kategoryzowane według poziomów istotności i modułów funkcjonalnych.
- Wyświetlane w terminalu lub przechowywane w formie plików.
- Służą głównie do diagnozowania i rozwiązywania problemów systemowych występujących podczas pracy.

### Logi żądań

> Zobacz [Logi żądań](./index.md#request-logs)

- Rejestrują szczegóły żądań i odpowiedzi HTTP API, koncentrując się na ID żądania, ścieżce API, nagłówkach, kodzie statusu odpowiedzi i czasie trwania.
- Wyświetlane w terminalu lub przechowywane w formie plików.
- Służą głównie do śledzenia wywołań API i wydajności ich wykonywania.

## Logi audytowe

> Zobacz [Logi audytowe](/security/audit-logger/index.md)

- Rejestrują działania użytkowników (lub API) na zasobach systemowych, skupiając się na typie zasobu, obiekcie docelowym, typie operacji, informacjach o użytkowniku i statusie operacji.
- Aby lepiej śledzić działania użytkowników i ich wyniki, parametry żądań i odpowiedzi są przechowywane jako metadane. Informacje te częściowo pokrywają się z logami żądań, ale nie są z nimi tożsame – na przykład logi żądań zazwyczaj nie zawierają pełnej treści (body) żądania.
- Parametry żądań i odpowiedzi **nie są równoznaczne** z migawkami (snapshots) danych. Pozwalają one dowiedzieć się, jakie operacje zostały wykonane, ale nie pokazują dokładnej zawartości danych przed modyfikacją, dlatego nie mogą być wykorzystywane do kontroli wersji ani przywracania danych po błędnych operacjach.
- Przechowywane zarówno w plikach, jak i w tabelach bazy danych.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historia rekordów

> Zobacz [Historię rekordów](/record-history/index.md)

- Rejestruje historię zmian zawartości danych.
- Śledzi typ zasobu, obiekt zasobu, typ operacji, zmienione pola oraz wartości przed i po zmianie.
- Może być wykorzystywana do porównywania danych i audytu.
- Przechowywana w tabelach bazy danych.

![](https://static-docs.nocobase.com/202511011338499.png)