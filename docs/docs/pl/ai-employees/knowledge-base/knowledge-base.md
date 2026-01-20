:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Baza wiedzy

## Wprowadzenie

Baza wiedzy stanowi podstawę wyszukiwania RAG. Organizuje dokumenty według kategorii i buduje indeksy. Gdy pracownik AI odpowiada na pytania, w pierwszej kolejności przeszukuje bazę wiedzy w poszukiwaniu odpowiedzi.

## Zarządzanie bazą wiedzy

Proszę przejść do strony konfiguracji wtyczki pracownika AI, następnie kliknąć zakładkę `Knowledge base`, aby przejść do strony zarządzania bazą wiedzy.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Proszę kliknąć przycisk `Add new` w prawym górnym rogu, aby dodać nową bazę wiedzy typu `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Proszę wprowadzić niezbędne informacje dla nowej bazy wiedzy:

- W polu `Name` proszę wprowadzić nazwę bazy wiedzy;
- W `File storage` proszę wybrać lokalizację przechowywania plików;
- W `Vector store` proszę wybrać magazyn wektorów, odwołując się do [Magazyn wektorów](/ai-employees/knowledge-base/vector-store);
- W polu `Description` proszę wprowadzić opis bazy wiedzy;

Proszę kliknąć przycisk `Submit`, aby utworzyć bazę wiedzy.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Zarządzanie dokumentami w bazie wiedzy

Po utworzeniu bazy wiedzy, na stronie listy baz wiedzy, proszę kliknąć nowo utworzoną bazę wiedzy, aby przejść do strony zarządzania dokumentami bazy wiedzy.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/2025100527.png)

Proszę kliknąć przycisk `Upload`, aby przesłać dokumenty. Po przesłaniu dokumentów automatycznie rozpocznie się wektoryzacja. Proszę poczekać, aż `Status` zmieni się ze stanu `Pending` na `Success`.

Obecnie baza wiedzy obsługuje następujące typy dokumentów: txt, pdf, doc, docx, ppt, pptx; pliki PDF obsługują wyłącznie czysty tekst.

![20251023100901](https://static-docs.nocobase.com/2025100901.png)

## Typy baz wiedzy

### Lokalna baza wiedzy

Lokalna baza wiedzy to baza wiedzy przechowywana lokalnie w NocoBase. Zarówno dokumenty, jak i ich dane wektorowe są przechowywane lokalnie przez NocoBase.

![20251023101620](https://static-docs.nocobase.com/2025101620.png)

### Baza wiedzy tylko do odczytu

Baza wiedzy tylko do odczytu to baza wiedzy, której dokumenty i dane wektorowe są utrzymywane zewnętrznie. W NocoBase tworzone jest jedynie połączenie z wektorową bazą danych (obecnie obsługiwany jest tylko PGVector).

![20251023101743](https://static-docs.nocobase.com/2025101743.png)

### Zewnętrzna baza wiedzy

Zewnętrzna baza wiedzy to baza wiedzy, której dokumenty i dane wektorowe są utrzymywane zewnętrznie. Wyszukiwanie w wektorowej bazie danych wymaga rozszerzenia przez deweloperów, co umożliwia korzystanie z baz danych wektorowych, które nie są obecnie obsługiwane przez NocoBase.

![20251023101949](https://static-docs.nocobase.com/2025101949.png)