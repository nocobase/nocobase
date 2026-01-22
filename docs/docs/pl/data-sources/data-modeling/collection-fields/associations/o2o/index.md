:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Jeden do jednego

W relacji między pracownikami a ich profilami osobistymi, każdy pracownik może mieć tylko jeden profil osobisty, a każdy profil osobisty może należeć tylko do jednego pracownika. W takiej sytuacji mówimy o relacji jeden do jednego.

Klucz obcy w relacji jeden do jednego może być umieszczony zarówno w **kolekcji** źródłowej, jak i docelowej. Jeśli chcemy wyrazić, że jeden element "ma" drugi (np. pracownik ma profil), klucz obcy lepiej umieścić w **kolekcji** docelowej. Natomiast jeśli relacja oznacza "przynależność" (np. profil należy do pracownika), klucz obcy będzie bardziej pasował do **kolekcji** źródłowej.

Na przykład, w opisanym powyżej przypadku, gdzie pracownik ma tylko jeden profil osobisty, a profil osobisty należy do pracownika, odpowiednie jest umieszczenie klucza obcego w **kolekcji** profili osobistych.

## Jeden do jednego (Ma jeden)

Wskazuje, że pracownik posiada profil osobisty.

Relacja ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Konfiguracja pola

![alt text](https://static-docs.nocobase.com/765a87e094b4fb50c9426a108f87105.png)

## Jeden do jednego (Należy do)

Wskazuje, że profil osobisty należy do konkretnego pracownika.

Relacja ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Konfiguracja pola

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Opis parametrów

### Kolekcja źródłowa

**Kolekcja** źródłowa, czyli **kolekcja**, w której znajduje się bieżące pole.

### Kolekcja docelowa

**Kolekcja** docelowa, czyli **kolekcja**, z którą nawiązywana jest relacja.

### Klucz obcy

Służy do ustanawiania relacji między dwiema **kolekcjami**. W relacji jeden do jednego, klucz obcy może być umieszczony zarówno w **kolekcji** źródłowej, jak i docelowej. Jeśli chcemy wyrazić, że jeden element "ma" drugi (np. pracownik ma profil), klucz obcy lepiej umieścić w **kolekcji** docelowej. Natomiast jeśli relacja oznacza "przynależność" (np. profil należy do pracownika), klucz obcy będzie bardziej pasował do **kolekcji** źródłowej.

### Klucz źródłowy <- Klucz obcy (Klucz obcy w kolekcji docelowej)

Pole, do którego odwołuje się ograniczenie klucza obcego, musi być unikalne. Gdy klucz obcy jest umieszczony w **kolekcji** docelowej, wskazuje to na relację "ma jeden".

### Klucz docelowy <- Klucz obcy (Klucz obcy w kolekcji źródłowej)

Pole, do którego odwołuje się ograniczenie klucza obcego, musi być unikalne. Gdy klucz obcy jest umieszczony w **kolekcji** źródłowej, wskazuje to na relację "należy do".

### ON DELETE

`ON DELETE` odnosi się do zasad postępowania z odniesieniami klucza obcego w powiązanej **kolekcji** potomnej, gdy usuwane są rekordy z **kolekcji** nadrzędnej. Jest to opcja definiowana podczas ustanawiania ograniczenia klucza obcego. Typowe opcje `ON DELETE` to:

- `CASCADE`: Gdy rekord w **kolekcji** nadrzędnej jest usuwany, automatycznie usuwa wszystkie powiązane rekordy w **kolekcji** potomnej.
- `SET NULL`: Gdy rekord w **kolekcji** nadrzędnej jest usuwany, ustawia wartość klucza obcego w powiązanej **kolekcji** potomnej na `NULL`.
- `RESTRICT`: Opcja domyślna, w której usunięcie rekordu **kolekcji** nadrzędnej jest odrzucane, jeśli istnieją powiązane rekordy w **kolekcji** potomnej.
- `NO ACTION`: Podobnie do `RESTRICT`, usunięcie rekordu **kolekcji** nadrzędnej jest odrzucane, jeśli istnieją powiązane rekordy w **kolekcji** potomnej.