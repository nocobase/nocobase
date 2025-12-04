---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zatwierdzanie

## Wprowadzenie

W przepływie pracy zatwierdzania, aby skonfigurować logikę operacyjną dla osób zatwierdzających, służącą do przetwarzania (zatwierdzania, odrzucania lub zwracania) inicjowanego zatwierdzenia, wymagany jest dedykowany węzeł „Zatwierdzanie”. Węzeł „Zatwierdzanie” może być używany wyłącznie w procesach zatwierdzania.

:::info{title=Wskazówka}
Różnica w stosunku do zwykłego węzła „Ręczne przetwarzanie”: Zwykły węzeł „Ręczne przetwarzanie” jest przeznaczony do bardziej ogólnych scenariuszy, takich jak ręczne wprowadzanie danych lub ręczne podejmowanie decyzji o kontynuacji procesu w różnych typach przepływów pracy. Węzeł „Zatwierdzanie” to wyspecjalizowany węzeł przetwarzania, przeznaczony wyłącznie do procesów zatwierdzania, obsługujący tylko dane inicjowanego zatwierdzenia i nie może być używany w innych przepływach pracy.
:::

## Tworzenie węzła

Proszę kliknąć przycisk plusa („+”) w przepływie pracy, dodać węzeł „Zatwierdzanie”, a następnie wybrać jeden z trybów zatwierdzania, aby utworzyć węzeł zatwierdzania:

