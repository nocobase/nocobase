:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Gestione delle Release

## Introduzione

Nelle applicazioni reali, per garantire la sicurezza dei dati e la stabilità dell'applicazione, è prassi comune implementare più ambienti, come un ambiente di sviluppo, uno di pre-release e uno di produzione. Questo documento illustra due processi di sviluppo no-code comuni e spiega in dettaglio come implementare la gestione delle release in NocoBase.

## Installazione

Per la gestione delle release sono essenziali tre plugin. Si prega di assicurarsi che tutti i seguenti plugin siano attivati.

### Variabili d'ambiente

- Plugin integrato, installato e attivato per impostazione predefinita.
- Offre configurazione e gestione centralizzate delle variabili d'ambiente e delle chiavi, utilizzate per l'archiviazione di dati sensibili, il riutilizzo di dati di configurazione, l'isolamento della configurazione basato sull'ambiente e altro ancora ([Vedi documentazione](#)).

### Gestore dei Backup

- Disponibile solo nell'edizione Professional o superiore ([Scopri di più](https://www.nocobase.com/en/commercial)).
- Supporta le funzioni di backup e ripristino, inclusi i backup programmati, garantendo la sicurezza dei dati e un rapido recupero. ([Vedi documentazione](../backup-manager/index.mdx)).

### Gestore delle Migrazioni

- Disponibile solo nell'edizione Professional o superiore ([Scopri di più](https://www.nocobase.com/en/commercial)).
- Utilizzato per migrare le configurazioni dell'applicazione da un ambiente applicativo a un altro ([Vedi documentazione](../migration-manager/index.md)).

## Processi di Sviluppo No-Code Comuni

### Ambiente di Sviluppo Singolo, Release Unidirezionale

Questo approccio è adatto a flussi di lavoro di sviluppo semplici. Esiste un unico ambiente di sviluppo, un unico ambiente di pre-release e un unico ambiente di produzione. Le modifiche fluiscono dall'ambiente di sviluppo all'ambiente di pre-release e vengono infine implementate nell'ambiente di produzione. In questo flusso di lavoro, solo l'ambiente di sviluppo può modificare le configurazioni; né l'ambiente di pre-release né quello di produzione consentono modifiche.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Quando si configurano le regole di migrazione, selezionare la regola **"Sovrascrivi"** per le tabelle integrate nel core e nei plugin, se necessario; per tutte le altre, è possibile mantenere le impostazioni predefinite se non ci sono requisiti particolari.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Ambienti di Sviluppo Multipli, Release Unificata

Questo approccio è adatto a scenari di collaborazione multi-persona o progetti complessi. Diversi ambienti di sviluppo paralleli possono essere utilizzati in modo indipendente e tutte le modifiche vengono unificate in un unico ambiente di pre-release per test e verifica, prima di essere implementate in produzione. Anche in questo flusso di lavoro, solo l'ambiente di sviluppo può modificare le configurazioni; né l'ambiente di pre-release né quello di produzione consentono modifiche.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Quando si configurano le regole di migrazione, selezionare la regola **"Inserisci o Aggiorna"** per le tabelle integrate nel core e nei plugin, se necessario; per tutte le altre, è possibile mantenere le impostazioni predefinite se non ci sono requisiti particolari.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Rollback

Prima di eseguire una migrazione, il sistema crea automaticamente un backup dell'applicazione corrente. Se la migrazione fallisce o i risultati non sono conformi alle aspettative, è possibile eseguire un rollback e ripristinare tramite il [Gestore dei Backup](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)