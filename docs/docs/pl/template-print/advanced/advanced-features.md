:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Funkcje zaawansowane

### Numeracja stron

#### 1. Automatyczna aktualizacja numerów stron

##### Składnia
Wystarczy wstawić numerację stron w oprogramowaniu Office.

##### Przykład
W programie Microsoft Word:
- Proszę użyć funkcji „Wstawianie → Numer strony”.  
W programie LibreOffice:
- Proszę użyć funkcji „Wstaw → Pola → Numer strony”.

##### Rezultat
W wygenerowanym raporcie numery stron będą aktualizować się automatycznie na każdej stronie.

#### 2. Generowanie spisu treści

##### Składnia
Wystarczy wstawić spis treści w oprogramowaniu Office.

##### Przykład
W programie Microsoft Word:
- Proszę użyć funkcji „Wstawianie → Spis treści i indeksy → Spis treści”.  
W programie LibreOffice:
- Proszę użyć funkcji „Wstaw → Spisy treści i indeksy → Spis treści, indeks lub bibliografia”.

##### Rezultat
Spis treści raportu będzie aktualizowany automatycznie w oparciu o zawartość dokumentu.

#### 3. Powtarzające się nagłówki tabel

##### Składnia
Wystarczy ustawić tę opcję w oprogramowaniu Office.

##### Przykład
W programie Microsoft Word:
- Proszę kliknąć prawym przyciskiem myszy na nagłówek tabeli → Właściwości tabeli → Zaznaczyć „Powtórz jako wiersz nagłówka na każdej stronie”.  
W programie LibreOffice:
- Proszę kliknąć prawym przyciskiem myszy na nagłówek tabeli → Właściwości tabeli → Zakładka Przepływ tekstu → Zaznaczyć „Powtórz nagłówek”.

##### Rezultat
Gdy tabela rozciąga się na wiele stron, nagłówek będzie automatycznie powtarzany na górze każdej strony.

### Internacjonalizacja (i18n)

#### 1. Tłumaczenie tekstu statycznego

##### Składnia
Proszę użyć znacznika `{t(tekst)}` do internacjonalizacji tekstu statycznego:
```
{t(meeting)}
```

##### Przykład
W szablonie:
```
{t(meeting)} {t(apples)}
```
Odpowiednie tłumaczenia są dostarczane w danych JSON lub zewnętrznym słowniku lokalizacyjnym (np. dla „fr-fr”), na przykład „meeting” → „rendez-vous” i „apples” → „Pommes”.

##### Rezultat
Podczas generowania raportu tekst zostanie zastąpiony odpowiednim tłumaczeniem, zgodnie z językiem docelowym.

#### 2. Tłumaczenie tekstu dynamicznego

##### Składnia
Dla zawartości danych można użyć formatowania `:t`, na przykład:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Przykład
W szablonie:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Dane JSON i słownik lokalizacyjny dostarczają odpowiednie tłumaczenia.

##### Rezultat
W zależności od warunku, wynikiem będzie „lundi” lub „mardi” (na przykładzie języka docelowego).

### Mapowanie klucz-wartość

#### 1. Konwersja wyliczeń (:convEnum)

##### Składnia
```
{data:convEnum(enumName)}
```
Na przykład:
```
0:convEnum('ORDER_STATUS')
```

##### Przykład
W przykładzie opcji API dostarczono następujące dane:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
W szablonie:
```
0:convEnum('ORDER_STATUS')
```

##### Rezultat
Wynikiem jest „pending”; jeśli indeks przekracza zakres wyliczenia, zostanie wyświetlona oryginalna wartość.

### Obrazy dynamiczne
:::info
Obecnie obsługiwane są pliki typu XLSX i DOCX.
:::
Mogą Państwo wstawiać „obrazy dynamiczne” do szablonów dokumentów. Oznacza to, że obrazy-zastępniki w szablonie zostaną automatycznie zastąpione rzeczywistymi obrazami podczas renderowania, w oparciu o dane. Ten proces jest bardzo prosty i wymaga jedynie:

1. Wstawienia tymczasowego obrazu jako symbolu zastępczego.
2. Edycji „Tekstu alternatywnego” tego obrazu w celu ustawienia etykiety pola.
3. Wyrenderowania dokumentu, a system automatycznie zastąpi obraz-zastępnik rzeczywistym obrazem.

