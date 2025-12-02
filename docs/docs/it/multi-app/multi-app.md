---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Multi-applicazione

## Introduzione

Il **plugin Multi-applicazione** Le permette di creare e gestire dinamicamente più applicazioni indipendenti, senza la necessità di deployment separati. Ogni sotto-applicazione è un'istanza completamente autonoma, con il proprio database, i propri plugin e la propria configurazione.

#### Casi d'uso
- **Multi-tenancy**: Offrire istanze applicative indipendenti, dove ogni cliente ha i propri dati, le configurazioni dei plugin e il proprio sistema di permessi.
- **Sistemi principali e secondari per diversi domini di business**: Un sistema di grandi dimensioni composto da più applicazioni più piccole, implementate in modo indipendente.

:::warning
Il plugin Multi-applicazione di per sé non offre funzionalità di condivisione degli utenti.  
Se ha bisogno di condividere gli utenti tra più applicazioni, può utilizzarlo in combinazione con il **[plugin di Autenticazione](/auth-verification)**.
:::

## Installazione

Nel gestore dei plugin, trovi il plugin **Multi-applicazione** e lo abiliti.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Guida all'uso

### Creazione di una sotto-applicazione

Nel menu delle impostazioni di sistema, clicchi su "Multi-applicazione" per accedere alla pagina di gestione delle multi-applicazioni:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Clicchi sul pulsante "Aggiungi nuovo" per creare una nuova sotto-applicazione:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Descrizione dei campi del modulo

*   **Nome**: Identificatore della sotto-applicazione, globalmente unico.
*   **Nome visualizzato**: Il nome della sotto-applicazione visualizzato nell'interfaccia.
*   **Modalità di avvio**:
    *   **Avvia alla prima visita**: La sotto-applicazione si avvia solo quando un utente la accede tramite URL per la prima volta.
    *   **Avvia con l'applicazione principale**: La sotto-applicazione si avvia contemporaneamente all'applicazione principale (questo aumenterà il tempo di avvio dell'applicazione principale).
*   **Porta**: Il numero di porta utilizzato dalla sotto-applicazione durante l'esecuzione.
*   **Dominio personalizzato**: Configuri un sottodominio indipendente per la sotto-applicazione.
*   **Fissa al menu**: Fissi la voce della sotto-applicazione sul lato sinistro della barra di navigazione superiore.
*   **Connessione al database**: Utilizzata per configurare la fonte dati della sotto-applicazione, supporta i seguenti tre metodi:
    *   **Nuovo database**: Riutilizzi il servizio dati corrente per creare un database indipendente.
    *   **Nuova connessione dati**: Configuri un servizio di database completamente nuovo.
    *   **Modalità Schema**: Crei uno schema indipendente per la sotto-applicazione in PostgreSQL.
*   **Aggiornamento**: Se il database connesso contiene una versione precedente della struttura dati di NocoBase, verrà automaticamente aggiornato alla versione corrente.

### Avvio e arresto di una sotto-applicazione

Clicchi sul pulsante **Avvia** per avviare la sotto-applicazione;  
> Se durante la creazione è stata selezionata l'opzione *"Avvia alla prima visita"*, la sotto-applicazione si avvierà automaticamente al primo accesso.  

Clicchi sul pulsante **Visualizza** per aprire la sotto-applicazione in una nuova scheda.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Stato e log della sotto-applicazione

Nell'elenco, può visualizzare l'utilizzo di memoria e CPU di ogni applicazione.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Clicchi sul pulsante **Log** per visualizzare i log di runtime della sotto-applicazione.  
> Se la sotto-applicazione non è accessibile dopo l'avvio (ad esempio, a causa di un database danneggiato), può utilizzare i log per la risoluzione dei problemi.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Eliminazione di una sotto-applicazione

Clicchi sul pulsante **Elimina** per rimuovere la sotto-applicazione.  
> Durante l'eliminazione, può scegliere se eliminare anche il database. Proceda con cautela, poiché questa azione è irreversibile.

### Accesso a una sotto-applicazione
Per impostazione predefinita, le sotto-applicazioni sono accessibili utilizzando `/_app/:appName/admin/`, ad esempio:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Inoltre, può configurare un sottodominio indipendente per la sotto-applicazione. Dovrà risolvere il dominio all'IP corrente e, se utilizza Nginx, dovrà anche aggiungere il dominio alla configurazione di Nginx.

### Gestione delle sotto-applicazioni tramite riga di comando

Nella directory radice del progetto, può utilizzare la riga di comando per gestire le istanze delle sotto-applicazioni tramite **PM2**:

```bash
yarn nocobase pm2 list              # Visualizza l'elenco delle istanze attualmente in esecuzione
yarn nocobase pm2 stop [appname]    # Ferma un processo di sotto-applicazione specifico
yarn nocobase pm2 delete [appname]  # Elimina un processo di sotto-applicazione specifico
yarn nocobase pm2 kill              # Termina forzatamente tutti i processi avviati (potrebbe includere l'istanza dell'applicazione principale)
```

### Migrazione dei dati dalla vecchia Multi-applicazione

Acceda alla vecchia pagina di gestione delle multi-applicazioni e clicchi sul pulsante **Migra dati alla nuova Multi-applicazione** per avviare la migrazione dei dati.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Domande Frequenti

#### 1. Gestione dei plugin
Le sotto-applicazioni possono utilizzare gli stessi plugin dell'applicazione principale (incluse le versioni), ma possono essere configurate e utilizzate in modo indipendente.

#### 2. Isolamento del database
Le sotto-applicazioni possono essere configurate con database indipendenti. Se desidera condividere dati tra le applicazioni, può farlo tramite fonti dati esterne.

#### 3. Backup e migrazione dei dati
Attualmente, i backup dei dati nell'applicazione principale non includono i dati delle sotto-applicazioni (solo le informazioni di base delle sotto-applicazioni). È necessario eseguire manualmente il backup e la migrazione dei dati all'interno di ogni sotto-applicazione.

#### 4. Deployment e aggiornamenti
La versione di una sotto-applicazione verrà automaticamente aggiornata insieme all'applicazione principale, garantendo la coerenza della versione tra l'applicazione principale e le sotto-applicazioni.

#### 5. Gestione delle risorse
Il consumo di risorse di ogni sotto-applicazione è sostanzialmente lo stesso dell'applicazione principale. Attualmente, una singola applicazione utilizza circa 500-600 MB di memoria.