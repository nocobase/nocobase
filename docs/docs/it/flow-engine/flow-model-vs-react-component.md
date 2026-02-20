:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# FlowModel vs React.Component

## Confronto delle Responsabilità Fondamentali

| Caratteristica/Capacità | `React.Component` | `FlowModel` |
| --- | --- | --- |
| Capacità di Rendering | Sì, il metodo `render()` genera l'interfaccia utente | Sì, il metodo `render()` genera l'interfaccia utente |
| Gestione dello Stato | `state` e `setState` integrati | Utilizza i `props`, ma la gestione dello stato si basa maggiormente sulla struttura ad albero del modello |
| Ciclo di Vita | Sì, ad es. `componentDidMount` | Sì, ad es. `onInit`, `onMount`, `onUnmount` |
| Scopo | Creazione di componenti UI | Creazione di "alberi di modelli" strutturati, basati sui dati e orientati al flusso |
| Struttura Dati | Albero dei componenti | Albero dei modelli (supporta modelli padre-figlio, Fork multi-istanza) |
| Componenti Figlio | Utilizzo di JSX per annidare i componenti | Utilizzo di `setSubModel`/`addSubModel` per impostare esplicitamente i sotto-modelli |
| Comportamento Dinamico | Binding degli eventi, aggiornamenti dello stato che guidano l'interfaccia utente | Registrazione/dispatch di `Flow`, gestione dei flussi automatici |
| Persistenza | Nessun meccanismo integrato | Supporta la persistenza (ad es. `model.save()`) |
| Supporta il Fork (rendering multipli) | No (richiede il riutilizzo manuale) | Sì (`createFork` per istanze multiple) |
| Controllo del Motore | Nessuno | Sì, gestito, registrato e caricato da `FlowEngine` |

## Confronto del Ciclo di Vita

| Hook del Ciclo di Vita | `React.Component` | `FlowModel` |
| --- | --- | --- |
| Inizializzazione | `constructor`, `componentDidMount` | `onInit`, `onMount` |
| Smontaggio | `componentWillUnmount` | `onUnmount` |
| Risposta all'Input | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Gestione degli Errori | `componentDidCatch` | `onAutoFlowsError` |

## Confronto della Struttura di Costruzione

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

## Albero dei Componenti vs Albero dei Modelli

*   **Albero dei Componenti React**: Un albero di rendering dell'interfaccia utente formato dall'annidamento di JSX in fase di esecuzione.
*   **Albero dei Modelli FlowModel**: Un albero di struttura logica gestito da `FlowEngine`, che può essere reso persistente e consente la registrazione dinamica e il controllo dei sotto-modelli. È adatto per la creazione di blocchi di pagina, flussi di azioni, modelli di dati, ecc.

## Funzionalità Speciali (Specifiche di FlowModel)

| Funzione | Descrizione |
| --- | --- |
| `registerFlow` | Registra un flusso |
| `applyFlow` / `dispatchEvent` | Esegue/attiva un flusso |
| `setSubModel` / `addSubModel` | Controlla esplicitamente la creazione e il binding dei sotto-modelli |
| `createFork` | Supporta il riutilizzo della logica di un modello per rendering multipli (ad es. ogni riga di una tabella) |
| `openFlowSettings` | Impostazioni dei passaggi del flusso |
| `save` / `saveStepParams()` | Il modello può essere reso persistente e integrato con il backend |

## Riepilogo

| Elemento | React.Component | FlowModel |
| --- | --- | --- |
| Scenari Adatti | Organizzazione dei componenti a livello UI | Gestione di flussi e blocchi basati sui dati |
| Idea Centrale | UI dichiarativa | Flusso strutturato basato su modello |
| Metodo di Gestione | React controlla il ciclo di vita | FlowModel controlla il ciclo di vita e la struttura del modello |
| Vantaggi | Ricco ecosistema e toolchain | Fortemente strutturato, flussi persistenti, sotto-modelli controllabili |

> FlowModel può essere utilizzato in modo complementare con React: si usa React per il rendering all'interno di un FlowModel, mentre il suo ciclo di vita e la sua struttura sono gestiti da `FlowEngine`.