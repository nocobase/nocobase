:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zdarzenia kolekcji

## Wprowadzenie

Triggery typu zdarzeń kolekcji będą nasłuchiwać zdarzeń tworzenia, aktualizacji i usuwania danych w kolekcji. Gdy operacja na danych w tej kolekcji nastąpi i spełni skonfigurowane warunki, zostanie uruchomiony odpowiedni przepływ pracy. Na przykład, scenariusze takie jak odjęcie stanu magazynowego produktu po utworzeniu nowego zamówienia, lub oczekiwanie na ręczną weryfikację po dodaniu nowego komentarza.

## Podstawowe użycie

Istnieje kilka typów zmian w kolekcji:

1. Po utworzeniu danych.
2. Po zaktualizowaniu danych.
3. Po utworzeniu lub zaktualizowaniu danych.
4. Po usunięciu danych.

![Collection Event_Trigger Timing Selection](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Mogą Państwo wybrać moment wyzwolenia w zależności od potrzeb biznesowych. Gdy wybrana zmiana obejmuje aktualizację kolekcji, mogą Państwo również określić pola, które uległy zmianie. Warunek wyzwolenia zostanie spełniony tylko wtedy, gdy zmienią się wybrane pola. Jeśli żadne pola nie zostaną wybrane, oznacza to, że zmiana w dowolnym polu może wyzwolić przepływ pracy.

![Collection Event_Select Changed Fields](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Bardziej szczegółowo, mogą Państwo skonfigurować reguły warunków dla każdego pola w wyzwalającym wierszu danych. Wyzwolenie nastąpi tylko wtedy, gdy pola spełnią odpowiednie warunki.

![Collection Event_Configure Data Conditions](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Po wyzwoleniu zdarzenia kolekcji, wiersz danych, który wygenerował zdarzenie, zostanie wstrzyknięty do planu wykonania jako dane kontekstowe wyzwalacza, aby mógł być używany jako zmienne przez kolejne węzły w przepływie pracy. Jednakże, gdy kolejne węzły będą potrzebowały użyć pól relacji tych danych, należy najpierw skonfigurować wstępne ładowanie danych relacji. Wybrane dane relacji zostaną wstrzyknięte do kontekstu wraz z wyzwoleniem i mogą być wybierane i używane hierarchicznie.

## Wskazówki

### Wyzwalanie przez masowe operacje na danych nie jest obecnie obsługiwane

Zdarzenia kolekcji obecnie nie obsługują wyzwalania przez masowe operacje na danych. Na przykład, podczas tworzenia artykułu i jednoczesnego dodawania wielu tagów dla tego artykułu (dane relacji jeden do wielu), zostanie wyzwolony tylko przepływ pracy dla tworzenia artykułu. Jednocześnie utworzone wiele tagów nie wyzwolą przepływu pracy dla tworzenia tagów. Podczas kojarzenia lub dodawania danych relacji wiele do wielu, przepływ pracy dla kolekcji pośredniej również nie zostanie wyzwolony.

### Operacje na danych poza aplikacją nie wyzwolą zdarzeń

Operacje na kolekcjach poprzez wywołania interfejsu API HTTP aplikacji również mogą wyzwalać odpowiednie zdarzenia. Jednakże, jeśli zmiany danych są dokonywane bezpośrednio poprzez operacje bazodanowe, a nie za pośrednictwem aplikacji NocoBase, odpowiednie zdarzenia nie mogą zostać wyzwolone. Na przykład, natywne triggery bazodanowe nie będą powiązane z przepływami pracy w aplikacji.

Dodatkowo, użycie węzła operacji SQL do manipulowania bazą danych jest równoznaczne z bezpośrednimi operacjami na bazie danych i nie wyzwoli zdarzeń kolekcji.

### Zewnętrzne źródła danych

Przepływy pracy obsługują zewnętrzne źródła danych od wersji `0.20`. Jeśli używają Państwo wtyczki zewnętrznego źródła danych i zdarzenie kolekcji jest skonfigurowane dla zewnętrznego źródła danych, to dopóki operacje na danych w tym źródle są wykonywane w ramach aplikacji (takie jak tworzenie przez użytkownika, aktualizacje i operacje danych przepływu pracy), odpowiednie zdarzenia kolekcji mogą zostać wyzwolone. Jednakże, jeśli zmiany danych są dokonywane za pośrednictwem innych systemów lub bezpośrednio w zewnętrznej bazie danych, zdarzenia kolekcji nie mogą zostać wyzwolone.

## Przykład

Przyjrzyjmy się scenariuszowi obliczania całkowitej ceny i odejmowania stanu magazynowego po utworzeniu nowego zamówienia.

Najpierw tworzymy kolekcję Produktów i kolekcję Zamówień z następującymi modelami danych:

| Nazwa pola      | Typ pola         |
| --------------- | ---------------- |
| Nazwa produktu  | Tekst jednowierszowy |
| Cena            | Liczba           |
| Stan magazynowy | Liczba całkowita |

| Nazwa pola              | Typ pola             |
| ----------------------- | -------------------- |
| ID zamówienia           | Sekwencja            |
| Produkt zamówienia      | Wiele do jednego (Produkty) |
| Całkowita wartość zamówienia | Liczba               |

Następnie dodajemy podstawowe dane produktów:

| Nazwa produktu  | Cena | Stan magazynowy |
| --------------- | ---- | --------------- |
| iPhone 14 Pro   | 7999 | 10              |
| iPhone 13 Pro   | 5999 | 0               |

Następnie tworzymy przepływ pracy oparty na zdarzeniu kolekcji Zamówień:

![Collection Event_Example_New Order Trigger](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Oto niektóre z opcji konfiguracji:

- Kolekcja: Wybierz kolekcję „Zamówienia”.
- Moment wyzwolenia: Wybierz wyzwolenie „Po utworzeniu danych”.
- Warunki wyzwolenia: Pozostaw puste.
- Wstępne ładowanie danych relacji: Zaznacz „Produkty”.

Następnie konfigurujemy inne węzły zgodnie z logiką przepływu pracy: sprawdzamy, czy stan magazynowy produktu jest większy niż 0. Jeśli tak, odejmujemy stan magazynowy; w przeciwnym razie zamówienie jest nieważne i powinno zostać usunięte:

![Collection Event_Example_New Order Workflow Orchestration](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Konfiguracja węzłów zostanie szczegółowo wyjaśniona w dokumentacji dla konkretnych typów węzłów.

Włącz ten przepływ pracy i przetestuj go, tworząc nowe zamówienie za pośrednictwem interfejsu. Po złożeniu zamówienia na „iPhone 14 Pro”, stan magazynowy odpowiedniego produktu zostanie zmniejszony do 9. Jeśli zamówienie zostanie złożone na „iPhone 13 Pro”, zamówienie zostanie usunięte z powodu niewystarczającego stanu magazynowego.

![Collection Event_Example_New Order Execution Result](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)