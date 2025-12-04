:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zakończ przepływ pracy

Po wykonaniu tego węzła, bieżący przepływ pracy zostanie natychmiast zakończony ze statusem skonfigurowanym w węźle. Jest to zazwyczaj używane do kontroli przepływu opartej na określonej logice, aby wyjść z bieżącego przepływu pracy po spełnieniu pewnych warunków logicznych i zatrzymać wykonywanie kolejnych procesów. Można to porównać do instrukcji `return` w językach programowania, służącej do wyjścia z aktualnie wykonywanej funkcji.

## Dodawanie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Zakończ przepływ pracy”:

![Zakończ przepływ pracy_Dodawanie](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Konfiguracja węzła

![Zakończ przepływ pracy_Konfiguracja węzła](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Status zakończenia

Status zakończenia wpłynie na ostateczny status wykonania przepływu pracy. Można go skonfigurować jako „Sukces” lub „Niepowodzenie”. Gdy wykonanie przepływu pracy dotrze do tego węzła, zostanie on natychmiast zakończony ze skonfigurowanym statusem.

:::info{title=Uwaga}
W przypadku użycia w przepływie pracy typu „Zdarzenie przed akcją”, spowoduje to przechwycenie żądania, które zainicjowało akcję. Szczegółowe informacje znajdą Państwo w [Instrukcji użycia „Zdarzenia przed akcją”](../triggers/pre-action).

Ponadto, oprócz przechwytywania żądania, które zainicjowało akcję, konfiguracja statusu zakończenia wpłynie również na status informacji zwrotnej w „wiadomości odpowiedzi” dla tego typu przepływu pracy.
:::