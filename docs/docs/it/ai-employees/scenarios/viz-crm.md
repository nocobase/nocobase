# Agente AI · Viz: Guida alla configurazione dello scenario CRM

> Prendendo come esempio il CRM, impari come far sì che il Suo analista di insight AI comprenda veramente il Suo business e sprigioni tutto il suo potenziale.

## 1. Introduzione: Far passare Viz dal "vedere i dati" al "comprendere il business"

Nel sistema NocoBase, **Viz** è l'analista di insight AI predefinito.
Può riconoscere il contesto della pagina (come Lead, Opportunità, Account) e generare grafici di tendenza, grafici a imbuto e schede KPI.
Ma per impostazione predefinita, possiede solo le capacità di interrogazione più basilari:

| Strumento | Descrizione della funzione | Sicurezza |
| --- | --- | --- |
| Get Collection Names | Ottieni elenco delle collezioni | ✅ Sicuro |
| Get Collection Metadata | Ottieni struttura dei campi | ✅ Sicuro |

Questi strumenti permettono a Viz solo di "riconoscere la struttura", ma non ancora di "comprendere veramente il contenuto".
Per consentirgli di generare insight, rilevare anomalie e analizzare tendenze, Lei deve **estenderlo con strumenti di analisi più adatti**.

Nella demo ufficiale del CRM, abbiamo utilizzato due metodi:

*   **Overall Analytics (Motore di analisi generico)**: Una soluzione basata su template, sicura e riutilizzabile;
*   **SQL Execution (Motore di analisi specializzato)**: Offre maggiore flessibilità ma comporta rischi maggiori.

Queste due non sono le uniche opzioni; sono più simili a un **paradigma di progettazione**:

> Può seguire i suoi principi per creare un'implementazione più adatta al Suo business.

---

## 2. La struttura di Viz: Personalità stabile + Compiti flessibili

Per capire come estendere Viz, deve prima comprendere la sua progettazione interna a strati:

| Livello | Descrizione | Esempio |
| --- | --- | --- |
| **Definizione del Ruolo** | La personalità e il metodo di analisi di Viz: Comprendere → Interrogare → Analizzare → Visualizzare | Fisso |
| **Definizione del Compito** | Prompt personalizzati e combinazioni di strumenti per uno specifico scenario di business | Modificabile |
| **Configurazione dello Strumento** | Il ponte per Viz per richiamare fonti dati esterne o flussi di lavoro | Liberamente sostituibile |

Questa progettazione a strati permette a Viz di mantenere una personalità stabile (logica di analisi coerente) e allo stesso tempo di adattarsi rapidamente a diversi scenari di business (CRM, gestione ospedaliera, analisi dei canali, operazioni di produzione...).

---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


## 3. Modello Uno: Motore di Analisi Basato su Template (Consigliato)

### 3.1 Panoramica del Principio

**Overall Analytics** è il motore di analisi centrale nella demo CRM.
Gestisce tutte le query SQL tramite una **collezione di template di analisi dati (data_analysis)**.
Viz non scrive SQL direttamente, ma **richiama template predefiniti** per generare i risultati.

Il flusso di esecuzione è il seguente:

```mermaid
flowchart TD
    A[Viz riceve il compito] --> B[Richiama il flusso di lavoro Overall Analytics]
    B --> C[Abbina il template in base alla pagina/compito corrente]
    C --> D[Esegue il template SQL (sola lettura)]
    D --> E[Restituisce il risultato dei dati]
    E --> F[Viz genera il grafico + breve interpretazione]
```

In questo modo, Viz può generare risultati di analisi sicuri e standardizzati in pochi secondi, e gli amministratori possono gestire e revisionare centralmente tutti i template SQL.

---

### 3.2 Struttura della collezione di template (data_analysis)