![Tworzenie węzła zatwierdzania](https://static-docs.nocobase.com/20251107000938.png)

## Konfiguracja węzła

### Tryb zatwierdzania

Dostępne są dwa tryby zatwierdzania:

1.  **Tryb bezpośredni (Pass-through)**: Zazwyczaj używany w prostszych procesach. To, czy węzeł zatwierdzania zostanie zatwierdzony, czy nie, decyduje jedynie o zakończeniu procesu. W przypadku braku zatwierdzenia proces zostaje bezpośrednio zakończony.

    ![Tryb bezpośredni węzła zatwierdzania](https://static-docs.nocobase.com/20251107001043.png)

2.  **Tryb rozgałęzienia (Branch)**: Zazwyczaj używany w przypadku bardziej złożonej logiki danych. Po uzyskaniu dowolnego wyniku przez węzeł zatwierdzania, inne węzły mogą być nadal wykonywane w jego gałęzi wyników.

    ![Tryb rozgałęzienia węzła zatwierdzania](https://static-docs.nocobase.com/20251107001234.png)

    Po „zatwierdzeniu” tego węzła, oprócz wykonania gałęzi zatwierdzenia, będzie kontynuowany również dalszy przepływ pracy. Po operacji „Odrzuć” domyślnie również może być kontynuowany dalszy przepływ pracy, lub można skonfigurować węzeł tak, aby zakończył proces po wykonaniu gałęzi.

:::info{title=Wskazówka}
Trybu zatwierdzania nie można zmienić po utworzeniu węzła.
:::

### Osoby zatwierdzające

Osoby zatwierdzające to zbiór użytkowników odpowiedzialnych za działanie zatwierdzania w tym węźle. Może to być jeden lub więcej użytkowników. Źródłem wyboru może być wartość statyczna wybrana z listy użytkowników lub wartość dynamiczna określona przez zmienną.

![Konfiguracja osób zatwierdzających](https://static-docs.nocobase.com/20251107001433.png)

Przy wyborze zmiennej można wybrać tylko klucz podstawowy lub klucz obcy danych użytkownika z kontekstu i wyników węzła. Jeśli wybrana zmienna jest tablicą podczas wykonywania (relacja wiele-do-wielu), każdy użytkownik w tablicy zostanie połączony w cały zbiór osób zatwierdzających.

Oprócz bezpośredniego wyboru użytkowników lub zmiennych, można również dynamicznie filtrować kwalifikujących się użytkowników jako osoby zatwierdzające, bazując na warunkach zapytania z kolekcji użytkowników:

![Filtrowanie osób zatwierdzających](https://static-docs.nocobase.com/20251107001703.png)

### Tryb uzgadniania

Jeśli w momencie ostatecznego wykonania jest tylko jedna osoba zatwierdzająca (wliczając w to przypadek po usunięciu duplikatów z wielu zmiennych), to niezależnie od wybranego trybu uzgadniania, tylko ten użytkownik wykona operację zatwierdzania, a wynik zostanie określony wyłącznie przez tego użytkownika.

Gdy w zbiorze osób zatwierdzających znajduje się wielu użytkowników, wybór różnych trybów uzgadniania oznacza różne metody przetwarzania:

1.  **Dowolny (Anyone)**: Wystarczy, że jedna osoba zatwierdzi, aby węzeł został zatwierdzony. Węzeł zostanie odrzucony tylko wtedy, gdy wszyscy odrzucą.
2.  **Kontrasygnata (Countersign)**: Wszyscy muszą zatwierdzić, aby węzeł został zatwierdzony. Wystarczy, że jedna osoba odrzuci, aby węzeł został odrzucony.
3.  **Głosowanie (Vote)**: Liczba osób, które zatwierdzą, musi przekroczyć ustalony stosunek, aby węzeł został zatwierdzony; w przeciwnym razie węzeł zostanie odrzucony.

W przypadku operacji „Zwróć”, w każdym trybie, jeśli którykolwiek użytkownik w zbiorze osób zatwierdzających przetworzy ją jako zwrot, węzeł bezpośrednio zakończy proces.

### Kolejność przetwarzania

Podobnie, gdy w zbiorze osób zatwierdzających znajduje się wielu użytkowników, wybór różnych kolejności przetwarzania oznacza różne metody przetwarzania:

1.  **Równolegle (Parallel)**: Wszystkie osoby zatwierdzające mogą przetwarzać w dowolnej kolejności; kolejność przetwarzania nie ma znaczenia.
2.  **Sekwencyjnie (Sequential)**: Osoby zatwierdzające przetwarzają kolejno, zgodnie z porządkiem w zbiorze osób zatwierdzających. Następna osoba zatwierdzająca może przetwarzać dopiero po przesłaniu przez poprzednią.

Niezależnie od tego, czy ustawiono przetwarzanie „Sekwencyjne”, wynik uzyskany zgodnie z rzeczywistą kolejnością przetwarzania będzie również zgodny z zasadami opisanymi w „Trybie uzgadniania”. Węzeł zakończy swoje wykonanie po spełnieniu odpowiednich warunków.

### Zakończ przepływ pracy po zakończeniu gałęzi odrzucenia

Gdy „Tryb zatwierdzania” jest ustawiony na „Tryb rozgałęzienia”, można wybrać opcję zakończenia przepływu pracy po zakończeniu gałęzi odrzucenia. Po zaznaczeniu tej opcji, na końcu gałęzi odrzucenia pojawi się symbol „✗”, wskazujący, że po zakończeniu tej gałęzi nie będą kontynuowane kolejne węzły:

![Zakończ po odrzuceniu (węzeł zatwierdzania)](https://static-docs.nocobase.com/20251107001839.png)

### Konfiguracja interfejsu osoby zatwierdzającej

Konfiguracja interfejsu osoby zatwierdzającej służy do zapewnienia interfejsu operacyjnego dla osoby zatwierdzającej, gdy przepływ pracy zatwierdzania osiągnie ten węzeł. Proszę kliknąć przycisk konfiguracji, aby otworzyć wyskakujące okno:

![Wyskakujące okno konfiguracji interfejsu osoby zatwierdzającej](https://static-docs.nocobase.com/20251107001958.png)

W wyskakującym oknie konfiguracji można dodać bloki takie jak oryginalna treść zgłoszenia, informacje o zatwierdzeniu, formularz przetwarzania oraz niestandardowy tekst podpowiedzi:

![Dodawanie bloków do interfejsu osoby zatwierdzającej](https://static-docs.nocobase.com/20251107002604.png)

#### Oryginalna treść zgłoszenia

Blok szczegółów treści zatwierdzenia to blok danych przesłanych przez inicjatora. Podobnie jak w przypadku zwykłego bloku danych, można dowolnie dodawać komponenty pól z kolekcji i dowolnie je rozmieszczać, aby zorganizować treść, którą osoba zatwierdzająca musi przejrzeć:

![Konfiguracja bloku szczegółów (węzeł zatwierdzania)](https://static-docs.nocobase.com/20251107002925.png)

#### Formularz przetwarzania

W bloku formularza operacji można dodać przyciski akcji obsługiwane przez ten węzeł, w tym „Zatwierdź”, „Odrzuć”, „Zwróć”, „Przekaż” i „Dodaj sygnatariusza”:

![Blok formularza operacji (węzeł zatwierdzania)](https://static-docs.nocobase.com/20251107003015.png)

Ponadto, do formularza operacji można również dodać pola, które mogą być modyfikowane przez osobę zatwierdzającą. Pola te będą wyświetlane w formularzu operacji, gdy osoba zatwierdzająca będzie przetwarzać zatwierdzenie. Osoba zatwierdzająca może modyfikować wartości tych pól, a po przesłaniu, jednocześnie zostaną zaktualizowane dane do zatwierdzenia oraz migawka odpowiadających danych w procesie zatwierdzania.

![Modyfikacja pól treści zatwierdzenia w formularzu operacji (węzeł zatwierdzania)](https://static-docs.nocobase.com/20251107003206.png)

#### „Zatwierdź” i „Odrzuć”

Wśród przycisków akcji zatwierdzania, „Zatwierdź” i „Odrzuć” są operacjami decydującymi. Po przesłaniu oznacza to zakończenie przetwarzania przez osobę zatwierdzającą dla tego węzła. Dodatkowe pola, które należy wypełnić podczas przesyłania, takie jak „Komentarz”, można dodać w wyskakującym oknie „Konfiguracja przetwarzania” dla przycisku akcji.

![Konfiguracja przetwarzania (węzeł zatwierdzania)](https://static-docs.nocobase.com/20251107003314.png)

#### „Zwróć”

„Zwróć” to również operacja decydująca. Oprócz możliwości konfiguracji komentarzy, można również skonfigurować węzły, do których można zwrócić:

![Konfiguracja węzłów do zwrotu](https://static-docs.nocobase.com/20251107003555.png)

#### „Przekaż” i „Dodaj sygnatariusza”

„Przekaż” i „Dodaj sygnatariusza” to operacje niedecydujące, służące do dynamicznego dostosowywania osób zatwierdzających w procesie zatwierdzania. „Przekaż” polega na przekazaniu zadania zatwierdzania bieżącego użytkownika innemu użytkownikowi do przetworzenia. „Dodaj sygnatariusza” polega na dodaniu osoby zatwierdzającej przed lub po bieżącej osobie zatwierdzającej, a nowo dodana osoba zatwierdzająca będzie kontynuować zatwierdzanie wspólnie.

Po włączeniu przycisków akcji „Przekaż” lub „Dodaj sygnatariusza”, należy wybrać „Zakres przypisania” w menu konfiguracji przycisku, aby ustawić zakres użytkowników, którzy mogą być przypisani jako nowe osoby zatwierdzające:

![Zakres przypisania (węzeł zatwierdzania)](https://static-docs.nocobase.com/20241226232321.png)

Podobnie jak w przypadku oryginalnej konfiguracji osób zatwierdzających węzła, zakres przypisania może również obejmować bezpośrednio wybrane osoby zatwierdzające lub być oparty na warunkach zapytania z kolekcji użytkowników. Ostatecznie zostanie on połączony w jeden zbiór i nie będzie zawierał użytkowników już znajdujących się w zbiorze osób zatwierdzających.

:::warning{title=Ważne}
Jeśli przycisk akcji został włączony lub wyłączony, lub zmieniono zakres przypisania, należy zapisać konfigurację węzła po zamknięciu wyskakującego okna konfiguracji interfejsu operacji. W przeciwnym razie zmiany w przycisku akcji nie zostaną zastosowane.
:::

## Wynik węzła

Po zakończeniu zatwierdzania, odpowiedni status i dane zostaną zapisane w wyniku węzła i mogą być używane jako zmienne przez kolejne węzły.

![Wynik węzła](https://static-docs.nocobase.com/20250614095052.png)

### Status zatwierdzenia węzła

Reprezentuje status przetwarzania bieżącego węzła zatwierdzania. Wynik jest wartością wyliczeniową.

### Dane po zatwierdzeniu

Jeśli osoba zatwierdzająca zmodyfikuje treść zatwierdzenia w formularzu operacji, zmodyfikowane dane zostaną zapisane w wyniku węzła do wykorzystania przez kolejne węzły. Aby użyć pól powiązanych, należy skonfigurować wstępne ładowanie dla tych pól w wyzwalaczu.

### Rekordy zatwierdzeń

> v1.8.0+

Rekord przetwarzania zatwierdzenia to tablica, która zawiera rekordy przetwarzania wszystkich osób zatwierdzających w tym węźle. Każdy rekord przetwarzania zawiera następujące pola:

| Pole | Typ | Opis |
| --- | --- | --- |
| `id` | `number` | Unikalny identyfikator rekordu przetwarzania |
| `userId` | `number` | ID użytkownika, który przetworzył ten rekord |
| `status` | `number` | Status przetwarzania |
| `comment` | `string` | Komentarz w momencie przetwarzania |
| `updatedAt` | `string` | Czas aktualizacji rekordu przetwarzania |

Pola te można wykorzystać jako zmienne w kolejnych węzłach, zgodnie z potrzebami.