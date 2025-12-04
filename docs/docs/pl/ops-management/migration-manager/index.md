---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Menedżer Migracji

## Wprowadzenie

Menedżer Migracji pomaga przenosić konfiguracje aplikacji między różnymi środowiskami. Skupia się on przede wszystkim na migracji „konfiguracji aplikacji”. Jeśli potrzebują Państwo pełnej migracji danych, zalecamy skorzystanie z funkcji tworzenia kopii zapasowych i przywracania dostępnych w [Menedżerze Kopii Zapasowych](../backup-manager/index.mdx).

## Instalacja

Menedżer Migracji wymaga [wtyczki](../backup-manager/index.mdx) Menedżera Kopii Zapasowych. Prosimy upewnić się, że wtyczka ta jest już zainstalowana i aktywna.

## Proces i Zasady Działania

Menedżer Migracji przenosi tabele i dane z głównej bazy danych do innej instancji aplikacji, bazując na określonych regułach migracji. Należy pamiętać, że nie migruje on danych z zewnętrznych baz danych ani z pod-aplikacji.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Reguły Migracji

### Wbudowane Reguły

Menedżer Migracji może migrować wszystkie tabele w głównej bazie danych i obsługuje pięć wbudowanych reguł:

1.  **Tylko struktura:** Migruje wyłącznie strukturę (schemat) tabel – dane nie są wstawiane ani aktualizowane.
2.  **Nadpisz (wyczyść i wstaw ponownie):** Usuwa wszystkie istniejące rekordy z docelowej tabeli bazy danych, a następnie wstawia nowe dane.
3.  **Wstaw lub aktualizuj (Upsert):** Sprawdza, czy rekord istnieje (na podstawie klucza podstawowego). Jeśli tak, aktualizuje ten rekord; jeśli nie, wstawia go.
4.  **Wstaw i ignoruj duplikaty (Insert-ignore):** Wstawia nowe rekordy, ale jeśli rekord już istnieje (na podstawie klucza podstawowego), wstawienie jest ignorowane (nie następuje żadna aktualizacja).
5.  **Pomiń:** Całkowicie pomija przetwarzanie tabeli (brak zmian struktury, brak migracji danych).

**Dodatkowe uwagi:**

- Reguły „Nadpisz”, „Wstaw lub aktualizuj” oraz „Wstaw i ignoruj duplikaty” synchronizują również zmiany w strukturze tabel.
- Jeśli tabela używa automatycznie inkrementowanego ID jako klucza podstawowego lub nie posiada klucza podstawowego, nie można zastosować reguł „Wstaw lub aktualizuj” ani „Wstaw i ignoruj duplikaty”.
- Reguły „Wstaw lub aktualizuj” oraz „Wstaw i ignoruj duplikaty” opierają się na kluczu podstawowym w celu określenia, czy rekord już istnieje.

### Szczegółowy Projekt

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interfejs Konfiguracji

Konfiguracja reguł migracji

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Włączanie niezależnych reguł

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Wybór niezależnych reguł oraz tabel, które mają być przetwarzane zgodnie z tymi regułami

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Pliki Migracji

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Tworzenie Nowej Migracji

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Wykonywanie Migracji

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Sprawdzanie zmiennych środowiskowych aplikacji (dowiedz się więcej o [Zmiennych Środowiskowych](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Jeśli brakuje jakichkolwiek zmiennych, pojawi się okno dialogowe z prośbą o wprowadzenie wymaganych nowych zmiennych środowiskowych, a następnie będzie można kontynuować.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Logi Migracji

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Wycofanie (Rollback)

Przed każdą migracją aplikacja jest automatycznie archiwizowana. Jeśli migracja zakończy się niepowodzeniem lub jej wyniki nie będą zgodne z oczekiwaniami, mogą Państwo przywrócić poprzedni stan za pomocą [Menedżera Kopii Zapasowych](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)