Poniżej przedstawimy metody działania dla plików DOCX i XLSX, posługując się konkretnymi przykładami.

#### Wstawianie obrazów dynamicznych do plików DOCX
##### Zastępowanie pojedynczego obrazu

1. Proszę otworzyć szablon DOCX i wstawić tymczasowy obraz (może to być dowolny obraz-zastępnik, na przykład [jednolity niebieski obraz](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Instrukcje dotyczące formatu obrazu**

- Obecnie obrazy-zastępniki obsługują tylko format PNG. Zalecamy użycie dostarczonego przez nas przykładowego [jednolitego niebieskiego obrazu](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Docelowe obrazy renderowane obsługują tylko formaty PNG, JPG, JPEG. Inne typy obrazów mogą nie zostać poprawnie wyrenderowane.

**Instrukcje dotyczące rozmiaru obrazu**

Zarówno w przypadku DOCX, jak i XLSX, ostateczny rozmiar renderowanego obrazu będzie zgodny z wymiarami tymczasowego obrazu w szablonie. Oznacza to, że rzeczywisty obraz zastępczy zostanie automatycznie przeskalowany do rozmiaru wstawionego przez Państwa obrazu-zastępczego. Jeśli chcą Państwo, aby renderowany obraz miał rozmiar 150×150, proszę użyć tymczasowego obrazu w szablonie i dostosować go do tych wymiarów.
:::

2. Proszę kliknąć prawym przyciskiem myszy na obraz, edytować jego „Tekst alternatywny” (Alt Text) i wpisać etykietę pola obrazu, którą chcą Państwo wstawić, na przykład `{d.imageUrl}`:
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Proszę użyć następujących przykładowych danych do renderowania:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
}
```

4. W wyrenderowanym dokumencie tymczasowy obraz zostanie zastąpiony rzeczywistym obrazem:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Zastępowanie wielu obrazów w pętli

Jeśli chcą Państwo wstawić grupę obrazów do szablonu, na przykład listę produktów, można to również zrealizować za pomocą pętli. Poniżej przedstawiono konkretne kroki:
1. Proszę założyć, że Państwa dane wyglądają następująco:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg"
    }
  ]
}
```

2. Proszę ustawić obszar pętli w szablonie DOCX i wstawić tymczasowe obrazy w każdym elemencie pętli, ustawiając tekst alternatywny na `{d.products[i].imageUrl}`, jak pokazano poniżej:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Po wyrenderowaniu wszystkie tymczasowe obrazy zostaną zastąpione odpowiednimi obrazami z danych:
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Wstawianie obrazów dynamicznych do plików XLSX

Metoda działania w szablonach Excela (XLSX) jest zasadniczo taka sama, proszę tylko zwrócić uwagę na następujące kwestie:

1. Po wstawieniu obrazu proszę upewnić się, że wybrali Państwo opcję „obraz w komórce”, a nie obraz unoszący się nad komórką.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Po wybraniu komórki proszę kliknąć, aby wyświetlić „Tekst alternatywny” i wpisać etykietę pola, na przykład `{d.imageUrl}`.

### Kody kreskowe
:::info
Obecnie obsługiwane są pliki typu XLSX i DOCX.
:::

#### Generowanie kodów kreskowych (np. kodów QR)

Generowanie kodów kreskowych działa tak samo jak w przypadku obrazów dynamicznych i wymaga tylko trzech kroków:

1. Proszę wstawić tymczasowy obraz do szablonu, aby oznaczyć pozycję kodu kreskowego.

2. Proszę edytować „Tekst alternatywny” obrazu i wpisać etykietę pola formatu kodu kreskowego, na przykład `{d.code:barcode(qrcode)}`, gdzie `qrcode` to typ kodu kreskowego (szczegóły w poniższej liście obsługiwanych typów).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Po wyrenderowaniu obraz-zastępnik zostanie automatycznie zastąpiony odpowiednim obrazem kodu kreskowego:
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Obsługiwane typy kodów kreskowych

| Nazwa kodu kreskowego | Typ   |
| --------------------- | ----- |
| Kod QR                | qrcode |