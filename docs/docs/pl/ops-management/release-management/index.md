:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zarządzanie wydaniami

## Wprowadzenie

W praktycznych zastosowaniach, aby zapewnić bezpieczeństwo danych i stabilne działanie aplikacji, zazwyczaj wdrażamy wiele środowisk, takich jak środowisko deweloperskie, środowisko przedprodukcyjne (pre-release) oraz środowisko produkcyjne. Ten dokument przedstawia przykłady dwóch typowych **przepływów pracy** w rozwoju no-code i szczegółowo wyjaśnia, jak zaimplementować zarządzanie wydaniami w NocoBase.

## Instalacja

Trzy **wtyczki** są niezbędne do zarządzania wydaniami. Proszę upewnić się, że wszystkie poniższe **wtyczki** są aktywne.

### Zmienne środowiskowe i klucze

- Wbudowana **wtyczka**, domyślnie zainstalowana i aktywna.
- Umożliwia scentralizowaną konfigurację i zarządzanie zmiennymi środowiskowymi oraz kluczami, wykorzystywanymi do przechowywania wrażliwych danych, ponownego użycia danych konfiguracyjnych, izolacji konfiguracji środowiskowej itp. ([Zobacz dokumentację](#)).

### Menedżer kopii zapasowych

- Ta **wtyczka** jest dostępna wyłącznie w wersji Professional lub wyższej ([Dowiedz się więcej](https://www.nocobase.com/en/commercial)).
- Oferuje funkcje tworzenia kopii zapasowych i przywracania, w tym planowane kopie zapasowe, zapewniając bezpieczeństwo danych i szybkie odzyskiwanie. ([Zobacz dokumentację](../backup-manager/index.mdx)).

### Menedżer migracji

- Ta **wtyczka** jest dostępna wyłącznie w wersji Professional lub wyższej ([Dowiedz się więcej](https://www.nocobase.com/en/commercial)).
- Służy do migracji konfiguracji aplikacji z jednego środowiska aplikacji do drugiego. ([Zobacz dokumentację](../migration-manager/index.md)).

## Typowe **przepływy pracy** w rozwoju no-code

### Pojedyncze środowisko deweloperskie, jednokierunkowe wydanie

To podejście jest odpowiednie dla prostych **przepływów pracy** deweloperskich. Istnieje jedno środowisko deweloperskie, jedno środowisko przedprodukcyjne i jedno środowisko produkcyjne. Zmiany przepływają sekwencyjnie ze środowiska deweloperskiego do środowiska przedprodukcyjnego, a ostatecznie są wdrażane w środowisku produkcyjnym. W tym **przepływie pracy** tylko środowisko deweloperskie może modyfikować konfiguracje; ani środowisko przedprodukcyjne, ani produkcyjne nie zezwalają na modyfikacje.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Podczas konfigurowania reguł migracji, dla wbudowanych tabel w rdzeniu i **wtyczkach** proszę wybrać regułę „Nadpisz priorytetowo” (Overwrite). W przypadku pozostałych elementów, jeśli nie ma specjalnych wymagań, można pozostawić ustawienia domyślne.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Wiele środowisk deweloperskich, wydanie po scaleniu

To podejście jest odpowiednie dla scenariuszy współpracy wielu osób lub złożonych projektów. Kilka równoległych środowisk deweloperskich może być używanych niezależnie, a wszystkie zmiany są scalane w jednym środowisku przedprodukcyjnym w celu testowania i weryfikacji, a następnie wydawane do środowiska produkcyjnego. W tym **przepływie pracy** również tylko środowisko deweloperskie może modyfikować konfiguracje; ani środowisko przedprodukcyjne, ani produkcyjne nie zezwalają na modyfikacje.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Podczas konfigurowania reguł migracji, dla wbudowanych tabel w rdzeniu i **wtyczkach** proszę wybrać regułę „Wstaw lub aktualizuj priorytetowo” (Insert or Update). W przypadku pozostałych elementów, jeśli nie ma specjalnych wymagań, można pozostawić ustawienia domyślne.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Wycofanie zmian (Rollback)

Przed wykonaniem migracji system automatycznie tworzy kopię zapasową bieżącej aplikacji. Jeśli migracja zakończy się niepowodzeniem lub wyniki nie będą zgodne z oczekiwaniami, mogą Państwo wycofać zmiany i przywrócić poprzedni stan za pomocą [Menedżera kopii zapasowych](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)