---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Blok referencyjny

## Wprowadzenie
Blok referencyjny pozwala wyświetlić istniejący, skonfigurowany blok bezpośrednio na bieżącej stronie, podając jego UID. Dzięki temu nie muszą Państwo konfigurować go ponownie.

## Aktywacja wtyczki
Ta wtyczka jest wbudowana, ale domyślnie wyłączona.
Proszę otworzyć „Menedżer wtyczek” → znaleźć „Blok: Referencyjny” → kliknąć „Włącz”.

![Włączanie bloku referencyjnego (Menedżer wtyczek)](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Jak dodać blok
1) Proszę dodać blok → grupa „Inne bloki” → wybrać „Blok referencyjny”.
2) W „Ustawieniach bloku referencyjnego” proszę skonfigurować:
   - `UID bloku`: UID bloku docelowego
   - `Tryb referencji`: proszę wybrać `Referencja` lub `Kopia`

![Demonstracja dodawania i konfiguracji bloku referencyjnego](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Jak uzyskać UID bloku
- Proszę otworzyć menu ustawień bloku docelowego i kliknąć `Kopiuj UID`, aby skopiować jego UID.

![Przykład kopiowania UID bloku](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Tryby i zachowanie
- `Referencja` (domyślnie)
  - Współdzieli tę samą konfigurację z oryginalnym blokiem; zmiany wprowadzone w oryginalnym bloku lub w którymkolwiek miejscu odwołania zostaną zsynchronizowane we wszystkich referencjach.

- `Kopia`
  - Tworzy niezależny blok, identyczny z oryginalnym w momencie kopiowania; późniejsze zmiany w żadnym z nich nie będą się wzajemnie wpływać ani synchronizować.

## Konfiguracja
- Blok referencyjny:
  - `Ustawienia bloku referencyjnego`: służą do określenia UID bloku docelowego oraz wyboru trybu „Referencja/Kopia”;
  - Jednocześnie zostaną wyświetlone pełne ustawienia „referencyjnego bloku” (co jest równoznaczne z bezpośrednią konfiguracją oryginalnego bloku).

![Interfejs konfiguracji bloku referencyjnego](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Skopiowany blok:
  - Blok uzyskany po skopiowaniu jest tego samego typu co blok oryginalny i zawiera wyłącznie własne ustawienia;
  - Nie zawiera już `Ustawień bloku referencyjnego`.

## Stany błędów i zastępcze
- Gdy cel jest brakujący/nieprawidłowy: wyświetlany jest komunikat o błędzie. Mogą Państwo ponownie określić UID bloku w ustawieniach bloku referencyjnego (Ustawienia bloku referencyjnego → UID bloku), a po zapisaniu widok zostanie przywrócony.

![Stan błędu, gdy blok docelowy jest nieprawidłowy](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Uwagi i ograniczenia
- Funkcja eksperymentalna – proszę używać z ostrożnością w środowiskach produkcyjnych.
- Podczas kopiowania bloku niektóre konfiguracje, które zależą od UID bloku docelowego, mogą wymagać ponownej konfiguracji.
- Wszystkie konfiguracje bloku referencyjnego są automatycznie synchronizowane, w tym konfiguracje takie jak „zakres danych”. Jednak blok referencyjny może mieć własną [konfigurację przepływu zdarzeń](/interface-builder/event-flow/). Dzięki przepływom zdarzeń i niestandardowym akcjom JavaScript można pośrednio osiągnąć różne zakresy danych lub powiązane konfiguracje dla każdej referencji.