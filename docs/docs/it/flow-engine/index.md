:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Che cos'è FlowEngine?

FlowEngine è un nuovo motore di sviluppo front-end no-code e low-code introdotto in NocoBase 2.0. Combina i Model con i Flow per semplificare la logica front-end, migliorando la riusabilità e la manutenibilità. Allo stesso tempo, sfruttando la natura configurabile dei Flow, offre capacità di configurazione e orchestrazione no-code per i componenti front-end e la logica di business.

## Perché si chiama FlowEngine?

Perché in FlowEngine, le proprietà e la logica dei componenti non sono più definite staticamente, ma sono guidate e gestite da un **Flow**.

*   Un **Flow**, come un flusso di dati, scompone la logica in passaggi (Step) ordinati e li applica sequenzialmente al componente;
*   **Engine** indica che si tratta di un motore che guida la logica e le interazioni front-end.

Quindi, **FlowEngine = Un motore di logica front-end guidato dai Flow**.

## Che cos'è un Model?

In FlowEngine, un Model è un modello astratto di un componente, responsabile di:

*   Gestire le **proprietà (Props) e lo stato** del componente;
*   Definire il **metodo di rendering** del componente;
*   Ospitare ed eseguire il **Flow**;
*   Gestire in modo uniforme la **distribuzione degli eventi** e i **cicli di vita**.

In altre parole, **il Model è il cervello logico del componente**, trasformandolo da un elemento statico in un'unità dinamica configurabile e orchestrabile.

## Che cos'è un Flow?

In FlowEngine, un **Flow è un flusso logico che serve il Model**.
Il suo scopo è:

*   Scomporre la logica delle proprietà o degli eventi in passaggi (Step) ed eseguirli sequenzialmente, come un flusso;
*   Gestire le modifiche delle proprietà e le risposte agli eventi;
*   Rendere la logica **dinamica, configurabile e riutilizzabile**.

## Come comprendere questi concetti?

Può immaginare un **Flow** come un **flusso d'acqua**:

*   **Uno Step è come un nodo lungo il percorso del flusso**
    Ogni Step svolge un piccolo compito (ad esempio, impostare una proprietà, attivare un evento, chiamare un'API), proprio come l'acqua ha un effetto quando passa attraverso una chiusa o una ruota idraulica.

*   **Il flusso è ordinato**
    L'acqua scorre lungo un percorso predeterminato da monte a valle, passando attraverso tutti gli Step in sequenza; allo stesso modo, la logica in un Flow viene eseguita nell'ordine definito.

*   **Il flusso può essere ramificato e combinato**
    Un corso d'acqua può dividersi in più piccoli ruscelli o confluire insieme; un Flow può anche essere suddiviso in più sotto-Flow o combinato in catene logiche più complesse.

*   **Il flusso è configurabile e controllabile**
    La direzione e il volume di un flusso d'acqua possono essere regolati con una chiusa; il metodo di esecuzione e i parametri di un Flow possono anche essere controllati tramite configurazione (`stepParams`).

Riepilogo dell'analogia

*   Un **componente** è come una ruota idraulica che ha bisogno di un flusso d'acqua per girare;
*   Il **Model** è la base e il controllore di questa ruota idraulica, responsabile di ricevere l'acqua e di guidarne il funzionamento;
*   Il **Flow** è quel flusso d'acqua che passa attraverso ogni Step in ordine, facendo sì che il componente cambi e risponda continuamente.

Quindi in FlowEngine:

*   **Il Flow permette alla logica di muoversi naturalmente come un flusso d'acqua**;
*   **Il Model rende il componente il vettore e l'esecutore di questo flusso**.