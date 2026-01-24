---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Webhook

## Wprowadzenie

Wyzwalacz Webhook udostępnia adres URL, który może być wywołany przez systemy zewnętrzne za pomocą żądań HTTP. Gdy wystąpi zdarzenie w systemie zewnętrznym, wysyła on żądanie HTTP na ten adres URL, co uruchamia wykonanie przepływu pracy. Jest to idealne rozwiązanie do obsługi powiadomień inicjowanych przez systemy zewnętrzne, takich jak potwierdzenia płatności czy wiadomości.

## Tworzenie przepływu pracy

Podczas tworzenia przepływu pracy proszę wybrać typ „Zdarzenie Webhook”:

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Wskazówka"}
Różnica między synchronicznymi a asynchronicznymi przepływami pracy polega na tym, że synchroniczny przepływ pracy czeka na zakończenie jego wykonania, zanim zwróci odpowiedź, natomiast asynchroniczny przepływ pracy natychmiast zwraca odpowiedź skonfigurowaną w wyzwalaczu i kolejkuje wykonanie w tle.
:::

## Konfiguracja wyzwalacza

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Adres URL Webhooka

Adres URL wyzwalacza Webhook jest generowany automatycznie przez system i powiązany z tym przepływem pracy. Mogą Państwo kliknąć przycisk po prawej stronie, aby go skopiować i wkleić do systemu zewnętrznego.

Obsługiwana jest wyłącznie metoda HTTP POST; inne metody zwrócą błąd `405`.

### Bezpieczeństwo

Obecnie obsługiwane jest uwierzytelnianie HTTP Basic. Mogą Państwo włączyć tę opcję i ustawić nazwę użytkownika oraz hasło. Następnie proszę uwzględnić nazwę użytkownika i hasło w adresie URL Webhooka w systemie zewnętrznym, aby zaimplementować bezpieczne uwierzytelnianie dla Webhooka (szczegóły standardu znajdą Państwo pod adresem: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Gdy ustawiono nazwę użytkownika i hasło, system zweryfikuje, czy nazwa użytkownika i hasło w żądaniu są zgodne. Jeśli nie zostaną podane lub nie będą pasować, zostanie zwrócony błąd `401`.

### Parsowanie danych żądania

Gdy system zewnętrzny wywołuje Webhooka, dane zawarte w żądaniu muszą zostać sparsowane, zanim będzie można ich użyć w przepływie pracy. Po sparsowaniu dane te stają się zmienną wyzwalacza, którą można odwoływać się w kolejnych węzłach.

Parsowanie żądania HTTP dzieli się na trzy części:

1.  Nagłówki żądania

    Nagłówki żądania to zazwyczaj proste pary klucz-wartość typu string. Pola nagłówka, których Państwo potrzebują, można skonfigurować bezpośrednio. Na przykład `Date`, `X-Request-Id` itp.

2.  Parametry żądania

    Parametry żądania to część zapytania w adresie URL, na przykład parametr `query` w `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Mogą Państwo wkleić pełny przykładowy adres URL lub tylko część z parametrami zapytania, a następnie kliknąć przycisk parsowania, aby automatycznie sparsować pary klucz-wartość.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Automatyczne parsowanie przekształci część parametrów adresu URL w strukturę JSON i wygeneruje ścieżki takie jak `query[0]`, `query[0].a` w oparciu o hierarchię parametrów. Nazwę ścieżki można ręcznie zmodyfikować, jeśli nie spełnia ona Państwa wymagań, ale zazwyczaj nie jest to konieczne. Alias to opcjonalna nazwa wyświetlana zmiennej, gdy jest używana. Parsowanie wygeneruje również pełną listę parametrów z przykładu; mogą Państwo usunąć wszelkie niepotrzebne parametry.

3.  Treść żądania

    Treść żądania to część Body żądania HTTP. Obecnie obsługiwane są tylko treści żądań z `Content-Type` w formacie `application/json`. Mogą Państwo bezpośrednio skonfigurować ścieżki do sparsowania, lub wprowadzić przykładowy JSON i kliknąć przycisk parsowania w celu automatycznego parsowania.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Automatyczne parsowanie przekształci pary klucz-wartość w strukturze JSON w ścieżki. Na przykład `{"a": 1, "b": {"c": 2}}` wygeneruje ścieżki takie jak `a`, `b` i `b.c`. Alias to opcjonalna nazwa wyświetlana zmiennej, gdy jest używana. Parsowanie wygeneruje również pełną listę parametrów z przykładu; mogą Państwo usunąć wszelkie niepotrzebne parametry.

### Ustawienia odpowiedzi

Konfiguracja odpowiedzi Webhooka różni się w zależności od tego, czy przepływ pracy jest synchroniczny, czy asynchroniczny. W przypadku asynchronicznych przepływów pracy odpowiedź jest konfigurowana bezpośrednio w wyzwalaczu. Po otrzymaniu żądania Webhook, system natychmiast zwraca skonfigurowaną odpowiedź do systemu zewnętrznego, a następnie wykonuje przepływ pracy. Natomiast w przypadku synchronicznych przepływów pracy, należy dodać węzeł odpowiedzi w ramach przepływu, aby obsłużyć ją zgodnie z wymaganiami biznesowymi (szczegóły znajdą Państwo w: [Węzeł odpowiedzi](#węzeł-odpowiedzi)).

Zazwyczaj odpowiedź na asynchronicznie wywołane zdarzenie Webhook ma kod statusu `200` i treść odpowiedzi `ok`. Mogą Państwo również dostosować kod statusu odpowiedzi, nagłówki i treść odpowiedzi w zależności od potrzeb.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Węzeł odpowiedzi

Referencje: [Węzeł odpowiedzi](../nodes/response.md)

## Przykład

W przepływie pracy Webhooka można zwracać różne odpowiedzi w zależności od warunków biznesowych, jak pokazano na poniższym rysunku:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Za pomocą węzła rozgałęzienia warunkowego można określić, czy dany status biznesowy jest spełniony. Jeśli tak, zwracana jest odpowiedź sukcesu; w przeciwnym razie zwracana jest odpowiedź błędu.