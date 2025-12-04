---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Niestandardowe zdarzenie akcji

## Wprowadzenie

NocoBase posiada wbudowane typowe operacje na danych (dodawanie, usuwanie, aktualizowanie, przeglądanie itp.). Kiedy te operacje nie są wystarczające do spełnienia złożonych wymagań biznesowych, mogą Państwo wykorzystać niestandardowe zdarzenia akcji w przepływie pracy. Poprzez przypisanie takiego zdarzenia do przycisku „Uruchom przepływ pracy” w bloku strony, kliknięcie go przez użytkownika spowoduje uruchomienie przepływu pracy z niestandardową akcją.

## Tworzenie przepływu pracy

Podczas tworzenia przepływu pracy proszę wybrać „Niestandardowe zdarzenie akcji”:

![Tworzenie przepływu pracy „Niestandardowe zdarzenie akcji”](https://static-docs.nocobase.com/20240509091820.png)

## Konfiguracja wyzwalacza

### Typ kontekstu

> v.1.6.0+

Typ kontekstu decyduje o tym, do których przycisków w blokach mogą Państwo przypisać dany przepływ pracy:

*   **Bez kontekstu**: Zdarzenie globalne, które można przypisać do przycisków akcji na pasku operacji oraz w blokach danych.
*   **Pojedynczy rekord**: Można przypisać do przycisków akcji w blokach danych, takich jak wiersze tabel, formularze i widoki szczegółów.
*   **Wiele rekordów**: Można przypisać do przycisków operacji masowych w tabeli.

![Konfiguracja wyzwalacza_Typ kontekstu](https://static-docs.nocobase.com/20250215135808.png)

### Kolekcja

Gdy typem kontekstu jest „Pojedynczy rekord” lub „Wiele rekordów”, należy wybrać kolekcję, do której ma zostać przypisany model danych:

![Konfiguracja wyzwalacza_Wybór kolekcji](https://static-docs.nocobase.com/20250215135919.png)

### Dane powiązane do wykorzystania

Jeśli potrzebują Państwo użyć danych powiązanych z wierszem danych wyzwalającym przepływ pracy, mogą Państwo wybrać tutaj głębokie pola powiązane:

![Konfiguracja wyzwalacza_Wybór danych powiązanych do wykorzystania](https://static-docs.nocobase.com/20250215135955.png)

Pola te zostaną automatycznie wstępnie załadowane do kontekstu przepływu pracy po wyzwoleniu zdarzenia, dzięki czemu będą dostępne do użycia w przepływie pracy.

## Konfiguracja akcji

Konfiguracja przycisków akcji w różnych blokach różni się w zależności od typu kontekstu skonfigurowanego w przepływie pracy.

### Bez kontekstu

> v.1.6.0+

Na pasku operacji i w innych blokach danych mogą Państwo dodać przycisk „Uruchom przepływ pracy”:

![Dodawanie przycisku akcji do bloku_Pasek operacji](https://static-docs.nocobase.com/20250215221738.png)

![Dodawanie przycisku akcji do bloku_Kalendarz](https://static-docs.nocobase.com/20250215221942.png)

![Dodawanie przycisku akcji do bloku_Wykres Gantta](https://static-docs.nocobase.com/20250215221810.png)

Po dodaniu przycisku proszę przypisać do niego wcześniej utworzony przepływ pracy bez kontekstu. Poniżej przykład z użyciem przycisku na pasku operacji:

![Przypisywanie przepływu pracy do przycisku_Pasek operacji](https://static-docs.nocobase.com/20250215222120.png)

![Wybór przepływu pracy do przypisania_Bez kontekstu](https://static-docs.nocobase.com/20250215222234.png)

### Pojedynczy rekord

W dowolnym bloku danych, na pasku akcji dla pojedynczego rekordu, można dodać przycisk „Uruchom przepływ pracy”, na przykład w formularzach, wierszach tabeli, widokach szczegółów itp.:

![Dodawanie przycisku akcji do bloku_Formularz](https://static-docs.nocobase.com/20240509165428.png)

![Dodawanie przycisku akcji do bloku_Wiersz tabeli](https://static-docs.nocobase.com/20240509165340.png)

![Dodawanie przycisku akcji do bloku_Szczegóły](https://static-docs.nocobase.com/20240509165545.png)

Po dodaniu przycisku proszę przypisać do niego wcześniej utworzony przepływ pracy:

![Przypisywanie przepływu pracy do przycisku](https://static-docs.nocobase.com/20240509165631.png)

![Wybór przepływu pracy do przypisania](https://static-docs.nocobase.com/20240509165658.png)

Następnie kliknięcie tego przycisku wyzwoli niestandardowe zdarzenie akcji:

![Wynik kliknięcia przycisku](https://static-docs.nocobase.com/20240509170453.png)

### Wiele rekordów

> v.1.6.0+

Na pasku akcji bloku tabeli, podczas dodawania przycisku „Uruchom przepływ pracy”, dostępna jest dodatkowa opcja wyboru typu kontekstu: „Bez kontekstu” lub „Wiele rekordów”:

![Dodawanie przycisku akcji do bloku_Tabela](https://static-docs.nocobase.com/20250215222507.png)

Gdy wybrano „Bez kontekstu”, jest to zdarzenie globalne i można przypisać tylko przepływy pracy typu „Bez kontekstu”.

Gdy wybrano „Wiele rekordów”, mogą Państwo przypisać przepływ pracy dla wielu rekordów, który może być używany do operacji masowych po wybraniu wielu rekordów (obecnie obsługiwane tylko przez tabele). Dostępne przepływy pracy są ograniczone do tych, które zostały skonfigurowane tak, aby pasowały do kolekcji bieżącego bloku danych:

![Wybór przepływu pracy dla wielu rekordów](https://static-docs.nocobase.com/20250215224436.png)

Podczas klikania przycisku w celu wyzwolenia, muszą Państwo zaznaczyć niektóre wiersze danych w tabeli; w przeciwnym razie przepływ pracy nie zostanie uruchomiony:

![Wymagane zaznaczenie wierszy do wyzwolenia](https://static-docs.nocobase.com/20250215224736.png)

## Przykład

Na przykład, mają Państwo kolekcję „Próbki”. Dla próbek o statusie „Zebrane” należy zapewnić akcję „Przekaż do kontroli”. Akcja ta najpierw sprawdzi podstawowe informacje o próbce, następnie wygeneruje „Zapis kontroli”, a na koniec zmieni status próbki na „Przekazano do kontroli”. Ponieważ tej serii procesów nie można zrealizować za pomocą prostych przycisków „dodaj, usuń, aktualizuj, przeglądaj”, można w tym celu wykorzystać niestandardowe zdarzenie akcji.

Najpierw proszę utworzyć kolekcję „Próbki” i kolekcję „Zapisy kontroli”, a następnie wprowadzić podstawowe dane testowe do kolekcji „Próbki”:

![Przykład_Kolekcja Próbki](https://static-docs.nocobase.com/20240509172234.png)

Następnie proszę utworzyć przepływ pracy „Niestandardowe zdarzenie akcji”. Jeśli potrzebują Państwo szybkiej informacji zwrotnej z procesu operacji, mogą Państwo wybrać tryb synchroniczny (w trybie synchronicznym nie można używać węzłów asynchronicznych, takich jak ręczne przetwarzanie):

![Przykład_Tworzenie przepływu pracy](https://static-docs.nocobase.com/20240509173106.png)

W konfiguracji wyzwalacza proszę wybrać „Próbki” dla kolekcji:

![Przykład_Konfiguracja wyzwalacza](https://static-docs.nocobase.com/20240509173148.png)

Proszę ułożyć logikę w procesie zgodnie z wymaganiami biznesowymi. Na przykład, zezwolić na przekazanie do kontroli tylko wtedy, gdy parametr wskaźnika jest większy niż `90`; w przeciwnym razie wyświetlić odpowiedni komunikat:

![Przykład_Ułożenie logiki biznesowej](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Wskazówka}
Węzeł „[Wiadomość zwrotna](../nodes/response-message.md)” może być używany w synchronicznych niestandardowych zdarzeniach akcji do zwracania komunikatów dla klienta. Nie można go używać w trybie asynchronicznym.
:::

Po skonfigurowaniu i włączeniu przepływu pracy, proszę wrócić do interfejsu tabeli i dodać przycisk „Uruchom przepływ pracy” w kolumnie akcji tabeli:

![Przykład_Dodawanie przycisku akcji](https://static-docs.nocobase.com/20240509174525.png)

Następnie, w menu konfiguracji przycisku, proszę wybrać opcję przypisania przepływu pracy i otworzyć okno konfiguracji:

![Przykład_Otwieranie okna przypisywania przepływu pracy](https://static-docs.nocobase.com/20240509174633.png)

Proszę dodać wcześniej włączony przepływ pracy:

![Przykład_Wybór przepływu pracy](https://static-docs.nocobase.com/20240509174723.png)

Po zatwierdzeniu, proszę zmienić tekst przycisku na nazwę akcji, np. „Przekaż do kontroli”. Proces konfiguracji jest teraz zakończony.

Aby użyć, proszę wybrać dowolne dane próbki w tabeli i kliknąć przycisk „Przekaż do kontroli”, aby wyzwolić niestandardowe zdarzenie akcji. Zgodnie z wcześniej ułożoną logiką, jeśli parametr wskaźnika próbki jest mniejszy niż 90, po kliknięciu zostanie wyświetlony następujący komunikat:

![Przykład_Wskaźnik nie spełnia kryteriów przekazania do kontroli](https://static-docs.nocobase.com/20240509175026.png)

Jeśli parametr wskaźnika jest większy niż 90, proces zostanie wykonany normalnie, generując „Zapis kontroli” i zmieniając status próbki na „Przekazano do kontroli”:

![Przykład_Pomyślne przekazanie do kontroli](https://static-docs.nocobase.com/20240509175247.png)

W tym momencie proste niestandardowe zdarzenie akcji jest zakończone. Podobnie, w przypadku firm z złożonymi operacjami, takimi jak przetwarzanie zamówień czy składanie raportów, niestandardowe zdarzenia akcji mogą być wykorzystane do ich realizacji.

## Wywołanie zewnętrzne

Wyzwolenie niestandardowych zdarzeń akcji nie ogranicza się tylko do operacji w interfejsie użytkownika; mogą być one również wyzwalane poprzez wywołania HTTP API. W szczególności, niestandardowe zdarzenia akcji udostępniają nowy typ akcji dla wszystkich operacji na kolekcjach, aby wyzwalać przepływy pracy: `trigger`, który można wywołać za pomocą standardowego API operacji NocoBase.

Przepływ pracy wyzwalany przyciskiem, jak w przykładzie, można wywołać w następujący sposób:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Ponieważ ta akcja dotyczy pojedynczego rekordu, podczas wywoływania jej dla istniejących danych, należy określić ID wiersza danych, zastępując część `<:id>` w adresie URL.

Jeśli wywołanie dotyczy formularza (np. dodawania lub aktualizacji), dla formularza dodającego nowe dane można pominąć ID, ale należy przekazać przesłane dane jako kontekst wykonania:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Dla formularza aktualizacji należy przekazać zarówno ID wiersza danych, jak i zaktualizowane dane:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Jeśli przekazano jednocześnie ID i dane, najpierw zostanie załadowany wiersz danych odpowiadający ID, a następnie właściwości z przekazanego obiektu danych zostaną użyte do nadpisania oryginalnego wiersza danych, aby uzyskać ostateczny kontekst danych wyzwalających.

:::warning{title="Uwaga"}
Jeśli przekazano dane powiązane, również zostaną one nadpisane. Należy zachować szczególną ostrożność podczas przetwarzania danych wejściowych, zwłaszcza jeśli skonfigurowano wstępne ładowanie elementów danych powiązanych, aby uniknąć nieoczekiwanego nadpisania danych powiązanych.
:::

Dodatkowo, parametr URL `triggerWorkflows` to klucz przepływu pracy; wiele kluczy przepływów pracy jest oddzielonych przecinkami. Klucz ten można uzyskać, najeżdżając myszką na nazwę przepływu pracy u góry płótna przepływu pracy:

![Przepływ pracy_Klucz_Sposób wyświetlania](https://static-docs.nocobase.com/20240426135108.png)

Po pomyślnym wywołaniu zostanie wyzwolone niestandardowe zdarzenie akcji dla odpowiadającej kolekcji `samples`.

:::info{title="Wskazówka"}
Ponieważ wywołania zewnętrzne również muszą być oparte na tożsamości użytkownika, podczas wywoływania za pośrednictwem HTTP API, podobnie jak w przypadku żądań wysyłanych z interfejsu użytkownika, należy podać informacje uwierzytelniające. Obejmuje to nagłówek żądania `Authorization` lub parametr `token` (token uzyskany po zalogowaniu) oraz nagłówek żądania `X-Role` (nazwa bieżącej roli użytkownika).
:::

Jeśli chcą Państwo wyzwolić zdarzenie dla danych powiązanych typu „jeden do jednego” (typ „jeden do wielu” nie jest obecnie obsługiwany) w tej akcji, mogą Państwo użyć `!` w parametrze, aby określić dane wyzwalające pola powiązanego:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Po pomyślnym wywołaniu zostanie wyzwolone niestandardowe zdarzenie akcji dla odpowiadającej kolekcji `categories`.

:::info{title="Wskazówka"}
Podczas wyzwalania zdarzenia akcji za pośrednictwem wywołania HTTP API, należy również zwrócić uwagę na status włączenia przepływu pracy oraz na to, czy konfiguracja kolekcji jest zgodna; w przeciwnym razie wywołanie może się nie powieść lub może wystąpić błąd.
:::