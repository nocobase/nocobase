:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozwijana lista wyboru

## Wprowadzenie

Rozwijana lista wyboru umożliwia powiązanie danych poprzez wybranie ich z istniejących rekordów w docelowej kolekcji, lub poprzez dodanie nowych danych do kolekcji, a następnie ich powiązanie. Opcje na liście rozwijanej obsługują wyszukiwanie rozmyte.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Konfiguracja pola

### Ustawianie zakresu danych

Kontroluje zakres danych dostępnych na liście rozwijanej.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Więcej informacji znajdą Państwo w sekcji [Ustawianie zakresu danych](/interface-builder/fields/field-settings/data-scope).

### Ustawianie reguł sortowania

Kontroluje sposób sortowania danych w rozwijanej liście wyboru.

Przykład: Sortowanie według daty usługi w kolejności malejącej.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Zezwalaj na dodawanie/powiązywanie wielu rekordów

Ogranicza relację typu „wiele” (to-many) do możliwości powiązania tylko jednego rekordu.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Pole tytułowe

Pole tytułowe to pole etykiety wyświetlane jako opcja na liście.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Obsługuje szybkie wyszukiwanie na podstawie pola tytułowego.

Więcej informacji znajdą Państwo w sekcji [Pole tytułowe](/interface-builder/fields/field-settings/title-field).

### Szybkie tworzenie: Najpierw dodaj, potem wybierz

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Dodawanie przez listę rozwijaną

Po utworzeniu nowego rekordu w docelowej kolekcji system automatycznie go wybiera i powiązuje po przesłaniu formularza.

W przykładzie poniżej kolekcja „Zamówienia” posiada pole relacji „wiele do jednego” o nazwie „Account”.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Dodawanie przez okno modalne

Dodawanie przez okno modalne jest odpowiednie dla bardziej złożonych scenariuszy wprowadzania danych i umożliwia skonfigurowanie niestandardowego formularza do tworzenia nowych rekordów.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Komponent pola](/interface-builder/fields/association-field)