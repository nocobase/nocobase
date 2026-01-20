---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Eksport

## Wprowadzenie

Funkcja eksportu umożliwia eksportowanie przefiltrowanych rekordów do formatu **Excel**, z możliwością konfiguracji eksportowanych pól. Użytkownicy mogą wybrać pola, które chcą wyeksportować, zgodnie ze swoimi potrzebami, w celu późniejszej analizy danych, ich przetwarzania lub archiwizacji. Funkcja ta zwiększa elastyczność operacji na danych, szczególnie przydatna w scenariuszach, gdzie dane muszą zostać przeniesione na inne platformy lub poddane dalszej obróbce.

### Kluczowe cechy:
- **Wybór pól**: Użytkownicy mogą skonfigurować i wybrać pola do eksportu, zapewniając, że wyeksportowane dane są precyzyjne i zwięzłe.
- **Obsługa formatu Excel**: Wyeksportowane dane zostaną zapisane jako standardowy plik Excel, co ułatwia ich integrację i analizę z innymi danymi.

Dzięki tej funkcji użytkownicy mogą łatwo eksportować kluczowe dane ze swojej pracy do użytku zewnętrznego, zwiększając efektywność pracy.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Konfiguracja akcji

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Pola do eksportu

- Pierwszy poziom: Wszystkie pola bieżącej kolekcji;
- Drugi poziom: Jeśli jest to pole relacji, należy wybrać pola z powiązanej kolekcji;
- Trzeci poziom: Obsługiwane są tylko trzy poziomy; pola relacji na ostatnim poziomie nie są wyświetlane;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Reguła powiązania](/interface-builder/actions/action-settings/linkage-rule): Dynamiczne pokazywanie/ukrywanie przycisku;
- [Edytuj przycisk](/interface-builder/actions/action-settings/edit-button): Edycja tytułu, typu i ikony przycisku;