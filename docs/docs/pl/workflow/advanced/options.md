:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zaawansowana konfiguracja

## Tryb wykonania

Przepływy pracy są wykonywane w trybie „asynchronicznym” lub „synchronicznym”, w zależności od typu wyzwalacza wybranego podczas ich tworzenia. Tryb asynchroniczny oznacza, że po wyzwoleniu określonego zdarzenia, przepływ pracy trafia do kolejki i jest wykonywany pojedynczo przez harmonogram w tle. Natomiast tryb synchroniczny po wyzwoleniu nie trafia do kolejki harmonogramowania, lecz rozpoczyna wykonywanie bezpośrednio i natychmiastowo dostarcza informację zwrotną po zakończeniu.

Zdarzenia kolekcji, zdarzenia po akcji, zdarzenia niestandardowych akcji, zdarzenia zaplanowane oraz zdarzenia zatwierdzeń są domyślnie wykonywane asynchronicznie. Zdarzenia przed akcją są domyślnie wykonywane synchronicznie. Zarówno zdarzenia kolekcji, jak i zdarzenia formularzy obsługują oba tryby, które można wybrać podczas tworzenia przepływu pracy:

![Tryb synchroniczny_Tworzenie synchronicznego przepływu pracy](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Wskazówka}
Ze względu na swój charakter, synchroniczne przepływy pracy nie mogą używać węzłów, które generują stan „oczekiwania”, takich jak „Ręczne przetwarzanie”.
:::

## Automatyczne usuwanie historii wykonania

Gdy przepływ pracy jest często wyzwalany, można skonfigurować automatyczne usuwanie historii wykonania, aby zmniejszyć bałagan i odciążyć bazę danych.

Można również skonfigurować, czy historia wykonania przepływu pracy ma być automatycznie usuwana, w oknach dialogowych tworzenia i edycji przepływu pracy:

![Konfiguracja automatycznego usuwania historii wykonania](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Automatyczne usuwanie można skonfigurować w oparciu o status wyniku wykonania. W większości przypadków zaleca się zaznaczenie tylko statusu „Zakończono”, aby zachować rekordy nieudanych wykonań w celu późniejszego rozwiązywania problemów.

Zaleca się, aby nie włączać automatycznego usuwania historii wykonania podczas debugowania przepływu pracy, aby móc sprawdzić, czy logika wykonania przepływu pracy jest zgodna z oczekiwaniami.

:::info{title=Wskazówka}
Usunięcie historii przepływu pracy nie zmniejsza liczby jego dotychczasowych wykonań.
:::