---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Eksport załączników

## Wprowadzenie

Eksport załączników umożliwia eksportowanie pól związanych z załącznikami w formacie skompresowanego pakietu.

#### Konfiguracja eksportu załączników

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Skonfiguruj pola załączników do eksportu; obsługiwany jest wielokrotny wybór.
- Mogą Państwo wybrać, czy dla każdego rekordu ma zostać wygenerowany osobny folder.

Zasady nazewnictwa plików:

- Jeśli zdecydują się Państwo na generowanie folderu dla każdego rekordu, zasada nazewnictwa plików będzie następująca: `{wartość pola tytułu rekordu}/{nazwa pola załącznika}[-{numer kolejny pliku}].{rozszerzenie pliku}`.
- Jeśli zdecydują się Państwo nie generować folderów, zasada nazewnictwa plików będzie następująca: `{wartość pola tytułu rekordu}-{nazwa pola załącznika}[-{numer kolejny pliku}].{rozszerzenie pliku}`.

Numer kolejny pliku jest generowany automatycznie, gdy pole załącznika zawiera wiele załączników.

- [Zasada powiązania](/interface-builder/actions/action-settings/linkage-rule): dynamiczne pokazywanie/ukrywanie przycisku;
- [Edycja przycisku](/interface-builder/actions/action-settings/edit-button): edycja tytułu, typu i ikony przycisku;