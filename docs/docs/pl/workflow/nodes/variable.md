---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zmienna

## Wprowadzenie

Mogą Państwo deklarować zmienne w przepływie pracy lub przypisywać wartości do już zadeklarowanych zmiennych. Zazwyczaj służy to do przechowywania tymczasowych danych w ramach przepływu pracy.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Zmienna”:

![Dodaj węzeł zmiennej](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Konfiguracja węzła

### Tryb

Węzeł zmiennej jest podobny do zmiennych w programowaniu; musi zostać zadeklarowany, zanim będzie można go użyć i przypisać mu wartość. Dlatego podczas tworzenia węzła zmiennej należy wybrać jego tryb. Dostępne są dwa tryby:

![Wybierz tryb](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Deklaruj nową zmienną: Tworzy nową zmienną.
- Przypisz do istniejącej zmiennej: Przypisuje wartość do zmiennej, która została zadeklarowana wcześniej w przepływie pracy, co jest równoznaczne ze zmianą wartości zmiennej.

Gdy tworzony węzeł jest pierwszym węzłem zmiennej w przepływie pracy, mogą Państwo wybrać tylko tryb deklaracji, ponieważ nie ma jeszcze żadnych zmiennych dostępnych do przypisania.

Gdy zdecydują się Państwo przypisać wartość do zadeklarowanej zmiennej, należy również wybrać zmienną docelową, czyli węzeł, w którym zmienna została zadeklarowana:

![Wybierz zmienną do przypisania wartości](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Wartość

Wartość zmiennej może być dowolnego typu. Może to być stała, taka jak ciąg znaków, liczba, wartość logiczna czy data, lub inna zmienna z przepływu pracy.

W trybie deklaracji, ustawienie wartości zmiennej jest równoznaczne z przypisaniem jej wartości początkowej.

![Deklaruj wartość początkową](https://static-docs.nocobase.com/4ce2c608986565ad537343013758c6a4.png)

W trybie przypisania, ustawienie wartości zmiennej jest równoznaczne ze zmianą wartości zadeklarowanej zmiennej docelowej na nową wartość. Kolejne użycia będą pobierać tę nową wartość.

![Przypisz zmienną wyzwalacza do zadeklarowanej zmiennej](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Używanie wartości zmiennej

W kolejnych węzłach po węźle zmiennej mogą Państwo użyć wartości zmiennej, wybierając zadeklarowaną zmienną z grupy „Zmienne węzła”. Na przykład, w węźle zapytania, proszę użyć wartości zmiennej jako warunku zapytania:

![Użyj wartości zmiennej jako warunku filtrowania zapytania](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Przykład

Bardziej użytecznym scenariuszem dla węzła zmiennej są rozgałęzienia, gdzie nowe wartości są obliczane lub łączone z poprzednimi wartościami (podobnie jak `reduce`/`concat` w programowaniu), a następnie wykorzystywane po zakończeniu rozgałęzienia. Poniżej przedstawiono przykład użycia rozgałęzienia pętli i węzła zmiennej do konkatenacji ciągu znaków odbiorców.

Najpierw proszę utworzyć przepływ pracy wyzwalany przez kolekcję, który uruchamia się po zaktualizowaniu danych „Artykułu” i wstępnie ładuje powiązane dane relacji „Autor” (w celu uzyskania odbiorców):

![Skonfiguruj wyzwalacz](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Następnie proszę utworzyć węzeł zmiennej, który będzie przechowywał ciąg znaków odbiorców:

![Węzeł zmiennej odbiorcy](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Kolejnym krokiem jest utworzenie węzła rozgałęzienia pętli, aby iterować po autorach artykułu i dołączać ich informacje o odbiorcach do zmiennej odbiorcy:

![Iteruj po autorach w artykule](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Wewnątrz rozgałęzienia pętli, proszę najpierw utworzyć węzeł obliczeniowy, aby połączyć bieżącego autora z już zapisanym ciągiem znaków autorów:

![Konkatenuj ciąg znaków odbiorcy](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Po węźle obliczeniowym proszę utworzyć kolejny węzeł zmiennej. Proszę wybrać tryb przypisania, jako cel przypisania wybrać węzeł zmiennej odbiorcy, a jako wartość wybrać wynik węzła obliczeniowego:

![Przypisz połączony ciąg znaków odbiorcy do węzła odbiorcy](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

W ten sposób, po zakończeniu rozgałęzienia pętli, zmienna odbiorcy będzie przechowywać ciąg znaków odbiorców wszystkich autorów artykułu. Następnie, po pętli, mogą Państwo użyć węzła żądania HTTP, aby wywołać interfejs API wysyłania wiadomości e-mail, przekazując wartość zmiennej odbiorcy jako parametr odbiorcy do interfejsu API:

![Wyślij wiadomość e-mail do odbiorców za pośrednictwem węzła żądania](https://static-docs.nocobase.com/37f71a63e172bcb2dce10a250947e.png)

W tym momencie prosta funkcja masowej wysyłki wiadomości e-mail została zaimplementowana za pomocą pętli i węzła zmiennej.