| Nome del campo | Tipo | Descrizione | Esempio |
| --- | --- | --- | --- |
| **id** | Integer | Chiave primaria | 1 |
| **name** | Text | Nome del template di analisi | Leads Data Analysis |
| **collection** | Text | Collezione corrispondente | Lead |
| **sql** | Code | Istruzione SQL di analisi (sola lettura) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description** | Markdown | Descrizione o definizione del template | "Conteggio lead per fase" |
| **createdAt / createdBy / updatedAt / updatedBy** | Campo di sistema | Informazioni di audit | Generato automaticamente |

#### Esempi di template nella demo CRM

| Name | Collection | Description |
| --- | --- | --- |
| Account Data Analysis | Account | Analisi dati account |
| Contact Data Analysis | Contact | Analisi dati contatto |
| Leads Data Analysis | Lead | Analisi delle tendenze dei lead |
| Opportunity Data Analysis | Opportunity | Imbuto delle fasi delle opportunità |
| Task Data Analysis | Todo Tasks | Statistiche sullo stato delle attività da fare |
| Users (Sales Reps) Data Analysis | Users | Confronto delle performance dei rappresentanti di vendita |

---

### 3.3 Vantaggi di questo modello

| Dimensione | Vantaggio |
| --- | --- |
| **Sicurezza** | Tutte le query SQL sono memorizzate e revisionate, evitando la generazione diretta di query. |
| **Manutenibilità** | I template sono gestiti centralmente e aggiornati in modo uniforme. |
| **Riutilizzabilità** | Lo stesso template può essere riutilizzato da più compiti. |
| **Portabilità** | Può essere facilmente migrato ad altri sistemi, richiedendo solo la stessa struttura della collezione. |
| **Esperienza Utente** | Gli utenti business non devono preoccuparsi dell'SQL; devono solo avviare una richiesta di analisi. |

> 📘 Questa collezione `data_analysis` non deve necessariamente chiamarsi così.
> La chiave è: **memorizzare la logica di analisi in modo basato su template** e farla richiamare uniformemente da un flusso di lavoro.

---

### 3.4 Come far sì che Viz lo utilizzi

Nella definizione del compito, può indicare esplicitamente a Viz:

```markdown
Ciao Viz,

Si prega di analizzare i dati del modulo corrente.

**Priorità:** Utilizzare lo strumento Overall Analytics per ottenere i risultati dell'analisi dalla collezione di template.
**Se non viene trovato un template corrispondente:** Indicare che manca un template e suggerire all'amministratore di aggiungerne uno.

Requisiti di output:
- Generare un grafico separato per ogni risultato;
- Includere una breve descrizione di 2-3 frasi sotto il grafico;
- Non fabbricare dati o fare supposizioni.
```

In questo modo, Viz richiamerà automaticamente il flusso di lavoro, abbinerà l'SQL più adatto dalla collezione di template e genererà il grafico.

---

## 4. Modello Due: Esecutore SQL Specializzato (Usare con cautela)

### 4.1 Scenari applicabili

Quando ha bisogno di analisi esplorative, query ad hoc o aggregazioni JOIN tra più collezioni, può far sì che Viz richiami uno strumento **SQL Execution**.

Le caratteristiche di questo strumento sono:

*   Viz può generare direttamente query `SELECT`;
*   Il sistema le esegue e restituisce il risultato;
*   Viz è responsabile dell'analisi e della visualizzazione.

Esempio di compito:

> "Si prega di analizzare la tendenza dei tassi di conversione dei lead per regione negli ultimi 90 giorni."

In questo caso, Viz potrebbe generare:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Rischi e Raccomandazioni di Protezione

| Punto di rischio | Strategia di protezione |
| --- | --- |
| Generazione di operazioni di scrittura | Limitare forzatamente a `SELECT` |
| Accesso a collezioni non correlate | Validare se il nome della collezione esiste |
| Rischio di performance con collezioni di grandi dimensioni | Limitare l'intervallo di tempo, usare LIMIT per il numero di righe |
| Tracciabilità delle operazioni | Abilitare il logging delle query e l'audit |
| Controllo dei permessi utente | Solo gli amministratori possono utilizzare questo strumento |

