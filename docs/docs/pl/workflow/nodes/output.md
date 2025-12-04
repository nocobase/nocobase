---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Wyjście przepływu pracy

## Wprowadzenie

Węzeł „Wyjście przepływu pracy” służy do definiowania wartości wyjściowej w wywoływanym przepływie pracy. Gdy jeden przepływ pracy jest wywoływany przez inny, węzeł „Wyjście przepływu pracy” umożliwia przekazanie wartości z powrotem do wywołującego.

## Tworzenie węzła

W wywoływanym przepływie pracy proszę dodać węzeł „Wyjście przepływu pracy”:

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Konfiguracja węzła

### Wartość wyjściowa

Proszę wprowadzić lub wybrać zmienną jako wartość wyjściową. Wartość wyjściowa może być dowolnego typu, na przykład stałą (ciąg znaków, liczba, wartość logiczna, data lub niestandardowy JSON) lub inną zmienną z przepływu pracy.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Wskazówka}
Jeśli do wywoływanego przepływu pracy dodano wiele węzłów „Wyjście przepływu pracy”, to podczas wywołania tego przepływu pracy zostanie zwrócona wartość ostatniego wykonanego węzła „Wyjście przepływu pracy”.
:::