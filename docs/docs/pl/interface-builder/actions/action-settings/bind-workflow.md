:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Powiązywanie przepływów pracy

## Wprowadzenie

Na niektórych przyciskach akcji można skonfigurować powiązany przepływ pracy, aby skojarzyć daną operację z przepływem pracy i zautomatyzować przetwarzanie danych.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Obsługiwane akcje i typy przepływów pracy

Poniżej przedstawiamy obsługiwane przyciski akcji i typy przepływów pracy, które można powiązać:

| Przycisk akcji \ Typ przepływu pracy | Zdarzenie przed akcją | Zdarzenie po akcji | Zdarzenie zatwierdzenia | Zdarzenie niestandardowej akcji |
| --- | --- | --- | --- | --- |
| Przyciski "Wyślij", "Zapisz" w formularzu | ✅ | ✅ | ✅ | ❌ |
| Przycisk "Aktualizuj rekord" w wierszach danych (tabela, lista itp.) | ✅ | ✅ | ✅ | ❌ |
| Przycisk "Usuń" w wierszach danych (tabela, lista itp.) | ✅ | ❌ | ❌ | ❌ |
| Przycisk "Uruchom przepływ pracy" | ❌ | ❌ | ❌ | ✅ |

## Powiązywanie wielu przepływów pracy

Jeden przycisk akcji może być powiązany z wieloma przepływami pracy. Gdy powiązano wiele przepływów pracy, ich kolejność wykonywania podlega następującym zasadom:

1. W przypadku przepływów pracy tego samego typu wyzwalacza, najpierw wykonywane są przepływy synchroniczne, a następnie asynchroniczne.
2. Przepływy pracy tego samego typu wyzwalacza są wykonywane w kolejności konfiguracji.
3. Między przepływami pracy różnych typów wyzwalaczy:
    1. Zdarzenia przed akcją są zawsze wykonywane przed zdarzeniami po akcji i zdarzeniami zatwierdzenia.
    2. Zdarzenia po akcji i zdarzenia zatwierdzenia nie mają określonej kolejności, a logika biznesowa nie powinna być zależna od kolejności konfiguracji.

## Więcej

Aby uzyskać szczegółowe informacje na temat różnych typów zdarzeń przepływu pracy, prosimy zapoznać się ze szczegółowym opisem odpowiednich wtyczek:

* [Zdarzenie po akcji]
* [Zdarzenie przed akcją]
* [Zdarzenie zatwierdzenia]
* [Zdarzenie niestandardowej akcji]