> Raccomandazioni generali:
>
> *   Gli utenti regolari dovrebbero avere abilitata solo l'analisi basata su template (Overall Analytics);
> *   Solo gli amministratori o gli analisti senior dovrebbero essere autorizzati a utilizzare SQL Execution.

---

## 5. Se desidera costruire il Suo "Overall Analytics"

Ecco un approccio semplice e generale che può replicare in qualsiasi sistema (non dipendente da NocoBase):

### Passo 1: Progettare la collezione di template

Il nome della collezione può essere qualsiasi (ad es. `analysis_templates`).
Deve solo includere i campi: `name`, `sql`, `collection` e `description`.

### Passo 2: Scrivere un servizio o flusso di lavoro "Recupera Template → Esegui"

Logica:

1.  Ricevere il compito o il contesto della pagina (ad es. la collezione corrente);
2.  Abbinare un template;
3.  Eseguire il template SQL (sola lettura);
4.  Restituire una struttura dati standardizzata (righe + campi).

### Passo 3: Far sì che l'AI richiami questa interfaccia

Il prompt del compito può essere scritto così:

```
Per prima cosa, provare a richiamare lo strumento di analisi dei template. Se non viene trovata alcuna analisi corrispondente nei template, utilizzare l'esecutore SQL.
Assicurarsi che tutte le query siano di sola lettura e generare grafici per visualizzare i risultati.
```

> In questo modo, il Suo sistema di agente AI avrà capacità di analisi simili a quelle della demo CRM, ma sarà completamente indipendente e personalizzabile.

---

## 6. Migliori Pratiche e Raccomandazioni di Progettazione

| Raccomandazione | Descrizione |
| --- | --- |
| **Dare priorità all'analisi basata su template** | Sicura, stabile e riutilizzabile |
| **Utilizzare SQL Execution solo come supplemento** | Limitato al debug interno o a query ad hoc |
| **Un grafico, un punto chiave** | Mantenere l'output chiaro ed evitare un eccessivo disordine |
| **Nomenclatura chiara dei template** | Nominare in base alla pagina/dominio di business, ad es. `Leads-Stage-Conversion` |
| **Spiegazioni concise e chiare** | Accompagnare ogni grafico con un riassunto di 2-3 frasi |
| **Indicare quando manca un template** | Informare l'utente "Nessun template corrispondente trovato" invece di fornire un output vuoto |

---

## 7. Dalla demo CRM al Suo scenario

Sia che Lei si occupi di CRM ospedaliero, produzione, logistica di magazzino o iscrizioni educative, purché Lei possa rispondere alle seguenti tre domande, Viz potrà apportare valore al Suo sistema:

| Domanda | Esempio |
| --- | --- |
| **1. Cosa desidera analizzare?** | Tendenze dei lead / Fasi di trattativa / Tasso di utilizzo delle attrezzature |
| **2. Dove si trovano i dati?** | Quale collezione, quali campi |
| **3. Come desidera presentarli?** | Grafico a linee, a imbuto, a torta, tabella di confronto |

Una volta definiti questi elementi, Le basterà:

*   Scrivere la logica di analisi nella collezione di template;
*   Allegare il prompt del compito alla pagina;
*   Viz potrà quindi "prendere in carico" l'analisi dei Suoi report.

---

## 8. Conclusione: Porti con Sé il Paradigma

"Overall Analytics" e "SQL Execution" sono solo due implementazioni di esempio.
Ciò che è più importante è l'idea che sta dietro di esse:

> **Far sì che l'agente AI comprenda la Sua logica di business, anziché limitarsi a eseguire i prompt.**

Sia che Lei utilizzi NocoBase, un sistema privato o il Suo flusso di lavoro personalizzato, può replicare questa struttura:

*   Template centralizzati;
*   Richiami del flusso di lavoro;
*   Esecuzione in sola lettura;
*   Presentazione AI.

In questo modo, Viz non è più solo un'"AI in grado di generare grafici", ma un vero analista che comprende i Suoi dati, le Sue definizioni e il Suo business.