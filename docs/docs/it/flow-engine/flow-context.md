# Panoramica del Sistema di Contesto

Il sistema di contesto del motore di flusso di NocoBase è diviso in tre livelli, ognuno corrispondente a un ambito diverso. Un uso appropriato permette di ottenere una condivisione e un isolamento flessibili di servizi, configurazioni e dati, migliorando la manutenibilità e la scalabilità del business.

- **FlowEngineContext (Contesto Globale)**: Unico a livello globale, accessibile da tutti i modelli e i flussi di lavoro, è adatto per la registrazione di servizi e configurazioni globali, ecc.
- **FlowModelContext (Contesto del Modello)**: Utilizzato per la condivisione del contesto all'interno di un albero di modelli. I sottomodelli delegano automaticamente al contesto del modello padre, supportando la sovrascrittura di nomi identici. È adatto per l'isolamento logico e dei dati a livello di modello.
- **FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)**: Creato ogni volta che un flusso di lavoro viene eseguito, persiste per l'intero ciclo di esecuzione del flusso. È adatto per il passaggio di dati, l'archiviazione di variabili e la registrazione dello stato di esecuzione all'interno del flusso di lavoro. Supporta due modalità: `mode: 'runtime' | 'settings'`, che corrispondono rispettivamente alla modalità di esecuzione e alla modalità di configurazione.

Tutti i `FlowEngineContext` (Contesto Globale), `FlowModelContext` (Contesto del Modello), `FlowRuntimeContext` (Contesto di Esecuzione del Flusso di Lavoro), ecc., sono sottoclassi o istanze di `FlowContext`.

---

## 🗂️ Diagramma della Gerarchia

```text
FlowEngineContext (Contesto Globale)
│
├── FlowModelContext (Contesto del Modello)
│     ├── Sub FlowModelContext (Sottomodello)
│     │     ├── FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)
│     │     └── FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)
│     └── FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)
│
├── FlowModelContext (Contesto del Modello)
│     └── FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)
│
└── FlowModelContext (Contesto del Modello)
      ├── Sub FlowModelContext (Sottomodello)
      │     └── FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)
      └── FlowRuntimeContext (Contesto di Esecuzione del Flusso di Lavoro)
```

- Il `FlowModelContext` può accedere alle proprietà e ai metodi del `FlowEngineContext` tramite un meccanismo di delega, consentendo la condivisione delle capacità globali.
- Il `FlowModelContext` di un sottomodello può accedere al contesto del modello padre (relazione sincrona) tramite un meccanismo di delega, supportando la sovrascrittura di nomi identici.
- I modelli padre-figlio asincroni non stabiliscono una relazione di delega per evitare la corruzione dello stato.
- Il `FlowRuntimeContext` accede sempre al suo `FlowModelContext` corrispondente tramite un meccanismo di delega, ma non propaga le modifiche verso l'alto.

---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



## 🧭 Modalità di Esecuzione e di Configurazione (mode)

Il `FlowRuntimeContext` supporta due modalità, distinte dal parametro `mode`:

- `mode: 'runtime'` (Modalità di esecuzione): Utilizzata durante la fase di esecuzione effettiva del flusso di lavoro. Le proprietà e i metodi restituiscono dati reali. Ad esempio:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Modalità di configurazione): Utilizzata durante la fase di progettazione e configurazione del flusso di lavoro. L'accesso alle proprietà restituisce una stringa di template di variabile, facilitando la selezione di espressioni e variabili. Ad esempio:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Questo design a doppia modalità garantisce la disponibilità dei dati in fase di esecuzione e facilita il riferimento alle variabili e la generazione di espressioni durante la configurazione, migliorando la flessibilità e l'usabilità del motore di flusso.