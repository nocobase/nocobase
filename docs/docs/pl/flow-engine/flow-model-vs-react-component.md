:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# FlowModel a React.Component

## Porównanie podstawowych zadań

| Cecha/Możliwość         | `React.Component`       | `FlowModel`                            |
| ------------------- | ----------------------- | -------------------------------------- |
| Zdolność renderowania | Tak, metoda `render()` generuje UI    | Tak, metoda `render()` generuje UI                   |
| Zarządzanie stanem    | Wbudowane `state` i `setState` | Wykorzystuje `props`, ale zarządzanie stanem w większym stopniu opiera się na strukturze drzewa modeli               |
| Cykl życia          | Tak, np. `componentDidMount` | Tak, np. `onInit`, `onMount`, `onUnmount`     |
| Przeznaczenie         | Budowanie komponentów UI                | Budowanie zorientowanych na dane, opartych na przepływach pracy, ustrukturyzowanych „drzew modeli”                   |
| Struktura danych      | Drzewo komponentów                     | Drzewo modeli (obsługuje modele rodzic-dziecko, Fork dla wielu instancji)                   |
| Elementy potomne      | Użycie JSX do zagnieżdżania komponentów             | Użycie `setSubModel`/`addSubModel` do jawnego ustawiania modeli potomnych |
| Dynamiczne zachowanie | Wiązanie zdarzeń, aktualizacje stanu napędzają UI          | Rejestrowanie/wysyłanie przepływów pracy, obsługa automatycznych przepływów                      |
| Trwałość            | Brak wbudowanego mechanizmu                   | Obsługuje trwałość (np. `model.save()`)                |
| Obsługa Fork (wielokrotne renderowanie) | Nie (wymaga ręcznego ponownego użycia)                | Tak (`createFork` dla wielu instancji)                   |
| Kontrola silnika      | Brak                       | Tak, zarządzany, rejestrowany i ładowany przez `FlowEngine`              |

## Porównanie cykli życia

| Hak cyklu życia | `React.Component`                 | `FlowModel`                                  |
| ----------- | --------------------------------- | -------------------------------------------- |
| Inicjalizacja    | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Odmontowanie     | `componentWillUnmount`            | `onUnmount`                                  |
| Reagowanie na dane wejściowe   | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Obsługa błędów   | `componentDidCatch`               | `onAutoFlowsError`                      |

## Porównanie struktur budowy

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Drzewo komponentów a drzewo modeli

*   **Drzewo komponentów React**: Drzewo renderowania interfejsu użytkownika, tworzone przez zagnieżdżony JSX w czasie wykonania.
*   **Drzewo modeli FlowModel**: Drzewo struktury logicznej zarządzane przez FlowEngine, które może być utrwalane i umożliwia dynamiczną rejestrację oraz kontrolę modeli potomnych. Nadaje się do budowania bloków stron, przepływów akcji, modeli danych itp.

## Funkcje specjalne (specyficzne dla FlowModel)

| Funkcja                               | Opis                     |
| ------------------------------------- | ---------------------- |
| `registerFlow`                        | Rejestracja przepływu pracy             |
| `applyFlow` / `dispatchEvent`         | Wykonanie/wyzwolenie przepływu pracy             |
| `setSubModel` / `addSubModel`         | Jawna kontrola tworzenia i wiązania modeli potomnych          |
| `createFork`                          | Obsługuje ponowne wykorzystanie logiki modelu do wielokrotnego renderowania (np. dla każdego wiersza w tabeli) |
| `openFlowSettings`                    | Ustawienia kroku przepływu pracy |
| `save` / `saveStepParams()`           | Model może być utrwalany i integrowany z zapleczem           |

## Podsumowanie

| Element   | React.Component | FlowModel              |
| --------- | --------------- | ---------------------- |
| Odpowiednie scenariusze | Organizacja komponentów warstwy UI        | Zarządzanie przepływami pracy i blokami opartymi na danych           |
| Główna idea | Deklaratywny interfejs użytkownika          | Ustrukturyzowany przepływ pracy oparty na modelach             |
| Metoda zarządzania | React kontroluje cykl życia    | FlowModel kontroluje cykl życia i strukturę modelu |
| Zalety    | Bogaty ekosystem i zestaw narzędzi        | Silna strukturyzacja, przepływy pracy mogą być utrwalane, modele potomne są kontrolowalne      |

> FlowModel może być używany komplementarnie z React: React jest wykorzystywany do renderowania w ramach FlowModel, podczas gdy jego cykl życia i struktura są zarządzane przez FlowEngine.