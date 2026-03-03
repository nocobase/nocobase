:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/fields/specific/sub-table-popup).
:::

# Podtabela (edycja w oknie wyskakującym)

## Wprowadzenie

Podtabela (edycja w oknie wyskakującym) służy do zarządzania wieloma powiązanymi danymi (takimi jak relacje jeden-do-wielu lub wiele-do-wielu) wewnątrz formularza. Tabela wyświetla tylko aktualnie powiązane rekordy. Dodawanie lub edycja rekordów odbywa się w oknie wyskakującym (pop-up), a dane są zapisywane w bazie danych zbiorczo po przesłaniu formularza głównego.

## Instrukcja użytkowania

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Scenariusze zastosowania:**

- Pola powiązań: O2M / M2M / MBM
- Typowe zastosowania: szczegóły zamówienia, listy podpozycji, powiązane tagi/członkowie itp.

## Konfiguracja pola

### Zezwalaj na wybór istniejących danych (Domyślnie: Włączone)

Obsługuje wybieranie powiązań z istniejących rekordów.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Komponent pola

[Komponent pola](/interface-builder/fields/association-field): Przełącz na inne komponenty pól relacji, takie jak wybór jednokrotny, selektor kolekcji itp.

### Zezwalaj na odpinanie istniejących danych (Domyślnie: Włączone)

> Kontroluje, czy istniejące powiązane dane w formularzu edycji mogą zostać odpięte. Nowo dodane dane można zawsze usunąć.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Zezwalaj na dodawanie (Domyślnie: Włączone)

Kontroluje wyświetlanie przycisku „Dodaj”. Jeśli użytkownik nie posiada uprawnień `create` dla docelowej kolekcji, przycisk będzie wyłączony z informacją o braku uprawnień.

### Zezwalaj na szybką edycję (Domyślnie: Wyłączone)

Po włączeniu, najechanie kursorem na komórkę spowoduje wyświetlenie ikony edycji, co pozwala na szybką zmianę zawartości komórki.

Mogą Państwo włączyć szybką edycję dla wszystkich pól w ustawieniach komponentu pola powiązania.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Można ją również włączyć dla poszczególnych kolumn.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Rozmiar strony (Domyślnie: 10)

Ustawia liczbę rekordów wyświetlanych na jednej stronie w podtabeli.

## Zachowanie systemu

- Podczas wybierania istniejących rekordów następuje usuwanie duplikatów na podstawie klucza głównego, aby zapobiec wielokrotnemu powiązaniu tego samego rekordu.
- Nowo dodane rekordy są wprowadzane bezpośrednio do podtabeli, a widok automatycznie przechodzi do strony zawierającej nowy rekord.
- Edycja wewnątrz wiersza modyfikuje tylko dane w bieżącym wierszu.
- Usunięcie rekordu powoduje jedynie odpięcie powiązania w bieżącym formularzu; nie usuwa danych źródłowych z bazy danych.
- Dane są zapisywane w bazie danych zbiorczo dopiero po przesłaniu formularza głównego.