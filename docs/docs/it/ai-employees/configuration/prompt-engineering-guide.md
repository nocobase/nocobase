:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Agente AI · Guida all'Ingegneria dei Prompt

> Da "come scrivere" a "scrivere bene", questa guida Le insegnerà a creare prompt di alta qualità in modo semplice, stabile e riutilizzabile.

## 1. Perché i prompt sono fondamentali

Un prompt è la "descrizione del lavoro" per un agente AI, e ne determina direttamente lo stile, i limiti e la qualità dell'output.

**Esempio di confronto:**

❌ Prompt poco chiaro:

```
Sei un assistente di analisi dati, aiuta gli utenti ad analizzare i dati.
```

✅ Prompt chiaro e controllabile:

```
Sei Viz, un esperto di analisi dati.

Definizione del Ruolo
- Stile: Intuitivo, chiaro nell'espressione, orientato alla visualizzazione
- Missione: Trasformare dati complessi in "storie illustrate" comprensibili

Flusso di Lavoro
1) Comprendere i requisiti
2) Generare SQL sicuro (utilizzando solo SELECT)
3) Estrarre insight
4) Presentare con grafici

Regole Rigide
- MUST: Utilizzare solo SELECT, non modificare mai i dati
- ALWAYS: Produrre visualizzazioni grafiche per impostazione predefinita
- NEVER: Inventare o indovinare dati

Formato di Output
Breve conclusione (2-3 frasi) + JSON del grafico ECharts
```

**Conclusione**: Un buon prompt definisce chiaramente "chi è, cosa fare, come farlo e con quale standard", rendendo le prestazioni dell'AI stabili e controllabili.

## 2. La Formula d'Oro dei "Nove Elementi" per i Prompt

Una struttura la cui efficacia è stata comprovata nella pratica:

```
Denominazione + Doppie Istruzioni + Conferma Simulativa + Ripetizione + Regole Rigide
+ Informazioni di Contesto + Rinforzo Positivo + Esempi di Riferimento + Esempi Negativi (Opzionale)
```

### 2.1 Descrizione degli Elementi

| Elemento   | Cosa risolve            | Perché è efficace        |
| ---- | ----------------- | ------------ |
| Denominazione   | Chiarisce identità e stile           | Aiuta l'AI a stabilire un "senso del ruolo" |
| Doppie Istruzioni | Distingue "chi sono" da "cosa devo fare"     | Riduce la confusione di ruolo       |
| Conferma Simulativa | Ripete la comprensione prima dell'esecuzione            | Previene deviazioni          |
| Ripetizione | I punti chiave appaiono ripetutamente           | Aumenta la priorità        |
| Regole Rigide | MUST/ALWAYS/NEVER | Stabilisce una base         |
| Informazioni di Contesto | Conoscenze e vincoli necessari           | Riduce i malintesi         |
| Rinforzo Positivo | Guida le aspettative e lo stile           | Tono e prestazioni più stabili    |
| Esempi di Riferimento | Fornisce un modello diretto da imitare           | L'output è più vicino alle aspettative      |
| Esempi Negativi | Evita errori comuni             | Correggere gli errori, diventando più preciso con l'uso    |

### 2.2 Modello di Avvio Rapido

```yaml
# 1) Denominazione
Lei è [Nome], un eccellente [Ruolo/Specializzazione].

# 2) Doppie Istruzioni
## Ruolo
Stile: [Aggettivo x2-3]
Missione: [Riepilogo in una frase della responsabilità principale]

## Flusso di Lavoro del Task
1) Comprendere: [Punto chiave]
2) Eseguire: [Punto chiave]
3) Verificare: [Punto chiave]
4) Presentare: [Punto chiave]

# 3) Conferma Simulativa
Prima dell'esecuzione, ripeta la Sua comprensione: "Ho capito che Lei ha bisogno di... Lo completerò tramite..."

# 4) Ripetizione
Requisito fondamentale: [1-2 punti più critici] (appaiono almeno due volte all'inizio/nel flusso/alla fine)

# 5) Regole Rigide
MUST: [Regola inviolabile]
ALWAYS: [Principio da seguire sempre]
NEVER: [Azione esplicitamente proibita]

# 6) Informazioni di Contesto
[Conoscenze di dominio necessarie/contesto/trappole comuni]

# 7) Rinforzo Positivo
Lei eccelle in [Abilità] ed è esperto in [Specialità]. Mantenga questo stile per completare il task.

# 8) Esempi di Riferimento
[Fornire un esempio conciso dell'"output ideale"]

# 9) Esempi Negativi (Opzionale)
- [Modo errato] → [Modo corretto]
```

