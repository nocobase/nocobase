---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Zdarzenie po operacji

## Wprowadzenie

Wszystkie zmiany danych wprowadzane przez użytkowników w systemie są zazwyczaj realizowane poprzez wykonanie jakiejś operacji. Najczęściej polega to na kliknięciu przycisku, który może być przyciskiem `Wyślij` w formularzu lub przyciskiem akcji w bloku danych. Zdarzenia po operacji służą do powiązania odpowiednich przepływów pracy z tymi przyciskami, tak aby po pomyślnym zakończeniu operacji przez użytkownika został uruchomiony określony proces.

Na przykład, podczas dodawania lub aktualizowania danych, użytkownik może skonfigurować opcję „Powiąż przepływ pracy” dla przycisku. Po zakończeniu operacji zostanie uruchomiony powiązany przepływ pracy.

Na poziomie implementacji, ponieważ obsługa zdarzeń po operacji odbywa się na warstwie middleware (middleware Koa), wywołania HTTP API do NocoBase również mogą uruchamiać zdefiniowane zdarzenia po operacji.

## Instalacja

Jest to wtyczka wbudowana, nie wymaga instalacji.

## Konfiguracja wyzwalacza

### Tworzenie przepływu pracy

Podczas tworzenia przepływu pracy proszę wybrać typ „Zdarzenie po operacji”:

