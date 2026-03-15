:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/blocks/filter-blocks/form).
:::

# Formularz filtrowania

## Wprowadzenie

Formularz filtrowania umożliwia użytkownikom filtrowanie danych poprzez wypełnianie pól formularza. Może być używany do filtrowania bloków tabeli, bloków wykresu, bloków listy itp.

## Jak używać

Pozwólmy sobie najpierw szybko zapoznać się z metodą użycia formularza filtrowania na prostym przykładzie. Załóżmy, że mamy blok tabeli zawierający informacje o użytkownikach i chcemy mieć możliwość filtrowania danych za pomocą formularza filtrowania. Tak jak poniżej:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Kroki konfiguracji są następujące:

1. Włączyć tryb konfiguracji, dodać do strony blok "Formularz filtrowania" i blok "Tabela".
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Dodać pole „Pseudonim” w bloku tabeli i bloku formularza filtrowania.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Teraz mogą Państwo zacząć go używać.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Zaawansowane użycie

Blok formularza filtrowania obsługuje więcej zaawansowanych konfiguracji, poniżej przedstawiono kilka typowych zastosowań.

### Łączenie wielu bloków

Pojedyncze pole formularza może jednocześnie filtrować dane w wielu blokach. Konkretne kroki są następujące:

1. Kliknąć opcję konfiguracji „Connect fields” pola.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Dodać bloki docelowe, które mają zostać powiązane, tutaj wybieramy blok listy na stronie.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Wybrać jedno lub więcej pól w bloku listy do powiązania. Tutaj wybieramy pole „Pseudonim”.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Kliknąć przycisk zapisz, aby zakończyć konfigurację, efekt jest pokazany poniżej:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Łączenie bloków wykresów

Referencja: [Filtry strony i powiązania](../../../data-visualization/guide/filters-and-linkage.md)

### Pola niestandardowe

Oprócz wybierania pól z kolekcji, można również tworzyć pola formularza poprzez „Pola niestandardowe”. Na przykład można utworzyć pole wyboru z listy rozwijanej i dostosować opcje. Konkretne kroki są następujące:

1. Kliknąć opcję „Pola niestandardowe”, aby otworzyć interfejs konfiguracji.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Wypełnić tytuł pola, wybrać „Wybór” w „Typie pola” i skonfigurować opcje.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nowo dodane pola niestandardowe muszą zostać ręcznie powiązane z polami bloków docelowych, metoda działania jest następująca:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfiguracja zakończona, efekt jest pokazany poniżej:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Obecnie obsługiwane typy pól to:

- Pole tekstowe
- Liczba
- Data
- Wybór
- Przycisk opcji
- Pole wyboru
- Powiązany rekord

#### Powiązany rekord (Niestandardowe pole relacji)

„Powiązany rekord” nadaje się do scenariuszy „filtrowania według rekordów powiązanej tabeli”. Na przykład na liście zamówień filtrowanie zamówień według „Klienta” lub na liście zadań filtrowanie zadań według „Osoby odpowiedzialnej”.

Opis opcji konfiguracji:

- **Docelowa kolekcja**: Określa, z której kolekcji mają zostać załadowane wybieralne rekordy.
- **Pole tytułu**: Tekst wyświetlany w opcjach rozwijanych i wybranych tagach (np. nazwa, tytuł).
- **Pole wartości**: Wartość przesyłana podczas faktycznego filtrowania, zazwyczaj wybiera się pole klucza głównego (np. `id`).
- **Zezwalaj na wielokrotny wybór**: Po włączeniu można wybrać wiele rekordów naraz.
- **Operator**: Definiuje, w jaki sposób dopasowywane są warunki filtrowania (patrz „Operator” poniżej).

Zalecana konfiguracja:

1. `Pole tytułu` wybrać pole o wysokiej czytelności (np. „Nazwa”), aby uniknąć wpływu czystych identyfikatorów ID na użyteczność.
2. `Pole wartości` priorytetowo traktować pole klucza głównego, aby zapewnić stabilne i unikalne filtrowanie.
3. W scenariuszach pojedynczego wyboru zazwyczaj wyłącza się `Zezwalaj na wielokrotny wybór`, a w scenariuszach wielokrotnego wyboru włącza się `Zezwalaj na wielokrotny wybór` i używa odpowiedniego `Operatora`.

#### Operator

`Operator` służy do definiowania relacji dopasowania między „wartością pola formularza filtrowania” a „wartością pola bloku docelowego”.

### Zwijanie

Dodanie przycisku zwijania pozwala na zwijanie i rozwijanie zawartości formularza filtrowania, co oszczędza miejsce na stronie.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Obsługuje następujące konfiguracje:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Liczba wierszy wyświetlanych po zwinięciu**: Ustawia liczbę wierszy pól formularza wyświetlanych w stanie zwiniętym.
- **Domyślnie zwinięty**: Po włączeniu formularz filtrowania jest domyślnie wyświetlany w stanie zwiniętym.