:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Reguły powiązania akcji

## Wprowadzenie

Reguły powiązania akcji pozwalają użytkownikom dynamicznie kontrolować stan operacji (takich jak wyświetlanie, włączanie, ukrywanie, wyłączanie itp.) w zależności od określonych warunków. Konfigurując te reguły, mogą Państwo powiązać zachowanie przycisków akcji z bieżącym rekordem, rolą użytkownika lub danymi kontekstowymi.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Jak używać

Gdy warunek jest spełniony (domyślnie przechodzi, jeśli nie ustawiono żadnego warunku), wyzwala to wykonanie ustawień właściwości lub kodu JavaScript. W ocenie warunków mogą Państwo używać stałych i zmiennych.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Reguła umożliwia modyfikację właściwości przycisków.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Stałe

Przykład: Opłacone zamówienia nie mogą być edytowane.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Zmienne

### Zmienne systemowe

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Przykład 1: Kontrolowanie widoczności przycisku w zależności od bieżącego typu urządzenia.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Przykład 2: Przycisk masowej aktualizacji w nagłówku tabeli bloku zamówień jest dostępny tylko dla roli Administratora; inne role nie mogą wykonać tej akcji.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Zmienne kontekstowe

Przykład: Przycisk Dodaj w bloku możliwości zamówienia (blok powiązania) jest włączony tylko wtedy, gdy status zamówienia to „Oczekujące na płatność” lub „Szkic”. W innych statusach przycisk zostanie wyłączony.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Więcej informacji na temat zmiennych znajdą Państwo w [Zmienne](/interface-builder/variables).