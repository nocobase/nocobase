---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Komunikat zwrotny

## Wprowadzenie

Węzeł komunikatu zwrotnego służy do przesyłania niestandardowych wiadomości z przepływu pracy z powrotem do klienta, który zainicjował akcję, w określonych typach przepływów pracy.

:::info{title=Uwaga}
Obecnie węzeł ten jest obsługiwany w przepływach pracy typu „Zdarzenie przed akcją” i „Zdarzenie niestandardowej akcji” działających w trybie synchronicznym.
:::

## Tworzenie węzła

W obsługiwanych typach przepływów pracy mogą Państwo dodać węzeł „Komunikat zwrotny” w dowolnym miejscu. Aby to zrobić, proszę kliknąć przycisk plusa („+”) w przepływie pracy:

![Dodawanie węzła](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Komunikat zwrotny istnieje jako tablica przez cały proces żądania. Za każdym razem, gdy węzeł komunikatu zwrotnego zostanie wykonany w przepływie pracy, nowa treść komunikatu jest dodawana do tej tablicy. Gdy serwer wysyła odpowiedź, wszystkie komunikaty są przesyłane do klienta jednocześnie.

## Konfiguracja węzła

Treść komunikatu to ciąg znaków szablonu, w którym można wstawiać zmienne. Mogą Państwo dowolnie organizować tę treść szablonu w konfiguracji węzła:

![Konfiguracja węzła](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Gdy przepływ pracy dotrze do tego węzła, szablon zostanie przeanalizowany, aby wygenerować treść komunikatu. W powyższej konfiguracji zmienna „Zmienna lokalna / Pętla wszystkich produktów / Obiekt pętli / Produkt / Tytuł” zostanie zastąpiona konkretną wartością w rzeczywistym przepływie pracy, na przykład:

```
Brak produktu „iPhone 14 pro” w magazynie
```

![Treść komunikatu](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Konfiguracja przepływu pracy

Status komunikatu zwrotnego zależy od tego, czy wykonanie przepływu pracy zakończyło się sukcesem, czy niepowodzeniem. Niepowodzenie wykonania dowolnego węzła spowoduje awarię całego przepływu pracy. W takiej sytuacji treść komunikatu zostanie zwrócona klientowi ze statusem błędu i wyświetlona.

Jeśli chcą Państwo aktywnie zdefiniować stan błędu w przepływie pracy, mogą Państwo użyć „Węzła końcowego” i skonfigurować go jako stan błędu. Po wykonaniu tego węzła przepływ pracy zakończy się ze statusem błędu, a komunikat zostanie zwrócony klientowi ze statusem błędu.

Jeśli cały przepływ pracy nie wygeneruje stanu błędu i zostanie pomyślnie wykonany do końca, treść komunikatu zostanie zwrócona klientowi ze statusem sukcesu.

:::info{title=Uwaga}
Jeśli w przepływie pracy zdefiniowano wiele węzłów komunikatu zwrotnego, wykonane węzły dodadzą treść komunikatu do tablicy. Ostatecznie, po zwróceniu do klienta, cała treść komunikatu zostanie zwrócona i wyświetlona jednocześnie.
:::

## Scenariusze użycia

### Przepływ pracy „Zdarzenie przed akcją”

Użycie komunikatu zwrotnego w przepływie pracy „Zdarzenie przed akcją” umożliwia wysłanie odpowiedniego komunikatu zwrotnego do klienta po zakończeniu przepływu pracy. Aby uzyskać szczegółowe informacje, proszę zapoznać się z [Zdarzeniem przed akcją](../triggers/pre-action.md).

### Przepływ pracy „Zdarzenie niestandardowej akcji”

Użycie komunikatu zwrotnego w „Zdarzeniu niestandardowej akcji” w trybie synchronicznym umożliwia wysłanie odpowiedniego komunikatu zwrotnego do klienta po zakończeniu przepływu pracy. Aby uzyskać szczegółowe informacje, proszę zapoznać się z [Zdarzeniem niestandardowej akcji](../triggers/custom-action.md).