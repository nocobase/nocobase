:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Szybki start

## Konfiguracja pierwszego przepływu pracy

Proszę przejść do strony zarządzania wtyczką przepływów pracy z menu konfiguracji wtyczek na górnym pasku nawigacyjnym:

![Wejście do zarządzania wtyczką przepływów pracy](https://static-docs.nocobase.com/20251027222721.png)

W interfejsie zarządzania znajdzie Pan/Pani listę wszystkich utworzonych przepływów pracy:

![Zarządzanie przepływami pracy](https://static-docs.nocobase.com/20251027222900.png)

Proszę kliknąć przycisk „Nowy”, aby utworzyć nowy przepływ pracy, a następnie wybrać zdarzenie kolekcji:

![Tworzenie przepływu pracy](https://static-docs.nocobase.com/20251027222951.png)

Po zatwierdzeniu proszę kliknąć łącze „Konfiguruj” na liście, aby przejść do interfejsu konfiguracji przepływu pracy:

![Pusty przepływ pracy](https://static-docs.nocobase.com/20251027223131.png)

Następnie proszę kliknąć kartę wyzwalacza, aby otworzyć panel konfiguracji wyzwalacza. Proszę wybrać wcześniej utworzoną kolekcję (np. „Artykuły”), dla opcji „Moment wyzwolenia” wybrać „Po dodaniu rekordu”, a następnie kliknąć przycisk „Zapisz”, aby zakończyć konfigurację wyzwalacza:

![Konfiguracja wyzwalacza](https://static-docs.nocobase.com/20251027224735.png)

Następnie możemy kliknąć przycisk plusa w przepływie, aby dodać węzeł. Na przykład, proszę wybrać węzeł obliczeniowy, który posłuży do połączenia pola „Tytuł” z polem „ID” z danych wyzwalacza:

![Dodawanie węzła obliczeniowego](https://static-docs.nocobase.com/20251027224842.png)

Proszę kliknąć kartę węzła, aby otworzyć panel konfiguracji węzła. Proszę użyć funkcji obliczeniowej `CONCATENATE` dostarczonej przez Formula.js, aby połączyć pola „Tytuł” i „ID”. Oba pola wstawia się za pomocą selektora zmiennych:

![Węzeł obliczeniowy używający funkcji i zmiennych](https://static-docs.nocobase.com/20251027224939.png)

Następnie proszę utworzyć węzeł aktualizacji danych, który posłuży do zapisania wyniku w polu „Tytuł”:

![Tworzenie węzła aktualizacji danych](https://static-docs.nocobase.com/20251027232654.png)

Podobnie, proszę kliknąć kartę, aby otworzyć panel konfiguracji węzła aktualizacji danych. Proszę wybrać kolekcję „Artykuły”, dla identyfikatora danych do aktualizacji wybrać identyfikator danych z wyzwalacza, dla elementu danych do aktualizacji wybrać „Tytuł”, a dla wartości danych do aktualizacji wybrać wynik z węzła obliczeniowego:

![Konfiguracja węzła aktualizacji danych](https://static-docs.nocobase.com/20251027232802.png)

Na koniec proszę kliknąć przełącznik „Włącz”/„Wyłącz” na pasku narzędzi w prawym górnym rogu, aby przełączyć przepływ pracy w stan aktywny. Dzięki temu przepływ pracy będzie mógł zostać wyzwolony i wykonany.

## Wyzwalanie przepływu pracy

Proszę wrócić do głównego interfejsu systemu, utworzyć artykuł za pomocą bloku artykułów i wypełnić jego tytuł:

![Tworzenie danych artykułu](https://static-docs.nocobase.com/20251027233004.png)

Po zatwierdzeniu i odświeżeniu bloku, zobaczy Pan/Pani, że tytuł artykułu został automatycznie zaktualizowany do formatu „Tytuł artykułu + ID artykułu”:

![Tytuł artykułu zmodyfikowany przez przepływ pracy](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Wskazówka}
Ponieważ przepływy pracy wyzwalane przez zdarzenia kolekcji są wykonywane asynchronicznie, nie zobaczy Pan/Pani natychmiastowej aktualizacji danych w interfejsie po ich zatwierdzeniu. Jednak po krótkiej chwili, odświeżając stronę lub blok, będzie Pan/Pani mógł/mogła zobaczyć zaktualizowaną zawartość.
:::

## Przeglądanie historii wykonania

Przepływ pracy został właśnie pomyślnie wyzwolony i wykonany. Możemy wrócić do interfejsu zarządzania przepływami pracy, aby zobaczyć odpowiadającą mu historię wykonania:

![Przeglądanie listy przepływów pracy](https://static-docs.nocobase.com/20251027233246.png)

Na liście przepływów pracy zobaczy Pan/Pani, że ten przepływ pracy wygenerował jedną historię wykonania. Proszę kliknąć łącze w kolumnie z liczbą wykonań, aby otworzyć rekordy historii wykonania dla danego przepływu pracy:

![Lista historii wykonania dla danego przepływu pracy](https://static-docs.nocobase.com/20251027233341.png)

Następnie proszę kliknąć łącze „Pokaż”, aby przejść do strony szczegółów tego wykonania, gdzie zobaczy Pan/Pani status wykonania i dane wynikowe dla każdego węzła:

![Szczegóły historii wykonania przepływu pracy](https://static-docs.nocobase.com/20251027233615.png)

Dane kontekstowe wyzwalacza oraz dane wynikowe wykonania węzła można przeglądać, klikając przycisk statusu w prawym górnym rogu odpowiedniej karty. Na przykład, zobaczmy dane wynikowe węzła obliczeniowego:

![Wynik węzła obliczeniowego](https://static-docs.nocobase.com/20251027233635.png)

W danych wynikowych węzła obliczeniowego zobaczy Pan/Pani obliczony tytuł, który jest następnie używany przez węzeł aktualizacji danych.

## Podsumowanie

Wykonując powyższe kroki, zakończyliśmy konfigurację i wyzwolenie prostego przepływu pracy, a także zapoznaliśmy się z następującymi podstawowymi koncepcjami:

-   **Przepływ pracy**: Służy do definiowania podstawowych informacji o procesie, w tym nazwy, typu wyzwalacza i statusu włączenia. Można w nim skonfigurować dowolną liczbę węzłów. Jest to jednostka, która realizuje proces.
-   **Wyzwalacz**: Każdy przepływ pracy zawiera jeden wyzwalacz, który można skonfigurować z określonymi warunkami, aby przepływ pracy został uruchomiony. Jest to punkt wejścia do procesu.
-   **Węzeł**: Węzeł to jednostka instrukcji w przepływie pracy, która wykonuje określoną akcję. Wiele węzłów w przepływie pracy tworzy kompletny proces wykonania poprzez relacje nadrzędne i podrzędne.
-   **Wykonanie**: Wykonanie to konkretny obiekt wykonania po wyzwoleniu przepływu pracy, znany również jako rekord wykonania lub historia wykonania. Zawiera informacje takie jak status wykonania, dane kontekstowe wyzwalacza itp. Dla każdego węzła istnieją również odpowiadające mu wyniki wykonania, które obejmują status węzła po wykonaniu i dane wynikowe.

Aby uzyskać bardziej szczegółowe informacje, może Pan/Pani zapoznać się z następującymi treściami:

-   [Wyzwalacze](./triggers/index)
-   [Węzły](./nodes/index)
-   [Używanie zmiennych](./advanced/variables)
-   [Wykonania](./advanced/executions)
-   [Zarządzanie wersjami](./advanced/revisions)
-   [Opcje zaawansowane](./advanced/options)