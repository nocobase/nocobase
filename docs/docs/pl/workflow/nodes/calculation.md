:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Obliczenia

Węzeł Obliczenia może ewaluować wyrażenie, a wynik obliczeń jest zapisywany w wyniku odpowiedniego węzła, aby mógł być użyty przez kolejne węzły. Jest to narzędzie służące do obliczania, przetwarzania i transformowania danych. W pewnym stopniu może zastąpić funkcjonalność wywoływania funkcji na wartości i przypisywania jej do zmiennej, typową dla języków programowania.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Obliczenia”:

![Węzeł Obliczenia_Dodawanie](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Konfiguracja węzła

![Węzeł Obliczenia_Konfiguracja](https://static-docs.nocobase.com/6a155de3c883d8cd1881b2d9c33874.png)

### Silnik obliczeniowy

Silnik obliczeniowy określa składnię obsługiwaną przez wyrażenie. Obecnie obsługiwane silniki obliczeniowe to [Math.js](https://mathjs.org/) i [Formula.js](https://formulajs.info/). Każdy z tych silników ma wbudowaną dużą liczbę popularnych funkcji i metod do operacji na danych. Szczegółowe informacje na temat ich użycia znajdą Państwo w oficjalnej dokumentacji.

:::info{title=Wskazówka}
Należy zauważyć, że różne silniki różnią się w dostępie do indeksów tablic. Indeksy w Math.js zaczynają się od `1`, natomiast w Formula.js od `0`.
:::

Ponadto, jeśli potrzebują Państwo prostego łączenia ciągów znaków, mogą Państwo bezpośrednio użyć „Szablonu ciągu znaków”. Ten silnik zastąpi zmienne w wyrażeniu ich odpowiednimi wartościami, a następnie zwróci połączony ciąg znaków.

### Wyrażenie

Wyrażenie to tekstowa reprezentacja formuły obliczeniowej, która może składać się ze zmiennych, stałych, operatorów i obsługiwanych funkcji. Mogą Państwo używać zmiennych z kontekstu przepływu, takich jak wynik poprzedzającego węzła Obliczenia lub zmienne lokalne pętli.

Jeśli wprowadzone wyrażenie nie jest zgodne ze składnią, w konfiguracji węzła zostanie wyświetlony błąd. Jeśli podczas wykonywania zmienna nie istnieje lub typ nie pasuje, lub jeśli użyto nieistniejącej funkcji, węzeł Obliczenia zostanie przedwcześnie zakończony ze statusem błędu.

## Przykład

### Obliczanie całkowitej ceny zamówienia

Zazwyczaj zamówienie może zawierać wiele pozycji, a każda pozycja ma inną cenę i ilość. Całkowita cena zamówienia wymaga obliczenia sumy iloczynów ceny i ilości wszystkich pozycji. Po załadowaniu listy szczegółów zamówienia (zestaw danych z relacją jeden do wielu) mogą Państwo użyć węzła Obliczenia do obliczenia całkowitej ceny zamówienia:

![Węzeł Obliczenia_Przykład_Konfiguracja](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Funkcja `SUMPRODUCT` z Formula.js może obliczyć sumę iloczynów dla każdego wiersza dwóch tablic o tej samej długości, co daje całkowitą cenę zamówienia.