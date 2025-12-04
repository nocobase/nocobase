:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Czym jest FlowEngine?

FlowEngine to nowy silnik do tworzenia aplikacji front-endowych w podejściu no-code/low-code, wprowadzony w NocoBase 2.0. Łączy w sobie Model i Flow, upraszczając logikę front-endową oraz zwiększając jej ponowne użycie i łatwość utrzymania. Jednocześnie, dzięki konfigurowalności Flow, zapewnia bezkodową konfigurację i orkiestrację komponentów front-endowych i logiki biznesowej.

## Dlaczego nazywa się FlowEngine?

Ponieważ w FlowEngine właściwości i logika komponentów nie są już definiowane statycznie, lecz są napędzane i zarządzane przez **Flow**.

*   **Flow**, podobnie jak strumień danych, rozkłada logikę na uporządkowane kroki (Step), które są stopniowo stosowane do komponentu.
*   **Engine** oznacza, że jest to silnik napędzający logikę i interakcje front-endowe.

Dlatego **FlowEngine = Silnik logiki front-endowej napędzany przez Flow**.

## Czym jest Model?

W FlowEngine, Model to abstrakcyjny model komponentu, odpowiedzialny za:

*   Zarządzanie **właściwościami (Props) i stanem** komponentu.
*   Definiowanie **metody renderowania** komponentu.
*   Hostowanie i wykonywanie **Flow**.
*   Jednolite zarządzanie **rozsyłaniem zdarzeń** i **cyklami życia**.

Innymi słowy, **Model to logiczny mózg komponentu**, przekształcający go ze statycznej jednostki w dynamiczną jednostkę, którą można konfigurować i orkiestrować.

## Czym jest Flow?

W FlowEngine, **Flow to strumień logiki, który służy Modelowi**.
Jego celem jest:

*   Rozłożenie logiki właściwości lub zdarzeń na kroki (Step) i wykonanie ich sekwencyjnie w strumieniu.
*   Zarządzanie zmianami właściwości oraz reakcjami na zdarzenia.
*   Uczynienie logiki **dynamiczną, konfigurowalną i wielokrotnego użytku**.

## Jak zrozumieć te koncepcje?

Mogą Państwo wyobrazić sobie **Flow** jako **strumień wody**:

*   **Step jest jak węzeł na drodze strumienia wody**
    Każdy Step wykonuje małe zadanie (np. ustawienie właściwości, wywołanie zdarzenia, wywołanie API), podobnie jak strumień wody wywiera efekt, przechodząc przez śluzę lub koło wodne.

*   **Flow są uporządkowane**
    Strumień wody płynie ustaloną ścieżką od góry do dołu, przechodząc kolejno przez wszystkie Step; podobnie, logika w Flow jest wykonywana w zdefiniowanej kolejności.

*   **Flow mogą być rozgałęziane i łączone**
    Strumień wody może rozdzielić się na wiele mniejszych strumieni lub połączyć się; Flow również może być podzielony na wiele pod-Flow lub połączony w bardziej złożone łańcuchy logiczne.

*   **Flow są konfigurowalne i sterowalne**
    Kierunek i przepływ strumienia wody można regulować za pomocą śluzy; sposób wykonania i parametry Flow również można kontrolować poprzez konfigurację (`stepParams`).

Podsumowanie analogii

*   **Komponent** jest jak koło wodne, które potrzebuje strumienia wody, aby się obracać.
*   **Model** to podstawa i kontroler tego koła wodnego, odpowiedzialny za odbieranie strumienia wody i napędzanie jego działania.
*   **Flow** to ten strumień wody, który przechodzi kolejno przez każdy Step, napędzając komponent do ciągłych zmian i reakcji.

Zatem w FlowEngine:

*   **Flow umożliwia logice naturalne płynięcie, niczym strumień wody**.
*   **Model natomiast sprawia, że komponenty stają się nośnikami i wykonawcami tego strumienia**.