## 3. Esempio Pratico: Viz (Analisi Dati)

Di seguito, uniamo i nove elementi per creare un esempio completo e "pronto all'uso".

```text
# Denominazione
Sei Viz, un esperto di analisi dati.

# Doppie Istruzioni
【Ruolo】
Stile: Intuitivo, chiaro nell'espressione, orientato alla visualizzazione
Missione: Trasformare dati complessi in "storie illustrate"

【Flusso di Lavoro del Task】
1) Comprendere: Analizzare i requisiti dati dell'utente e l'ambito delle metriche
2) Query: Generare SQL sicuro (interrogare solo dati reali, solo SELECT)
3) Analizzare: Estrarre insight chiave (tendenze/confronti/proporzioni)
4) Presentare: Scegliere un grafico appropriato per una chiara espressione

# Conferma Simulativa
Prima dell'esecuzione, ripeta: "Ho capito che Lei desidera analizzare [oggetto/ambito], e presenterò i risultati tramite [metodo di query e visualizzazione]."

# Ripetizione
Ribadire: La veridicità dei dati è prioritaria, la qualità prima della quantità; se non ci sono dati disponibili, dichiararlo onestamente.

# Regole Rigide
MUST: Utilizzare solo query SELECT, non modificare alcun dato
ALWAYS: Produrre un grafico visivo per impostazione predefinita
NEVER: Inventare o indovinare dati

# Informazioni di Contesto
- ECharts richiede una configurazione "JSON puro", senza commenti/funzioni
- Ogni grafico dovrebbe focalizzarsi su un singolo tema, evitare di accumulare più metriche

# Rinforzo Positivo
Sei abile nell'estrarre conclusioni attuabili da dati reali e nell'esprimerle con i grafici più semplici.

# Esempi di Riferimento
Descrizione (2-3 frasi) + JSON del grafico

Descrizione Esempio:
Questo mese sono stati aggiunti 127 nuovi lead, con un aumento del 23% rispetto al mese precedente, provenienti principalmente da canali di terze parti.

Grafico Esempio:
{
  "title": {"text": "Andamento dei Lead di Questo Mese"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Esempi Negativi (Opzionale)
- Mescolare le lingue → Mantenere la coerenza linguistica
- Grafici sovraccarichi → Ogni grafico dovrebbe esprimere un solo tema
- Dati incompleti → Dichiarare onestamente "Nessun dato disponibile"
```

**Punti di Progettazione**

*   La "veridicità" appare più volte nel flusso di lavoro, nella ripetizione e nelle sezioni delle regole (forte richiamo)
*   Scegliere un output in due parti "descrizione + JSON" per una facile integrazione frontend
*   Specificare "SQL di sola lettura" per ridurre il rischio

## 4. Come Migliorare i Prompt nel Tempo

### 4.1 Iterazione in Cinque Fasi

```
Iniziare con una versione funzionante → Testare su piccola scala → Registrare i problemi → Aggiungere regole/esempi per risolverli → Testare di nuovo
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Processo di Ottimizzazione" width="50%">

Si consiglia di testare 5-10 task tipici contemporaneamente, completando un ciclo entro 30 minuti.

### 4.2 Principi e Rapporti

*   **Dare priorità alla Guida Positiva**: Prima, dire all'AI cosa dovrebbe fare
*   **Miglioramento Guidato dai Problemi**: Aggiungere vincoli solo quando sorgono problemi
*   **Vincoli Moderati**: Non accumulare "divieti" fin dall'inizio

Rapporto empirico: **80% Positivo : 20% Negativo**.

### 4.3 Un'Ottimizzazione Tipica

**Problema**: Grafici sovraccarichi, scarsa leggibilità
**Ottimizzazione**:

1.  Nelle "Informazioni di Contesto", aggiungere: un tema per grafico
2.  Negli "Esempi di Riferimento", fornire un "grafico a metrica singola"
3.  Se il problema persiste, aggiungere un vincolo rigido in "Regole Rigide/Ripetizione"

## 5. Tecniche Avanzate

### 5.1 Utilizzare XML/Tag per una Struttura più Chiara (Consigliato per Prompt Lunghi)

Quando il contenuto supera i 1000 caratteri o può essere confuso, l'uso di tag per la partizione è più stabile:

```xml
<Ruolo>Sei Dex, un esperto di organizzazione dati.</Ruolo>
<Stile>Meticoloso, accurato e organizzato.</Stile>

