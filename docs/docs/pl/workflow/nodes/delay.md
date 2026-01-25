:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Opóźnienie

## Wprowadzenie

Węzeł Opóźnienie pozwala dodać opóźnienie do przepływu pracy. Po jego zakończeniu, w zależności od konfiguracji, przepływ może kontynuować wykonywanie kolejnych węzłów lub zostać przedwcześnie zakończony.

Często używa się go w połączeniu z węzłem Równoległa gałąź. Węzeł Opóźnienie można dodać do jednej z gałęzi, aby obsłużyć procesy po przekroczeniu limitu czasu. Na przykład, w równoległej gałęzi, jedna gałąź zawiera proces ręczny, a druga węzeł Opóźnienie. Gdy proces ręczny przekroczy limit czasu, ustawienie opcji "niepowodzenie po przekroczeniu limitu czasu" oznacza, że proces ręczny musi zostać zakończony w określonym czasie. Ustawienie opcji "kontynuuj po przekroczeniu limitu czasu" pozwala zignorować ten proces ręczny po upływie wyznaczonego czasu.

## Instalacja

Wbudowana wtyczka, nie wymaga instalacji.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, kliknij przycisk plusa („+”) w przepływie, aby dodać węzeł „Opóźnienie”:

![Tworzenie węzła Opóźnienie](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Konfiguracja węzła

![Węzeł Opóźnienie_Konfiguracja węzła](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Czas opóźnienia

Dla czasu opóźnienia mogą Państwo wprowadzić liczbę i wybrać jednostkę czasu. Obsługiwane jednostki czasu to: sekundy, minuty, godziny, dni i tygodnie.

### Status po upływie czasu

Dla statusu po upływie czasu mogą Państwo wybrać „Przejdź i kontynuuj” lub „Zakończ z błędem”. Pierwsza opcja oznacza, że po zakończeniu opóźnienia przepływ pracy będzie kontynuował wykonywanie kolejnych węzłów. Druga opcja oznacza, że po zakończeniu opóźnienia przepływ pracy zostanie przedwcześnie zakończony ze statusem błędu.

## Przykład

Rozważmy scenariusz, w którym zlecenie pracy wymaga odpowiedzi w ograniczonym czasie po jego zainicjowaniu. Musimy dodać węzeł ręczny w jednej z dwóch równoległych gałęzi, a węzeł Opóźnienie w drugiej. Jeśli proces ręczny nie zostanie zakończony w ciągu 10 minut, status zlecenia pracy zostanie zaktualizowany na „przekroczono limit czasu i nieprzetworzone”.

![Węzeł Opóźnienie_Przykład_Organizacja przepływu](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)