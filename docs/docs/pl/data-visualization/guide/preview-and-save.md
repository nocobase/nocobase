:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Podgląd i Zapisywanie

*   **Podgląd**: Tymczasowo wyświetla zmiany wprowadzone w panelu konfiguracji na wykresie strony, aby Państwo mogli zweryfikować ich efekt.
*   **Zapisz**: Zapisuje zmiany wprowadzone w panelu konfiguracji do bazy danych na stałe.

## Punkty dostępu

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   W trybie konfiguracji wizualnej (Basic) wszystkie zmiany są domyślnie automatycznie stosowane w podglądzie.
*   W trybach SQL i Custom, po wprowadzeniu zmian, mogą Państwo kliknąć przycisk „Podgląd” po prawej stronie, aby zastosować je w podglądzie.
*   Na dole całego panelu konfiguracji dostępny jest ujednolicony przycisk „Podgląd”.

## Zachowanie podglądu
*   Konfiguracja jest tymczasowo wyświetlana na stronie, ale nie jest zapisywana do bazy danych. Po odświeżeniu strony lub anulowaniu operacji wynik podglądu nie zostanie zachowany.
*   Wbudowane opóźnienie (debounce): Wielokrotne wywołanie odświeżania w krótkim czasie spowoduje wykonanie tylko ostatniego, co pozwala uniknąć częstych żądań.
*   Ponowne kliknięcie „Podgląd” nadpisze poprzedni wynik podglądu.

## Komunikaty o błędach
*   Błędy zapytania lub niepowodzenia walidacji: są wyświetlane w obszarze „Zobacz dane”.
*   Błędy konfiguracji wykresu (brakujące mapowanie Basic, wyjątki z Custom JS): są wyświetlane w obszarze wykresu lub konsoli, zachowując możliwość obsługi strony.
*   Aby skutecznie zredukować błędy, proszę najpierw potwierdzić nazwy kolumn i typy danych w obszarze „Zobacz dane”, a następnie przystąpić do mapowania pól lub pisania kodu Custom.

## Zapisywanie i Anulowanie
*   **Zapisz**: Zapisuje bieżące zmiany w konfiguracji bloku i natychmiast stosuje je na stronie.
*   **Anuluj**: Odrzuca bieżące, niezapisane zmiany i przywraca stan sprzed ostatniego zapisu.
*   **Zakres zapisu**:
    *   **Zapytanie danych**: Parametry zapytania Builder; w trybie SQL zapisywany jest również tekst SQL.
    *   **Opcje wykresu**: Typ Basic, mapowanie pól i właściwości; tekst JS Custom.
    *   **Zdarzenia interakcji**: Tekst JS zdarzenia i logika wiązania.
*   Po zapisaniu blok staje się aktywny dla wszystkich odwiedzających (zależnie od ustawień uprawnień strony).

## Zalecany przepływ pracy
*   Skonfiguruj zapytanie danych → Uruchom zapytanie → Zobacz dane, aby potwierdzić nazwy kolumn i typy → Skonfiguruj opcje wykresu, aby zmapować kluczowe pola → Podgląd w celu walidacji → Zapisz, aby zastosować.