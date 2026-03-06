:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/solution/ticket-system/index).
:::

# Introduzione alla soluzione Ticket

> **Nota**: Questa è una versione in anteprima. Le funzionalità sono in fase di perfezionamento e stiamo lavorando costantemente a miglioramenti. I feedback sono benvenuti!

## 1. Contesto (Perché)

### Quali problemi di settore / ruolo / gestione risolve

Le aziende affrontano vari tipi di richieste di assistenza nelle operazioni quotidiane: riparazioni di apparecchiature, supporto IT, reclami dei clienti, consulenze, ecc. Queste richieste provengono da fonti sparse (sistemi CRM, tecnici sul campo, e-mail, moduli pubblici, ecc.), presentano flussi di lavoro diversi e mancano di meccanismi di tracciamento e gestione unificati.

**Esempi di scenari aziendali tipici:**

- **Riparazione apparecchiature**: Il team post-vendita gestisce le richieste di riparazione, con la necessità di registrare informazioni specifiche del dispositivo come numeri di serie, codici di errore e parti di ricambio.
- **Supporto IT**: Il dipartimento IT gestisce le richieste dei dipendenti interni per il ripristino delle password, l'installazione di software e problemi di rete.
- **Reclami clienti**: Il team del servizio clienti gestisce reclami provenienti da più canali; alcuni clienti particolarmente insoddisfatti necessitano di una gestione prioritaria.
- **Self-service clienti**: I clienti finali desiderano inviare comodamente richieste di assistenza e monitorare lo stato di avanzamento della gestione.

### Profilo dell'utente target

| Dimensione | Descrizione |
|------------|-------------|
| Dimensione aziendale | Dalle PMI alle grandi imprese con consistenti esigenze di servizio clienti |
| Struttura dei ruoli | Team di assistenza clienti, supporto IT, team post-vendita, gestione operativa |
| Maturità digitale | Da principiante a intermedia, che cerca di passare dalla gestione tramite Excel/e-mail a una gestione sistematizzata |

### Criticità delle attuali soluzioni principali

- **Costi elevati / Personalizzazione lenta**: I sistemi di ticketing SaaS sono costosi e i cicli di sviluppo personalizzato sono lunghi.
- **Frammentazione del sistema, silos di dati**: I dati aziendali sono sparsi su diversi sistemi, rendendo difficile l'analisi e il processo decisionale unificato.
- **Cambiamenti aziendali rapidi, difficile evoluzione**: Quando i requisiti aziendali cambiano, i sistemi sono difficili da adattare rapidamente.
- **Risposta lenta del servizio**: Le richieste che fluiscono tra diversi sistemi non possono essere smistate tempestivamente.
- **Processo opaco**: I clienti non possono tracciare lo stato del ticket; le frequenti richieste di informazioni aumentano la pressione sul servizio clienti.
- **Qualità difficile da garantire**: Mancanza di monitoraggio SLA; i ritardi e i feedback negativi non possono essere segnalati in tempo.

---

## 2. Analisi comparativa (Benchmark)

### Prodotti principali sul mercato

- **SaaS**: Salesforce, Zendesk, Odoo, ecc.
- **Sistemi personalizzati / Sistemi interni**

### Dimensioni di confronto

- Copertura delle funzionalità
- Flessibilità
- Estensibilità
- Approccio all'uso dell'IA

### Punti di differenziazione della soluzione NocoBase

**Vantaggi a livello di piattaforma:**

- **Priorità alla configurazione**: Dalle tabelle dati sottostanti ai tipi di business, SLA e instradamento delle competenze: tutto è gestito tramite configurazione.
- **Sviluppo rapido Low-Code**: Più veloce dello sviluppo personalizzato, più flessibile del SaaS.

**Cosa i sistemi tradizionali non possono fare o richiedono costi eccessivi:**

- **Integrazione nativa dell'IA**: Sfruttando i plugin IA di NocoBase per la classificazione intelligente, l'assistenza nella compilazione dei moduli e i suggerimenti basati sulla conoscenza.
- **Tutti i design possono essere replicati dagli utenti**: Gli utenti possono estendere il sistema basandosi sui modelli.
- **Architettura dati a T**: Tabella principale + tabelle di estensione aziendale; l'aggiunta di nuovi tipi di business richiede solo l'aggiunta di tabelle di estensione.

---

## 3. Principi di progettazione (Principles)

- **Basso carico cognitivo**
- **Il business prima della tecnologia**
- **Evolvibile, non un lavoro una tantum**
- **Configurazione prioritaria, codice come soluzione di riserva**
- **Collaborazione uomo-IA, non l'IA che sostituisce l'uomo**
- **Tutti i design devono essere replicabili dagli utenti**

---

## 4. Panoramica della soluzione (Solution Overview)

### Introduzione sintetica

Una piattaforma di ticketing universale costruita sulla piattaforma low-code NocoBase, che realizza:

