---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Pętla

## Wprowadzenie

Pętla jest odpowiednikiem struktur składniowych, takich jak `for`/`while`/`forEach` w językach programowania. Kiedy potrzebuje Pan/Pani powtórzyć pewne operacje określoną liczbę razy lub dla danej **kolekcji** danych (tablicy), może Pan/Pani użyć węzła pętli.

## Instalacja

To wbudowana **wtyczka**, która nie wymaga instalacji.

## Tworzenie węzła

W interfejsie konfiguracji **przepływu pracy** proszę kliknąć przycisk plusa („+”), aby dodać węzeł „Pętla”.

![Tworzenie węzła pętli](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Po utworzeniu węzła pętli zostanie wygenerowana wewnętrzna gałąź pętli. W tej gałęzi może Pan/Pani dodać dowolną liczbę węzłów. Węzły te mogą używać zmiennych z kontekstu **przepływu pracy**, a także zmiennych lokalnych z kontekstu pętli, na przykład obiektu danych przetwarzanego w każdej iteracji **kolekcji** pętli lub indeksu licznika pętli (indeksowanie zaczyna się od `0`). Zakres zmiennych lokalnych jest ograniczony do wnętrza pętli. W przypadku zagnieżdżonych pętli, może Pan/Pani używać zmiennych lokalnych dla każdej konkretnej pętli na danym poziomie.

## Konfiguracja węzła

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Obiekt pętli

Pętla różnie przetwarza różne typy danych obiektu pętli:

1.  **Tablica**: To najczęstszy przypadek. Zazwyczaj może Pan/Pani wybrać zmienną z kontekstu **przepływu pracy**, na przykład wiele wyników danych z węzła zapytania lub wstępnie załadowane dane relacji jeden-do-wielu. Jeśli wybrano tablicę, węzeł pętli będzie iterować po każdym elemencie w tablicy, a w każdej iteracji bieżący element zostanie przypisany do zmiennej lokalnej w kontekście pętli.

2.  **Liczba**: Kiedy wybrana zmienna jest liczbą, zostanie ona użyta jako liczba iteracji. Wartość liczby musi być dodatnią liczbą całkowitą; liczby ujemne nie spowodują wejścia do pętli, a część dziesiętna liczby zmiennoprzecinkowej zostanie zignorowana. Indeks licznika pętli w zmiennej lokalnej jest również wartością obiektu pętli. Ta wartość zaczyna się od **0**. Na przykład, jeśli obiekt pętli to liczba 5, obiekt i indeks w każdej iteracji będą kolejno: 0, 1, 2, 3, 4.

3.  **Ciąg znaków**: Kiedy wybrana zmienna jest ciągiem znaków, jego długość zostanie użyta jako liczba iteracji, przetwarzając każdy znak ciągu znaków według indeksu.

4.  **Inne**: Inne typy wartości (w tym typy obiektowe) są traktowane jako obiekt pętli jednokrotnego przetwarzania i pętla wykona się tylko raz. Zazwyczaj w takiej sytuacji użycie pętli nie jest konieczne.

Oprócz wyboru zmiennej, dla typów liczbowych i ciągów znaków można również bezpośrednio wprowadzić stałe. Na przykład, wpisanie `5` (typ liczbowy) spowoduje, że węzeł pętli wykona się 5 razy. Wpisanie `abc` (typ ciągu znaków) spowoduje, że węzeł pętli wykona się 3 razy, przetwarzając odpowiednio znaki `a`, `b` i `c`. W narzędziu do wyboru zmiennych proszę wybrać typ, którego chce Pan/Pani użyć dla stałej.

### Warunek pętli

Od wersji `v1.4.0-beta` dodano nowe opcje dotyczące warunków pętli. Może Pan/Pani włączyć warunki pętli w konfiguracji węzła.

**Warunek**

Podobnie jak w konfiguracji warunków w węźle warunkowym, może Pan/Pani łączyć konfiguracje i używać zmiennych z bieżącej pętli, takich jak obiekt pętli, indeks pętli itp.

**Moment sprawdzenia**

Podobnie jak w konstrukcjach `while` i `do/while` w językach programowania, może Pan/Pani wybrać, czy skonfigurowany warunek ma być obliczany przed każdą iteracją pętli, czy po niej. Obliczanie warunku po iteracji pozwala na wykonanie innych węzłów w ciele pętli przez jedną rundę, zanim warunek zostanie sprawdzony.

**Gdy warunek nie jest spełniony**

Podobnie jak instrukcje `break` i `continue` w językach programowania, może Pan/Pani wybrać wyjście z pętli lub kontynuowanie do następnej iteracji.

### Obsługa błędów w węzłach pętli

Od wersji `v1.4.0-beta`, gdy węzeł wewnątrz pętli nie wykona się pomyślnie (z powodu niespełnionych warunków, błędów itp.), może Pan/Pani skonfigurować dalszy przebieg **przepływu pracy**. Obsługiwane są trzy metody postępowania:

*   Wyjście z **przepływu pracy** (jak `throw` w programowaniu)
*   Wyjście z pętli i kontynuowanie **przepływu pracy** (jak `break` w programowaniu)
*   Kontynuowanie do następnego obiektu pętli (jak `continue` w programowaniu)

Domyślnie jest to „Wyjście z **przepływu pracy**”. Może Pan/Pani zmienić to ustawienie w zależności od potrzeb.

## Przykład

Na przykład, podczas składania zamówienia, należy sprawdzić stan magazynowy każdego produktu w zamówieniu. Jeśli stan magazynowy jest wystarczający, należy go zmniejszyć; w przeciwnym razie produkt w szczegółach zamówienia zostanie oznaczony jako nieprawidłowy.

1.  Proszę utworzyć trzy **kolekcje**: Produkty <-(1:m)-- Szczegóły zamówienia --(m:1)-> Zamówienia. Model **źródła danych** jest następujący:

    **Kolekcja Zamówienia**
    | Nazwa pola             | Typ pola                   |
    | ---------------------- | -------------------------- |
    | Szczegóły zamówienia   | Jeden-do-wielu (Szczegóły zamówienia) |
    | Całkowita cena zamówienia | Liczba                     |

    **Kolekcja Szczegóły zamówienia**
    | Nazwa pola | Typ pola               |
    | ---------- | ---------------------- |
    | Produkt    | Wiele-do-jednego (Produkt) |
    | Ilość      | Liczba                 |

    **Kolekcja Produkty**
    | Nazwa pola    | Typ pola          |
    | ------------- | ----------------- |
    | Nazwa produktu | Tekst jednowierszowy |
    | Cena          | Liczba            |
    | Stan magazynowy | Liczba całkowita  |

2.  Proszę utworzyć **przepływ pracy**. Dla wyzwalacza proszę wybrać „Zdarzenie **kolekcji**” i wybrać **kolekcję** „Zamówienia” do wyzwolenia „Po dodaniu rekordu”. Należy również skonfigurować wstępne ładowanie danych relacji **kolekcji** „Szczegóły zamówienia” oraz **kolekcji** „Produkty” w ramach tych szczegółów:

    ![Węzeł pętli_Przykład_Konfiguracja wyzwalacza](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Proszę utworzyć węzeł pętli i wybrać obiekt pętli jako „Dane wyzwalające / Szczegóły zamówienia”, co oznacza, że będzie on przetwarzał każdy rekord w **kolekcji** „Szczegóły zamówienia”:

    ![Węzeł pętli_Przykład_Konfiguracja węzła pętli](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Wewnątrz węzła pętli proszę utworzyć węzeł „Warunek”, aby sprawdzić, czy stan magazynowy produktu jest wystarczający:

    ![Węzeł pętli_Przykład_Konfiguracja węzła warunku](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Jeśli jest wystarczający, w gałęzi „Tak” proszę utworzyć węzeł „Obliczenia” i węzeł „Aktualizuj rekord”, aby zaktualizować odpowiedni rekord produktu o obliczony, zmniejszony stan magazynowy:

    ![Węzeł pętli_Przykład_Konfiguracja węzła obliczeń](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Węzeł pętli_Przykład_Konfiguracja węzła aktualizacji stanu magazynowego](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  W przeciwnym razie, w gałęzi „Nie” proszę utworzyć węzeł „Aktualizuj rekord”, aby zaktualizować status szczegółów zamówienia na „nieprawidłowy”:

    ![Węzeł pętli_Przykład_Konfiguracja węzła aktualizacji szczegółów zamówienia](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Ogólna struktura **przepływu pracy** przedstawiona jest na poniższym schemacie:

![Węzeł pętli_Przykład_Struktura przepływu pracy](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Po zakończeniu konfiguracji i aktywacji tego **przepływu pracy**, po utworzeniu nowego zamówienia system automatycznie sprawdzi stan magazynowy produktów w szczegółach zamówienia. Jeśli stan magazynowy jest wystarczający, zostanie on zmniejszony; w przeciwnym razie produkt w szczegółach zamówienia zostanie oznaczony jako nieprawidłowy (aby można było obliczyć prawidłową całkowitą cenę zamówienia).