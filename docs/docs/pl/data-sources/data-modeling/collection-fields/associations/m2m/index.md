:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wiele do wielu

W systemie zapisów na kursy mamy dwie encje: studentów i kursy. Jeden student może zapisać się na wiele kursów, a jeden kurs może mieć wielu zapisanych studentów, co tworzy relację wiele do wielu. W relacyjnej bazie danych, aby przedstawić relację wiele do wielu między studentami a kursami, zazwyczaj używa się pośredniej kolekcji, na przykład kolekcji zapisów. Ta kolekcja może rejestrować, które kursy wybrał każdy student i którzy studenci zapisali się na każdy kurs. Takie podejście skutecznie reprezentuje relację wiele do wielu między studentami a kursami.

Diagram ER:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Konfiguracja pól:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Opis parametrów

### Source collection

**Kolekcja źródłowa**: Kolekcja, w której znajduje się bieżące pole.

### Target collection

**Kolekcja docelowa**: Kolekcja, z którą ma być nawiązana relacja.

### Through collection

**Kolekcja pośrednicząca**: Używana, gdy między dwiema encjami istnieje relacja wiele do wielu. Kolekcja pośrednicząca posiada dwa klucze obce, które służą do utrzymywania powiązania między tymi encjami.

### Source key

**Klucz źródłowy**: Pole w kolekcji źródłowej, do którego odwołuje się klucz obcy. Musi być unikalne.

### Foreign key 1

**Klucz obcy 1**: Pole w kolekcji pośredniczącej, które ustanawia powiązanie z kolekcją źródłową.

### Foreign key 2

**Klucz obcy 2**: Pole w kolekcji pośredniczącej, które ustanawia powiązanie z kolekcją docelową.

### Target key

**Klucz docelowy**: Pole w kolekcji docelowej, do którego odwołuje się klucz obcy. Musi być unikalne.

### ON DELETE

**ON DELETE**: Odnosi się do zasad stosowanych wobec odwołań kluczy obcych w powiązanych kolekcjach podrzędnych, gdy rekordy w kolekcji nadrzędnej są usuwane. Jest to opcja używana podczas definiowania ograniczenia klucza obcego. Typowe opcje ON DELETE to:

- **CASCADE**: Gdy rekord w kolekcji nadrzędnej zostanie usunięty, wszystkie powiązane rekordy w kolekcji podrzędnej zostaną automatycznie usunięte.
- **SET NULL**: Gdy rekord w kolekcji nadrzędnej zostanie usunięty, wartości kluczy obcych w powiązanych rekordach kolekcji podrzędnej zostaną ustawione na NULL.
- **RESTRICT**: Opcja domyślna. Zapobiega usunięciu rekordu z kolekcji nadrzędnej, jeśli istnieją powiązane rekordy w kolekcji podrzędnej.
- **NO ACTION**: Podobnie jak RESTRICT, zapobiega usunięciu rekordu z kolekcji nadrzędnej, jeśli istnieją powiązane rekordy w kolekcji podrzędnej.