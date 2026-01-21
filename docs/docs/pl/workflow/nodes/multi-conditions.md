:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wielokrotne warunki <Badge>v2.0.0+</Badge>

## Wprowadzenie

Podobnie jak instrukcje `switch / case` lub `if / else if` w językach programowania. System ocenia skonfigurowane warunki sekwencyjnie. Gdy tylko jeden warunek zostanie spełniony, przepływ pracy wykonuje odpowiadającą mu gałąź i pomija sprawdzanie kolejnych warunków. Jeśli żaden z warunków nie zostanie spełniony, wykonana zostanie gałąź „W przeciwnym razie”.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Wielokrotne warunki”:

![Create Multi-conditions Node](https://static-docs.nocobase.com/20251123222134.png)

## Zarządzanie gałęziami

### Gałęzie domyślne

Po utworzeniu węzeł domyślnie zawiera dwie gałęzie:

1.  **Gałąź warunkowa**: Służy do konfigurowania konkretnych warunków oceny.
2.  **Gałąź „W przeciwnym razie”**: Jest uruchamiana, gdy żadna z gałęzi warunkowych nie zostanie spełniona; nie wymaga konfiguracji warunków.

Proszę kliknąć przycisk „Dodaj gałąź” pod węzłem, aby dodać więcej gałęzi warunkowych.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Dodawanie gałęzi

Po kliknięciu „Dodaj gałąź” nowa gałąź zostanie dodana przed gałęzią „W przeciwnym razie”.

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Usuwanie gałęzi

Gdy istnieje wiele gałęzi warunkowych, proszę kliknąć ikonę kosza po prawej stronie gałęzi, aby ją usunąć. Jeśli pozostanie tylko jedna gałąź warunkowa, nie można jej usunąć.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Wskazówka}
Usunięcie gałęzi spowoduje również usunięcie wszystkich węzłów w niej zawartych; proszę postępować ostrożnie.

Gałąź „W przeciwnym razie” jest wbudowaną gałęzią i nie można jej usunąć.
:::

## Konfiguracja węzła

### Konfiguracja warunków

Proszę kliknąć nazwę warunku u góry gałęzi, aby edytować szczegóły konkretnego warunku:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Etykieta warunku

Obsługuje niestandardowe etykiety. Po wypełnieniu zostanie ona wyświetlona jako nazwa warunku na schemacie przepływu. Jeśli nie zostanie skonfigurowana (lub pozostawiona pusta), domyślnie wyświetli się jako „Warunek 1”, „Warunek 2” itd., w kolejności.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Silnik obliczeniowy

Obecnie obsługuje trzy silniki:

-   **Podstawowy**: Wykorzystuje proste porównania logiczne (np. równa się, zawiera) oraz kombinacje „I”/„LUB” do określania wyników.
-   **Math.js**: Obsługuje obliczenia wyrażeń przy użyciu składni [Math.js](https://mathjs.org/).
-   **Formula.js**: Obsługuje obliczenia wyrażeń przy użyciu składni [Formula.js](https://formulajs.info/) (podobnie do formuł Excela).

Wszystkie trzy tryby obsługują użycie zmiennych kontekstu przepływu pracy jako parametrów.

### Gdy żaden z warunków nie zostanie spełniony

W panelu konfiguracji węzła można ustawić dalsze działanie, gdy żaden z warunków nie zostanie spełniony:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Zakończ przepływ pracy niepowodzeniem (domyślnie)**: Oznacza status przepływu pracy jako nieudany i przerywa proces.
*   **Kontynuuj wykonywanie kolejnych węzłów**: Po zakończeniu bieżącego węzła, kontynuuje wykonywanie kolejnych węzłów w przepływie pracy.

:::info{title=Wskazówka}
Niezależnie od wybranej metody obsługi, gdy żaden z warunków nie zostanie spełniony, przepływ najpierw wejdzie do gałęzi „W przeciwnym razie”, aby wykonać znajdujące się w niej węzły.
:::

## Historia wykonania

W historii wykonania przepływu pracy węzeł „Wielokrotne warunki” identyfikuje wynik każdego warunku za pomocą różnych kolorów:

-   **Zielony**: Warunek spełniony; wejście do tej gałęzi.
-   **Czerwony**: Warunek niespełniony (lub błąd obliczeniowy); pominięto tę gałąź.
-   **Niebieski**: Ocena nie została wykonana (pominięto, ponieważ poprzedni warunek został już spełniony).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Jeśli błąd konfiguracji spowoduje wyjątek obliczeniowy, oprócz wyświetlenia na czerwono, najechanie kursorem na nazwę warunku wyświetli szczegółowe informacje o błędzie:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Gdy wystąpi wyjątek obliczeniowy warunku, węzeł „Wielokrotne warunki” zakończy się ze statusem „Błąd” i nie będzie kontynuował wykonywania kolejnych węzłów.