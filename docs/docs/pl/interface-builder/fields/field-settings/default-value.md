:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wartość domyślna

## Wprowadzenie

Wartość domyślna to początkowa wartość pola w momencie tworzenia nowego rekordu. Mogą Państwo ustawić wartość domyślną dla pola podczas jego konfiguracji w kolekcji lub określić ją dla pola w bloku formularza dodawania. Może być ustawiona jako stała lub zmienna.

## Gdzie ustawić wartości domyślne

### Pola kolekcji

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Pola w formularzu dodawania

Większość pól w formularzu dodawania obsługuje ustawianie wartości domyślnej.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Dodawanie w podformularzu

Poddane, dodane za pośrednictwem pola podformularza w formularzu dodawania lub edycji, będą miały wartość domyślną.

Dodaj nowy w podformularzu
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Podczas edycji istniejących danych, puste pole nie zostanie uzupełnione wartością domyślną. Wartość domyślna zostanie użyta tylko dla nowo dodanych danych.

### Wartości domyślne dla pól relacji

Wartości domyślne są dostępne tylko dla relacji typu **wiele-do-jednego** i **wiele-do-wielu**, gdy używane są komponenty selektora (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Zmienne wartości domyślnych

### Dostępne zmienne

- Bieżący użytkownik;
- Bieżący rekord; dotyczy to tylko istniejących rekordów;
- Bieżący formularz; idealnie, wyświetla tylko pola w formularzu;
- Bieżący obiekt; pojęcie w podformularzach (obiekt danych dla każdego wiersza w podformularzu);
- Parametry URL
Więcej informacji na temat zmiennych znajdą Państwo w sekcji [Zmienne](/interface-builder/variables).

### Zmienne wartości domyślnych pól

Dzielą się na dwie kategorie: pola nierelacyjne i pola relacyjne.

#### Zmienne wartości domyślnych pól relacyjnych

- Obiekt zmiennej musi być rekordem kolekcji;
- Musi to być kolekcja w łańcuchu dziedziczenia, która może być bieżącą kolekcją lub kolekcją nadrzędną/podrzędną;
- Zmienna „Wybrane rekordy tabeli” jest dostępna tylko dla pól relacji „wiele-do-wielu” i „jeden-do-wielu/wiele-do-jednego”;
- **W scenariuszach wielopoziomowych należy spłaszczyć i usunąć duplikaty.**

```typescript
// Table selected records:
[{id:1},{id:2},{id:3},{id:4}]

// Table selected records/to-one:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Flatten and deduplicate
[{id: 2}, {id: 3}]

// Table selected records/to-many:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Flatten
[{id:1},{id:2},{id:3},{id:4}]
```

#### Zmienne wartości domyślnych pól nierelacyjnych

- Typy muszą być spójne lub kompatybilne, np. ciągi znaków są kompatybilne z liczbami, a także ze wszystkimi obiektami, które udostępniają metodę `toString`;
- Pole JSON jest specjalne i może przechowywać dowolny typ danych;

### Poziom pola (pola opcjonalne)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Zmienne wartości domyślnych pól nierelacyjnych
  - Przy wyborze pól wielopoziomowych, jest to ograniczone do relacji typu 'do jednego' i nie obsługuje relacji typu 'do wielu';
  - Pole JSON jest specjalne i może być nieograniczone;

- Zmienne wartości domyślnych pól relacyjnych
  - `hasOne`, obsługuje tylko relacje typu 'do jednego';
  - `hasMany`, obsługuje zarówno relacje typu 'do jednego' (konwersja wewnętrzna), jak i 'do wielu';
  - `belongsToMany`, obsługuje zarówno relacje typu 'do jednego' (konwersja wewnętrzna), jak i 'do wielu';
  - `belongsTo`, zazwyczaj dla relacji typu 'do jednego', ale gdy relacja nadrzędna to `hasMany`, obsługuje również relacje typu 'do wielu' (ponieważ `hasMany`/`belongsTo` to w zasadzie relacja wiele-do-wielu);

## Przypadki specjalne

### „Wiele-do-wielu” jest równoważne kombinacji „jeden-do-wielu/wiele-do-jednego”

Model

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Dlaczego relacje jeden-do-jednego i jeden-do-wielu nie mają wartości domyślnych?

Na przykład, w relacji A.B, jeśli `b1` jest powiązane z `a1`, nie może być powiązane z `a2`. Jeśli `b1` zostanie powiązane z `a2`, jego powiązanie z `a1` zostanie usunięte. W tym przypadku dane nie są współdzielone, podczas gdy wartość domyślna jest mechanizmem współdzielenia (wszystkie mogą być powiązane). Dlatego relacje jeden-do-jednego i jeden-do-wielu nie mogą mieć wartości domyślnych.

### Dlaczego podformularze lub podtabele relacji wiele-do-jednego i wiele-do-wielu nie mogą mieć wartości domyślnych?

Ponieważ podformularze i podtabele koncentrują się na bezpośredniej edycji danych relacyjnych (w tym dodawaniu i usuwaniu), podczas gdy wartość domyślna relacji jest mechanizmem współdzielenia, gdzie wszystkie mogą być powiązane, ale danych relacyjnych nie można modyfikować. Dlatego w tym scenariuszu nie jest odpowiednie udostępnianie wartości domyślnych.

Ponadto, podformularze lub podtabele posiadają pola podrzędne, i byłoby niejasne, czy wartość domyślna dla podformularza lub podtabeli dotyczy wiersza, czy kolumny.

Biorąc pod uwagę wszystkie czynniki, bardziej odpowiednie jest, aby podformularze lub podtabele nie miały bezpośrednio ustawionych wartości domyślnych, niezależnie od typu relacji.