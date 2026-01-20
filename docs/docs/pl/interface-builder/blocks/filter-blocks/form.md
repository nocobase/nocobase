:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Formularz filtrowania

## Wprowadzenie

Formularz filtrowania umożliwia użytkownikom filtrowanie danych poprzez wypełnianie pól formularza. Można go używać do filtrowania bloków tabel, bloków wykresów, bloków list i wielu innych.

## Jak używać

Zacznijmy od prostego przykładu, aby szybko zrozumieć, jak używać formularza filtrowania. Załóżmy, że mamy blok tabeli zawierający informacje o użytkownikach i chcemy filtrować te dane za pomocą formularza filtrowania, tak jak pokazano poniżej:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Kroki konfiguracji:

1. Włącz tryb edycji i dodaj na stronę blok „Formularz filtrowania” oraz blok „Tabela”.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Dodaj pole „Pseudonim” zarówno do bloku tabeli, jak i do bloku formularza filtrowania.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Teraz mogą Państwo zacząć korzystać z tej funkcji.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Zaawansowane użycie

Blok formularza filtrowania obsługuje bardziej zaawansowane konfiguracje. Poniżej przedstawiamy kilka typowych zastosowań.

### Łączenie wielu bloków

Pojedyncze pole formularza może jednocześnie filtrować dane z wielu bloków. Oto jak to zrobić:

1. Kliknij opcję konfiguracji „Connect fields” dla danego pola.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Dodaj bloki docelowe, które chcesz połączyć. W tym przykładzie wybieramy blok listy na stronie.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Wybierz jedno lub więcej pól z bloku listy, aby je połączyć. Tutaj wybieramy pole „Pseudonim”.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Kliknij przycisk zapisu, aby zakończyć konfigurację. Efekt wygląda następująco:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Łączenie bloków wykresów

Referencje: [Filtry strony i powiązania](../../../data-visualization/guide/filters-and-linkage.md)

### Pola niestandardowe

Oprócz wybierania pól z kolekcji, mogą Państwo również tworzyć pola formularza za pomocą „Pól niestandardowych”. Na przykład, można utworzyć rozwijane pole wyboru z własnymi opcjami. Oto jak to zrobić:

1. Kliknij opcję „Pola niestandardowe”, aby otworzyć panel konfiguracji.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Wypełnij tytuł pola, wybierz „Select” jako model pola i skonfiguruj opcje.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nowo dodane pola niestandardowe należy ręcznie połączyć z polami w blokach docelowych. Oto jak to zrobić:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfiguracja zakończona. Efekt wygląda następująco:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Obecnie obsługiwane modele pól to:

- `Input`: Jednowierszowe pole tekstowe
- `Number`: Pole do wprowadzania liczb
- `Date`: Selektor daty
- `Select`: Lista rozwijana (można skonfigurować wybór pojedynczy lub wielokrotny)
- `Radio group`: Przyciski radiowe (jednokrotnego wyboru)
- `Checkbox group`: Pola wyboru (wielokrotnego wyboru)

### Zwijanie

Dodanie przycisku zwijania pozwala na zwijanie i rozwijanie zawartości formularza filtrowania, co oszczędza miejsce na stronie.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Obsługiwane konfiguracje:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Liczba wierszy po zwinięciu**: Określa, ile wierszy pól formularza jest wyświetlanych w stanie zwiniętym.
- **Domyślnie zwinięty**: Po włączeniu formularz filtrowania jest domyślnie wyświetlany w stanie zwiniętym.