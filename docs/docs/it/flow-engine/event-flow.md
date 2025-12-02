:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Flusso di Eventi

In FlowEngine, tutti i componenti dell'interfaccia sono **guidati dagli eventi (event-driven)**.
Il comportamento, l'interazione e le modifiche ai dati dei componenti sono attivati da **eventi** ed eseguiti tramite un **flusso**.

## Flusso Statico vs. Flusso Dinamico

In FlowEngine, i **flussi** possono essere suddivisi in due tipi:

### **1. Flusso Statico**

- Definito dagli sviluppatori nel codice;
- Agisce su **tutte le istanze di una classe Model**;
- Utilizzato comunemente per gestire la logica generale di una classe Model;

### **2. Flusso Dinamico**

- Configurabile dagli utenti tramite l'interfaccia;
- Ha effetto solo su una specifica istanza;
- Utilizzato comunemente per comportamenti personalizzati in scenari specifici;

In breve: **un flusso statico è un modello logico definito su una classe, mentre un flusso dinamico è una logica personalizzata definita su un'istanza.**

## Regole di Collegamento vs. Flusso Dinamico

Nel sistema di configurazione di FlowEngine, esistono due modi per implementare la logica degli eventi:

### **1. Regole di Collegamento**

- Sono **incapsulamenti di step di flusso di eventi integrati**;
- Più semplici da configurare e più semantiche;
- Essenzialmente, sono comunque una forma semplificata di un **flusso di eventi**.

### **2. Flusso Dinamico**

- Capacità complete di configurazione del **flusso**;
- Personalizzabile:
  - **Trigger (on)**: Definisce quando attivare;
  - **Passaggi di esecuzione (steps)**: Definiscono la logica da eseguire;
- Adatto per logiche di business più complesse e flessibili.

Pertanto, le **Regole di Collegamento ≈ Flusso di Eventi Semplificato**, e i loro meccanismi centrali sono coerenti.

## Coerenza di FlowAction

Sia le **Regole di Collegamento** che i **Flussi di Eventi** dovrebbero utilizzare lo stesso insieme di **FlowAction**.
Ovvero:

- **FlowAction** definisce le azioni che possono essere richiamate da un **flusso**;
- Entrambi condividono un unico sistema di azioni, invece di implementarne due separati;
- Ciò garantisce il riutilizzo della logica e un'estensione coerente.

## Gerarchia Concettuale

Concettualmente, la relazione astratta centrale di FlowModel è la seguente:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Eventi Globali (Global Events)
      │     └── Eventi Locali (Local Events)
      └── FlowActionDefinition
            ├── Azioni Globali (Global Actions)
            └── Azioni Locali (Local Actions)
```

### Descrizione della Gerarchia

- **FlowModel**
  Rappresenta un'entità modello con logica di flusso configurabile ed eseguibile.

- **FlowDefinition**
  Definisce un insieme completo di logica di flusso (incluse le condizioni di attivazione e i passaggi di esecuzione).

- **FlowEventDefinition**
  Definisce la fonte di attivazione del flusso, includendo:
  - **Eventi globali**: come l'avvio dell'applicazione, il completamento del caricamento dei dati;
  - **Eventi locali**: come modifiche ai campi, clic sui pulsanti.

- **FlowActionDefinition**
  Definisce le azioni eseguibili dal flusso, includendo:
  - **Azioni globali**: come l'aggiornamento della pagina, le notifiche globali;
  - **Azioni locali**: come la modifica dei valori dei campi, il cambio di stato dei componenti.

## Riepilogo

| Concetto | Scopo | Ambito |
|------|------|-----------|
| **Flusso Statico (Static Flow)** | Logica di flusso definita nel codice | Tutte le istanze di XXModel |
| **Flusso Dinamico (Dynamic Flow)** | Logica di flusso definita nell'interfaccia | Una singola istanza di FlowModel |
| **FlowEvent** | Definisce il trigger (quando attivare) | Globale o locale |
| **FlowAction** | Definisce la logica di esecuzione | Globale o locale |
| **Regola di Collegamento (Linkage Rule)** | Incapsulamento semplificato degli step del flusso di eventi | Livello di blocco, livello di azione |