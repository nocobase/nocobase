---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zatwierdzanie

## Wprowadzenie

Zatwierdzanie to typ procesu, który jest inicjowany i przetwarzany ręcznie przez użytkowników, aby decydować o statusie powiązanych danych. Jest powszechnie stosowany w automatyzacji biura lub do zarządzania procesami wymagającymi ręcznych decyzji. Pozwala na tworzenie i zarządzanie przepływami pracy dla scenariuszy takich jak „wnioski urlopowe”, „zatwierdzanie zwrotów kosztów” czy „zatwierdzanie zakupu surowców”.

Wtyczka Zatwierdzanie udostępnia dedykowany typ przepływu pracy (wyzwalacz) „Zatwierdzanie (zdarzenie)” oraz specjalny węzeł „Zatwierdzanie” dla tego procesu. W połączeniu z unikalnymi dla NocoBase niestandardowymi kolekcjami i blokami, mogą Państwo szybko i elastycznie tworzyć oraz zarządzać różnymi scenariuszami zatwierdzania.

## Tworzenie przepływu pracy

Aby utworzyć przepływ pracy zatwierdzania, proszę wybrać typ „Zatwierdzanie” podczas tworzenia nowego przepływu pracy:

![Wyzwalacz zatwierdzania_Tworzenie przepływu pracy zatwierdzania](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Następnie, w interfejsie konfiguracji przepływu pracy, proszę kliknąć wyzwalacz, aby otworzyć okno dialogowe z dodatkowymi opcjami konfiguracji.

## Konfiguracja wyzwalacza

### Wiązanie kolekcji

Wtyczka Zatwierdzanie w NocoBase została zaprojektowana z myślą o elastyczności i może współpracować z dowolną niestandardową kolekcją. Oznacza to, że konfiguracja zatwierdzania nie wymaga ponownego definiowania modelu danych, lecz bezpośrednio wykorzystuje już istniejącą kolekcję. Dlatego po przejściu do konfiguracji wyzwalacza, w pierwszej kolejności należy wybrać kolekcję, aby określić, które dane z tej kolekcji (po utworzeniu lub aktualizacji) będą wyzwalać ten przepływ pracy:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Wybór kolekcji](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Następnie, w formularzu tworzenia (lub edycji) danych dla wybranej kolekcji, proszę powiązać ten przepływ pracy z przyciskiem wysyłania:

![Inicjowanie zatwierdzania_Wiązanie przepływu pracy](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Po tym, jak użytkownik prześle formularz, zostanie wyzwolony odpowiedni przepływ pracy zatwierdzania. Przesłane dane zostaną nie tylko zapisane w powiązanej kolekcji, ale także zarchiwizowane w procesie zatwierdzania, aby były dostępne do wglądu dla kolejnych osób zatwierdzających.

### Wycofanie

Jeśli przepływ pracy zatwierdzania ma umożliwiać inicjatorowi wycofanie, należy w konfiguracji interfejsu inicjatora włączyć przycisk „Wycofaj”:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Zezwalaj na wycofanie](https://static-docs.nocobase.com/20251029232544.png)

Po włączeniu tej opcji, zatwierdzenie zainicjowane w ramach tego przepływu pracy może zostać wycofane przez inicjatora, zanim zostanie przetworzone przez jakąkolwiek osobę zatwierdzającą. Jednak po przetworzeniu przez osobę zatwierdzającą w kolejnym węźle zatwierdzania, wycofanie nie będzie już możliwe.

:::info{title=Wskazówka}
Po włączeniu lub usunięciu przycisku wycofania, należy kliknąć „Zapisz i prześlij” w oknie dialogowym konfiguracji wyzwalacza, aby zmiany zostały zastosowane.
:::

### Konfiguracja interfejsu formularza inicjatora

Na koniec należy skonfigurować interfejs formularza inicjatora. Ten interfejs będzie służył do przesyłania danych zarówno podczas inicjowania z bloku centrum zatwierdzania, jak i podczas ponownego inicjowania po wycofaniu przez użytkownika. Proszę kliknąć przycisk konfiguracji, aby otworzyć okno dialogowe:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Formularz inicjatora](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Mogą Państwo dodać do interfejsu inicjatora formularz do wypełnienia, oparty na powiązanej kolekcji, lub tekst opisowy (Markdown) służący jako wskazówki i instrukcje. Formularz jest obowiązkowy; w przeciwnym razie inicjator nie będzie mógł wykonywać żadnych operacji po wejściu do tego interfejsu.

Po dodaniu bloku formularza, podobnie jak w standardowym interfejsie konfiguracji formularza, mogą Państwo dodawać komponenty pól z powiązanej kolekcji i dowolnie je rozmieszczać, aby zorganizować zawartość do wypełnienia w formularzu:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Formularz inicjatora_Konfiguracja pól](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Oprócz przycisku bezpośredniego wysyłania, mogą Państwo również dodać przycisk akcji „Zapisz jako szkic”, aby umożliwić tymczasowe zapisywanie procesu:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Formularz inicjatora_Konfiguracja akcji](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Węzeł zatwierdzania

W przepływie pracy zatwierdzania należy użyć dedykowanego węzła „Zatwierdzanie”, aby skonfigurować logikę operacyjną dla osób zatwierdzających, umożliwiającą przetwarzanie (zatwierdzanie, odrzucanie lub zwracanie) zainicjowanego zatwierdzenia. Węzeł „Zatwierdzanie” może być używany wyłącznie w przepływach pracy zatwierdzania. Proszę zapoznać się z [Węzłem zatwierdzania](../nodes/approval.md), aby uzyskać szczegółowe informacje.

## Konfiguracja inicjowania zatwierdzania

Po skonfigurowaniu i włączeniu przepływu pracy zatwierdzania, mogą Państwo powiązać go z przyciskiem wysyłania formularza odpowiedniej kolekcji, aby użytkownicy mogli inicjować zatwierdzenie podczas przesyłania danych:

![Inicjowanie zatwierdzania_Wiązanie przepływu pracy](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Po powiązaniu przepływu pracy, użytkownik inicjuje zatwierdzenie w momencie przesłania bieżącego formularza.

:::info{title=Wskazówka}
Przycisk inicjowania zatwierdzenia obecnie obsługuje wyłącznie przycisk „Wyślij” (lub „Zapisz”) w formularzach tworzenia lub aktualizacji. Nie obsługuje przycisku „Wyślij do przepływu pracy” (który może być powiązany tylko ze „Zdarzeniem po akcji”).
:::

## Centrum zadań

Centrum zadań stanowi ujednolicony punkt dostępu, ułatwiający użytkownikom przeglądanie i przetwarzanie zadań do wykonania. Zatwierdzenia zainicjowane przez bieżącego użytkownika oraz jego oczekujące zadania są dostępne poprzez Centrum zadań w górnym pasku narzędzi. Różne typy zadań do wykonania można przeglądać za pomocą nawigacji po lewej stronie.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Moje zgłoszenia

#### Przeglądanie zgłoszonych zatwierdzeń

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Bezpośrednie inicjowanie nowego zatwierdzenia

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Moje zadania do wykonania

#### Lista zadań do wykonania

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Szczegóły zadania do wykonania

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## API HTTP

### Inicjator

#### Inicjowanie z kolekcji

Aby zainicjować proces z bloku danych, mogą Państwo użyć następującego wywołania (na przykładzie przycisku tworzenia dla kolekcji `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Parametr URL `triggerWorkflows` to klucz przepływu pracy; wiele przepływów pracy należy oddzielić przecinkami. Ten klucz można uzyskać, najeżdżając kursorem myszy na nazwę przepływu pracy u góry obszaru roboczego przepływu pracy:

![Przepływ pracy_Klucz_Metoda_wyświetlania](https://static-docs.nocobase.com/20240426135108.png)

Po pomyślnym wywołaniu zostanie wyzwolony przepływ pracy zatwierdzania dla odpowiedniej kolekcji `posts`.

:::info{title="Wskazówka"}
Ponieważ wywołania zewnętrzne również wymagają uwierzytelnienia użytkownika, podczas korzystania z API HTTP, podobnie jak w przypadku żądań wysyłanych z interfejsu użytkownika, należy podać informacje uwierzytelniające. Obejmuje to nagłówek `Authorization` lub parametr `token` (token uzyskany po zalogowaniu) oraz nagłówek `X-Role` (nazwa bieżącej roli użytkownika).
:::

Jeśli chcą Państwo wyzwolić zdarzenie dla danych powiązanych jeden do jednego w tej operacji (relacje jeden do wielu nie są jeszcze obsługiwane), mogą Państwo użyć `!` w parametrze, aby określić dane wyzwalające dla pola relacji:

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

Po pomyślnym wywołaniu powyższego, zostanie wyzwolone zdarzenie zatwierdzania dla odpowiedniej kolekcji `categories`.

:::info{title="Wskazówka"}
Podczas wywoływania zdarzeń po akcji za pośrednictwem API HTTP, należy również zwrócić uwagę na status włączenia przepływu pracy oraz na to, czy konfiguracja kolekcji jest zgodna. W przeciwnym razie wywołanie może się nie powieść lub wystąpić błąd.
:::

#### Inicjowanie z Centrum zatwierdzania

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parametry**

*   `collectionName`: Nazwa docelowej kolekcji do inicjowania zatwierdzenia, wymagane.
*   `workflowId`: ID przepływu pracy używanego do inicjowania zatwierdzenia, wymagane.
*   `data`: Pola rekordu kolekcji tworzonego podczas inicjowania zatwierdzenia, wymagane.
*   `status`: Status rekordu tworzonego podczas inicjowania zatwierdzenia, wymagane. Możliwe wartości to:
    *   `0`: Szkic, oznacza zapisanie bez przesyłania do zatwierdzenia.
    *   `1`: Prześlij do zatwierdzenia, oznacza, że inicjator przesyła wniosek o zatwierdzenie, rozpoczynając proces zatwierdzania.

#### Zapisz i wyślij

Gdy zainicjowane (lub wycofane) zatwierdzenie znajduje się w stanie szkicu, mogą Państwo ponownie je zapisać lub wysłać za pośrednictwem następującego API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Pobieranie listy zgłoszonych zatwierdzeń

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Wycofanie

Inicjator może wycofać rekord aktualnie znajdujący się w procesie zatwierdzania za pośrednictwem następującego API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametry**

*   `<approval id>`: ID rekordu zatwierdzenia do wycofania, wymagane.

### Osoba zatwierdzająca

Gdy przepływ pracy zatwierdzania wejdzie w węzeł zatwierdzania, dla bieżącej osoby zatwierdzającej zostanie utworzone zadanie do wykonania. Osoba zatwierdzająca może wykonać zadanie zatwierdzania za pośrednictwem interfejsu użytkownika lub poprzez wywołanie API HTTP.

#### Pobieranie rekordów zatwierdzeń

Zadania do wykonania to rekordy przetwarzania zatwierdzeń. Mogą Państwo uzyskać wszystkie rekordy przetwarzania zatwierdzeń bieżącego użytkownika za pośrednictwem następującego API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Gdzie `approvalRecords`, jako zasób kolekcji, może również używać ogólnych warunków zapytania, takich jak `filter`, `sort`, `pageSize` i `page`.

#### Pobieranie pojedynczego rekordu zatwierdzenia

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Zatwierdź i odrzuć

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parametry**

*   `<record id>`: ID rekordu do przetworzenia zatwierdzenia, wymagane.
*   `status`: Pole statusu przetwarzania zatwierdzenia. `2` oznacza „Zatwierdź”, `-1` oznacza „Odrzuć”, wymagane.
*   `comment`: Uwagi do przetwarzania zatwierdzenia, opcjonalne.
*   `data`: Oznacza modyfikacje rekordu kolekcji, w której znajduje się bieżący węzeł zatwierdzania, po zatwierdzeniu. Opcjonalne (skuteczne tylko po zatwierdzeniu).

#### Cofnij <Badge>v1.9.0+</Badge>

Przed wersją v1.9.0, cofnięcie używało tego samego API co „Zatwierdź” i „Odrzuć”, gdzie `"status": 1` oznaczało cofnięcie.

Od wersji v1.9.0, cofnięcie ma oddzielne API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametry**

*   `<record id>`: ID rekordu do przetworzenia zatwierdzenia, wymagane.
*   `returnToNodeKey`: Klucz docelowego węzła, do którego należy cofnąć. Opcjonalne. Jeśli w węźle skonfigurowano zakres węzłów, do których można cofnąć, ten parametr pozwala określić konkretny węzeł. W przeciwnym razie, parametr nie jest wymagany, a domyślnie proces zostanie cofnięty do punktu początkowego, aby inicjator mógł ponownie go przesłać.

#### Delegowanie

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametry**

*   `<record id>`: ID rekordu do przetworzenia zatwierdzenia, wymagane.
*   `assignee`: ID użytkownika, któremu ma zostać delegowane, wymagane.

#### Dodawanie osoby do podpisu

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametry**

*   `<record id>`: ID rekordu do przetworzenia zatwierdzenia, wymagane.
*   `assignees`: Lista ID użytkowników do dodania jako osoby do podpisu, wymagane.
*   `order`: Kolejność dodanej osoby do podpisu. `-1` oznacza „przed mną”, `1` oznacza „po mnie”.