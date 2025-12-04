:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wiele do jednego

W bazie danych biblioteki istnieją dwie encje: książki i autorzy. Jeden autor może napisać wiele książek, ale każda książka zazwyczaj ma tylko jednego autora. W takiej sytuacji relacja między autorami a książkami to relacja wiele do jednego. Wiele książek może być powiązanych z tym samym autorem, ale każda książka może mieć tylko jednego autora.

Diagram ER:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Konfiguracja pola:

![alt text](https://static-docs.nocobase.com/3b4484ebb84f82f832f3dbf752bd84c9.png)

## Opis parametrów

### Source collection

Kolekcja źródłowa, czyli kolekcja, w której znajduje się bieżące pole.

### Target collection

Kolekcja docelowa, czyli kolekcja, z którą ma zostać nawiązane powiązanie.

### Foreign key

Pole w kolekcji źródłowej, które służy do ustanowienia powiązania między dwiema kolekcjami.

### Target key

Pole w kolekcji docelowej, do którego odwołuje się klucz obcy. Musi być unikalne.

### ON DELETE

ON DELETE odnosi się do zasad stosowanych wobec odwołań kluczy obcych w powiązanych kolekcjach potomnych, gdy rekordy w kolekcji nadrzędnej są usuwane. Jest to opcja używana podczas definiowania ograniczenia klucza obcego. Typowe opcje ON DELETE to:

- **CASCADE**: Gdy rekord w kolekcji nadrzędnej zostanie usunięty, wszystkie powiązane rekordy w kolekcji potomnej zostaną automatycznie usunięte.
- **SET NULL**: Gdy rekord w kolekcji nadrzędnej zostanie usunięty, wartości kluczy obcych w powiązanych rekordach kolekcji potomnej zostaną ustawione na NULL.
- **RESTRICT**: Opcja domyślna. Zapobiega usunięciu rekordu w kolekcji nadrzędnej, jeśli istnieją powiązane rekordy w kolekcji potomnej.
- **NO ACTION**: Podobnie jak RESTRICT, zapobiega usunięciu rekordu w kolekcji nadrzędnej, jeśli istnieją powiązane rekordy w kolekcji potomnej.