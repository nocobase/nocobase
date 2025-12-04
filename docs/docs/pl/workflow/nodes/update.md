:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Aktualizacja Danych

Służy do aktualizacji danych w kolekcji, które spełniają określone warunki.

Części dotyczące kolekcji i przypisywania pól są takie same jak w węźle „Utwórz rekord”. Główna różnica w węźle „Aktualizuj dane” polega na dodaniu warunków filtrowania oraz konieczności wyboru trybu aktualizacji. Dodatkowo, wynik węzła „Aktualizuj dane” zwraca liczbę pomyślnie zaktualizowanych wierszy. Można to zobaczyć tylko w historii wykonania i nie może być używane jako zmienna w kolejnych węzłach.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Aktualizuj dane”:

![Dodaj węzeł Aktualizuj dane](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Konfiguracja węzła

![Konfiguracja węzła Aktualizuj dane](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Kolekcja

Proszę wybrać kolekcję, w której dane mają zostać zaktualizowane.

### Tryb aktualizacji

Dostępne są dwa tryby aktualizacji:

*   **Aktualizacja zbiorcza**: Nie wyzwala zdarzeń kolekcji dla każdego zaktualizowanego rekordu. Oferuje lepszą wydajność i jest odpowiednia do operacji aktualizacji dużych ilości danych.
*   **Aktualizacja pojedyncza**: Wyzwala zdarzenia kolekcji dla każdego zaktualizowanego rekordu. Może jednak powodować problemy z wydajnością przy dużych ilościach danych i należy jej używać z ostrożnością.

Wybór zazwyczaj zależy od danych docelowych do aktualizacji oraz od tego, czy mają zostać wyzwolone inne zdarzenia przepływu pracy. Jeśli aktualizuje się pojedynczy rekord na podstawie klucza podstawowego, zaleca się użycie trybu „Aktualizacja pojedyncza”. Jeśli aktualizuje się wiele rekordów na podstawie warunków, zaleca się użycie trybu „Aktualizacja zbiorcza”.

### Warunki filtrowania

Podobnie jak warunki filtrowania w zwykłym zapytaniu do kolekcji, można używać zmiennych kontekstowych z przepływu pracy.

### Wartości pól

Podobnie jak przypisywanie pól w węźle „Utwórz rekord”, można używać zmiennych kontekstowych z przepływu pracy lub ręcznie wprowadzać wartości statyczne.

Uwaga: Dane aktualizowane przez węzeł „Aktualizuj dane” w przepływie pracy nie obsługują automatycznie danych „Ostatnio zmodyfikowane przez”. Należy samodzielnie skonfigurować wartość tego pola w zależności od potrzeb.

## Przykład

Na przykład, gdy tworzony jest nowy „Artykuł”, należy automatycznie zaktualizować pole „Liczba artykułów” w kolekcji „Kategoria artykułów”. Można to osiągnąć za pomocą węzła „Aktualizuj dane”:

![Konfiguracja węzła Aktualizuj dane - przykład](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Po wyzwoleniu przepływu pracy, automatycznie zaktualizowane zostanie pole „Liczba artykułów” kolekcji „Kategoria artykułów” do bieżącej liczby artykułów + 1.