![Create Workflow_Post-Action Event Trigger](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Tryb wykonania

Dla zdarzeń po operacji, podczas ich tworzenia, mogą Państwo również wybrać tryb wykonania: „Synchroniczny” lub „Asynchroniczny”:

![Create Workflow_Select Synchronous or Asynchronous](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Jeśli proces ma zostać wykonany i zwrócony natychmiast po operacji użytkownika, można użyć trybu synchronicznego; w przeciwnym razie domyślnie używany jest tryb asynchroniczny. W trybie asynchronicznym operacja zostaje zakończona natychmiast po uruchomieniu przepływu pracy, a przepływ pracy będzie wykonywany sekwencyjnie w tle aplikacji, w kolejce.

### Konfiguracja kolekcji

Proszę przejść do obszaru roboczego przepływu pracy, kliknąć wyzwalacz, aby otworzyć okno konfiguracji, a następnie wybrać `kolekcję` do powiązania:

![Workflow Configuration_Select Collection](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Wybór trybu wyzwalania

Następnie proszę wybrać tryb wyzwalania, dostępny jest tryb lokalny i globalny:

![Workflow Configuration_Select Trigger Mode](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Gdzie:

*   Tryb lokalny jest uruchamiany tylko na przyciskach akcji, do których ten `przepływ pracy` jest powiązany. Kliknięcie przycisków, które nie mają powiązanego tego `przepływu pracy`, nie spowoduje jego uruchomienia. Mogą Państwo zdecydować, czy powiązać ten `przepływ pracy`, biorąc pod uwagę, czy formularze o różnym przeznaczeniu powinny uruchamiać ten sam proces.
*   Tryb globalny jest uruchamiany na wszystkich skonfigurowanych przyciskach akcji `kolekcji`, niezależnie od tego, z którego formularza pochodzą, i nie ma potrzeby wiązania odpowiedniego `przepływu pracy`.

W trybie lokalnym, obecnie obsługiwane są następujące przyciski akcji, które można powiązać:

*   Przyciski „Wyślij” i „Zapisz” w formularzu dodawania.
*   Przyciski „Wyślij” i „Zapisz” w formularzu aktualizacji.
*   Przycisk „Aktualizuj dane” w wierszach danych (tabela, lista, kanban itp.).

### Wybór typu operacji

Jeśli wybrali Państwo tryb globalny, należy również wybrać typ operacji. Obecnie obsługiwane są „Operacja tworzenia danych” i „Operacja aktualizacji danych”. Obie operacje uruchamiają `przepływ pracy` po pomyślnym zakończeniu operacji.

### Wybór wstępnie załadowanych danych powiązanych

Jeśli chcą Państwo użyć danych powiązanych z danymi wyzwalającymi w kolejnych procesach, mogą Państwo wybrać pola relacji do wstępnego załadowania:

![Workflow Configuration_Preload Association](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Po uruchomieniu, te powiązane dane mogą być bezpośrednio używane w procesie.

## Konfiguracja operacji

W przypadku operacji w lokalnym trybie wyzwalania, po skonfigurowaniu `przepływu pracy`, należy wrócić do interfejsu użytkownika i powiązać ten `przepływ pracy` z przyciskiem akcji formularza w odpowiednim bloku danych.

`Przepływy pracy` skonfigurowane dla przycisku „Wyślij” (w tym przycisku „Zapisz dane”) zostaną uruchomione po przesłaniu przez użytkownika odpowiedniego formularza i zakończeniu operacji na danych.

![Post-Action Event_Submit Button](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Proszę wybrać „Powiąż `przepływ pracy`” z menu konfiguracji przycisku, aby otworzyć wyskakujące okno konfiguracji powiązania. W tym oknie można skonfigurować dowolną liczbę `przepływów pracy` do uruchomienia; jeśli żaden nie zostanie skonfigurowany, oznacza to, że nie jest wymagane żadne uruchamianie. Dla każdego `przepływu pracy` należy najpierw określić, czy dane wyzwalające to dane całego formularza, czy dane z określonego pola relacji w formularzu. Następnie, w oparciu o `kolekcję` odpowiadającą wybranemu modelowi danych, należy wybrać `przepływ pracy` formularza, który został skonfigurowany tak, aby pasował do tego modelu `kolekcji`.

![Post-Action Event_Bind Workflow Configuration_Context Selection](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Post-Action Event_Bind Workflow Configuration_Workflow Selection](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Wskazówka"}
`Przepływ pracy` musi być włączony, aby można go było wybrać w powyższym interfejsie.
:::

## Przykład

Poniżej przedstawiamy demonstrację z wykorzystaniem operacji tworzenia.

Załóżmy scenariusz „Wniosku o zwrot kosztów”. Po przesłaniu wniosku o zwrot kosztów przez pracownika, musimy przeprowadzić automatyczną weryfikację kwoty oraz ręczną weryfikację dla kwot przekraczających limit. Tylko wnioski, które pomyślnie przejdą weryfikację, zostaną zatwierdzone, a następnie przekazane do działu finansowego.

Najpierw możemy utworzyć `kolekcję` „Zwrot kosztów” z następującymi polami:

- Nazwa projektu: Tekst jednowierszowy
- Wnioskodawca: Wiele do jednego (Użytkownik)
- Kwota: Liczba
- Status: Jednokrotny wybór („Zatwierdzony”, „Przetworzony”)

Następnie proszę utworzyć `przepływ pracy` typu „Zdarzenie po operacji” i skonfigurować model `kolekcji` w wyzwalaczu jako `kolekcję` „Zwrot kosztów”:

![Example_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Po ustawieniu `przepływu pracy` na stan włączony, wrócimy później do konfiguracji konkretnych węzłów przetwarzania procesu.

Następnie tworzymy na interfejsie blok tabeli dla `kolekcji` „Zwrot kosztów”, dodajemy przycisk „Dodaj” do paska narzędzi i konfigurujemy odpowiednie pola formularza. W opcjach konfiguracji przycisku akcji „Wyślij” formularza otwieramy okno dialogowe konfiguracji „Powiąż `przepływ pracy`”, wybieramy wszystkie dane formularza jako kontekst oraz `przepływ pracy`, który wcześniej utworzyliśmy:

![Example_Form Button Configuration_Bind Workflow](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Po zakończeniu konfiguracji formularza, wracamy do orkiestracji logiki `przepływu pracy`. Na przykład, jeśli kwota przekracza 500 jednostek, wymagamy ręcznej weryfikacji przez administratora; w przeciwnym razie wniosek jest zatwierdzany automatycznie. Rekord zwrotu kosztów jest tworzony dopiero po zatwierdzeniu i jest dalej przetwarzany przez dział finansowy (pominięto).

![Example_Processing Flow](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Pomijając dalsze przetwarzanie przez dział finansowy, konfiguracja procesu wniosku o zwrot kosztów jest teraz zakończona. Gdy pracownik wypełni i prześle wniosek o zwrot kosztów, zostanie uruchomiony odpowiedni `przepływ pracy`. Jeśli kwota wydatku jest mniejsza niż 500, rekord zostanie automatycznie utworzony i będzie czekał na dalsze przetwarzanie przez dział finansowy. W przeciwnym razie zostanie on zweryfikowany przez przełożonego, a po zatwierdzeniu rekord również zostanie utworzony i przekazany do działu finansowego.

Proces przedstawiony w tym przykładzie można również skonfigurować na zwykłym przycisku „Wyślij”. Mogą Państwo zdecydować, czy najpierw utworzyć rekord, a następnie wykonać kolejne procesy, w zależności od konkretnego scenariusza biznesowego.

## Wywołanie zewnętrzne

Uruchamianie zdarzeń po operacji nie ogranicza się tylko do operacji w interfejsie użytkownika; mogą być one również wyzwalane poprzez wywołania HTTP API.

:::info{title="Wskazówka"}
Podczas wywoływania zdarzenia po operacji za pośrednictwem wywołania HTTP API, należy również zwrócić uwagę na stan włączenia `przepływu pracy` oraz na to, czy konfiguracja `kolekcji` jest zgodna, w przeciwnym razie wywołanie może się nie powieść lub wystąpi błąd.
:::

Dla `przepływów pracy` lokalnie powiązanych z przyciskiem akcji, można je wywołać w następujący sposób (na przykładzie przycisku tworzenia dla `kolekcji` `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Gdzie parametr URL `triggerWorkflows` to klucz `przepływu pracy`, a wiele `przepływów pracy` jest oddzielonych przecinkami. Ten klucz można uzyskać, najeżdżając myszką na nazwę `przepływu pracy` u góry obszaru roboczego `przepływu pracy`:

![Workflow_Key_View Method](https://static-docs.nocobase.com/20240426135108.png)

Po pomyślnym wykonaniu powyższego wywołania, zostanie uruchomione zdarzenie po operacji dla odpowiedniej `kolekcji` `posts`.

:::info{title="Wskazówka"}
Ponieważ wywołania zewnętrzne również muszą być oparte na tożsamości użytkownika, podczas wywoływania za pośrednictwem HTTP API, podobnie jak w przypadku żądań wysyłanych z normalnego interfejsu, należy podać informacje uwierzytelniające, w tym nagłówek żądania `Authorization` lub parametr `token` (token uzyskany po zalogowaniu) oraz nagłówek żądania `X-Role` (nazwa bieżącej roli użytkownika).
:::

Jeśli chcą Państwo uruchomić zdarzenie dla danych relacji jeden do jednego w tej operacji (relacje jeden do wielu nie są jeszcze obsługiwane), można użyć `!` w parametrze, aby określić dane wyzwalające dla pola relacji:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Po pomyślnym wykonaniu powyższego wywołania, zostanie uruchomione zdarzenie po operacji dla odpowiedniej `kolekcji` `categories`.

:::info{title="Wskazówka"}
Jeśli zdarzenie jest skonfigurowane w trybie globalnym, nie ma potrzeby używania parametru URL `triggerWorkflows` do określania odpowiedniego `przepływu pracy`. Wystarczy bezpośrednio wywołać odpowiednią operację `kolekcji`, aby ją uruchomić.
:::

## Często zadawane pytania

### Różnica w stosunku do zdarzenia przed operacją

*   Zdarzenie przed operacją: Uruchamiane przed wykonaniem operacji (takiej jak dodawanie, aktualizacja itp.). Przed wykonaniem operacji, dane żądania mogą być walidowane lub przetwarzane w `przepływie pracy`. Jeśli `przepływ pracy` zostanie zakończony (żądanie zostanie przechwycone), operacja (dodawanie, aktualizacja itp.) nie zostanie wykonana.
*   Zdarzenie po operacji: Uruchamiane po pomyślnym zakończeniu operacji przez użytkownika. W tym momencie dane zostały już pomyślnie przesłane i zapisane w bazie danych, a powiązane procesy mogą być kontynuowane w oparciu o pomyślny wynik.

Jak pokazano na poniższym rysunku:

![Action Execution Order](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Różnica w stosunku do zdarzenia kolekcji

Zdarzenia po operacji i zdarzenia `kolekcji` są podobne w tym sensie, że oba są procesami uruchamianymi po zmianach danych. Jednak ich poziomy implementacji są różne. Zdarzenia po operacji działają na poziomie API, podczas gdy zdarzenia `kolekcji` dotyczą zmian danych w `kolekcji`.

Zdarzenia `kolekcji` są bliższe warstwie bazowej systemu. W niektórych przypadkach zmiana danych spowodowana jednym zdarzeniem może wywołać inne zdarzenie, tworząc reakcję łańcuchową. Zwłaszcza gdy dane w niektórych powiązanych `kolekcjach` również zmieniają się podczas operacji na bieżącej `kolekcji`, zdarzenia związane z powiązaną `kolekcją` również mogą zostać uruchomione.

Uruchamianie zdarzeń `kolekcji` nie zawiera informacji związanych z użytkownikiem. Natomiast zdarzenia po operacji są bliższe stronie użytkownika i są wynikiem jego działań. Kontekst `przepływu pracy` będzie również zawierał informacje związane z użytkownikiem, co czyni je odpowiednimi do obsługi procesów związanych z operacjami użytkownika. W przyszłym projekcie NocoBase, może zostać rozszerzona liczba zdarzeń po operacji, które mogą być używane do wyzwalania, dlatego **bardziej zaleca się używanie zdarzeń po operacji** do obsługi procesów, w których zmiany danych są spowodowane działaniami użytkownika.

Inną różnicą jest to, że zdarzenia po operacji mogą być lokalnie powiązane z konkretnymi przyciskami formularza. Jeśli istnieje wiele formularzy, przesłanie niektórych formularzy może wywołać to zdarzenie, podczas gdy inne nie. Zdarzenia `kolekcji` natomiast dotyczą zmian danych w całej `kolekcji` i nie mogą być lokalnie powiązane.