---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Esporta Pro

## Introduzione

Il plugin Esporta Pro offre funzionalità avanzate rispetto alla normale funzione di esportazione.

## Installazione

Questo plugin dipende dal plugin di Gestione Attività Asincrone. È necessario abilitare il plugin di Gestione Attività Asincrone prima di utilizzarlo.

## Funzionalità avanzate

- Supporta operazioni di esportazione asincrone, eseguite in un thread separato, per l'esportazione di grandi quantità di dati.
- Supporta l'esportazione di allegati.

## Guida all'uso

### Configurazione della modalità di esportazione

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Sul pulsante di esportazione, è possibile configurare la modalità di esportazione. Sono disponibili tre modalità opzionali:

- Automatico: La modalità di esportazione viene determinata in base al volume dei dati. Se il numero di record è inferiore a 1000 (o 100 per le esportazioni di allegati), viene utilizzata l'esportazione sincrona. Se è superiore a 1000 (o 100 per le esportazioni di allegati), viene utilizzata l'esportazione asincrona.
- Sincrona: Utilizza l'esportazione sincrona, che viene eseguita nel thread principale. È adatta per dati di piccole dimensioni. L'esportazione di grandi quantità di dati in modalità sincrona potrebbe causare il blocco, il rallentamento del sistema e l'impossibilità di gestire altre richieste degli utenti.
- Asincrona: Utilizza l'esportazione asincrona, che viene eseguita in un thread di background separato e non blocca il funzionamento attuale del sistema.

### Esportazione asincrona

Dopo aver avviato un'esportazione, il processo verrà eseguito in un thread di background separato senza richiedere una configurazione manuale da parte dell'utente. Nell'interfaccia utente, dopo aver avviato un'esportazione, l'attività di esportazione attualmente in esecuzione verrà visualizzata nell'angolo in alto a destra, mostrando l'avanzamento in tempo reale.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Una volta completata l'esportazione, è possibile scaricare il file esportato dalle attività di esportazione.

#### Esportazioni concorrenti
Un numero elevato di attività di esportazione concorrenti può essere influenzato dalla configurazione del server, portando a una risposta più lenta del sistema. Pertanto, si raccomanda agli sviluppatori di sistema di configurare il numero massimo di attività di esportazione concorrenti (il valore predefinito è 3). Quando il numero di attività concorrenti supera il limite configurato, le nuove attività verranno messe in coda.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Metodo di configurazione della concorrenza: Variabile d'ambiente ASYNC_TASK_MAX_CONCURRENCY=numero_concorrenza

Sulla base di test approfonditi con diverse configurazioni e complessità dei dati, i numeri di concorrenza raccomandati sono:
- CPU a 2 core, numero di concorrenza 3.
- CPU a 4 core, numero di concorrenza 5.

#### Informazioni sulle prestazioni
Quando si riscontra che il processo di esportazione è insolitamente lento (vedere il riferimento seguente), potrebbe trattarsi di un problema di prestazioni causato dalla struttura della collezione.

| Caratteristiche dei dati | Tipo di indice | Volume dei dati | Durata esportazione |
|---------|---------|--------|---------|
| Campi senza relazioni | Chiave primaria / Vincolo unico | 1 milione | 3～6 minuti |
| Campi senza relazioni | Indice normale | 1 milione | 6～10 minuti |
| Campi senza relazioni | Indice composito (non unico) | 1 milione | 30 minuti |
| Campi di relazione<br>(Uno-a-uno, Uno-a-molti,<br>Molti-a-uno, Molti-a-molti) | Chiave primaria / Vincolo unico | 500.000 | 15～30 minuti | I campi di relazione riducono le prestazioni |

Per garantire esportazioni efficienti, Le consigliamo di:
1. La collezione deve soddisfare le seguenti condizioni:

| Tipo di condizione | Condizione richiesta | Altre note |
|---------|------------------------|------|
| Struttura della collezione (soddisfare almeno una) | Ha una chiave primaria<br>Ha un vincolo unico<br>Ha un indice (unico, normale, composito) | Priorità: Chiave primaria > Vincolo unico > Indice
| Caratteristiche del campo | La chiave primaria / il vincolo unico / l'indice (uno di questi) deve avere caratteristiche ordinabili, come: ID auto-incrementante, ID Snowflake, UUID v1, timestamp, numero, ecc.<br>(Nota: i campi non ordinabili come UUID v3/v4/v5, stringhe normali, ecc., influenzeranno le prestazioni) | Nessuna |

2. Ridurre il numero di campi non necessari da esportare, in particolare i campi di relazione (i problemi di prestazioni causati dai campi di relazione sono ancora in fase di ottimizzazione).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Se l'esportazione è ancora lenta dopo aver soddisfatto le condizioni di cui sopra, è possibile analizzare i log o fornire feedback al team ufficiale.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Regola di collegamento](/interface-builder/actions/action-settings/linkage-rule): Mostra/nascondi dinamicamente il pulsante;
- [Modifica pulsante](/interface-builder/actions/action-settings/edit-button): Modifica il titolo, il tipo e l'icona del pulsante;