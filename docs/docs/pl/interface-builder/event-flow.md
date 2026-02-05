:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przepływ zdarzeń

## Wprowadzenie

Jeśli chcą Państwo wywołać niestandardowe operacje przy zmianie formularza, mogą Państwo użyć przepływu zdarzeń. Oprócz formularzy, strony, bloki, przyciski i pola mogą również wykorzystywać przepływy zdarzeń do konfigurowania niestandardowych operacji.

## Jak używać

Poniżej przedstawimy prosty przykład, aby wyjaśnić, jak skonfigurować przepływ zdarzeń. Stwórzmy powiązanie między dwiema tabelami, gdzie kliknięcie wiersza w lewej tabeli automatycznie filtruje dane w prawej tabeli.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Kroki konfiguracji:

1. Proszę kliknąć ikonę „błyskawicy” w prawym górnym rogu bloku lewej tabeli, aby otworzyć panel konfiguracji przepływu zdarzeń.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Proszę kliknąć „Dodaj przepływ zdarzeń” (Add event flow), wybrać „Kliknięcie wiersza” (Row click) jako „Zdarzenie wyzwalające” (Trigger event), co oznacza, że przepływ zostanie wywołany po kliknięciu wiersza tabeli.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. „Warunek wyzwalający” (Trigger condition) służy do konfigurowania warunków. Przepływ zdarzeń zostanie wywołany tylko wtedy, gdy te warunki zostaną spełnione. W tym przypadku nie musimy konfigurować żadnych warunków, więc przepływ zostanie wywołany przy każdym kliknięciu wiersza.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Proszę najechać kursorem na „Dodaj krok” (Add step), aby dodać kroki operacji. Wybieramy „Ustaw zakres danych” (Set data scope), aby skonfigurować zakres danych dla prawej tabeli.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Proszę skopiować UID prawej tabeli i wkleić go w polu „UID bloku docelowego” (Target block UID). Poniżej natychmiast pojawi się panel konfiguracji warunków, gdzie mogą Państwo skonfigurować zakres danych dla prawej tabeli.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Skonfigurujmy warunek, jak pokazano poniżej:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Po skonfigurowaniu zakresu danych, należy odświeżyć blok, aby wyświetlić przefiltrowane wyniki. Następnie skonfigurujmy odświeżanie bloku prawej tabeli. Proszę dodać krok „Odśwież bloki docelowe” (Refresh target blocks), a następnie wprowadzić UID prawej tabeli.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Na koniec proszę kliknąć przycisk „Zapisz” w prawym dolnym rogu, aby zakończyć konfigurację.

## Typy zdarzeń

### Przed renderowaniem (Before render)

Uniwersalne zdarzenie, które może być używane na stronach, w blokach, przyciskach lub polach. W tym zdarzeniu można wykonywać zadania inicjalizacyjne, na przykład konfigurować różne zakresy danych w zależności od warunków.

### Kliknięcie wiersza (Row click)

Zdarzenie specyficzne dla bloku tabeli. Wyzwalane po kliknięciu wiersza tabeli. Po wyzwoleniu dodaje do kontekstu „Clicked row record”, który może być używany jako zmienna w warunkach i krokach.

### Zmiana wartości formularza (Form values change)

Zdarzenie specyficzne dla bloku formularza. Wyzwalane, gdy zmieniają się wartości pól formularza. Mogą Państwo uzyskać dostęp do wartości formularza za pomocą zmiennej „Current form” w warunkach i krokach.

### Kliknięcie (Click)

Zdarzenie specyficzne dla przycisku. Wyzwalane po kliknięciu przycisku.

## Typy kroków

### Zmienna niestandardowa (Custom variable)

Służy do tworzenia niestandardowej zmiennej, a następnie używania jej w kontekście.

#### Zakres

Zmienne niestandardowe mają zakres. Na przykład, zmienna zdefiniowana w przepływie zdarzeń bloku może być używana tylko w tym bloku. Aby zmienna była dostępna we wszystkich blokach na bieżącej stronie, należy ją skonfigurować w przepływie zdarzeń strony.

#### Zmienna formularza (Form variable)

Używa wartości z bloku formularza jako zmiennej. Konfiguracja:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Tytuł zmiennej
- Variable identifier: Identyfikator zmiennej
- Form UID: UID formularza

#### Inne zmienne

W przyszłości będą obsługiwane kolejne typy zmiennych. Prosimy o cierpliwość.

### Ustaw zakres danych (Set data scope)

Ustawia zakres danych dla bloku docelowego. Konfiguracja:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID bloku docelowego
- Condition: Warunek filtrowania

### Odśwież bloki docelowe (Refresh target blocks)

Odświeża bloki docelowe. Można skonfigurować wiele bloków. Konfiguracja:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID bloku docelowego

### Przejdź do URL (Navigate to URL)

Przekierowuje do określonego adresu URL. Konfiguracja:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Docelowy adres URL, obsługuje zmienne
- Search parameters: Parametry zapytania w adresie URL
- Open in new window: Jeśli zaznaczone, otwiera adres URL w nowej karcie przeglądarki

### Wyświetl wiadomość (Show message)

Wyświetla globalne komunikaty zwrotne dotyczące operacji.

#### Kiedy używać

- Może dostarczać komunikaty zwrotne o sukcesie, ostrzeżeniach i błędach.
- Wyświetla się na środku u góry i automatycznie znika, stanowiąc lekką formę powiadomienia, która nie przerywa operacji użytkownika.

#### Konfiguracja

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Typ wiadomości
- Message content: Treść wiadomości
- Duration: Czas wyświetlania (w sekundach)

### Wyświetl powiadomienie (Show notification)

Wyświetla globalne powiadomienia.

#### Kiedy używać

Wyświetla powiadomienia w czterech rogach systemu. Często używane w następujących sytuacjach:

- Bardziej złożona treść powiadomienia.
- Interaktywne powiadomienia, które wskazują użytkownikowi kolejne kroki.
- Powiadomienia inicjowane przez system.

#### Konfiguracja

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Typ powiadomienia
- Notification title: Tytuł powiadomienia
- Notification description: Opis powiadomienia
- Placement: Pozycja, dostępne opcje: lewy górny, prawy górny, lewy dolny, prawy dolny

### Wykonaj JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Wykonuje kod JavaScript.