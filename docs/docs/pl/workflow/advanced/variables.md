:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Używanie zmiennych

## Kluczowe koncepcje

Podobnie jak zmienne w językach programowania, **zmienne** w przepływie pracy są kluczowym narzędziem do łączenia i organizowania procesów.

Gdy każdy węzeł jest wykonywany po uruchomieniu przepływu pracy, niektóre elementy konfiguracji mogą używać zmiennych. Źródłem tych zmiennych są dane z węzłów poprzedzających bieżący węzeł, w tym następujące kategorie:

-   Dane kontekstu wyzwalacza: W przypadkach takich jak wyzwalacze akcji lub wyzwalacze kolekcji, obiekt danych pojedynczego wiersza może być używany jako zmienna przez wszystkie węzły. Szczegóły różnią się w zależności od implementacji każdego wyzwalacza.
-   Dane z węzłów poprzedzających: Gdy proces osiągnie dowolny węzeł, są to dane wynikowe z wcześniej ukończonych węzłów.
-   Zmienne lokalne: Gdy węzeł znajduje się w specjalnych strukturach rozgałęzień, może używać zmiennych lokalnych specyficznych dla danej gałęzi. Na przykład, w strukturze pętli można użyć obiektu danych z każdej iteracji.
-   Zmienne systemowe: Niektóre wbudowane parametry systemowe, takie jak bieżący czas.

Funkcji zmiennych używaliśmy już wielokrotnie w sekcji [Szybki start](../getting-started.md). Na przykład, w węźle obliczeniowym możemy użyć zmiennych do odwoływania się do danych kontekstu wyzwalacza w celu wykonania obliczeń:

![Węzeł obliczeniowy używający funkcji i zmiennych](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

W węźle aktualizacji proszę użyć danych kontekstu wyzwalacza jako zmiennej dla warunku filtrowania, a wynik węzła obliczeniowego jako zmiennej dla wartości pola do zaktualizowania:

![Zmienne węzła aktualizacji danych](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Struktura danych

Wewnętrznie zmienna jest strukturą JSON, a Pan/Pani może zazwyczaj używać konkretnej części danych, odwołując się do niej za pomocą ścieżki JSON. Ponieważ wiele zmiennych opiera się na strukturze kolekcji NocoBase, dane powiązane będą hierarchicznie ustrukturyzowane jako właściwości obiektów, tworząc strukturę przypominającą drzewo. Na przykład, możemy wybrać wartość konkretnego pola z danych powiązanych z zapytanymi danymi. Dodatkowo, gdy dane powiązane mają strukturę z wieloma powiązaniami, zmienna może być tablicą.

Podczas wybierania zmiennej, najczęściej będzie Pan/Pani musiał(a) wybrać atrybut wartości na ostatnim poziomie, który zazwyczaj jest prostym typem danych, takim jak liczba czy ciąg znaków. Jednakże, gdy w hierarchii zmiennych znajduje się tablica, atrybut ostatniego poziomu również zostanie zmapowany na tablicę. Dane tablicowe mogą być poprawnie przetwarzane tylko wtedy, gdy odpowiadający im węzeł obsługuje tablice. Na przykład, w węźle obliczeniowym niektóre silniki obliczeniowe posiadają funkcje specjalnie do obsługi tablic, a w węźle pętli obiekt pętli również może być bezpośrednio tablicą.

Na przykład, gdy węzeł zapytania pobiera wiele rekordów danych, wynik węzła będzie tablicą zawierającą wiele wierszy jednorodnych danych:

```json
[
  {
    "id": 1,
    "title": "标题1"
  },
  {
    "id": 2,
    "title": "标题2"
  }
]
```

Jednakże, gdy używa się jej jako zmiennej w kolejnych węzłach, jeśli wybrana zmienna ma formę `Dane węzła/Węzeł zapytania/Tytuł`, otrzyma Pan/Pani tablicę zmapowaną na odpowiadające jej wartości pól:

```json
["标题1", "标题2"]
```

Jeśli jest to tablica wielowymiarowa (np. pole relacji wiele do wielu), otrzyma Pan/Pani tablicę jednowymiarową z spłaszczonym odpowiadającym jej polem.

## Wbudowane zmienne systemowe

### Czas systemowy

Pobiera czas systemowy w momencie wykonania węzła. Strefa czasowa tego czasu jest strefą ustawioną na serwerze.

### Parametry zakresu dat

Mogą być używane podczas konfigurowania warunków filtrowania pól daty w węzłach zapytania, aktualizacji i usuwania. Obsługiwane są tylko w przypadku porównań typu „jest równe”. Zarówno początkowy, jak i końcowy punkt czasowy zakresu dat są oparte na strefie czasowej ustawionej na serwerze.

![Parametry zakresu dat](https://static-docs.nocobase.com/20240817175354.png)