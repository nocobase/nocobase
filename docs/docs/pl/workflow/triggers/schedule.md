:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zadanie cykliczne

## Wprowadzenie

Zadanie cykliczne to zdarzenie wyzwalane przez warunek czasowy. Dostępne są dwa tryby:

- **Czas niestandardowy**: Standardowe wyzwalanie oparte na czasie systemowym, podobne do crona.
- **Pole czasowe kolekcji**: Wyzwalanie oparte na wartości pola czasowego w kolekcji, gdy nadejdzie określony czas.

Gdy system osiągnie punkt czasowy (z dokładnością do sekundy) spełniający skonfigurowane warunki wyzwalania, zostanie uruchomiony odpowiedni przepływ pracy.

## Podstawowe użycie

### Tworzenie zadania cyklicznego

Podczas tworzenia przepływu pracy na liście przepływów pracy proszę wybrać typ „Zadanie cykliczne”:

![Tworzenie zadania cyklicznego](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Tryb czasu niestandardowego

W przypadku trybu standardowego należy najpierw skonfigurować czas rozpoczęcia na dowolny punkt w czasie (z dokładnością do sekundy). Czas rozpoczęcia można ustawić na przyszłość lub przeszłość. Jeśli czas rozpoczęcia zostanie ustawiony na przeszłość, system sprawdzi, czy nadszedł czas na wyzwolenie, zgodnie ze skonfigurowanym warunkiem powtarzania. Jeśli warunek powtarzania nie zostanie skonfigurowany, a czas rozpoczęcia jest w przeszłości, przepływ pracy nie zostanie już wyzwolony.

Istnieją dwa sposoby konfiguracji reguły powtarzania:

- **Według interwału**: Wyzwala się w stałych odstępach czasu po czasie rozpoczęcia, np. co godzinę, co 30 minut itp.
- **Tryb zaawansowany**: Zgodnie z regułami crona, można skonfigurować cykl, który osiąga stałą datę i godzinę określoną regułą.

Po skonfigurowaniu reguły powtarzania można również ustawić warunek zakończenia. Może to być zakończenie w stałym punkcie czasowym lub ograniczenie przez liczbę wykonanych już razy.

### Tryb pola czasowego kolekcji

Użycie pola czasowego kolekcji do określenia czasu rozpoczęcia to tryb wyzwalania, który łączy zwykłe zadania cykliczne z polami czasowymi kolekcji. Korzystanie z tego trybu może uprościć węzły w niektórych specyficznych procesach, a także jest bardziej intuicyjne pod względem konfiguracji. Na przykład, aby zmienić status zaległych, nieopłaconych zamówień na anulowane, można po prostu skonfigurować zadanie cykliczne w trybie pola czasowego kolekcji, wybierając czas rozpoczęcia na 30 minut po utworzeniu zamówienia.

## Powiązane wskazówki

### Zadania cykliczne w stanie nieaktywnym lub wyłączonym

Jeśli skonfigurowany warunek czasowy zostanie spełniony, ale cała usługa aplikacji NocoBase jest w stanie nieaktywnym lub wyłączonym, zadanie cykliczne, które powinno było zostać wyzwolone w tym punkcie czasowym, zostanie pominięte. Co więcej, po ponownym uruchomieniu usługi, pominięte zadania nie zostaną już wyzwolone. Dlatego podczas korzystania z tej funkcji warto rozważyć obsługę takich sytuacji lub zastosowanie środków zaradczych.

### Liczba powtórzeń

Gdy skonfigurowany jest warunek zakończenia „według liczby powtórzeń”, system zlicza całkowitą liczbę wykonań wszystkich wersji tego samego przepływu pracy. Na przykład, jeśli zadanie cykliczne zostało wykonane 10 razy w wersji 1, a liczba powtórzeń również została ustawiona na 10, ten przepływ pracy nie zostanie już wyzwolony. Nawet jeśli zostanie skopiowany do nowej wersji, nie zostanie wyzwolony, chyba że liczba powtórzeń zostanie zmieniona na wartość większą niż 10. Jednakże, jeśli przepływ pracy zostanie skopiowany jako nowy przepływ pracy, liczba wykonań zostanie zresetowana do 0. Bez modyfikowania odpowiedniej konfiguracji, nowy przepływ pracy będzie mógł zostać wyzwolony kolejne 10 razy.

### Różnica między interwałem a trybem zaawansowanym w regułach powtarzania

Interwał w regule powtarzania jest względny w stosunku do czasu ostatniego wyzwolenia (lub czasu rozpoczęcia), podczas gdy tryb zaawansowany wyzwala się w stałych punktach czasowych. Na przykład, jeśli skonfigurowano wyzwalanie co 30 minut, a ostatnie wyzwolenie miało miejsce 2021-09-01 12:01:23, to następne wyzwolenie nastąpi 2021-09-01 12:31:23. Tryb zaawansowany, czyli tryb crona, jest skonfigurowany tak, aby wyzwalać się w stałych punktach czasowych, na przykład można go skonfigurować tak, aby wyzwalał się w 01. i 31. minucie każdej godziny.

## Przykład

Załóżmy, że co minutę musimy sprawdzać zamówienia, które nie zostały opłacone w ciągu 30 minut od ich utworzenia, i automatycznie zmieniać ich status na anulowane. Zaimplementujemy to, używając obu trybów.

### Tryb czasu niestandardowego

Proszę utworzyć przepływ pracy oparty na zadaniu cyklicznym. W konfiguracji wyzwalacza proszę wybrać tryb „Czas niestandardowy”, ustawić czas rozpoczęcia na dowolny punkt nie późniejszy niż bieżący czas, wybrać „Co minutę” dla reguły powtarzania i pozostawić warunek zakończenia pusty:

![Zadanie cykliczne_Konfiguracja wyzwalacza_Tryb czasu niestandardowego](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Następnie proszę skonfigurować inne węzły zgodnie z logiką procesu, obliczyć czas 30 minut wstecz i zmienić status nieopłaconych zamówień utworzonych przed tym czasem na anulowane:

![Zadanie cykliczne_Konfiguracja wyzwalacza_Tryb czasu niestandardowego](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Po włączeniu przepływu pracy będzie on wyzwalany raz na minutę od czasu rozpoczęcia, obliczając czas 30 minut wstecz, aby zaktualizować status zamówień utworzonych przed tym punktem czasowym na anulowane.

### Tryb pola czasowego kolekcji

Proszę utworzyć przepływ pracy oparty na zadaniu cyklicznym. W konfiguracji wyzwalacza proszę wybrać tryb „Pole czasowe kolekcji”, wybrać kolekcję „Zamówienia”, ustawić czas rozpoczęcia na 30 minut po czasie utworzenia zamówienia i wybrać „Nie powtarzaj” dla reguły powtarzania:

![Zadanie cykliczne_Konfiguracja wyzwalacza_Tryb pola czasowego kolekcji_Wyzwalacz](https://static-docs.nocobase.com/d40b5aef57f42799d31cc5882dd94246.png)

Następnie proszę skonfigurować inne węzły zgodnie z logiką procesu, aby zaktualizować status zamówienia o ID danych wyzwalających i statusie „nieopłacone” na anulowane:

![Zadanie cykliczne_Konfiguracja wyzwalacza_Tryb pola czasowego kolekcji_Węzeł aktualizacji](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

W przeciwieństwie do trybu czasu niestandardowego, tutaj nie ma potrzeby obliczania czasu 30 minut wstecz, ponieważ kontekst danych wyzwalających przepływ pracy zawiera już wiersz danych spełniający warunek czasowy, więc można bezpośrednio zaktualizować status odpowiedniego zamówienia.