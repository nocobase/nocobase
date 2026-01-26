:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# FlowModel kontra React.Component

## Jämförelse av grundläggande ansvarsområden

| Egenskap/Förmåga      | `React.Component`                  | `FlowModel`                                  |
| --------------------- | ---------------------------------- | -------------------------------------------- |
| Renderingsförmåga     | Ja, `render()`-metoden genererar UI | Ja, `render()`-metoden genererar UI          |
| Tillståndshantering   | Inbyggd `state` och `setState`     | Använder `props`, men tillståndshanteringen är mer beroende av modellträdstrukturen |
| Livscykel             | Ja, t.ex. `componentDidMount`      | Ja, t.ex. `onInit`, `onMount`, `onUnmount`   |
| Syfte                 | Bygga UI-komponenter               | Bygga datadrivna, flödesbaserade, strukturerade "modellträd" |
| Datastruktur          | Komponentträd                      | Modellträd (stöder förälder-barn-modeller, flera instanser (Fork)) |
| Underkomponenter      | Använder JSX för att kapsla in komponenter | Använder `setSubModel`/`addSubModel` för att explicit ange undermodeller |
| Dynamiskt beteende    | Händelsebindning, tillståndsuppdateringar driver UI | Registrerar/skickar flöden, hanterar automatiska flöden |
| Persistens            | Ingen inbyggd mekanism             | Stöder persistens (t.ex. `model.save()`)      |
| Stöder Fork (flera renderingar) | Nej (kräver manuell återanvändning) | Ja (`createFork` för flera instansieringar)  |
| Motorstyrning         | Ingen                              | Ja, hanteras, registreras och laddas av `FlowEngine` |

## Jämförelse av livscykler

| Livscykelkrok | `React.Component`                 | `FlowModel`                                  |
| ------------- | --------------------------------- | -------------------------------------------- |
| Initialisering | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Avmontering   | `componentWillUnmount`            | `onUnmount`                                  |
| Svara på indata | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Felhantering  | `componentDidCatch`               | `onAutoFlowsError`                      |

## Jämförelse av konstruktionsstruktur

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

## Komponentträd kontra modellträd

*   **React-komponentträd**: Ett UI-renderingsträd som bildas av kapslad JSX vid körning.
*   **FlowModel-modellträd**: Ett logiskt strukturträd som hanteras av FlowEngine, vilket kan persisteras och tillåter dynamisk registrering och kontroll av undermodeller. Lämpligt för att bygga sidblock, åtgärdsflöden, datamodeller, etc.

## Specialfunktioner (unika för FlowModel)

| Funktion                      | Beskrivning                                  |
| ----------------------------- | -------------------------------------------- |
| `registerFlow`                | Registrera flöde                             |
| `applyFlow` / `dispatchEvent` | Utföra/utlösa flöde                          |
| `setSubModel` / `addSubModel` | Explicit kontroll över skapande och bindning av undermodeller |
| `createFork`                  | Stöder återanvändning av en modells logik för flera renderingar (t.ex. varje rad i en tabell) |
| `openFlowSettings`            | Inställningar för flödessteg                 |
| `save` / `saveStepParams()`   | Modellen kan persisteras och integreras med backend |

## Sammanfattning

| Post          | React.Component             | FlowModel                       |
| ------------- | --------------------------- | ------------------------------- |
| Lämpliga scenarier | Organisation av UI-lagerkomponenter | Datadriven flödes- och blockhantering |
| Kärnidén      | Deklarativt UI              | Modelldrivet strukturerat flöde |
| Hanteringsmetod | React kontrollerar livscykeln | FlowModel kontrollerar modellens livscykel och struktur |
| Fördelar      | Rikt ekosystem och verktygskedja | Starkt strukturerad, flöden kan persisteras, undermodeller är kontrollerbara |

> FlowModel kan användas komplementärt med React: Använd React för rendering inom en FlowModel, medan dess livscykel och struktur hanteras av FlowEngine.