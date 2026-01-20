---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Żądanie HTTP

## Wprowadzenie

Gdy potrzebują Państwo zintegrować się z innym systemem webowym, mogą Państwo skorzystać z węzła Żądanie HTTP. Podczas wykonania, węzeł ten wysyła żądanie HTTP pod wskazany adres, zgodnie z jego konfiguracją. Może ono przenosić dane w formacie JSON lub `application/x-www-form-urlencoded`, umożliwiając wymianę danych z systemami zewnętrznymi.

Jeśli są Państwo zaznajomieni z narzędziami do wysyłania żądań, takimi jak Postman, szybko opanują Państwo obsługę węzła Żądanie HTTP. W odróżnieniu od tych narzędzi, wszystkie parametry w węźle Żądanie HTTP mogą wykorzystywać zmienne kontekstowe z bieżącego przepływu pracy, co pozwala na organiczną integrację z procesami biznesowymi systemu.

## Instalacja

Wbudowana wtyczka, nie wymaga instalacji.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, kliknijcie Państwo przycisk plusa („+”) w przepływie, aby dodać węzeł „Żądanie HTTP”:

![Żądanie HTTP_Dodaj](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Konfiguracja węzła

![Węzeł Żądanie HTTP_Konfiguracja](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Metoda żądania

Dostępne metody żądania HTTP: `GET`, `POST`, `PUT`, `PATCH` i `DELETE`.

### Adres URL żądania

Adres URL usługi HTTP, który musi zawierać część protokołu (`http://` lub `https://`). Zaleca się używanie `https://`.

### Format danych żądania

Jest to `Content-Type` w nagłówku żądania. Obsługiwane formaty znajdą Państwo w sekcji „[Treść żądania](#request-body)”.

### Konfiguracja nagłówka żądania

Pary klucz-wartość dla sekcji nagłówka żądania (Header). Wartości mogą wykorzystywać zmienne z kontekstu przepływu pracy.

:::info{title=Wskazówka}
Nagłówek żądania `Content-Type` jest konfigurowany poprzez format danych żądania. Nie ma potrzeby wypełniania go tutaj, a wszelkie próby nadpisania będą nieskuteczne.
:::

### Parametry żądania

Pary klucz-wartość dla sekcji parametrów zapytania (query). Wartości mogą wykorzystywać zmienne z kontekstu przepływu pracy.

### Treść żądania

Część Body (treść) żądania. Obsługiwane są różne formaty, w zależności od wybranego `Content-Type`.

#### `application/json`

Obsługuje standardowy tekst w formacie JSON. Mogą Państwo wstawiać zmienne z kontekstu przepływu pracy za pomocą przycisku zmiennych w prawym górnym rogu edytora tekstu.

:::info{title=Wskazówka}
Zmienne muszą być używane wewnątrz ciągu znaków JSON, na przykład: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Format par klucz-wartość. Wartości mogą wykorzystywać zmienne z kontekstu przepływu pracy. Gdy zmienne są uwzględnione, zostaną one sparsowane jako szablon ciągu znaków i połączone w końcową wartość ciągu znaków.

#### `application/xml`

Obsługuje standardowy tekst w formacie XML. Mogą Państwo wstawiać zmienne z kontekstu przepływu pracy za pomocą przycisku zmiennych w prawym górnym rogu edytora tekstu.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Obsługuje pary klucz-wartość dla danych formularza. Pliki mogą być przesyłane, gdy typ danych jest ustawiony na obiekt pliku. Pliki mogą być wybierane tylko za pomocą zmiennych z istniejących obiektów plików w kontekście, takich jak wyniki zapytania do kolekcji plików lub powiązane dane z kolekcji plików.

:::info{title=Wskazówka}
Podczas wybierania danych pliku, należy upewnić się, że zmienna odpowiada pojedynczemu obiektowi pliku, a nie liście plików (w zapytaniu relacji jeden-do-wielu lub wiele-do-wielu, wartość pola relacji będzie tablicą).
:::

### Ustawienia limitu czasu

Gdy żądanie nie odpowiada przez długi czas, ustawienie limitu czasu (timeout) może zostać użyte do anulowania jego wykonania. Jeśli żądanie przekroczy limit czasu, bieżący przepływ pracy zostanie przedwcześnie zakończony ze statusem niepowodzenia.

### Ignoruj niepowodzenia

Węzeł żądania uznaje standardowe kody statusu HTTP w zakresie od `200` do `299` (włącznie) za pomyślne, a wszystkie inne za nieudane. Jeśli opcja „Ignoruj nieudane żądania i kontynuuj przepływ pracy” jest zaznaczona, kolejne węzły w przepływie pracy będą kontynuować wykonanie, nawet jeśli żądanie zakończy się niepowodzeniem.

## Użycie wyniku odpowiedzi

Wynik odpowiedzi żądania HTTP może zostać sparsowany przez węzeł [Zapytanie JSON](./json-query.md) w celu wykorzystania w kolejnych węzłach.

Od wersji `v1.0.0-alpha.16` trzy części wyniku odpowiedzi węzła żądania mogą być używane jako oddzielne zmienne:

*   Kod statusu odpowiedzi
*   Nagłówki odpowiedzi
*   Dane odpowiedzi

![Węzeł Żądanie HTTP_Użycie Wyniku Odpowiedzi](https://static-docs.nocobase.com/20240529110610.png)

Kod statusu odpowiedzi jest zazwyczaj standardowym kodem statusu HTTP w formie numerycznej, takim jak `200`, `403` itp. (podanym przez dostawcę usługi).

Nagłówki odpowiedzi (Response headers) są w formacie JSON. Zarówno nagłówki, jak i dane odpowiedzi w formacie JSON, nadal wymagają sparsowania za pomocą węzła JSON, zanim będzie można ich użyć.

## Przykład

Na przykład, możemy użyć węzła żądania do połączenia się z platformą chmurową w celu wysyłania powiadomień SMS. Konfiguracja dla API SMS w chmurze może wyglądać następująco (będą Państwo musieli zapoznać się z dokumentacją konkretnego API, aby dostosować parametry):

![Węzeł Żądanie HTTP_Konfiguracja](https://static-docs.nocobase.com/20240515124004.png)

Gdy przepływ pracy uruchomi ten węzeł, wywoła on API SMS z skonfigurowaną treścią. Jeśli żądanie zakończy się sukcesem, wiadomość SMS zostanie wysłana za pośrednictwem usługi SMS w chmurze.