- **Ingresso unificato**: Integrazione multi-sorgente, elaborazione standardizzata.
- **Distribuzione intelligente**: Classificazione assistita dall'IA, assegnazione con bilanciamento del carico.
- **Business polimorfico**: Tabella principale centrale + tabelle di estensione aziendale, estensione flessibile.
- **Feedback a ciclo chiuso**: Monitoraggio SLA, valutazioni dei clienti, follow-up dei feedback negativi.

### Flusso di gestione dei ticket

```
Ingresso multi-sorgente → Pre-elaborazione/Analisi IA → Assegnazione intelligente → Esecuzione manuale → Ciclo di feedback
          ↓                          ↓                          ↓                    ↓                ↓
 Controllo duplicati        Riconoscimento intenti      Corrispondenza competenze  Flusso di stato   Valutazione soddisfazione
                            Analisi del sentiment       Bilanciamento del carico   Monitoraggio SLA  Follow-up feedback negativi
                            Risposta automatica         Gestione code              Comunicazione commenti  Archiviazione dati
```

### Elenco dei moduli principali

| Modulo | Descrizione |
|--------|-------------|
| Acquisizione ticket | Moduli pubblici, portale clienti, creazione da parte dell'operatore, API/Webhook, analisi e-mail |
| Gestione ticket | CRUD dei ticket, flusso di stato, assegnazione/trasferimento, comunicazione tramite commenti, log operativi |
| Estensione aziendale | Tabelle di estensione per riparazione apparecchiature, supporto IT, reclami clienti e altro |
| Gestione SLA | Configurazione SLA, avvisi di timeout, escalation dei timeout |
| Gestione clienti | Tabella principale clienti, gestione contatti, portale clienti |
| Sistema di valutazione | Punteggio multidimensionale, tag rapidi, NPS, avvisi per feedback negativi |
| Assistenza IA | Classificazione intenti, analisi del sentiment, suggerimenti di conoscenza, assistenza nella risposta, perfezionamento del tono |

### Visualizzazione dell'interfaccia principale

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Dipendenti IA (AI Employee)

### Tipi di dipendenti IA e scenari

- **Assistente servizio clienti**, **Assistente vendite**, **Analista dati**, **Revisore**
- Assistono gli esseri umani, non li sostituiscono

### Quantificazione del valore dei dipendenti IA

In questa soluzione, i dipendenti IA possono:

| Dimensione del valore | Effetti specifici |
|-----------------------|-------------------|
| Migliorare l'efficienza | La classificazione automatica riduce il tempo di smistamento manuale del 50%+; i suggerimenti di conoscenza accelerano la risoluzione dei problemi |
| Ridurre i costi | Risposte automatiche a domande semplici, riducendo il carico di lavoro del servizio clienti manuale |
| Potenziare i dipendenti umani | Gli avvisi sul sentiment aiutano il servizio clienti a prepararsi in anticipo; il perfezionamento delle risposte migliora la qualità della comunicazione |
| Aumentare la soddisfazione del cliente | Risposta più rapida, assegnazione più accurata, risposte più professionali |

---

## 6. Punti di forza (Highlights)

### 1. Architettura dati a T

- Tutti i ticket condividono la tabella principale con una logica di flusso unificata.
- Le tabelle di estensione aziendale contengono campi specifici per tipo, garantendo un'estensione flessibile.
- L'aggiunta di nuovi tipi di business richiede solo l'aggiunta di tabelle di estensione, senza influire sul flusso principale.

### 2. Ciclo di vita completo del ticket

- Nuovo → Assegnato → In elaborazione → In sospeso → Risolto → Chiuso.
- Supporta scenari complessi come trasferimento, restituzione, riapertura.
- Cronometraggio SLA accurato fino alla pausa in sospeso.

### 3. Integrazione unificata multicanale

- Moduli pubblici, portale clienti, API, e-mail, creazione da parte dell'operatore.
- Il controllo di idempotenza impedisce la creazione di duplicati.

### 4. Integrazione nativa dell'IA

- Non si tratta di "aggiungere un pulsante IA", ma di un'integrazione in ogni fase.
- Riconoscimento intenti, analisi del sentiment, suggerimenti di conoscenza, perfezionamento della risposta.

---

## 7. Roadmap (In continuo aggiornamento)

- **Integrazione di sistema**: Supporto per l'integrazione del modulo ticket in vari sistemi aziendali come ERP, CRM, ecc.
- **Interconnessione ticket**: Integrazione dei ticket dei sistemi a monte/a valle e callback di stato per la collaborazione sui ticket tra sistemi diversi.
- **Automazione IA**: Dipendenti IA inseriti nei flussi di lavoro, con supporto per l'esecuzione automatica in background per una gestione non presidiata.
- **Supporto multi-tenant**: Scalabilità orizzontale tramite architettura multi-spazio/multi-app, consentendo la distribuzione a diversi team di assistenza per operazioni indipendenti.
- **Base di conoscenza RAG**: Vettorizzazione automatica di tutti i dati (ticket, clienti, prodotti, ecc.) per il recupero intelligente e suggerimenti basati sulla conoscenza.
- **Supporto multilingue**: Interfaccia e contenuti supportano più lingue, consentendo la collaborazione di team transfrontalieri/transregionali.