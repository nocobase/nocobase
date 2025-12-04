:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Czym jest FlowEngine?

FlowEngine to nowo wprowadzony w NocoBase 2.0 silnik do tworzenia aplikacji front-endowych w podejściu no-code i low-code. Łączy on modele (Model) z przepływami (Flow), aby uprościć logikę front-endową, zwiększyć jej ponowne wykorzystanie i ułatwić utrzymanie. Jednocześnie, wykorzystując konfigurowalność Flow, zapewnia komponentom front-endowym i logice biznesowej możliwości konfiguracji i orkiestracji bez użycia kodu.

## Dlaczego nazywa się FlowEngine?

Ponieważ w FlowEngine właściwości i logika komponentów nie są już statycznie definiowane, lecz są napędzane i zarządzane przez **przepływ (Flow)**.

*   **Flow**, podobnie jak strumień danych, rozbija logikę na uporządkowane kroki (Step) i stosuje je sekwencyjnie do komponentu;
*   **Engine** oznacza, że jest to silnik napędzający logikę i interakcje front-endowe.

Dlatego **FlowEngine = silnik logiki front-endowej napędzany przez przepływy**.

## Czym jest Model?

W FlowEngine, Model to abstrakcyjny model komponentu, odpowiedzialny za:

*   Zarządzanie **właściwościami (Props)** i **stanem** komponentu;
*   Definiowanie **sposobu renderowania** komponentu;
*   Hostowanie i wykonywanie **Flow**;
*   Jednolite zarządzanie **rozsyłaniem zdarzeń** i **cyklami życia**.

Innymi słowy, **Model jest logicznym mózgiem komponentu**, przekształcając go ze statycznego elementu w konfigurowalną i orkiestrowalną jednostkę dynamiczną.

## Czym jest Flow?

W FlowEngine, **Flow to logiczny przepływ, który służy Modelowi**.
Jego celem jest:

*   Rozbicie logiki właściwości lub zdarzeń na kroki (Step) i wykonywanie ich sekwencyjnie, w sposób przepływowy;
*   Zarządzanie zmianami właściwości, a także reakcjami na zdarzenia;
*   Uczynienie logiki **dynamiczną, konfigurowalną i wielokrotnego użytku**.

## Jak zrozumieć te koncepcje?

Mogą Państwo wyobrazić sobie **Flow** jako **strumień wody**:

*   **Step jest jak węzeł na drodze strumienia**
    Każdy Step wykonuje małe zadanie (np. ustawienie właściwości, wyzwolenie zdarzenia, wywołanie API), podobnie jak woda wywiera efekt, przechodząc przez śluzę lub koło wodne.

*   **Przepływ jest uporządkowany**
    Woda płynie ustaloną ścieżką od źródła do ujścia, przechodząc kolejno przez wszystkie kroki (Step); podobnie, logika w Flow jest wykonywana w zdefiniowanej kolejności.

*   **Przepływ może być rozgałęziony i łączony**
    Strumień wody może rozdzielić się na wiele mniejszych strumieni lub połączyć się w jeden; Flow również może być podzielony na wiele podprzepływów lub połączony w bardziej złożone łańcuchy logiczne.

*   **Przepływ jest konfigurowalny i sterowalny**
    Kierunek i objętość strumienia wody można regulować za pomocą śluzy; sposób wykonania i parametry Flow również można kontrolować poprzez konfigurację (`stepParams`).

Podsumowanie analogii

*   **Komponent** jest jak koło wodne, które potrzebuje strumienia wody, aby się obracać;
*   **Model** to podstawa i kontroler tego koła wodnego, odpowiedzialny za odbieranie wody i napędzanie jego działania;
*   **Flow** to ten strumień wody, który przechodzi przez każdy Step w kolejności, powodując ciągłe zmiany i reakcje komponentu.

Zatem w FlowEngine:

*   **Flow** pozwala logice płynąć naturalnie, jak strumień wody;
*   **Model** natomiast sprawia, że komponent staje się nośnikiem i wykonawcą tego strumienia.