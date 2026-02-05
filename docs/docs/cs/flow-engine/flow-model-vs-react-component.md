:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# FlowModel vs React.Component

## Srovnání základních zodpovědností

| Funkce/Schopnost         | `React.Component`       | `FlowModel`                            |
| ------------------------ | ----------------------- | -------------------------------------- |
| Schopnost vykreslování   | Ano, metoda `render()` generuje UI    | Ano, metoda `render()` generuje UI                   |
| Správa stavu             | Vestavěný `state` a `setState` | Používá `props`, ale správa stavu více závisí na struktuře stromu modelu               |
| Životní cyklus           | Ano, např. `componentDidMount` | Ano, např. `onInit`, `onMount`, `onUnmount`     |
| Účel                     | Vytváření UI komponent                | Vytváření datově řízených, na pracovních postupech založených, strukturovaných „stromů modelů“                   |
| Datová struktura         | Strom komponent                     | Strom modelů (podporuje rodičovské-dětské modely, vícenásobné instance Fork)                   |
| Dětské komponenty        | Používání JSX pro vnořování komponent             | Používání `setSubModel`/`addSubModel` pro explicitní nastavení podmodelů |
| Dynamické chování        | Vázání událostí, aktualizace stavu řídí UI          | Registrace/odesílání pracovních postupů, zpracování automatických pracovních postupů                      |
| Perzistence              | Žádný vestavěný mechanismus                   | Podporuje perzistenci (např. `model.save()`)                |
| Podporuje Fork (vícenásobné vykreslování) | Ne (vyžaduje ruční opětovné použití)                | Ano (`createFork` pro vícenásobné instanciace)                   |
| Řízení enginem           | Žádné                       | Ano, spravováno, registrováno a načítáno `FlowEngine`              |

## Srovnání životního cyklu

| Háček životního cyklu | `React.Component`                 | `FlowModel`                                  |
| -------------------- | --------------------------------- | -------------------------------------------- |
| Inicializace         | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Odpojení             | `componentWillUnmount`            | `onUnmount`                                  |
| Reakce na vstup      | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Zpracování chyb      | `componentDidCatch`               | `onAutoFlowsError`                      |

## Srovnání struktury konstrukce

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

## Strom komponent vs Strom modelů

*   **Strom komponent React**: Strom vykreslování UI tvořený vnořeným JSX za běhu.
*   **Strom modelů FlowModel**: Strom logické struktury spravovaný FlowEngine, který lze perzistovat a umožňuje dynamickou registraci a řízení podmodelů. Je vhodný pro vytváření bloků stránek, akčních pracovních postupů, datových modelů atd.

## Speciální funkce (specifické pro FlowModel)

| Funkce                               | Popis                     |
| ------------------------------------ | ------------------------- |
| `registerFlow`                       | Registrace pracovního postupu             |
| `applyFlow` / `dispatchEvent`        | Spuštění/vyvolání pracovního postupu             |
| `setSubModel` / `addSubModel`        | Explicitní řízení vytváření a vázání podmodelů          |
| `createFork`                         | Podporuje opětovné použití logiky modelu pro vícenásobné vykreslování (např. každý řádek v tabulce) |
| `openFlowSettings`                   | Nastavení kroku pracovního postupu |
| `save` / `saveStepParams()`          | Model lze perzistovat a integrovat s backendem           |

## Souhrn

| Položka          | React.Component        | FlowModel                      |
| ---------------- | ---------------------- | ------------------------------ |
| Vhodné scénáře   | Organizace komponent na úrovni UI        | Datově řízená správa pracovních postupů a bloků           |
| Klíčová myšlenka | Deklarativní UI          | Modelově řízený strukturovaný pracovní postup             |
| Metoda správy    | React řídí životní cyklus    | FlowModel řídí životní cyklus a strukturu modelu |
| Výhody           | Bohatý ekosystém a nástroje        | Silně strukturované, pracovní postupy lze perzistovat, podmodely jsou řiditelné      |

> FlowModel lze s Reactem používat komplementárně: React použijte pro vykreslování uvnitř FlowModelu, zatímco jeho životní cyklus a struktura jsou spravovány FlowEngine.