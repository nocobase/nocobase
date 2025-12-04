---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wywoływanie przepływu pracy

## Wprowadzenie

Umożliwia Panu/Pani wywoływanie innych przepływów pracy z poziomu bieżącego przepływu pracy. Może Pan/Pani wykorzystać zmienne z obecnego przepływu pracy jako dane wejściowe dla podprzepływu pracy, a następnie użyć danych wyjściowych podprzepływu pracy jako zmiennych w bieżącym przepływie pracy, w kolejnych węzłach.

Proces wywoływania przepływu pracy przedstawiono na poniższym rysunku:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Wywoływanie przepływów pracy pozwala Panu/Pani na ponowne wykorzystanie wspólnej logiki procesów, takiej jak wysyłanie e-maili, SMS-ów itp., lub na podzielenie złożonego przepływu pracy na wiele podprzepływów pracy, co ułatwia zarządzanie i konserwację.

Zasadniczo, przepływ pracy nie rozróżnia, czy dany proces jest podprzepływem pracy. Dowolny przepływ pracy może zostać wywołany jako podprzepływ pracy przez inne przepływy pracy, a także może wywoływać inne przepływy pracy. Wszystkie przepływy pracy są sobie równe; istnieje jedynie relacja wywołującego i wywoływanego.

Podobnie, wywoływanie przepływu pracy odbywa się w dwóch miejscach:

1.  W głównym przepływie pracy: Jako podmiot wywołujący, poprzez węzeł „Wywołaj przepływ pracy”, wywołuje inne przepływy pracy.
2.  W podprzepływie pracy: Jako podmiot wywoływany, poprzez węzeł „Wyjście przepływu pracy”, zapisuje zmienne, które mają zostać wyprowadzone z bieżącego przepływu pracy. Mogą one być następnie użyte przez kolejne węzły w przepływie pracy, który go wywołał.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie pracy, aby dodać węzeł „Wywołaj przepływ pracy”:

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Konfiguracja węzła

### Wybór przepływu pracy

Proszę wybrać przepływ pracy do wywołania. Może Pan/Pani skorzystać z pola wyszukiwania, aby szybko go znaleźć:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Wskazówka}
*   Wyłączone przepływy pracy również mogą być wywoływane jako podprzepływy pracy.
*   Gdy bieżący przepływ pracy działa w trybie synchronicznym, może on wywoływać tylko podprzepływy pracy, które również działają w trybie synchronicznym.
:::

### Konfiguracja zmiennych wyzwalacza przepływu pracy

Po wybraniu przepływu pracy, należy również skonfigurować zmienne wyzwalacza jako dane wejściowe do uruchomienia podprzepływu pracy. Może Pan/Pani bezpośrednio wybrać dane statyczne lub zmienne z bieżącego przepływu pracy:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Różne typy wyzwalaczy wymagają różnych zmiennych, które można skonfigurować w formularzu zgodnie z potrzebami.

## Węzeł wyjścia przepływu pracy

Proszę zapoznać się z treścią węzła [Wyjście przepływu pracy](./output.md), aby skonfigurować zmienne wyjściowe podprzepływu pracy.

## Używanie wyjścia przepływu pracy

Wracając do głównego przepływu pracy, w innych węzłach znajdujących się poniżej węzła „Wywołaj przepływ pracy”, gdy chce Pan/Pani użyć wartości wyjściowej podprzepływu pracy, może Pan/Pani wybrać wynik węzła „Wywołaj przepływ pracy”. Jeśli podprzepływ pracy zwraca prostą wartość, taką jak ciąg znaków, liczba, wartość logiczna, data (data jest ciągiem znaków w formacie UTC) itp., można jej użyć bezpośrednio. Jeśli jest to złożony obiekt (np. obiekt z kolekcji), należy go najpierw zmapować za pomocą węzła parsowania JSON, zanim będzie można użyć jego właściwości; w przeciwnym razie można go użyć tylko jako całości.

Jeśli podprzepływ pracy nie ma skonfigurowanego węzła wyjścia przepływu pracy lub nie zwraca żadnej wartości, wówczas podczas używania wyniku węzła „Wywołaj przepływ pracy” w głównym przepływie pracy, otrzyma Pan/Pani jedynie wartość pustą (`null`).