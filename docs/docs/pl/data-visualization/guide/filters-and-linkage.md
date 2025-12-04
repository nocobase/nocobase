:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Filtry na stronie i ich powiązania

Blok filtrujący (Filter Block) służy do jednolitego wprowadzania warunków filtrowania na poziomie strony i łączenia ich z zapytaniami wykresów. Pozwala to na spójne filtrowanie i powiązania wielu wykresów.

## Przegląd funkcji
- Dodanie „bloku filtrującego” do strony zapewnia ujednolicony punkt wejścia dla filtrów dla wszystkich wykresów na bieżącej stronie.
- Przyciski „Filtruj”, „Resetuj” i „Zwiń” służą do zastosowania, wyczyszczenia i zwinięcia filtrów.
- Jeśli w filtrze zostaną wybrane pola powiązane z wykresem, ich wartości zostaną automatycznie połączone z zapytaniem wykresu, co spowoduje jego odświeżenie.
- Filtry mogą również tworzyć pola niestandardowe i rejestrować je w zmiennych kontekstowych, dzięki czemu można je odwoływać w blokach danych, takich jak wykresy, tabele i formularze.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Więcej informacji na temat używania filtrów na stronie oraz ich powiązań z wykresami i innymi blokami danych znajdą Państwo w dokumentacji [Filtry na stronie](#).

## Używanie wartości filtrów strony w zapytaniach wykresów
- Tryb konstruktora (zalecany)
  - Automatyczne łączenie: Gdy źródło danych i kolekcja są zgodne, nie ma potrzeby dodatkowego pisania zmiennych w zapytaniu wykresu; filtry strony zostaną połączone za pomocą operatora `$and`.
  - Ręczny wybór: Mogą Państwo również ręcznie wybrać wartości z „pól niestandardowych” bloku filtrującego w warunkach filtrowania wykresu.

- Tryb SQL (poprzez wstrzykiwanie zmiennych)
  - W instrukcji SQL należy użyć opcji „Wybierz zmienną”, aby wstawić wartości z „pól niestandardowych” bloku filtrującego.