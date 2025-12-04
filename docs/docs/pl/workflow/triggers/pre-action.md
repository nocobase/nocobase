---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zdarzenie Przed Akcją

## Wprowadzenie

Wtyczka Zdarzenie Przed Akcją oferuje mechanizm przechwytywania operacji, który może zostać uruchomiony po przesłaniu żądania utworzenia, aktualizacji lub usunięcia, ale jeszcze przed jego przetworzeniem.

Jeśli w uruchomionym przepływie pracy zostanie wykonany węzeł „Zakończ przepływ pracy” lub jeśli inny węzeł zakończy się niepowodzeniem (z powodu błędu lub innego nieukończenia), operacja formularza zostanie przechwycona. W przeciwnym razie zamierzona akcja zostanie wykonana normalnie.

Użycie tego mechanizmu w połączeniu z węzłem „Wiadomość zwrotna” pozwala skonfigurować wiadomość, która zostanie zwrócona do klienta, dostarczając mu odpowiednich informacji. Zdarzenia przed akcją mogą być wykorzystywane do walidacji biznesowej lub kontroli logicznych, aby zatwierdzić lub przechwycić żądania utworzenia, aktualizacji i usunięcia przesłane przez klienta.

## Konfiguracja wyzwalacza

### Tworzenie wyzwalacza

Podczas tworzenia przepływu pracy proszę wybrać typ „Zdarzenie Przed Akcją”:

