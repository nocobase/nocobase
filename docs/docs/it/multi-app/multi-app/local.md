---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/multi-app/multi-app/local).
:::

# Modalità memoria condivisa

## Introduzione

Quando gli utenti desiderano suddividere il business a livello di applicazione, ma non vogliono introdurre un'architettura di distribuzione e manutenzione complessa, è possibile utilizzare la modalità multi-applicazione a memoria condivisa.

In questa modalità, più applicazioni possono essere eseguite contemporaneamente in un'unica istanza di NocoBase. Ogni applicazione è indipendente, può connettersi a un database indipendente, può essere creata, avviata e arrestata singolarmente, ma condividono lo stesso processo e spazio di memoria; l'utente deve comunque mantenere solo un'unica istanza di NocoBase.

## Manuale utente

### Configurazione delle variabili d'ambiente

Prima di utilizzare la funzione multi-applicazione, si assicuri che le seguenti variabili d'ambiente siano impostate all'avvio di NocoBase:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Creazione dell'applicazione

Nel menu delle impostazioni di sistema, clicchi su "App Supervisor" per accedere alla pagina di gestione delle applicazioni.

![](https://static-docs.nocobase.com/202512291056215.png)

Clicchi sul pulsante "Aggiungi nuovo" per creare una nuova applicazione.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Descrizione delle opzioni di configurazione

| Opzione | Descrizione |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nome applicazione** | Nome dell'applicazione visualizzato nell'interfaccia |
| **Identificatore applicazione** | Identificatore dell'applicazione, univoco a livello globale |
| **Modalità di avvio** | - Avvio al primo accesso: si avvia solo quando l'utente accede alla sotto-applicazione tramite URL per la prima volta<br>- Avvio insieme all'applicazione principale: si avvia contemporaneamente all'avvio dell'applicazione principale (aumenta il tempo di avvio dell'applicazione principale) |
| **Ambiente** | In modalità memoria condivisa, è disponibile solo l'ambiente locale, ovvero `local` |
| **Connessione al database** | Utilizzata per configurare la fonte dati principale dell'applicazione, supporta tre modalità:<br>- Nuovo database: riutilizza il servizio database corrente, crea un database indipendente<br>- Nuova connessione dati: si connette ad altri servizi database<br>- Modalità Schema: quando la fonte dati principale corrente è PostgreSQL, crea uno Schema indipendente per l'applicazione |
| **Aggiornamento** | Se nel database collegato sono presenti dati di un'applicazione NocoBase di versione precedente, indica se consentire l'aggiornamento automatico alla versione corrente dell'applicazione |
| **Chiave JWT** | Genera automaticamente una chiave JWT indipendente per l'applicazione, garantendo che la sessione dell'applicazione sia indipendente dall'applicazione principale e dalle altre applicazioni |
| **Dominio personalizzato** | Configura un dominio di accesso indipendente per l'applicazione |

### Avvio dell'applicazione

Clicchi sul pulsante **Avvia** per avviare la sotto-applicazione.

> Se durante la creazione è stata selezionata l'opzione _"Avvio al primo accesso"_, l'applicazione si avvierà automaticamente al primo accesso.

![](https://static-docs.nocobase.com/202512291121065.png)

### Accesso all'applicazione

Clicchi sul pulsante **Accedi** per aprire la sotto-applicazione in una nuova scheda.

Per impostazione predefinita, si utilizza `/apps/:appName/admin/` per accedere alla sotto-applicazione, ad esempio:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Allo stesso tempo, è possibile configurare un dominio indipendente per la sotto-applicazione; è necessario far puntare il dominio all'IP corrente e, se si utilizza Nginx, è necessario aggiungere il dominio nella configurazione di Nginx.

### Arresto dell'applicazione

Clicchi sul pulsante **Ferma** per arrestare la sotto-applicazione.

![](https://static-docs.nocobase.com/202512291122113.png)

### Stato dell'applicazione

È possibile visualizzare lo stato corrente di ogni applicazione nell'elenco.

![](https://static-docs.nocobase.com/202512291122339.png)

### Eliminazione dell'applicazione

Clicchi sul pulsante **Elimina** per rimuovere l'applicazione.

![](https://static-docs.nocobase.com/202512291122178.png)

## Domande frequenti

### 1. Gestione dei plugin

I plugin utilizzabili dalle altre applicazioni sono gli stessi dell'applicazione principale (inclusa la versione), ma possono essere configurati e utilizzati in modo indipendente.

### 2. Isolamento del database

Le altre applicazioni possono configurare database indipendenti; se si desidera condividere i dati tra le applicazioni, è possibile farlo tramite una fonte dati esterna.

### 3. Backup e migrazione dei dati

Attualmente, il backup dei dati sull'applicazione principale non supporta l'inclusione dei dati delle altre applicazioni (include solo le informazioni di base dell'applicazione); è necessario eseguire il backup e la migrazione manualmente all'interno delle altre applicazioni.

### 4. Distribuzione e aggiornamento

In modalità memoria condivisa, le versioni delle altre applicazioni seguiranno automaticamente l'aggiornamento dell'applicazione principale, garantendo automaticamente la coerenza della versione dell'applicazione.

### 5. Sessione dell'applicazione

- Se l'applicazione utilizza una chiave JWT indipendente, la sessione dell'applicazione è indipendente dall'applicazione principale e dalle altre applicazioni. Se si accede a diverse applicazioni tramite sotto-percorsi dello stesso dominio, poiché il TOKEN dell'applicazione è memorizzato nella cache del LocalStorage, è necessario effettuare nuovamente il login quando si passa da un'applicazione all'altra. Si consiglia di configurare domini indipendenti per le diverse applicazioni per ottenere un migliore isolamento della sessione.
- Se l'applicazione non utilizza una chiave JWT indipendente, condividerà la sessione dell'applicazione principale; dopo aver effettuato l'accesso ad altre applicazioni nello stesso browser, non è necessario effettuare nuovamente il login per tornare all'applicazione principale. Tuttavia, esiste un rischio per la sicurezza: se gli ID utente di diverse applicazioni si ripetono, ciò potrebbe portare a un accesso non autorizzato ai dati di altre applicazioni da parte dell'utente.