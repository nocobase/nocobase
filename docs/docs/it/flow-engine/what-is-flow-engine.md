:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Che cos'è FlowEngine?

FlowEngine è il nuovo motore di sviluppo front-end no-code/low-code introdotto in NocoBase 2.0. Combina i Model e i Flow per semplificare la logica front-end e migliorare la riusabilità e la manutenibilità. Allo stesso tempo, sfrutta la configurabilità dei Flow per fornire capacità di configurazione e orchestrazione no-code per i componenti front-end e la logica di business.

## Perché si chiama FlowEngine?

Perché in FlowEngine, le proprietà e la logica di un componente non sono più definite staticamente, ma sono guidate e gestite dai **Flow**.

*   Il **Flow**, come un flusso di dati, scompone la logica in passaggi ordinati (Step) che vengono applicati progressivamente al componente.
*   L'**Engine** indica che si tratta di un motore che guida la logica e le interazioni front-end.

Pertanto, **FlowEngine = un motore logico front-end guidato dai Flow**.

## Che cos'è un Model?

In FlowEngine, un Model è un modello astratto di un componente, responsabile di:

*   Gestire le **proprietà (Props)** e lo **stato** del componente;
*   Definire il **metodo di rendering** del componente;
*   Ospitare ed eseguire i **Flow**;
*   Gestire in modo uniforme il **dispatching degli eventi** e i **cicli di vita**.

In altre parole, **un Model è il cervello logico di un componente**, trasformandolo da unità statica in un'unità dinamica configurabile e orchestrabile.

## Che cos'è un Flow?

In FlowEngine, **un Flow è un flusso logico che serve un Model**.
Il suo scopo è:

*   Scomporre la logica delle proprietà o degli eventi in passaggi (Step) ed eseguirli sequenzialmente in un flusso;
*   Gestire i cambiamenti delle proprietà e le risposte agli eventi;
*   Rendere la logica **dinamica, configurabile e riutilizzabile**.

## Come comprendere questi concetti?

Può immaginare un **Flow** come un **flusso d'acqua**:

*   **Uno Step è come un nodo lungo il flusso d'acqua**
    Ogni Step esegue un piccolo compito (ad esempio, impostare una proprietà, attivare un evento, chiamare un'API), proprio come un flusso d'acqua ha un effetto quando passa attraverso una chiusa o una ruota idraulica.

*   **I Flow sono ordinati**
    Un flusso d'acqua segue un percorso predeterminato da monte a valle, passando attraverso tutti gli Step in sequenza; allo stesso modo, la logica in un Flow viene eseguita nell'ordine definito.

*   **I Flow possono essere ramificati e combinati**
    Un flusso d'acqua può essere diviso in più flussi più piccoli o unito insieme; un Flow può anche essere suddiviso in più sotto-Flow o combinato in catene logiche più complesse.

*   **I Flow sono configurabili e controllabili**
    La direzione e il volume di un flusso d'acqua possono essere regolati con una chiusa; il metodo di esecuzione e i parametri di un Flow possono anche essere controllati tramite configurazione (`stepParams`).

Riepilogo dell'analogia

*   Un **componente** è come una ruota idraulica che ha bisogno di un flusso d'acqua per girare.
*   Un **Model** è la base e il controller di questa ruota idraulica, responsabile di ricevere il flusso d'acqua e di guidarne il funzionamento.
*   Un **Flow** è quel flusso d'acqua, che passa attraverso ogni Step in ordine, spingendo il componente a cambiare e rispondere continuamente.

Quindi, in FlowEngine:

*   **I Flow permettono alla logica di muoversi naturalmente come un flusso d'acqua**.
*   **I Model permettono ai componenti di diventare i vettori e gli esecutori di questo flusso**.