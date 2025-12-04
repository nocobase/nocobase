---
pkg: '@nocobase/plugin-workflow-aggregate'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zapytanie agregujące

## Wprowadzenie

Służy do wykonywania zapytań z funkcjami agregującymi na danych w **kolekcji**, które spełniają określone warunki, i zwraca odpowiadające im wyniki statystyczne. Jest często używane do przetwarzania danych statystycznych związanych z raportami.

Implementacja tego węzła opiera się na funkcjach agregujących baz danych. Obecnie obsługuje on statystyki tylko dla pojedynczego pola w **kolekcji**. Wynik liczbowy statystyk zostanie zapisany w wyniku węzła do wykorzystania przez kolejne węzły.

## Instalacja

Wbudowana **wtyczka**, nie wymaga instalacji.

## Tworzenie węzła

W interfejsie konfiguracji **przepływu pracy** proszę kliknąć przycisk plusa („+”) w **przepływie pracy**, aby dodać węzeł „Zapytanie agregujące”:

![Create Aggregate Query Node](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Konfiguracja węzła

![Aggregate Query Node_Node Configuration](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Funkcja agregująca

Obsługuje 5 funkcji agregujących z SQL: `COUNT`, `SUM`, `AVG`, `MIN` i `MAX`. Proszę wybrać jedną z nich, aby wykonać zapytanie agregujące na danych.

### Typ celu

Cel zapytania agregującego można wybrać w dwóch trybach. Pierwszy to bezpośredni wybór docelowej **kolekcji** i jednego z jej pól. Drugi to wybór powiązanej **kolekcji** typu „jeden do wielu” i jej pola, poprzez istniejący obiekt danych w kontekście **przepływu pracy**, w celu wykonania zapytania agregującego.

### Unikalne wartości (Distinct)

Jest to `DISTINCT` w SQL. Pole do deduplikacji jest takie samo jak wybrane pole **kolekcji**. Obecnie nie jest obsługiwane wybieranie różnych pól dla tych dwóch opcji.

### Warunki filtrowania

Podobnie jak w przypadku warunków filtrowania w zwykłym zapytaniu do **kolekcji**, można używać zmiennych kontekstowych z **przepływu pracy**.

## Przykład

Cel agregacji „Dane **kolekcji**” jest stosunkowo łatwy do zrozumienia. Tutaj, na przykładzie „zliczania całkowitej liczby artykułów w kategorii po dodaniu nowego artykułu”, przedstawimy użycie celu agregacji „Powiązane dane **kolekcji**”.

Najpierw proszę utworzyć dwie **kolekcje**: „Artykuły” i „Kategorie”. **Kolekcja** „Artykuły” ma pole relacji „wiele do jednego” wskazujące na **kolekcję** „Kategorie”, a także utworzono odwrotne pole relacji „Kategorie” „jeden do wielu” „Artykuły”:

| Nazwa pola   | Typ                  |
| ------------ | -------------------- |
| Tytuł        | Tekst jednowierszowy |
| Kategoria    | Wiele do jednego (Kategorie) |

| Nazwa pola      | Typ                    |
| --------------- | ---------------------- |
| Nazwa kategorii | Tekst jednowierszowy   |
| Artykuły        | Jeden do wielu (Artykuły) |

Następnie proszę utworzyć **przepływ pracy** wyzwalany zdarzeniem **kolekcji**. Proszę wybrać opcję wyzwalania po dodaniu nowych danych do **kolekcji** „Artykuły”.

Następnie proszę dodać węzeł zapytania agregującego i skonfigurować go w następujący sposób:

![Aggregate Query Node_Example_Node Configuration](https://static-docs.nocobase.com/542272e638c6c0a567373d1b37ddda78.png)

W ten sposób, po wyzwoleniu **przepływu pracy**, węzeł zapytania agregującego zliczy liczbę wszystkich artykułów w kategorii nowo dodanego artykułu i zapisze ją jako wynik węzła.

:::info{title=Wskazówka}
Jeśli potrzebują Państwo użyć danych relacji z wyzwalacza zdarzeń **kolekcji**, należy skonfigurować odpowiednie pola w sekcji „Wstępne ładowanie powiązanych danych” w wyzwalaczu, w przeciwnym razie nie będzie można ich wybrać.
:::