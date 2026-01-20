---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Obliczenia Dat

## Wprowadzenie

Węzeł Obliczenia Dat oferuje dziewięć funkcji obliczeniowych, w tym dodawanie i odejmowanie okresów czasu, formatowanie ciągów znaków daty oraz konwersję jednostek czasu trwania. Każda funkcja ma określone typy wartości wejściowych i wyjściowych, a także może przyjmować wyniki z innych węzłów jako zmienne parametry. Wykorzystuje on mechanizm potoku obliczeniowego, aby łączyć wyniki skonfigurowanych funkcji, uzyskując w końcu oczekiwany rezultat.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Obliczenia Dat”:

![Węzeł Obliczenia Dat_Tworzenie węzła](https://static-docs.nocobase.com/[图片].png)

## Konfiguracja węzła

![Węzeł Obliczenia Dat_Konfiguracja węzła](https://static-docs.nocobase.com/20240817184423.png)

### Wartość wejściowa

Wartością wejściową może być zmienna lub stała data. Zmienna może pochodzić z danych, które wywołały ten przepływ pracy, lub być wynikiem węzła poprzedzającego w tym przepływie pracy. Jako stałą, można wybrać dowolną datę.

### Typ wartości wejściowej

Określa typ wartości wejściowej. Dostępne są dwa typy:

*   Typ daty: Oznacza, że wartość wejściowa może zostać ostatecznie przekonwertowana na typ daty i czasu, na przykład numeryczny znacznik czasu lub ciąg znaków reprezentujący czas.
*   Typ liczbowy: Ponieważ typ wartości wejściowej wpływa na wybór kolejnych kroków obliczeń czasu, należy prawidłowo wybrać typ wartości wejściowej.

### Kroki obliczeniowe

Każdy krok obliczeniowy składa się z funkcji obliczeniowej i jej konfiguracji parametrów. Przyjęto tu projekt potoku, gdzie wynik obliczeń poprzedniej funkcji służy jako wartość wejściowa dla kolejnej funkcji. W ten sposób można wykonać serię obliczeń i konwersji czasu.

Po każdym kroku obliczeniowym typ wyjściowy jest stały i wpływa na funkcje dostępne dla kolejnego kroku. Obliczenia mogą być kontynuowane tylko wtedy, gdy typy są zgodne. W przeciwnym razie wynik danego kroku będzie ostatecznym wynikiem wyjściowym węzła.

## Funkcje obliczeniowe

### Dodaj okres czasu

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Ilość do dodania, którą może być liczba lub wbudowana zmienna z węzła.
    -   Jednostka czasu.
-   Typ wartości wyjściowej: Data
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 00:00:00`, ilość to `1`, a jednostka to „dzień”, wynik obliczeń to `2024-7-16 00:00:00`.

### Odejmij okres czasu

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Ilość do odjęcia, którą może być liczba lub wbudowana zmienna z węzła.
    -   Jednostka czasu.
-   Typ wartości wyjściowej: Data
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 00:00:00`, ilość to `1`, a jednostka to „dzień”, wynik obliczeń to `2024-7-14 00:00:00`.

### Oblicz różnicę z inną datą

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Data, z którą należy obliczyć różnicę. Może to być stała data lub zmienna z kontekstu przepływu pracy.
    -   Jednostka czasu.
    -   Czy zastosować wartość bezwzględną.
    -   Operacja zaokrąglania: Dostępne opcje to zachowanie miejsc dziesiętnych, zaokrąglanie, zaokrąglanie w górę i zaokrąglanie w dół.
-   Typ wartości wyjściowej: Liczba
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 00:00:00`, obiekt porównania to `2024-7-16 06:00:00`, jednostka to „dzień”, wartość bezwzględna nie jest brana pod uwagę, a miejsca dziesiętne są zachowane, wynik obliczeń to `-1.25`.

:::info{title=Wskazówka}
Gdy wartość bezwzględna i zaokrąglanie są skonfigurowane jednocześnie, najpierw stosowana jest wartość bezwzględna, a następnie zaokrąglanie.
:::

### Pobierz wartość czasu w określonej jednostce

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Jednostka czasu.
-   Typ wartości wyjściowej: Liczba
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 00:00:00`, a jednostka to „dzień”, wynik obliczeń to `15`.

### Ustaw datę na początek określonej jednostki

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Jednostka czasu.
-   Typ wartości wyjściowej: Data
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 14:26:30`, a jednostka to „dzień”, wynik obliczeń to `2024-7-15 00:00:00`.

### Ustaw datę na koniec określonej jednostki

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Jednostka czasu.
-   Typ wartości wyjściowej: Data
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 14:26:30`, a jednostka to „dzień”, wynik obliczeń to `2024-7-15 23:59:59`.

### Sprawdź, czy rok jest przestępny

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Brak parametrów
-   Typ wartości wyjściowej: Logiczny (Boolean)
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 14:26:30`, wynik obliczeń to `true`.

### Formatuj jako ciąg znaków

-   Akceptowany typ wartości wejściowej: Data
-   Parametry
    -   Format, proszę zapoznać się z [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Typ wartości wyjściowej: Ciąg znaków
-   Przykład: Jeśli wartość wejściowa to `2024-7-15 14:26:30`, a format to `the time is YYYY/MM/DD HH:mm:ss`, wynik obliczeń to `the time is 2024/07/15 14:26:30`.

### Konwertuj jednostkę

-   Akceptowany typ wartości wejściowej: Liczba
-   Parametry
    -   Jednostka czasu przed konwersją.
    -   Jednostka czasu po konwersji.
    -   Operacja zaokrąglania: Dostępne opcje to zachowanie miejsc dziesiętnych, zaokrąglanie, zaokrąglanie w górę i zaokrąglanie w dół.
-   Typ wartości wyjściowej: Liczba
-   Przykład: Jeśli wartość wejściowa to `2`, jednostka przed konwersją to „tydzień”, jednostka po konwersji to „dzień”, a miejsca dziesiętne nie są zachowane, wynik obliczeń to `14`.

## Przykład

![Węzeł Obliczenia Dat_Przykład](https://static-docs.nocobase.com/20240817184137.png)

Załóżmy, że mamy wydarzenie promocyjne i chcemy, aby po utworzeniu każdego produktu, w jego polu została dodana data zakończenia promocji. Ta data zakończenia to 23:59:59 ostatniego dnia tygodnia następującego po dacie utworzenia produktu. Możemy zatem utworzyć dwie funkcje czasowe i uruchomić je w potoku:

-   Obliczyć czas dla następnego tygodnia
-   Zresetować uzyskany wynik do 23:59:59 ostatniego dnia tego tygodnia

W ten sposób uzyskujemy pożądaną wartość czasu i przekazujemy ją do następnego węzła, na przykład węzła modyfikacji kolekcji, aby dodać datę zakończenia promocji do kolekcji.