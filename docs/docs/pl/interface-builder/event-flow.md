:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/event-flow).
:::

# Przepływ zdarzeń

## Wprowadzenie

Jeśli chcą Państwo wywołać niestandardowe operacje przy zmianie formularza, mogą Państwo użyć przepływu zdarzeń. Oprócz formularzy, strony, bloki, przyciski i pola mogą również wykorzystywać przepływy zdarzeń do konfigurowania niestandardowych operacji.

## Jak używać

Poniżej przedstawimy prosty przykład, aby wyjaśnić, jak skonfigurować przepływ zdarzeń. Stwórzmy powiązanie między dwiema tabelami, gdzie kliknięcie wiersza w lewej tabeli automatycznie filtruje dane w prawej tabeli.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Kroki konfiguracji są następujące:

1. Proszę kliknąć ikonę „błyskawicy” w prawym górnym rogu bloku lewej tabeli, aby otworzyć interfejs konfiguracji przepływu zdarzeń.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Proszę kliknąć „Dodaj przepływ zdarzeń (Add event flow)”, wybrać „Kliknięcie wiersza (Row click)” jako „Zdarzenie wyzwalające”, co oznacza, że przepływ zostanie wywołany po kliknięciu wiersza tabeli.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Skonfigurować „Czas wykonania” (Execution timing), który służy do kontrolowania kolejności tego przepływu zdarzeń względem wbudowanych procesów systemowych. Zazwyczaj można pozostawić wartość domyślną; jeśli chcą Państwo wyświetlić powiadomienie lub przekierować po zakończeniu wbudowanej logiki, można wybrać „Po wszystkich przepływach”. Więcej informacji znajduje się poniżej w sekcji [Czas wykonania](#czas-wykonania).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. „Warunek wyzwalający (Trigger condition)” służy do konfigurowania warunków; przepływ zdarzeń zostanie wyzwolony tylko wtedy, gdy warunki zostaną spełnione. W tym przypadku nie musimy niczego konfigurować; każde kliknięcie wiersza wyzwoli przepływ zdarzeń.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Proszę najechać kursorem na „Dodaj krok (Add step)”, aby dodać kroki operacji. Wybieramy „Ustaw zakres danych (Set data scope)”, aby określić zakres danych dla prawej tabeli.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Proszę skopiować UID prawej tabeli i wpisać go w polu „UID bloku docelowego (Target block UID)”. Poniżej natychmiast wyświetli się interfejs konfiguracji warunków, w którym można określić zakres danych dla prawej tabeli.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Skonfigurujmy warunek, jak pokazano na poniższym obrazku:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Po skonfigurowaniu zakresu danych należy jeszcze odświeżyć blok, aby wyświetlić przefiltrowane wyniki. Następnie skonfigurujmy odświeżanie bloku prawej tabeli. Proszę dodać krok „Odśwież bloki docelowe (Refresh target blocks)”, a następnie wpisać UID prawej tabeli.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Na koniec proszę kliknąć przycisk zapisywania w prawym dolnym rogu i konfiguracja jest zakończona.

## Szczegóły zdarzeń

### Przed renderowaniem

Uniwersalne zdarzenie, które może być używane na stronach, w blokach, przyciskach lub polach. W tym zdarzeniu można wykonać pewne prace inicjalizacyjne. Na przykład skonfigurować różne zakresy danych w różnych warunkach.

### Kliknięcie wiersza (Row click)

Zdarzenie specyficzne dla bloku tabeli. Wyzwalane po kliknięciu wiersza tabeli. Podczas wyzwalania do kontekstu zostanie dodany rekord „Clicked row record”, który może być używany jako zmienna w warunkach i krokach.

### Zmiana wartości formularza (Form values change)

Zdarzenie specyficzne dla bloku formularza. Wyzwalane, gdy wartość pola formularza ulegnie zmianie. W warunkach i krokach można uzyskać dostęp do wartości formularza poprzez zmienną „Current form”.

### Kliknięcie (Click)

Zdarzenie specyficzne dla przycisku. Wyzwalane po kliknięciu przycisku.

## Czas wykonania

W konfiguracji przepływu zdarzeń istnieją dwa pojęcia, które łatwo pomylić:

- **Zdarzenie wyzwalające:** Kiedy rozpocząć wykonywanie (na przykład: Przed renderowaniem, Kliknięcie wiersza, Kliknięcie, Zmiana wartości formularza itp.).
- **Czas wykonania:** W którym miejscu **wbudowanego procesu** ma zostać wstawiony Państwa **niestandardowy przepływ zdarzeń** po wystąpieniu tego samego zdarzenia wyzwalającego.

### Czym są „wbudowane procesy / wbudowane kroki”?

Wiele stron, bloków lub samych operacji posiada zestaw wbudowanych procesów przetwarzania (na przykład: przesyłanie, otwieranie okna modalnego, żądanie danych). Gdy dodają Państwo niestandardowy przepływ zdarzeń dla tego samego zdarzenia (na przykład „Kliknięcie”), „Czas wykonania” służy do decydowania o tym:

- Czy najpierw wykonać Państwa przepływ zdarzeń, czy najpierw logikę wbudowaną;
- Czy wstawić Państwa przepływ zdarzeń przed lub po określonym kroku wbudowanego procesu.

### Jak rozumieć opcje czasu wykonania w interfejsie (UI)?

- **Przed wszystkimi przepływami (domyślnie):** Wykonywane jako pierwsze. Odpowiednie do „przechwytywania/przygotowania” (na przykład walidacja, ponowne potwierdzenie, inicjalizacja zmiennych itp.).
- **Po wszystkich przepływach:** Wykonywane po zakończeniu logiki wbudowanej. Odpowiednie do „zakończenia/informacji zwrotnej” (na przykład komunikaty, odświeżanie innych bloków, przekierowanie strony itp.).
- **Przed określonym przepływem / Po określonym przepływie:** Bardziej precyzyjny punkt wstawienia. Po wybraniu tej opcji należy wskazać konkretny „wbudowany proces”.
- **Przed określonym krokiem przepływu / Po określonym kroku przepływu:** Najbardziej precyzyjny punkt wstawienia. Po wybraniu tej opcji należy jednocześnie wskazać „wbudowany proces” oraz „krok wbudowanego procesu”.

> Wskazówka: Jeśli nie są Państwo pewni, który wbudowany proces/krok wybrać, najlepiej skorzystać z pierwszych dwóch opcji („Przed / Po”).

## Szczegóły kroków

### Zmienna niestandardowa (Custom variable)

Służy do zdefiniowania niestandardowej zmiennej, a następnie użycia jej w kontekście.

#### Zakres

Zmienne niestandardowe mają zakres (scope); na przykład zmienna zdefiniowana w przepływie zdarzeń bloku może być używana tylko w tym bloku. Jeśli chcą Państwo, aby zmienna była dostępna we wszystkich blokach na bieżącej stronie, należy ją skonfigurować w przepływie zdarzeń strony.

#### Zmienna formularza (Form variable)

Użycie wartości z określonego bloku formularza jako zmiennej. Konfiguracja jest następująca:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Tytuł zmiennej
- Variable identifier: Identyfikator zmiennej
- Form UID: UID formularza

#### Inne zmienne

W przyszłości będą obsługiwane inne zmienne, wkrótce dostępne.

### Ustaw zakres danych (Set data scope)

Ustawienie zakresu danych bloku docelowego. Konfiguracja jest następująca:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID bloku docelowego
- Condition: Warunek filtrowania

### Odśwież bloki docelowe (Refresh target blocks)

Odświeżenie bloku docelowego, pozwala na skonfigurowanie wielu bloków. Konfiguracja jest następująca:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID bloku docelowego

### Przejdź do URL (Navigate to URL)

Przejście do określonego adresu URL. Konfiguracja jest następująca:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Docelowy URL, obsługuje zmienne
- Search parameters: Parametry zapytania w URL
- Open in new window: Jeśli zaznaczone, otworzy nową stronę przeglądarki podczas przejścia

### Wyświetl wiadomo