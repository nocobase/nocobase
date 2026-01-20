---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Obliczenia JSON

## Wprowadzenie

W oparciu o różne silniki obliczeń JSON, ten węzeł pozwala na przetwarzanie lub transformację złożonych danych JSON generowanych przez poprzedzające węzły, tak aby mogły być wykorzystane przez kolejne etapy przepływu pracy. Przykładowo, wyniki operacji SQL lub żądań HTTP mogą zostać przekształcone w wymagane wartości i formaty zmiennych, co ułatwi ich dalsze użycie.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w procesie, aby dodać węzeł „Obliczenia JSON”:

![Tworzenie węzła](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Wskazówka}
Zazwyczaj węzeł Obliczenia JSON tworzy się poniżej innych węzłów danych, aby móc je przetwarzać.
:::

## Konfiguracja węzła

### Silnik parsowania

Węzeł Obliczenia JSON obsługuje różne składnie dzięki różnym silnikom parsowania. Mogą Państwo wybrać silnik w zależności od swoich preferencji i specyfiki każdego z nich. Obecnie obsługiwane są trzy silniki parsowania:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Wybór silnika](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Źródło danych

Źródłem danych może być wynik poprzedzającego węzła lub obiekt danych w kontekście przepływu pracy. Zazwyczaj jest to obiekt danych bez wbudowanej struktury, na przykład wynik węzła SQL lub węzła żądania HTTP.

![Źródło danych](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Wskazówka}
Zazwyczaj obiekty danych z węzłów związanych z kolekcjami są już ustrukturyzowane za pomocą informacji konfiguracyjnych kolekcji i zazwyczaj nie wymagają parsowania przez węzeł Obliczenia JSON.
:::

### Wyrażenie parsowania

Niestandardowe wyrażenia parsowania, dostosowane do wymagań parsowania i wybranego silnika parsowania.

![Wyrażenie parsowania](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Wskazówka}
Różne silniki oferują różne składnie parsowania. Szczegóły znajdą Państwo w dokumentacji dostępnej pod linkami.
:::

Od wersji `v1.0.0-alpha.15` wyrażenia obsługują zmienne. Zmienne są wstępnie parsowane przed wykonaniem przez konkretny silnik, zastępując je określonymi wartościami tekstowymi zgodnie z regułami szablonów ciągów znaków, a następnie łączone z innymi statycznymi ciągami w wyrażeniu, tworząc ostateczne wyrażenie. Ta funkcja jest bardzo przydatna, gdy trzeba dynamicznie budować wyrażenia, na przykład gdy część zawartości JSON wymaga dynamicznego klucza do parsowania.

### Mapowanie właściwości

Gdy wynikiem obliczeń jest obiekt (lub tablica obiektów), mogą Państwo dalej mapować wymagane właściwości na zmienne podrzędne za pomocą mapowania właściwości, aby mogły być użyte przez kolejne węzły.

![Mapowanie właściwości](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Wskazówka}
Dla wyniku będącego obiektem (lub tablicą obiektów), jeśli mapowanie właściwości nie zostanie wykonane, cały obiekt (lub tablica obiektów) zostanie zapisany jako pojedyncza zmienna w wyniku węzła, a wartości właściwości obiektu nie będą mogły być używane bezpośrednio jako zmienne.
:::

## Przykład

Załóżmy, że dane do parsowania pochodzą z poprzedzającego węzła SQL, który służy do pobierania danych, a jego wynikiem jest zestaw danych zamówień:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Jeśli chcemy sparsować i obliczyć całkowitą cenę dwóch zamówień z danych, a następnie połączyć ją z odpowiadającym ID zamówienia w obiekt, aby zaktualizować całkowitą cenę zamówienia, możemy to skonfigurować w następujący sposób:

![Przykład - Konfiguracja parsowania SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Proszę wybrać silnik parsowania JSONata;
2. Proszę wybrać wynik węzła SQL jako źródło danych;
3. Proszę użyć wyrażenia JSONata `$[0].{"id": id, "total": products.(price * quantity)}` do parsowania;
4. Proszę wybrać mapowanie właściwości, aby zmapować `id` i `total` na zmienne podrzędne;

Ostateczny wynik parsowania jest następujący:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Następnie, proszę iterować przez wynikową tablicę zamówień, aby zaktualizować całkowitą cenę zamówień.

![Aktualizacja całkowitej ceny odpowiadającego zamówienia](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)