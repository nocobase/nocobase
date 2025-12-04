:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Warunek

## Wprowadzenie

Podobnie jak instrukcja `if` w językach programowania, węzeł Warunek decyduje o dalszym kierunku przepływu pracy na podstawie wyniku skonfigurowanego warunku.

## Tworzenie węzła

Węzeł Warunek ma dwa tryby: „Kontynuuj, jeśli prawda” oraz „Rozgałęź, jeśli prawda/fałsz”. Muszą Państwo wybrać jeden z tych trybów podczas tworzenia węzła, i nie można go później zmienić w konfiguracji węzła.

![Wybór trybu warunku](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

W trybie „Kontynuuj, jeśli prawda”, gdy wynik warunku jest „prawdziwy”, przepływ pracy będzie kontynuował wykonywanie kolejnych węzłów. W przeciwnym razie przepływ pracy zostanie zakończony i przedwcześnie wyjdzie ze statusem niepowodzenia.

![Tryb „Kontynuuj, jeśli prawda”](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Ten tryb jest odpowiedni dla scenariuszy, w których przepływ pracy nie powinien być kontynuowany, jeśli warunek nie jest spełniony. Na przykład, przycisk wysyłania formularza do złożenia zamówienia jest powiązany ze „zdarzeniem przed akcją”. Jeśli jednak stan magazynowy produktu w zamówieniu jest niewystarczający, proces tworzenia zamówienia nie powinien być kontynuowany, lecz zakończyć się niepowodzeniem.

W trybie „Rozgałęź, jeśli prawda/fałsz” węzeł warunku utworzy dwie kolejne gałęzie przepływu pracy, odpowiadające wynikom warunku „prawda” i „fałsz”. Każdą gałąź można skonfigurować z własnymi kolejnymi węzłami. Po zakończeniu wykonywania którejkolwiek gałęzi, automatycznie połączy się ona z powrotem z nadrzędną gałęzią węzła warunku, aby kontynuować wykonywanie następnych węzłów.

![Tryb „Rozgałęź, jeśli prawda/fałsz”](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Ten tryb jest odpowiedni dla scenariuszy, w których należy wykonać różne działania w zależności od tego, czy warunek jest spełniony, czy nie. Na przykład, sprawdzenie, czy dany element danych istnieje: jeśli nie istnieje, utwórz go; jeśli istnieje, zaktualizuj go.

## Konfiguracja węzła

### Silnik obliczeniowy

Obecnie obsługiwane są trzy silniki:

- **Podstawowy**: Uzyskuje wynik logiczny poprzez proste obliczenia binarne oraz grupowanie „I”/„LUB”.
- **Math.js**: Oblicza wyrażenia obsługiwane przez silnik [Math.js](https://mathjs.org/), aby uzyskać wynik logiczny.
- **Formula.js**: Oblicza wyrażenia obsługiwane przez silnik [Formula.js](https://formulajs.info/), aby uzyskać wynik logiczny.

We wszystkich trzech typach obliczeń, zmienne z kontekstu przepływu pracy mogą być używane jako parametry.