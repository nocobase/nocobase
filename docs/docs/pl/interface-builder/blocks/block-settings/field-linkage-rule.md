:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Reguły powiązania pól

## Wprowadzenie

Reguły powiązania pól umożliwiają dynamiczne dostosowywanie stanu pól w blokach formularzy/szczegółów w zależności od działań użytkownika. Obecnie reguły powiązania pól są obsługiwane przez następujące bloki:

- [Blok formularza](/interface-builder/blocks/data-blocks/form)
- [Blok szczegółów](/interface-builder/blocks/data-blocks/details)
- [Podformularz](/interface-builder/fields/specific/sub-form)

## Instrukcja użycia

### **Blok formularza**

W bloku formularza reguły powiązania mogą dynamicznie dostosowywać zachowanie pól w zależności od określonych warunków:

- **Kontrola widoczności pola (pokaż/ukryj)**: Decydowanie, czy bieżące pole ma być wyświetlane, w oparciu o wartości innych pól.
- **Ustawianie pola jako wymaganego**: Dynamiczne ustawianie pola jako wymaganego lub opcjonalnego w określonych warunkach.
- **Przypisywanie wartości**: Automatyczne przypisywanie wartości do pola w oparciu o warunki.
- **Wykonywanie określonego kodu JavaScript**: Pisanie kodu JavaScript zgodnie z wymaganiami biznesowymi.

### **Blok szczegółów**

W bloku szczegółów reguły powiązania służą głównie do dynamicznej kontroli widoczności (pokazywania/ukrywania) pól w tym bloku.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Powiązanie właściwości

### Przypisywanie wartości

Przykład: Gdy zamówienie zostanie oznaczone jako zamówienie uzupełniające, status zamówienia zostanie automatycznie ustawiony na „Oczekujące na weryfikację”.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Wymagane

Przykład: Gdy status zamówienia to „Opłacone”, pole kwoty zamówienia jest wymagane.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Pokaż/Ukryj

Przykład: Konto płatnicze i całkowita kwota są wyświetlane tylko wtedy, gdy status zamówienia to „Oczekujące na płatność”.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)