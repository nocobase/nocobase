---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Import Pro

## Introduzione

Il plugin Import Pro offre funzionalità avanzate rispetto alla funzione di importazione standard.

## Installazione

Questo plugin dipende dal plugin di Gestione Attività Asincrone. È necessario abilitare il plugin di Gestione Attività Asincrone prima di utilizzarlo.

## Miglioramenti delle Funzionalità

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Supporta operazioni di importazione asincrone, eseguite in un thread separato, e permette l'importazione di grandi quantità di dati.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Supporta opzioni di importazione avanzate.

## Manuale Utente

### Importazione Asincrona

Dopo aver avviato un'importazione, il processo verrà eseguito in un thread in background separato, senza richiedere una configurazione manuale da parte dell'utente. Nell'interfaccia utente, dopo aver avviato l'operazione di importazione, l'attività di importazione in corso verrà visualizzata nell'angolo in alto a destra, mostrando l'avanzamento in tempo reale.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Una volta completata l'importazione, potrà visualizzare i risultati nelle attività di importazione.

#### Informazioni sulle Prestazioni

Per valutare le prestazioni dell'importazione di dati su larga scala, abbiamo condotto test comparativi in diversi scenari, tipi di campo e configurazioni di attivazione (i risultati possono variare a seconda delle configurazioni del server e del database e sono da intendersi solo come riferimento):

| Volume Dati | Tipi di Campo | Configurazione Importazione | Tempo di Elaborazione |
|------|---------|---------|---------|
| 1 milione di record | Stringa, Numero, Data, Email, Testo Lungo | • Attiva flusso di lavoro: No<br>• Identificatore duplicati: Nessuno | Circa 1 minuto |
| 500.000 record | Stringa, Numero, Data, Email, Testo Lungo, Molti-a-Molti | • Attiva flusso di lavoro: No<br>• Identificatore duplicati: Nessuno | Circa 16 minuti|
| 500.000 record | Stringa, Numero, Data, Email, Testo Lungo, Molti-a-Molti, Molti-a-Uno | • Attiva flusso di lavoro: No<br>• Identificatore duplicati: Nessuno | Circa 22 minuti |
| 500.000 record | Stringa, Numero, Data, Email, Testo Lungo, Molti-a-Molti, Molti-a-Uno | • Attiva flusso di lavoro: Notifica di attivazione asincrona<br>• Identificatore duplicati: Nessuno | Circa 22 minuti |
| 500.000 record | Stringa, Numero, Data, Email, Testo Lungo, Molti-a-Molti, Molti-a-Uno | • Attiva flusso di lavoro: Notifica di attivazione asincrona<br>• Identificatore duplicati: Aggiorna duplicati, con 50.000 record duplicati | Circa 3 ore |

Sulla base dei risultati dei test di performance sopra riportati e di alcune progettazioni esistenti, ecco alcune spiegazioni e suggerimenti riguardo ai fattori che influenzano le prestazioni:

1.  **Meccanismo di Gestione dei Record Duplicati**: Quando si selezionano le opzioni **Aggiorna record duplicati** o **Aggiorna solo record duplicati**, il sistema esegue operazioni di query e aggiornamento riga per riga, il che riduce significativamente l'efficienza dell'importazione. Se il Suo file Excel contiene dati duplicati inutili, ciò influenzerà ulteriormente la velocità di importazione. Si consiglia di pulire i dati duplicati inutili nel file Excel (ad esempio, utilizzando strumenti professionali di deduplicazione) prima di importarli nel sistema, per evitare di sprecare tempo prezioso.

2.  **Efficienza nell'Elaborazione dei Campi di Relazione**: Il sistema elabora i campi di relazione interrogando le associazioni riga per riga, il che può diventare un collo di bottiglia nelle prestazioni in scenari con grandi volumi di dati. Per strutture di relazione semplici (come un'associazione uno-a-molti tra due collezioni), si consiglia una strategia di importazione a più fasi: prima importare i dati di base della collezione principale, quindi stabilire la relazione tra le collezioni una volta completato. Se i requisiti aziendali impongono l'importazione simultanea dei dati di relazione, La preghiamo di fare riferimento ai risultati dei test di performance nella tabella sopra per pianificare ragionevolmente il Suo tempo di importazione.

3.  **Meccanismo di Attivazione del flusso di lavoro**: Non è consigliabile abilitare l'attivazione del flusso di lavoro in scenari di importazione di dati su larga scala, principalmente per i seguenti due motivi:
    -   Anche quando lo stato dell'attività di importazione mostra il 100%, non termina immediatamente. Il sistema necessita ancora di tempo aggiuntivo per creare i piani di esecuzione del flusso di lavoro. Durante questa fase, il sistema genera un piano di esecuzione del flusso di lavoro corrispondente per ogni record importato, occupando il thread di importazione, ma senza influire sull'utilizzo dei dati già importati.
    -   Dopo il completamento totale dell'attività di importazione, l'esecuzione concorrente di un gran numero di flussi di lavoro può causare un sovraccarico delle risorse di sistema, influenzando la reattività complessiva del sistema e l'esperienza utente.

I 3 fattori che influenzano le prestazioni sopra menzionati saranno considerati per ulteriori ottimizzazioni in futuro.

### Configurazione Importazione

#### Opzioni di Importazione - Attivare il flusso di lavoro

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Durante l'importazione, può scegliere se attivare i flussi di lavoro. Se questa opzione è selezionata e la collezione è associata a un flusso di lavoro (evento della collezione), l'importazione attiverà l'esecuzione del flusso di lavoro per ogni riga.

#### Opzioni di Importazione - Identificare i Record Duplicati

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Selezioni questa opzione e scelga la modalità corrispondente per identificare ed elaborare i record duplicati durante l'importazione.

Le opzioni nella configurazione di importazione verranno applicate come valori predefiniti. Gli amministratori possono controllare se consentire all'utente che carica i dati di modificare queste opzioni (ad eccezione dell'opzione per attivare il flusso di lavoro).

**Impostazioni dei Permessi per l'Uploader**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Consenti all'uploader di modificare le opzioni di importazione

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Impedisci all'uploader di modificare le opzioni di importazione

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Descrizione delle Modalità

- Salta record duplicati: Interroga i record esistenti in base al contenuto del "Campo identificatore". Se il record esiste già, la riga viene saltata; se non esiste, viene importata come nuovo record.
- Aggiorna record duplicati: Interroga i record esistenti in base al contenuto del "Campo identificatore". Se il record esiste già, viene aggiornato; se non esiste, viene importato come nuovo record.
- Aggiorna solo record duplicati: Interroga i record esistenti in base al contenuto del "Campo identificatore". Se il record esiste già, viene aggiornato; se non esiste, viene saltato.

##### Campo Identificatore

Il sistema identifica se una riga è un record duplicato in base al valore di questo campo.

- [Regola di Collegamento](/interface-builder/actions/action-settings/linkage-rule): Mostra/nasconde dinamicamente i pulsanti;
- [Pulsante Modifica](/interface-builder/actions/action-settings/edit-button): Modifica il titolo, il tipo e l'icona del pulsante;