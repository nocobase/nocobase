---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/multi-space/multi-app).
:::

# Multi-app

## Introduzione

Il plugin **Multi-app** consente la creazione e la gestione dinamica di più applicazioni indipendenti senza la necessità di distribuzioni separate. Ogni sotto-app è un'istanza completamente indipendente con il proprio database, i propri plugin e le proprie configurazioni.

#### Scenari di utilizzo
- **Multi-tenancy**: Fornisce istanze applicative indipendenti in cui ogni cliente dispone dei propri dati, configurazioni dei plugin e sistemi di permessi.
- **Sistemi principali e secondari per diversi domini aziendali**: Un sistema di grandi dimensioni composto da diverse piccole applicazioni distribuite indipendentemente.

:::warning
Il plugin Multi-app di per sé non fornisce funzionalità di condivisione degli utenti.  
Per abilitare l'integrazione degli utenti tra più applicazioni, può essere utilizzato in combinazione con il **[Plugin di Autenticazione](/auth-verification)**.
:::

## Installazione

Individuare il plugin **Multi-app** nel gestore dei plugin e attivarlo.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Manuale utente

### Creazione di una sotto-app

Fare clic su "Multi-app" nel menu delle impostazioni di sistema per accedere alla pagina di gestione multi-app:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Fare clic sul pulsante "Aggiungi nuovo" per creare una nuova sotto-app:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Descrizione dei campi del modulo

* **Nome**: Identificatore della sotto-app, univoco a livello globale.
* **Nome visualizzato**: Il nome della sotto-app visualizzato nell'interfaccia.
* **Modalità di avvio**:
  * **Avvio al primo accesso**: La sotto-app si avvia solo quando un utente vi accede tramite URL per la prima volta.
  * **Avvio con l'app principale**: La sotto-app si avvia contemporaneamente all'app principale (questo aumenta il tempo di avvio dell'app principale).
* **Porta**: Il numero di porta utilizzato dalla sotto-app durante l'esecuzione.
* **Dominio personalizzato**: Configura un sottodominio indipendente per la sotto-app.
* **Fissa al menu**: Fissa l'accesso alla sotto-app sul lato sinistro della barra di navigazione superiore.
* **Connessione al database**: Utilizzata per configurare la fonte dati per la sotto-app, supportando tre metodi:
  * **Nuovo database**: Riutilizza il servizio dati corrente per creare un database indipendente.
  * **Nuova connessione dati**: Configura un servizio di database completamente nuovo.
  * **Modalità Schema**: Crea uno Schema indipendente per la sotto-app in PostgreSQL.
* **Aggiornamento**: Se il database collegato contiene una versione precedente della struttura dati di NocoBase, verrà aggiornato automaticamente alla versione corrente.

### Avvio e arresto delle sotto-app

Fare clic sul pulsante **Avvia** per avviare una sotto-app.  
> Se l'opzione *"Avvio al primo accesso"* è stata selezionata durante la creazione, l'app si avvierà automaticamente alla prima visita.  

Fare clic sul pulsante **Visualizza** per aprire la sotto-app in una nuova scheda.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Stato di esecuzione e log della sotto-app

È possibile visualizzare l'utilizzo di memoria e CPU di ogni applicazione nell'elenco.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Fare clic sul pulsante **Log** per visualizzare i log di esecuzione della sotto-app.  
> Se una sotto-app non è accessibile dopo l'avvio (ad esempio, a causa di un database danneggiato), è possibile risolvere il problema consultando i log.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Eliminazione di una sotto-app

Fare clic sul pulsante **Elimina** per rimuovere una sotto-app.  
> Durante l'eliminazione, è possibile scegliere se eliminare anche il database. Si prega di procedere con cautela, poiché questa azione è irreversibile.

### Accesso alle sotto-app
Per impostazione predefinita, utilizzare `/_app/:appName/admin/` per accedere alle sotto-app, ad esempio:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Inoltre, è possibile configurare sottodomini indipendenti per le sotto-app. È necessario far puntare il dominio all'indirizzo IP corrente. Se si utilizza Nginx, il dominio deve essere aggiunto anche alla configurazione di Nginx.

### Gestione delle sotto-app tramite CLI

Nella directory principale del progetto, è possibile utilizzare la riga di comando per gestire le istanze delle sotto-app tramite **PM2**:

```bash
yarn nocobase pm2 list              # Visualizza l'elenco delle istanze attualmente in esecuzione
yarn nocobase pm2 stop [appname]    # Arresta un processo specifico di una sotto-app
yarn nocobase pm2 delete [appname]  # Elimina un processo specifico di una sotto-app
yarn nocobase pm2 kill              # Termina forzatamente tutti i processi avviati (potrebbe includere l'istanza dell'app principale)
```

### Migrazione dei dati dalla versione precedente

Accedere alla vecchia pagina di gestione multi-app e fare clic sul pulsante **Migra i dati alla nuova Multi-app** per eseguire la migrazione dei dati.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## FAQ

#### 1. Gestione dei plugin
Le sotto-app possono utilizzare gli stessi plugin dell'app principale (comprese le versioni), ma i plugin possono essere configurati e utilizzati in modo indipendente.

#### 2. Isolamento del database
Le sotto-app possono essere configurate con database indipendenti. Se si desidera condividere i dati tra le applicazioni, è possibile farlo attraverso fonti dati esterne.

#### 3. Backup e migrazione dei dati
Attualmente, il backup dei dati sull'app principale non include i dati delle sotto-app (include solo le informazioni di base delle sotto-app). I backup e le migrazioni devono essere eseguiti manualmente all'interno di ogni sotto-app.

#### 4. Distribuzione e aggiornamenti
Le versioni delle sotto-app seguiranno automaticamente gli aggiornamenti dell'app principale, garantendo la coerenza della versione tra l'app principale e le sotto-app.

#### 5. Gestione delle risorse
Il consumo di risorse di ogni sotto-app è sostanzialmente lo stesso dell'app principale. Attualmente, l'utilizzo della memoria di una singola applicazione è di circa 500-600 MB.