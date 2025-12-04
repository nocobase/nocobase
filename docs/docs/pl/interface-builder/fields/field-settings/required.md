:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wymagane

## Wprowadzenie

Wymagane jest często używaną regułą walidacji formularzy. Mogą Państwo włączyć tę opcję bezpośrednio w konfiguracji pola lub dynamicznie ustawić pole jako wymagane za pomocą reguł powiązań formularza.

## Gdzie można ustawić pole jako wymagane

### Ustawienia pola kolekcji

Gdy pole kolekcji zostanie ustawione jako wymagane, wyzwala to walidację po stronie serwera (backendu), a interfejs użytkownika (frontend) domyślnie również wyświetla je jako wymagane (bez możliwości modyfikacji).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Ustawienia pola

Bezpośrednie ustawienie pola jako wymagane. Jest to odpowiednie dla pól, które zawsze muszą być wypełnione przez użytkownika, takich jak nazwa użytkownika, hasło itp.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Reguły powiązań

Ustawienie pola jako wymagane na podstawie warunków za pomocą reguł powiązań pól w bloku formularza.

Przykład: Numer zamówienia jest wymagany, gdy data zamówienia nie jest pusta.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Przepływ pracy