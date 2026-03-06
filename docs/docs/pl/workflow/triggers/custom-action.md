---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/workflow/triggers/custom-action).
:::

# Niestandardowe zdarzenie akcji

## Wprowadzenie

NocoBase posiada wbudowane typowe operacje na danych (dodawanie, usuwanie, edycja, przeglądanie itp.). Gdy operacje te nie mogą zaspokoić złożonych potrzeb biznesowych, można skorzystać z niestandardowych zdarzeń akcji w przepływie pracy i powiązać to zdarzenie z przyciskiem „Uruchom przepływ pracy” w bloku strony. Po kliknięciu przez użytkownika zostanie uruchomiony przepływ pracy z niestandardową akcją.

## Tworzenie przepływu pracy

Podczas tworzenia przepływu pracy proszę wybrać „Niestandardowe zdarzenie akcji”:

![Tworzenie przepływu pracy „Niestandardowe zdarzenie akcji”](https://static-docs.nocobase.com/20240509091820.png)

## Konfiguracja wyzwalacza

### Typ kontekstu

> v1.6.0+

Różne typy kontekstu określają, do których przycisków w blokach można przypisać dany przepływ pracy:

* Bez kontekstu: zdarzenie globalne, które można przypisać do przycisków akcji w panelach operacji i blokach danych;
* Pojedynczy rekord: można przypisać do przycisków akcji w blokach danych, takich jak wiersze tabeli, formularze, szczegóły itp.;
* Wiele rekordów: można przypisać do przycisków operacji masowych w tabeli.

![Konfiguracja wyzwalacza_Typ kontekstu](https://static-docs.nocobase.com/20250215135808.png)

### Kolekcja

Gdy typem kontekstu jest pojedynczy rekord lub wiele rekordów, należy wybrać kolekcję, do której ma zostać przypisany model danych:

![Konfiguracja wyzwalacza_Wybór kolekcji](https://static-docs.nocobase.com/20250215135919.png)

### Dane powiązane do wykorzystania

Jeśli w przepływie pracy konieczne jest użycie danych powiązanych z wierszem danych wyzwalającym akcję, można tutaj wybrać głębokie pola powiązań:

![Konfiguracja wyzwalacza_Wybór danych powiązanych do wykorzystania](https://static-docs.nocobase.com/20250215135955.png)

Pola te zostaną automatycznie wstępnie załadowane do kontekstu przepływu pracy po wyzwoleniu zdarzenia, aby mogły być w nim użyte.

## Konfiguracja akcji

W zależności od typu kontekstu skonfigurowanego w przepływie pracy, konfiguracja przycisków akcji w różnych blokach również się różni.

### Bez kontekstu

> v1.6.0+

W panelu operacji i innych blokach danych można dodać przycisk „Uruchom przepływ pracy”:

![Dodawanie przycisku akcji do bloku_Pasek operacji](https://static-docs.nocobase.com/20250215221738.png)

![Dodawanie przycisku akcji do bloku_Kalendarz](https://static-docs.nocobase.com/20250215221942.png)

![Dodawanie przycisku akcji do bloku_Wykres Gantta](https://static-docs.nocobase.com/20250215221810.png)

Po dodaniu przycisku należy przypisać wcześniej utworzony przepływ pracy bez kontekstu, biorąc za przykład przycisk w panelu operacji:

![Przypisywanie przepływu pracy do przycisku_Pasek operacji](https://static-docs.nocobase.com/20250215222120.png)

![Wybór przepływu pracy do przypisania_Bez kontekstu](https://static-docs.nocobase.com/20250215222234.png)

### Pojedynczy rekord

W dowolnym bloku danych, na pasku akcji dla pojedynczego rekordu, można dodać przycisk „Uruchom przepływ pracy”, np. w formularzach, wierszach tabeli, szczegółach itp.:

![Dodawanie przycisku akcji do bloku_Formularz](https://static-docs.nocobase.com/20240509165428.png)

![Dodawanie przycisku akcji do bloku_Wiersz tabeli](https://static-docs.nocobase.com/20240509165340.png)

![Dodawanie przycisku akcji do bloku_Szczegóły](https://static-docs.nocobase.com/20240509165545.png)

Po dodaniu przycisku należy przypisać wcześniej utworzony przepływ pracy:

![Przypisywanie przepływu pracy do przycisku](https://static-docs.nocobase.com/20240509165631.png)

![Wybór przepływu pracy do przypisania](https://static-docs.nocobase.com/20240509165658.png)

Następnie kliknięcie tego przycisku wyzwoli niestandardowe zdarzenie akcji:

![Wynik kliknięcia przycisku](https://static-docs.nocobase.com/20240509170453.png)

### Wiele rekordów

> v1.6.0+

Na pasku akcji bloku tabeli, podczas dodawania przycisku „Uruchom przepływ pracy”, pojawi się dodatkowa opcja wyboru typu kontekstu: „Bez kontekstu” lub „Wiele rekordów”:

![Dodawanie przycisku akcji do bloku_Tabela](https://static-docs.nocobase.com/20250215222507.png)

Wybór „Bez kontekstu” oznacza zdarzenie globalne, do którego można przypisać tylko przepływy pracy typu bez kontekstu.

Wybór „Wiele rekordów” pozwala na przypisanie przepływu pracy typu wiele rekordów, co może być użyte do operacji masowych po zaznaczeniu wielu danych (obecnie obsługiwane tylko przez tabele). W tym przypadku zakres dostępnych przepływów pracy ograniczony jest do tych, które pasują do kolekcji bieżącego bloku danych:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Podczas wyzwalania przez kliknięcie przycisku, muszą być zaznaczone niektóre wiersze danych w tabeli, w przeciwnym razie przepływ pracy nie zostanie uruchomiony:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Przykład

Na przykład mamy kolekcję „Próbki”. Dla próbek o statusie „Zebrane” musimy udostępnić operację „Przekaż do badania”. Przekazanie najpierw sprawdzi podstawowe informacje o próbce, następnie wygeneruje rekord „Zapis badania”, a na koniec zmieni status próbki na „Przekazano do badania”. Całego tego procesu nie da się zrealizować za pomocą prostych przycisków CRUD, dlatego można użyć niestandardowego zdarzenia akcji.

Najpierw należy utworzyć kolekcję „Próbki” oraz kolekcję „Zapisy badania” i wprowadzić podstawowe dane testowe do tabeli próbek:

![Przykład_Kolekcja Próbki](https://static-docs.nocobase.com/20240509172234.png)

Następnie należy utworzyć przepływ pracy „Niestandardowe zdarzenie akcji”. Jeśli wymagana jest szybka informacja zwrotna z procesu, można wybrać tryb synchroniczny (w trybie synchronicznym nie można używać węzłów typu asynchronicznego, takich jak przetwarzanie ręczne):

![Przykład_Tworzenie przepływu pracy](https://static-docs.nocobase.com/20240509173106.png)

W konfiguracji wyzwalacza należy wybrać kolekcję „Próbki”:

![Przykład_Konfiguracja wyzwalacza](https://static-docs.nocobase.com/20240509173148.png)

Zgodnie z potrzebami biznesowymi należy ułożyć logikę w procesie, na przykład zezwalając na przekazanie do badania tylko wtedy, gdy parametr wskaźnika jest większy niż `90`, w przeciwnym razie wyświetlając stosowny komunikat:

![Przykład_Ułożenie logiki biznesowej](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Wskazówka}
Węzeł „[Wiadomość zwrotna](../nodes/response-message.md)” może być używany w synchronicznych niestandardowych zdarzeniach akcji w celu zwrócenia informacji do klienta. Nie można go używać w trybie asynchronicznym.
:::

Po skonfigurowaniu i włączeniu procesu należy wrócić do interfejsu tabeli i dodać przycisk „Uruchom przepływ pracy” w kolumnie operacji tabeli:

![Przykład_Dodawanie przycisku akcji](https://static-docs.nocobase.com/20240509174525.png)

Następnie w menu konfiguracji przycisku należy wybrać przypisanie przepływu pracy i otworzyć okno konfiguracji:

![Przykład_Otwieranie okna przypisywania przepływu pracy](https://static-docs.nocobase.com/20240509174633.png)

Należy dodać wcześniej włączony przepływ pracy:

![Przykład_Wybór przepływu pracy](https://static-docs.nocobase.com/20240509174723.png)

Po zatwierdzeniu należy zmienić tekst przycisku na nazwę operacji, np. „Przekaż do badania”. Proces konfiguracji jest zakończony.

Podczas użytkowania należy wybrać dowolny rekord próbki w tabeli i kliknąć przycisk „Przekaż do badania”, aby wyzwolić niestandardowe zdarzenie akcji. Zgodnie z wcześniej ułożoną logiką, jeśli parametr wskaźnika próbki jest mniejszy niż 90, po kliknięciu pojawi się następujący komunikat:

![Przykład_Wskaźnik nie spełnia kryteriów przekazania do badania](https://static-docs.nocobase.com/20240509175026.png)

Jeśli parametr wskaźnika jest większy niż 90, proces zostanie wykonany normalnie, wygenerowany zostanie rekord „Zapis badania”, a status próbki zmieni się na „Przekazano do badania”:

![Przykład_Pomyślne przekazanie do badania](https://static-docs.nocobase.com/20240509175247.png)

W ten sposób proste niestandardowe zdarzenie akcji zostało ukończone. Podobnie, dla procesów o złożonych operacjach, takich jak obsługa zamówień czy składanie raportów, można je realizować poprzez niestandardowe zdarzenia akcji.

## Wywołanie zewnętrzne

Wyzwalanie niestandardowych zdarzeń akcji nie ogranicza się do operacji w interfejsie użytkownika; może być również wyzwalane poprzez HTTP API. W szczególności niestandardowe zdarzenia akcji udostępniają nowy typ operacji dla wszystkich operacji na kolekcjach: `trigger`, który można wywołać zgodnie ze standardowym API operacji NocoBase.

:::info{title="Wskazówka"}
Ponieważ wywołania zewnętrzne również muszą opierać się na tożsamości użytkownika, podczas wywoływania przez HTTP API należy dostarczyć informacje uwierzytelniające, identycznie jak w przypadku żądań z interfejsu, w tym nagłówek `Authorization` lub parametr `token` (uzyskany po zalogowaniu) oraz nagłówek `X-Role` (nazwa bieżącej roli użytkownika).
:::

### Bez kontekstu

Przepływy pracy bez kontekstu wymagają wywołania operacji na zasobie workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Pojedynczy rekord

Przepływ pracy wyzwalany przyciskiem, podobnie jak w przykładzie, można wywołać w następujący sposób:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Ponieważ ta operacja dotyczy pojedynczego rekordu, przy wywoływaniu dla istniejących danych należy podać ID wiersza danych, zastępując część `<:id>` w adresie URL.

Jeśli wywołanie dotyczy formularza (np. dodawania lub aktualizacji), w przypadku formularza dodawania nowych danych można nie podawać ID, ale należy przesłać dane, które posłużą jako kontekst wykonania:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

W przypadku formularza aktualizacji należy podać zarówno ID wiersza danych, jak i aktualizowane dane:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Jeśli podano jednocześnie ID i dane, najpierw zostanie załadowany wiersz danych odpowiadający ID, a następnie właściwości z przesłanego obiektu danych nadpiszą oryginalny wiersz, tworząc ostateczny kontekst danych wyzwalacza.

:::warning{title="Uwaga"}
Jeśli przesłano dane powiązane, one również zostaną nadpisane. Należy zachować ostrożność przy przesyłaniu danych, zwłaszcza gdy skonfigurowano wstępne ładowanie powiązań, aby uniknąć nieoczekiwanego nadpisania danych powiązanych.
:::

Dodatkowo parametr URL `triggerWorkflows` to klucz (key) przepływu pracy; wiele przepływów należy oddzielić przecinkami. Klucz ten można uzyskać po najechaniu myszką na nazwę przepływu pracy u góry płótna:

![Przepływ pracy_Klucz_Sposób wyświetlania](https://static-docs.nocobase.com/20240426135108.png)

Po pomyślnym wywołaniu zostanie wyzwolone niestandardowe zdarzenie akcji dla odpowiedniej kolekcji `samples`.

:::info{title="Wskazówka"}
Podczas wyzwalania operacji przez HTTP API należy również zwrócić uwagę na status włączenia przepływu pracy oraz na to, czy konfiguracja kolekcji jest zgodna, w przeciwnym razie wywołanie może się nie powieść lub wystąpi błąd.
:::

### Wiele rekordów

Sposób wywołania jest podobny do pojedynczego rekordu, ale przesyłane dane wymagają jedynie wielu parametrów klucza głównego (`filterByTk[]`) i nie wymagają sekcji data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

To wywołanie wyzwoli niestandardowe zdarzenie akcji w trybie wielu rekordów, wykorzystując dane o ID 1 i 2 jako dane kontekstowe wyzwalacza.