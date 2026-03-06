:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/flow-engine/flow-context).
:::

# Panoramica del sistema di contesto

Il sistema di contesto del motore di flusso di NocoBase è diviso in tre livelli, corrispondenti a diversi ambiti di applicazione. Utilizzandoli correttamente, Lei potrà realizzare una condivisione e un isolamento flessibili di servizi, configurazioni e dati, migliorando la manutenibilità e la scalabilità del business.

- **FlowEngineContext (contesto globale)**: unico a livello globale, accessibile da tutti i modelli e flussi di lavoro, è adatto per la registrazione di servizi globali, configurazioni, ecc.
- **FlowModelContext (contesto del modello)**: utilizzato per la condivisione del contesto all'interno dell'albero dei modelli; i sottomodelli delegano automaticamente al contesto del modello padre, supportando la sovrascrittura con lo stesso nome; è adatto per l'isolamento della logica e dei dati a livello di modello.
- **FlowRuntimeContext (contesto di runtime del flusso)**: creato a ogni esecuzione del flusso, attraversa l'intero ciclo di esecuzione; è adatto per il passaggio di dati, l'archiviazione di variabili, la registrazione dello stato di esecuzione, ecc. Supporta due modalità `mode: 'runtime' | 'settings'`, corrispondenti rispettivamente allo stato di esecuzione e allo stato di configurazione.

Tutti i `FlowEngineContext` (contesto globale), `FlowModelContext` (contesto del modello), `FlowRuntimeContext` (contesto di runtime del flusso), ecc., sono sottoclassi o istanze di `FlowContext`.

---

## 🗂️ Diagramma della struttura gerarchica

```text
FlowEngineContext (contesto globale)
│
├── FlowModelContext (contesto del modello)
│     ├── FlowModelContext figlio (sottomodello)
│     │     ├── FlowRuntimeContext (contesto di runtime del flusso)
│     │     └── FlowRuntimeContext (contesto di runtime del flusso)
│     └── FlowRuntimeContext (contesto di runtime del flusso)
│
├── FlowModelContext (contesto del modello)
│     └── FlowRuntimeContext (contesto di runtime del flusso)
│
└── FlowModelContext (contesto del modello)
      ├── FlowModelContext figlio (sottomodello)
      │     └── FlowRuntimeContext (contesto di runtime del flusso)
      └── FlowRuntimeContext (contesto di runtime del flusso)
```

- `FlowModelContext` può accedere alle proprietà e ai metodi di `FlowEngineContext` tramite un meccanismo di delega (delegate), realizzando la condivisione delle capacità globali.
- Il `FlowModelContext` del sottomodello può accedere al contesto del modello padre tramite un meccanismo di delega (delegate) (relazione sincrona), supportando la sovrascrittura con lo stesso nome.
- I modelli padre-figlio asincroni non stabiliscono una relazione di delega (delegate) per evitare la contaminazione dello stato.
- `FlowRuntimeContext` accede sempre al relativo `FlowModelContext` tramite un meccanismo di delega (delegate), ma non trasmette i dati verso l'alto.

---

## 🧭 Stato di esecuzione e di configurazione (mode)

`FlowRuntimeContext` supporta due modalità, distinte dal parametro `mode`:

- `mode: 'runtime'` (stato di esecuzione): utilizzato nella fase di esecuzione effettiva del flusso, dove proprietà e metodi restituiscono dati reali. Ad esempio:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (stato di configurazione): utilizzato nella fase di progettazione e configurazione del flusso, dove l'accesso alle proprietà restituisce stringhe di template delle variabili, facilitando la selezione di espressioni e variabili. Ad esempio:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Questo design a doppia modalità garantisce sia la disponibilità dei dati a runtime, sia la facilità di riferimento alle variabili e di generazione di espressioni in fase di configurazione, migliorando la flessibilità e la facilità d'uso del motore di flusso.

---

## 🤖 Informazioni di contesto per strumenti/LLM

In alcuni scenari (come l'editing del codice RunJS in JS*Model, AI coding), è necessario che il "chiamante" comprenda quanto segue senza eseguire il codice:

- Quali **capacità statiche** sono presenti nel `ctx` corrente (documentazione API, parametri, esempi, link alla documentazione, ecc.)
- Quali **variabili opzionali** sono presenti nell'interfaccia/stato di esecuzione corrente (ad esempio "record corrente", "record del popup corrente" e altre strutture dinamiche)
- Uno **snapshot di piccole dimensioni** dell'ambiente di esecuzione corrente (utilizzato per i prompt)

### 1) `await ctx.getApiInfos(options?)` (informazioni API statiche)

### 2) `await ctx.getVarInfos(options?)` (informazioni sulla struttura delle variabili)

- Costruito sulla base di `defineProperty(...).meta` (incluso meta factory)
- Supporta il ritaglio del percorso `path` e il controllo della profondità `maxDepth`
- Si espande verso il basso solo quando necessario

Parametri comuni:

- `maxDepth`: livello massimo di espansione (predefinito 3)
- `path: string | string[]`: ritaglio, emette solo il sottoalbero del percorso specificato

### 3) `await ctx.getEnvInfos()` (snapshot dell'ambiente di runtime)

Struttura del nodo (semplificata):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Può essere usato direttamente per await ctx.getVar(getVar), inizia con "ctx."
  value?: any; // Valore statico risolto/serializzabile
  properties?: Record<string, EnvNode>;
};
```