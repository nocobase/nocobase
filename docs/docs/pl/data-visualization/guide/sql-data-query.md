:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zapytania danych w trybie SQL

W panelu „Zapytania danych” przełącz się na tryb SQL, napisz i uruchom zapytanie, a następnie bezpośrednio wykorzystaj zwrócone wyniki do mapowania i renderowania wykresów.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Pisanie zapytań SQL
- W panelu „Zapytania danych” wybierz tryb „SQL”.
- Wprowadź zapytanie SQL i kliknij „Uruchom zapytanie”, aby je wykonać.
- Obsługiwane są złożone instrukcje SQL, takie jak łączenia wielu tabel (JOIN) i widoki (VIEW).

Przykład: Suma zamówień według miesiąca
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Podgląd wyników
- Kliknij „Pokaż dane”, aby otworzyć panel podglądu wyników danych.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Dane obsługują stronicowanie; mogą Państwo również przełączać się między widokiem tabeli (Table) a JSON, aby sprawdzić nazwy i typy kolumn.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Mapowanie pól
- W konfiguracji „Opcje wykresu” należy dokonać mapowania pól w oparciu o kolumny wyników zapytania.
- Domyślnie pierwsza kolumna jest automatycznie traktowana jako wymiar (oś X lub kategoria), a druga jako miara (oś Y lub wartość). Proszę zwrócić uwagę na kolejność pól w zapytaniu SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- pole wymiaru w pierwszej kolumnie
  SUM(total_amount) AS total -- pole miary w kolejnych kolumnach
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Użycie zmiennych kontekstowych
Kliknięcie przycisku `x` w prawym górnym rogu edytora SQL umożliwia wybór zmiennych kontekstowych.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Po potwierdzeniu, wyrażenie zmiennej zostanie wstawione w miejscu kursora (lub zastąpi zaznaczony tekst) w treści zapytania SQL.

Na przykład `{{ ctx.user.createdAt }}`. Proszę pamiętać, aby nie dodawać samodzielnie dodatkowych cudzysłowów.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Więcej przykładów
Więcej przykładów użycia znajdą Państwo w [aplikacji demonstracyjnej](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

**Zalecenia:**
- Proszę ustabilizować nazwy kolumn przed mapowaniem ich do wykresów, aby uniknąć późniejszych błędów.
- Podczas debugowania proszę ustawić `LIMIT`, aby zmniejszyć liczbę zwracanych wierszy i przyspieszyć podgląd.

## Podgląd, zapisywanie i wycofywanie zmian
- Kliknięcie „Uruchom zapytanie” spowoduje wykonanie żądania danych i odświeżenie podglądu wykresu.
- Kliknięcie „Zapisz” spowoduje zapisanie bieżącego tekstu SQL i powiązanej konfiguracji do bazy danych.
- Kliknięcie „Anuluj” spowoduje powrót do ostatniego zapisanego stanu i odrzucenie bieżących, niezapisanych zmian.