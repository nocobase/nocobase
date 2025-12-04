:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Jeden do wielu

Relacja między klasą a jej uczniami to przykład relacji jeden do wielu: jedna klasa może mieć wielu uczniów, ale każdy uczeń należy tylko do jednej klasy.

Diagram ER:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Konfiguracja pola:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Opis parametrów

### Kolekcja źródłowa

Kolekcja, w której znajduje się bieżące pole.

### Kolekcja docelowa

Kolekcja, z którą ma zostać nawiązana relacja.

### Klucz źródłowy

Pole w kolekcji źródłowej, do którego odwołuje się klucz obcy. Musi być unikalne.

### Klucz obcy

Pole w kolekcji docelowej, służące do ustanowienia relacji między dwiema kolekcjami.

### Klucz docelowy

Pole w kolekcji docelowej, używane do wyświetlania każdego rekordu w bloku relacji, zazwyczaj jest to pole unikalne.

### ON DELETE

**ON DELETE** odnosi się do zasad stosowanych wobec odwołań do kluczy obcych w powiązanych kolekcjach podrzędnych, gdy rekordy w kolekcji nadrzędnej są usuwane. Jest to opcja używana podczas definiowania ograniczenia klucza obcego. Typowe opcje ON DELETE obejmują:

- **CASCADE**: Gdy rekord w kolekcji nadrzędnej zostanie usunięty, wszystkie powiązane rekordy w kolekcji podrzędnej zostaną automatycznie usunięte.
- **SET NULL**: Gdy rekord w kolekcji nadrzędnej zostanie usunięty, wartości kluczy obcych w powiązanych rekordach kolekcji podrzędnej zostaną ustawione na NULL.
- **RESTRICT**: Opcja domyślna. Zapobiega usunięciu rekordu z kolekcji nadrzędnej, jeśli istnieją powiązane rekordy w kolekcji podrzędnej.
- **NO ACTION**: Podobnie jak RESTRICT, zapobiega usunięciu rekordu z kolekcji nadrzędnej, jeśli istnieją powiązane rekordy w kolekcji podrzędnej.