<Task>
Deve essere completato seguendo questi passaggi:
1. Identificare i campi chiave
2. Estrarre i valori dei campi
3. Standardizzare il formato (Data AAAA-MM-GG)
4. Produrre JSON
</Task>

<Regole>
MUST: Mantenere l'accuratezza dei valori dei campi
NEVER: Indovinare informazioni mancanti
ALWAYS: Segnalare gli elementi incerti
</Regole>

<Esempio>
{"Nome":"John Doe","Data":"2024-01-15","Importo":5000,"Stato":"Confermato"}
</Esempio>
```

### 5.2 Approccio Stratificato "Contesto + Task" (Un Modo più Intuitivo)

*   **Contesto** (stabilità a lungo termine): Chi è questo agente, qual è il suo stile e quali capacità possiede
*   **Task** (su richiesta): Cosa fare ora, su quali metriche concentrarsi e qual è l'ambito predefinito

Questo si allinea naturalmente con il modello "Agente + Task" di NocoBase: un contesto fisso con task flessibili.

### 5.3 Riutilizzo Modulare

Suddividere le regole comuni in moduli da combinare e utilizzare secondo necessità:

**Modulo di Sicurezza dei Dati**

```
MUST: Utilizzare solo SELECT
NEVER: Eseguire INSERT/UPDATE/DELETE
```

**Modulo di Struttura dell'Output**

```
L'output deve includere:
1) Breve descrizione (2-3 frasi)
2) Contenuto principale (grafico/dati/codice)
3) Suggerimenti opzionali (se presenti)
```

## 6. Regole d'Oro (Conclusioni Pratiche)

1.  Un'AI per un solo tipo di lavoro; la specializzazione è più stabile
2.  Gli esempi sono più efficaci degli slogan; fornire prima modelli positivi
3.  Utilizzare MUST/ALWAYS/NEVER per stabilire i limiti
4.  Adottare un approccio orientato al processo per ridurre l'incertezza
5.  Procedere a piccoli passi, testare di più, modificare meno e iterare continuamente
6.  Non vincolare eccessivamente; evitare di "codificare rigidamente" il comportamento
7.  Registrare problemi e modifiche per creare versioni
8.  80/20: Prima, spiegare "come fare bene", poi vincolare "cosa non fare male"

## 7. Domande Frequenti

**D1: Qual è la lunghezza ideale?**

*   Agente base: 500-800 caratteri
*   Agente complesso: 800-1500 caratteri
*   Non consigliato >2000 caratteri (può rallentare ed essere ridondante)
  Standard: Coprire tutti i nove elementi, ma senza fronzoli.

**D2: Cosa fare se l'AI non segue le istruzioni?**

1.  Utilizzare MUST/ALWAYS/NEVER per chiarire i limiti
2.  Ripetere i requisiti chiave 2-3 volte
3.  Utilizzare tag/partizioni per migliorare la struttura
4.  Fornire più esempi positivi, meno principi astratti
5.  Valutare se è necessario un modello più potente

**D3: Come bilanciare la guida positiva e negativa?**
Prima, scrivere le parti positive (ruolo, flusso di lavoro, esempi), poi aggiungere vincoli basati sugli errori, e vincolare solo i punti che sono "ripetutamente errati".

**D4: Dovrebbe essere aggiornato frequentemente?**

*   Contesto (identità/stile/capacità principali): Stabilità a lungo termine
*   Task (scenario/metriche/ambito): Adattare in base alle esigenze aziendali
*   Creare una nuova versione per ogni modifica e registrare "perché è stata modificata".

## 8. Prossimi Passi

**Esercizio Pratico**

*   Scelga un ruolo semplice (ad esempio, assistente del servizio clienti), scriva una "versione funzionante" utilizzando i nove elementi e la testi con 5 task tipici
*   Trovi un agente esistente, raccolga 3-5 problemi reali ed esegua una piccola iterazione

**Letture Consigliate**

*   [Guida alla Configurazione dell'Amministratore dell'Agente AI](./admin-configuration.md): Applicare i prompt alla configurazione effettiva
*   Manuali dedicati per ogni agente AI: Visualizzare i modelli completi di ruolo/task

## Conclusione

**Far funzionare, poi perfezionare.**
Inizi da una versione "funzionante" e raccolga continuamente problemi, aggiunga esempi e perfezioni le regole in task reali.
Ricordi: **Prima, Le dica come fare le cose correttamente (guida positiva), poi La vincoli a non fare errori (restrizione moderata).**