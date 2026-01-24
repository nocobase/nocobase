:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Plan wykonania (Historia)

Po każdym wyzwoleniu **przepływu pracy** tworzony jest odpowiadający mu plan wykonania, aby śledzić przebieg tego zadania. Każdy plan wykonania ma wartość statusu, która wskazuje jego bieżący stan. Status ten można sprawdzić zarówno na liście historii wykonań, jak i w jej szczegółach:

![Status planu wykonania](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Gdy wszystkie węzły w głównej gałęzi **przepływu pracy** zostaną wykonane do końca ze statusem „Zakończono”, cały plan wykonania zakończy się statusem „Zakończono”. Jeśli węzeł w głównej gałęzi **przepływu pracy** osiągnie stan końcowy, taki jak „Niepowodzenie”, „Błąd”, „Anulowano” lub „Odrzucono”, cały plan wykonania zostanie **przedwcześnie zakończony** z odpowiednim statusem. Gdy węzeł w głównej gałęzi **przepływu pracy** znajdzie się w stanie „Oczekiwanie”, cały plan wykonania zostanie wstrzymany, ale nadal będzie wyświetlał status „W toku”, dopóki oczekujący węzeł nie zostanie wznowiony. Różne typy węzłów obsługują stan oczekiwania w różny sposób. Na przykład, węzeł ręczny wymaga oczekiwania na ręczne przetworzenie, podczas gdy węzeł opóźniający musi czekać na upłynięcie określonego czasu, zanim będzie kontynuowany.

Statusy planu wykonania przedstawia poniższa tabela:

| Status      | Odpowiadający status ostatnio wykonanego węzła w głównym przepływie | Znaczenie                                                                                             |
| ----------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| W kolejce   | -                                                                  | Przepływ pracy został wyzwolony i wygenerowano plan wykonania, oczekujący w kolejce na harmonogramowanie przez planistę. |
| W toku      | Oczekiwanie                                                        | Węzeł wymaga wstrzymania, oczekując na dalsze dane wejściowe lub wywołanie zwrotne, aby kontynuować. |
| Zakończono  | Zakończono                                                         | Nie napotkano żadnych problemów, wszystkie węzły zostały wykonane zgodnie z oczekiwaniami.            |
| Niepowodzenie | Niepowodzenie                                                      | Niepowodzenie z powodu niespełnienia konfiguracji węzła.                                              |
| Błąd        | Błąd                                                               | Węzeł napotkał nieobsłużony błąd programu i został przedwcześnie zakończony.                         |
| Anulowano    | Anulowano                                                         | Oczekujący węzeł został anulowany zewnętrznie przez administratora przepływu pracy, zakończony przedwcześnie. |
| Odrzucono   | Odrzucono                                                          | W węźle wymagającym ręcznego przetwarzania został ręcznie odrzucony, a dalszy proces nie będzie kontynuowany. |

W przykładzie z [Szybkiego startu](../getting-started.md) dowiedzieliśmy się już, że przeglądając szczegóły historii wykonania **przepływu pracy**, możemy sprawdzić, czy wszystkie węzły zostały wykonane prawidłowo, a także jaki był status wykonania i dane wynikowe każdego wykonanego węzła. W niektórych zaawansowanych **przepływach pracy** i węzłach, węzeł może mieć wiele wyników, na przykład wynik węzła pętli:

![Wyniki węzła z wielu wykonań](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Wskazówka}
**Przepływy pracy** mogą być wyzwalane współbieżnie, ale są wykonywane sekwencyjnie w kolejce. Nawet jeśli wiele **przepływów pracy** zostanie wyzwolonych jednocześnie, będą one wykonywane jeden po drugim, a nie równolegle. Dlatego status „W kolejce” oznacza, że inne **przepływy pracy** są aktualnie wykonywane i należy poczekać.

Status „W toku” wskazuje jedynie, że plan wykonania został rozpoczęty i zazwyczaj jest wstrzymany z powodu stanu oczekiwania wewnętrznego węzła. Nie oznacza to, że ten plan wykonania przejął zasoby wykonawcze z początku kolejki. Dlatego, gdy istnieje plan wykonania „W toku”, inne plany wykonania „W kolejce” nadal mogą zostać zaplanowane do uruchomienia.
:::

## Status wykonania węzła

Status planu wykonania jest określany przez wykonanie każdego z jego węzłów. W planie wykonania po wyzwoleniu, każdy węzeł po uruchomieniu generuje status wykonania, który z kolei decyduje o tym, czy dalszy proces będzie kontynuowany. Zazwyczaj, po pomyślnym wykonaniu węzła, wykonywany jest następny węzeł, aż wszystkie węzły zostaną wykonane sekwencyjnie lub proces zostanie przerwany. W przypadku węzłów związanych z kontrolą przepływu, takich jak rozgałęzienia, pętle, równoległe gałęzie, opóźnienia itp., kierunek wykonania następnego węzła jest określany na podstawie warunków skonfigurowanych w węźle oraz danych kontekstowych środowiska uruchomieniowego.

Możliwe statusy węzła po wykonaniu przedstawia poniższa tabela:

| Status      | Czy jest stanem końcowym | Czy kończy przedwcześnie | Znaczenie                                                                                             |
| ----------- | :----------------------: | :----------------------: | ----------------------------------------------------------------------------------------------------- |
| Oczekiwanie |            Nie           |            Nie           | Węzeł wymaga wstrzymania, oczekując na dalsze dane wejściowe lub wywołanie zwrotne, aby kontynuować. |
| Zakończono  |            Tak           |            Nie           | Nie napotkano żadnych problemów, wykonano pomyślnie i kontynuuje do następnego węzła aż do końca.      |
| Niepowodzenie |            Tak           |            Tak           | Niepowodzenie z powodu niespełnienia konfiguracji węzła.                                              |
| Błąd        |            Tak           |            Tak           | Węzeł napotkał nieobsłużony błąd programu i został przedwcześnie zakończony.                         |
| Anulowano    |            Tak           |            Tak           | Oczekujący węzeł został anulowany zewnętrznie przez administratora przepływu pracy, zakończony przedwcześnie. |
| Odrzucono   |            Tak           |            Tak           | W węźle wymagającym ręcznego przetwarzania został ręcznie odrzucony, a dalszy proces nie będzie kontynuowany. |

Z wyjątkiem statusu „Oczekiwanie”, wszystkie pozostałe statusy są stanami końcowymi wykonania węzła. Tylko gdy stan końcowy to „Zakończono”, proces będzie kontynuowany; w przeciwnym razie całe wykonanie **przepływu pracy** zostanie przedwcześnie zakończone. Gdy węzeł znajduje się w gałęzi przepływu (gałąź równoległa, warunek, pętla itp.), stan końcowy wynikający z wykonania węzła zostanie przejęty przez węzeł, który zainicjował gałąź, i to z kolei zadecyduje o dalszym przebiegu całego **przepływu pracy**.

Na przykład, gdy używamy węzła warunkowego w trybie „Kontynuuj, jeśli ‘Tak’”, jeśli wynik wykonania będzie „Nie”, cały **przepływ pracy** zostanie przedwcześnie zakończony ze statusem „Niepowodzenie”, a kolejne węzły nie zostaną wykonane, jak pokazano na poniższym rysunku:

![Niepowodzenie wykonania węzła](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Wskazówka}
Wszystkie stany końcowe inne niż „Zakończono” mogą być uznane za niepowodzenia, ale ich przyczyny są różne. Mogą Państwo sprawdzić wyniki wykonania węzła, aby lepiej zrozumieć przyczynę niepowodzenia.
:::