![Tworzenie Zdarzenia Przed Akcją](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Wybór kolekcji

W wyzwalaczu przepływu pracy przechwytującego, pierwszą rzeczą do skonfigurowania jest kolekcja odpowiadająca danej akcji:

![Konfiguracja Zdarzenia Przechwytującego_Kolekcja](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Następnie proszę wybrać tryb przechwytywania. Mogą Państwo zdecydować się na przechwytywanie tylko przycisku akcji powiązanego z tym przepływem pracy, albo przechwytywać wszystkie wybrane akcje dla tej kolekcji (niezależnie od tego, z którego formularza pochodzą i bez konieczności wiązania z odpowiednim przepływem pracy):

### Tryb przechwytywania

![Konfiguracja Zdarzenia Przechwytującego_Tryb Przechwytywania](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Obecnie obsługiwane typy akcji to „Utwórz”, „Aktualizuj” i „Usuń”. Można jednocześnie wybrać wiele typów akcji.

## Konfiguracja akcji

Jeśli w konfiguracji wyzwalacza wybrano tryb „Wyzwalaj przechwytywanie tylko po przesłaniu formularza powiązanego z tym przepływem pracy”, należy również wrócić do interfejsu formularza i powiązać ten przepływ pracy z odpowiednim przyciskiem akcji:

![Dodaj Zamówienie_Powiąż Przepływ Pracy](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

W konfiguracji powiązania przepływu pracy proszę wybrać odpowiedni przepływ pracy. Zazwyczaj domyślny kontekst dla danych wyzwalających, „Całe dane formularza”, jest wystarczający:

![Wybierz Przepływ Pracy do Powiązania](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Wskazówka}
Przyciski, które można powiązać ze Zdarzeniem Przed Akcją, obecnie obsługują tylko przyciski „Prześlij” (lub „Zapisz”), „Aktualizuj dane” i „Usuń” w formularzach tworzenia lub aktualizacji. Przycisk „Uruchom przepływ pracy” nie jest obsługiwany (można go powiązać tylko ze „Zdarzeniem Po Akcji”).
:::

## Warunki przechwytywania

W przypadku „Zdarzenia Przed Akcją” istnieją dwa warunki, które spowodują przechwycenie odpowiadającej akcji:

1. Przepływ pracy dochodzi do dowolnego węzła „Zakończ przepływ pracy”. Podobnie jak w poprzednich instrukcjach, gdy dane, które uruchomiły przepływ pracy, nie spełniają wstępnie ustawionych warunków w węźle „Warunek”, przepływ wejdzie w gałąź „Nie” i wykona węzeł „Zakończ przepływ pracy”. W tym momencie przepływ pracy zostanie zakończony, a żądana akcja zostanie przechwycona.
2. Dowolny węzeł w przepływie pracy zakończy się niepowodzeniem, w tym błędy wykonania węzła lub inne wyjątki. W takim przypadku przepływ pracy zakończy się z odpowiednim statusem, a żądana akcja również zostanie przechwycona. Na przykład, jeśli przepływ pracy wywołuje dane zewnętrzne za pośrednictwem „Żądania HTTP” i żądanie to zakończy się niepowodzeniem, przepływ pracy zakończy się ze statusem błędu, a także przechwyci odpowiadające żądanie akcji.

Po spełnieniu warunków przechwytywania, odpowiadająca akcja nie zostanie już wykonana. Na przykład, jeśli przesłanie zamówienia zostanie przechwycone, odpowiadające dane zamówienia nie zostaną utworzone.

## Powiązane parametry dla odpowiadającej akcji

W przepływie pracy typu „Zdarzenie Przed Akcją”, dla różnych operacji, wyzwalacz udostępnia różne dane, które mogą być używane jako zmienne w przepływie pracy:

| Typ akcji \ Zmienna | „Operator” | „Identyfikator roli operatora” | Parametr akcji: „ID” | Parametr akcji: „Przesłany obiekt danych” |
| ------------------ | -------- | ---------------- | -------------- | -------------------------- |
| Utwórz rekord       | ✓        | ✓                | -              | ✓                          |
| Zaktualizuj rekord | ✓        | ✓                | ✓              | ✓                          |
| Usuń pojedynczy lub wiele rekordów | ✓        | ✓                | ✓              | -                          |

:::info{title=Wskazówka}
Zmienna „Dane wyzwalacza / Parametry akcji / Przesłany obiekt danych” w Zdarzeniu Przed Akcją nie jest rzeczywistymi danymi z bazy danych, lecz parametrami przesłanymi wraz z akcją. Jeśli potrzebują Państwo rzeczywistych danych z bazy danych, należy je odpytać za pomocą węzła „Zapytanie o dane” w ramach przepływu pracy.

Ponadto, w przypadku akcji usuwania, „ID” w parametrach akcji jest pojedynczą wartością, gdy dotyczy pojedynczego rekordu, ale jest tablicą, gdy dotyczy wielu rekordów.
:::

## Wyjście wiadomości zwrotnej

Po skonfigurowaniu wyzwalacza mogą Państwo dostosować odpowiednią logikę decyzyjną w przepływie pracy. Zazwyczaj używa się trybu rozgałęzienia węzła „Warunek”, aby na podstawie wyników konkretnych warunków biznesowych zdecydować, czy „Zakończyć przepływ pracy” i zwrócić wstępnie ustawioną „Wiadomość zwrotną”:

![Konfiguracja Przepływu Pracy Przechwytującego](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

W tym momencie konfiguracja odpowiadającego przepływu pracy jest zakończona. Mogą Państwo teraz spróbować przesłać dane, które nie spełniają warunków skonfigurowanych w węźle warunkowym przepływu pracy, aby uruchomić logikę przechwytywania. Wówczas zobaczą Państwo zwróconą wiadomość zwrotną:

![Wiadomość Zwrotna o Błędzie](https://static-docs.nocobase.com/06bd4a6b6ec499c39987f63a6a.png)

### Status wiadomości zwrotnej

Jeśli węzeł „Zakończ przepływ pracy” jest skonfigurowany do zakończenia ze statusem „Sukces”, a ten węzeł zostanie wykonany, żądanie akcji nadal zostanie przechwycone, ale zwrócona wiadomość zwrotna zostanie wyświetlona ze statusem „Sukces” (zamiast „Błąd”):

![Wiadomość Zwrotna ze Statusem Sukcesu](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Przykład

Łącząc powyższe podstawowe instrukcje, weźmy jako przykład scenariusz „Przesyłanie zamówienia”. Załóżmy, że gdy użytkownik przesyła zamówienie, musimy sprawdzić stan magazynowy wszystkich wybranych produktów. Jeśli stan magazynowy któregokolwiek z wybranych produktów jest niewystarczający, przesłanie zamówienia zostanie przechwycone, a zostanie zwrócona odpowiednia wiadomość. Przepływ pracy będzie sprawdzał każdy produkt w pętli, aż stan magazynowy wszystkich produktów będzie wystarczający, a następnie utworzy dane zamówienia dla użytkownika.

Pozostałe kroki są takie same jak w instrukcjach. Jednakże, ponieważ zamówienie dotyczy wielu produktów, oprócz dodania relacji wiele-do-wielu „Zamówienie” <-- M:1 -- „Pozycja zamówienia” -- 1:M --> „Produkt” w modelu danych, należy również dodać węzeł „Pętla” w przepływie pracy „Zdarzenie Przed Akcją”, aby iteracyjnie sprawdzać, czy stan magazynowy każdego produktu jest wystarczający:

![Przykład_Przepływ Pracy Sprawdzania w Pętli](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Obiektem dla pętli jest tablica „Pozycja zamówienia” z przesłanych danych zamówienia:

![Przykład_Konfiguracja Obiektu Pętli](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Węzeł warunkowy w pętli służy do określenia, czy stan magazynowy bieżącego obiektu produktu w pętli jest wystarczający:

![Przykład_Warunek w Pętli](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Pozostałe konfiguracje są takie same jak w podstawowym użyciu. Po ostatecznym przesłaniu zamówienia, jeśli którykolwiek produkt ma niewystarczający stan magazynowy, przesłanie zamówienia zostanie przechwycone, a zostanie zwrócona odpowiednia wiadomość. Podczas testowania proszę spróbować przesłać zamówienie z wieloma produktami, gdzie jeden ma niewystarczający stan magazynowy, a inny ma wystarczający. Zobaczą Państwo zwróconą wiadomość zwrotną:

![Przykład_Wiadomość Zwrotna po Przesłaniu](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Jak widać, wiadomość zwrotna nie wskazuje na brak stanu magazynowego pierwszego produktu „iPhone 15 pro”, a jedynie na brak stanu magazynowego drugiego produktu „iPhone 14 pro”. Dzieje się tak, ponieważ w pętli pierwszy produkt miał wystarczający stan magazynowy, więc nie został przechwycony, natomiast drugi produkt miał niewystarczający stan magazynowy, co spowodowało przechwycenie przesłania zamówienia.

## Wywołanie zewnętrzne

Samo Zdarzenie Przed Akcją jest wstrzykiwane w fazie przetwarzania żądania, dlatego obsługuje również wyzwalanie za pośrednictwem wywołań HTTP API.

Dla przepływów pracy, które są lokalnie powiązane z przyciskiem akcji, można je wywołać w następujący sposób (na przykładzie przycisku tworzenia dla kolekcji `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Parametr URL `triggerWorkflows` to klucz przepływu pracy; wiele kluczy przepływów pracy jest oddzielonych przecinkami. Ten klucz można uzyskać, najeżdżając myszą na nazwę przepływu pracy u góry obszaru roboczego przepływu pracy:

![Przepływ Pracy_Klucz_Metoda Wyświetlania](https://static-docs.nocobase.com/20240426135108.png)

Po wykonaniu powyższego wywołania zostanie uruchomione Zdarzenie Przed Akcją dla odpowiadającej kolekcji `posts`. Po synchronicznym przetworzeniu odpowiadającego przepływu pracy, dane zostaną normalnie utworzone i zwrócone.

Jeśli skonfigurowany przepływ pracy osiągnie „Węzeł końcowy”, logika jest taka sama jak w przypadku akcji interfejsu: żądanie zostanie przechwycone i żadne dane nie zostaną utworzone. Jeśli status węzła końcowego jest skonfigurowany jako niepowodzenie, zwrócony kod statusu odpowiedzi będzie wynosił `400`; w przypadku sukcesu będzie to `200`.

Jeśli przed węzłem końcowym skonfigurowano również węzeł „Wiadomość zwrotna”, wygenerowana wiadomość również zostanie zwrócona w wyniku odpowiedzi. Struktura w przypadku błędu jest następująca:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Struktura wiadomości, gdy „Węzeł końcowy” jest skonfigurowany na sukces, jest następująca:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Wskazówka}
Ponieważ w przepływie pracy można dodać wiele węzłów „Wiadomość zwrotna”, struktura danych zwróconej wiadomości jest tablicą.
:::

Jeśli Zdarzenie Przed Akcją jest skonfigurowane w trybie globalnym, podczas wywoływania HTTP API nie trzeba używać parametru URL `triggerWorkflows` do określenia odpowiadającego przepływu pracy. Wystarczy bezpośrednio wywołać akcję odpowiadającej kolekcji, aby ją uruchomić.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Wskazówka"}
Podczas wywoływania zdarzenia przed akcją za pośrednictwem HTTP API, należy również zwrócić uwagę na status włączenia przepływu pracy oraz na to, czy konfiguracja kolekcji jest zgodna, w przeciwnym razie wywołanie może się nie powieść lub może wystąpić błąd.
:::