---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Gestione delle Migrazioni

## Introduzione

Serve a migrare le configurazioni dell'applicazione da un ambiente applicativo a un altro. Il gestore delle migrazioni si concentra principalmente sulla migrazione delle "configurazioni dell'applicazione". Se ha bisogno di una migrazione completa, Le consigliamo di utilizzare la funzione di backup e ripristino del "[Gestore Backup](../backup-manager/index.mdx)".

## Installazione

Dipende dal plugin [Gestore Backup](../backup-manager/index.mdx). Si assicuri che sia già installato e attivato.

## Processo e Principi

Trasferisce le tabelle e i dati dal database principale, in base a regole di migrazione specifiche, da un'applicazione a un'altra. È importante notare che non vengono migrati i dati da database esterni o sotto-applicazioni.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Regole di Migrazione

### Regole Predefinite

Il gestore delle migrazioni può migrare tutte le tabelle del database principale e supporta le seguenti cinque regole predefinite:

- Solo struttura: Migra solo la struttura (schema) delle tabelle, senza inserire o aggiornare dati.
- Sovrascrivi (svuota e reinserisci): Elimina tutti i record esistenti dalla tabella di destinazione, quindi inserisce i nuovi dati.
- Inserisci o aggiorna (Upsert): Se un record esiste, lo aggiorna; altrimenti, lo inserisce.
- Ignora duplicati all'inserimento (Insert-ignore): Inserisce nuovi record, ma se un record esiste già, l'inserimento viene ignorato (non vengono eseguiti aggiornamenti).
- Salta: Non esegue alcuna elaborazione per la tabella.

Note aggiuntive:

- Le regole "Sovrascrivi", "Inserisci o aggiorna" e "Ignora duplicati all'inserimento" sincronizzano anche le modifiche alla struttura della tabella.
- Se una tabella utilizza un ID auto-incrementante come chiave primaria, o se non ha una chiave primaria, non è possibile applicare le regole `Inserisci o aggiorna` e `Ignora duplicati all'inserimento`.
- Le regole `Inserisci o aggiorna` e `Ignora duplicati all'inserimento` si basano sulla chiave primaria per determinare se il record esiste già.

### Design Dettagliato

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interfaccia di Configurazione

Configurare le regole di migrazione

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Abilitare regole indipendenti

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Selezionare le regole indipendenti e le tabelle da elaborare secondo tali regole

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## File di Migrazione

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Creazione di una Nuova Migrazione

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Esecuzione di una Migrazione

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Verifica delle variabili d'ambiente dell'applicazione (scopra di più sulle [Variabili d'ambiente](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Se mancano, apparirà una finestra pop-up che Le chiederà di inserire qui le nuove variabili d'ambiente necessarie, per poi continuare.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Log di Migrazione

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Rollback

Prima di eseguire qualsiasi migrazione, l'applicazione corrente viene automaticamente sottoposta a backup. Se la migrazione fallisce o i risultati non sono quelli attesi, può eseguire un rollback utilizzando il [Gestore Backup](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)