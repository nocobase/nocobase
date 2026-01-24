:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel vs React.Component

## Vergelijking van basisverantwoordelijkheden

| Functie/Mogelijkheid         | `React.Component`       | `FlowModel`                            |
| ----------------------- | ----------------------- | -------------------------------------- |
| Weergavemogelijkheid          | Ja, de `render()` methode genereert UI    | Ja, de `render()` methode genereert UI                   |
| Statusbeheer          | Ingebouwde `state` en `setState` | Gebruikt `props`, maar statusbeheer is meer afhankelijk van de modelboomstructuur               |
| Levenscyclus          | Ja, bijv. `componentDidMount` | Ja, bijv. `onInit`, `onMount`, `onUnmount`     |
| Doel            | Bouwen van UI-componenten                | Bouwen van datagedreven, flow-gebaseerde, gestructureerde "modelbomen"                   |
| Datastructuur          | Componentboom                     | Modelboom (ondersteunt ouder-kindmodellen, multi-instantie Fork)                   |
| Kindcomponenten           | Gebruikt JSX om componenten te nesten             | Gebruikt `setSubModel`/`addSubModel` om submodellen expliciet in te stellen |
| Dynamisch gedrag          | Gebeurtenisbinding, statusupdates sturen UI aan          | Registreren/dispatchen van flows, afhandelen van automatische flows                      |
| Persistentie           | Geen ingebouwd mechanisme                   | Ondersteunt persistentie (bijv. `model.save()`)                |
| Ondersteunt Fork (meerdere weergaven) | Nee (vereist handmatig hergebruik)                | Ja (`createFork` voor meerdere instantiaties)                   |
| Engine-besturing          | Geen                       | Ja, beheerd, geregistreerd en geladen door `FlowEngine`              |

## Levenscyclusvergelijking

| Levenscyclus-hook | `React.Component`                 | `FlowModel`                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| Initialisatie    | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Ontkoppelen     | `componentWillUnmount`            | `onUnmount`                                  |
| Reageren op invoer   | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Foutafhandeling   | `componentDidCatch`               | `onAutoFlowsError`                      |

## Vergelijking van opbouwstructuur

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

## Componentboom vs Modelboom

*   **React Componentboom**: Een UI-weergaveboom die tijdens runtime wordt gevormd door geneste JSX.
*   **FlowModel Modelboom**: Een logische structuurboom die wordt beheerd door FlowEngine, die persistent kan worden gemaakt en dynamische registratie en besturing van submodellen mogelijk maakt. Geschikt voor het bouwen van paginablokken, actie-flows, datamodellen, enz.

## Speciale functies (specifiek voor FlowModel)

| Functie                               | Beschrijving                     |
| -------------------------------- | ---------------------- |
| `registerFlow`                 | Registreer flow             |
| `applyFlow` / `dispatchEvent` | Voer flow uit / activeer flow             |
| `setSubModel` / `addSubModel`         | Expliciet de aanmaak en koppeling van submodellen beheren          |
| `createFork`                          | Ondersteunt het hergebruiken van de logica van een model voor meerdere weergaven (bijv. elke rij in een tabel) |
| `openFlowSettings`                    | Flow-stapinstellingen |
| `save` / `saveStepParams()`           | Het model kan persistent worden gemaakt en geïntegreerd met de backend           |

## Samenvatting

| Onderdeel   | React.Component | FlowModel              |
| ---- | --------------- | ---------------------- |
| Geschikte scenario's | Organisatie van UI-laagcomponenten        | Datagedreven flow- en blokbeheer           |
| Kernidee | Declaratieve UI          | Modelgedreven gestructureerde flow             |
| Beheermethode | React beheert de levenscyclus    | FlowModel beheert de levenscyclus en structuur van het model |
| Voordelen   | Rijk ecosysteem en toolchain        | Sterk gestructureerd, flows kunnen persistent worden gemaakt, submodellen zijn controleerbaar      |

> FlowModel kan complementair met React worden gebruikt: u gebruikt React voor de rendering binnen een FlowModel, terwijl de levenscyclus en structuur ervan worden beheerd door FlowEngine.