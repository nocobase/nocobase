---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Rozgałęzienie równoległe

Węzeł rozgałęzienia równoległego może podzielić przepływ pracy na wiele gałęzi. Każdą gałąź można skonfigurować z różnymi węzłami, a sposób jej wykonania różni się w zależności od trybu gałęzi. Węzeł ten jest przydatny w scenariuszach, gdzie wiele operacji musi być wykonanych jednocześnie.

## Instalacja

Wbudowana wtyczka, nie wymaga instalacji.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Rozgałęzienie równoległe”:

![Dodaj rozgałęzienie równoległe](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Po dodaniu węzła rozgałęzienia równoległego do przepływu pracy, domyślnie dodawane są dwie podgałęzie. Mogą Państwo również dodać więcej gałęzi, klikając przycisk dodawania gałęzi. Do każdej gałęzi można dodać dowolną liczbę węzłów. Niepotrzebne gałęzie można usunąć, klikając przycisk usuwania na początku gałęzi.

![Zarządzanie rozgałęzieniami równoległymi](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Konfiguracja węzła

### Tryb gałęzi

Węzeł rozgałęzienia równoległego ma następujące trzy tryby:

- **Wszystkie pomyślne**: Przepływ pracy będzie kontynuował wykonywanie węzłów po zakończeniu gałęzi tylko wtedy, gdy wszystkie gałęzie zostaną wykonane pomyślnie. W przeciwnym razie, jeśli jakakolwiek gałąź zakończy się przedwcześnie – czy to z powodu błędu, awarii, czy innego stanu niepowodzenia – cały węzeł rozgałęzienia równoległego zakończy się przedwcześnie z tym statusem. Jest to również znane jako „tryb Wszystkie”.
- **Dowolna pomyślna**: Przepływ pracy będzie kontynuował wykonywanie węzłów po zakończeniu gałęzi, gdy tylko dowolna gałąź zostanie wykonana pomyślnie. Cały węzeł rozgałęzienia równoległego zakończy się przedwcześnie tylko wtedy, gdy wszystkie gałęzie zakończą się przedwcześnie – czy to z powodu błędu, awarii, czy innego stanu niepowodzenia. Jest to również znane jako „tryb Dowolna”.
- **Dowolna pomyślna lub nieudana**: Przepływ pracy będzie kontynuował wykonywanie węzłów po zakończeniu gałęzi, gdy tylko dowolna gałąź zostanie wykonana pomyślnie. Jednakże, jeśli jakikolwiek węzeł zakończy się niepowodzeniem, całe rozgałęzienie równoległe zakończy się przedwcześnie z tym statusem. Jest to również znane jako „tryb Wyścig”.

Niezależnie od wybranego trybu, każda gałąź będzie wykonywana kolejno od lewej do prawej, aż do spełnienia warunków wstępnie ustawionego trybu gałęzi, po czym przepływ pracy będzie kontynuował wykonywanie kolejnych węzłów lub zakończy się przedwcześnie.

## Przykład

Proszę zapoznać się z przykładem w [Węzeł opóźnienia](./delay.md).