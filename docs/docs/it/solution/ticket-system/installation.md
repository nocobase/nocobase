:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/solution/ticket-system/installation).
:::

# Come installare

> L'attuale versione adotta la forma di **backup e ripristino** per la distribuzione. Nelle versioni successive, potremmo passare alla forma di **migrazione incrementale**, al fine di agevolare l'integrazione della soluzione nei Suoi sistemi esistenti.

Per consentirLe di distribuire la soluzione per i ticket nel Suo ambiente NocoBase in modo rapido e fluido, forniamo due metodi di ripristino. Scelga quello più adatto a Lei in base alla Sua versione utente e al Suo background tecnico.

Prima di iniziare, si assicuri che:

- Disponga già di un ambiente di esecuzione NocoBase di base. Per l'installazione del sistema principale, consulti la [documentazione ufficiale di installazione](https://docs-cn.nocobase.com/welcome/getting-started/installation) più dettagliata.
- La versione di NocoBase sia **2.0.0-beta.5 o superiore**.
- Abbia già scaricato i file corrispondenti al sistema ticket:
  - **File di backup**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Applicabile al Metodo 1
  - **File SQL**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Applicabile al Metodo 2

**Nota importante**:
- Questa soluzione è realizzata sulla base del database **PostgreSQL 16**; si assicuri che il Suo ambiente utilizzi PostgreSQL 16.
- **DB_UNDERSCORED non può essere true**: controlli il Suo file `docker-compose.yml` e si assicuri che la variabile d'ambiente `DB_UNDERSCORED` non sia impostata su `true`, altrimenti entrerà in conflitto con il backup della soluzione causando il fallimento del ripristino.

---

## Metodo 1: Ripristino tramite il Gestore backup (consigliato per utenti Pro/Enterprise)

Questo metodo utilizza il plugin integrato di NocoBase "[Gestore backup](https://docs-cn.nocobase.com/handbook/backups)" (versione Pro/Enterprise) per eseguire un ripristino con un clic; è l'operazione più semplice. Tuttavia, presenta requisiti specifici per l'ambiente e la versione utente.

### Caratteristiche principali

* **Vantaggi**:
  1. **Operazione comoda**: può essere completata tramite l'interfaccia UI e consente di ripristinare integralmente tutte le configurazioni, inclusi i plugin.
  2. **Ripristino completo**: **in grado di ripristinare tutti i file di sistema**, inclusi i file dei modelli di stampa, i file caricati nei campi file delle tabelle, ecc., garantendo l'integrità funzionale.
* **Limitazioni**:
  1. **Esclusivo per Pro/Enterprise**: il "Gestore backup" è un plugin di livello aziendale, disponibile solo per gli utenti delle versioni Pro/Enterprise.
  2. **Requisiti ambientali rigorosi**: richiede che l'ambiente del Suo database (versione, impostazioni di distinzione tra maiuscole e minuscole, ecc.) sia altamente compatibile con l'ambiente in cui è stato creato il backup.
  3. **Dipendenza dai plugin**: se la soluzione include plugin commerciali non presenti nel Suo ambiente locale, il ripristino fallirà.

### Passaggi operativi

**Passaggio 1: [Fortemente consigliato] Avviare l'applicazione utilizzando l'immagine `full`**

Per evitare fallimenti nel ripristino dovuti alla mancanza di client del database, Le consigliamo vivamente di utilizzare la versione `full` dell'immagine Docker. Essa include tutti i programmi di supporto necessari, evitandole configurazioni aggiuntive.

Esempio di comando per scaricare l'immagine:

```bash
docker pull nocobase/nocobase:beta-full
```

Quindi utilizzi questa immagine per avviare il Suo servizio NocoBase.

> **Nota**: se non utilizza l'immagine `full`, potrebbe dover installare manualmente il client del database `pg_dump` all'interno del container, un processo macchinoso e instabile.

**Passaggio 2: Attivare il plugin "Gestore backup"**

1. Acceda al Suo sistema NocoBase.
2. Entri in **`Gestione plugin`**.
3. Trovi e attivi il plugin **`Gestore backup`**.

**Passaggio 3: Ripristino dal file di backup locale**

1. Dopo aver attivato il plugin, aggiorni la pagina.
2. Acceda al menu a sinistra **`Amministrazione del sistema`** -> **`Gestore backup`**.
3. Clicchi sul pulsante **`Ripristina da backup locale`** in alto a destra.
4. Trascini il file di backup scaricato nell'area di caricamento.
5. Clicchi su **`Invia`** e attenda pazientemente che il sistema completi il ripristino; questo processo può richiedere da poche decine di secondi a diversi minuti.

### Note

* **Compatibilità del database**: questo è il punto più critico di questo metodo. La **versione, il set di caratteri e le impostazioni di distinzione tra maiuscole e minuscole** del Suo database PostgreSQL devono corrispondere al file sorgente del backup. In particolare, il nome dello `schema` deve essere coerente.
* **Corrispondenza dei plugin commerciali**: si assicuri di possedere e aver attivato tutti i plugin commerciali richiesti dalla soluzione, altrimenti il ripristino verrà interrotto.

---

## Metodo 2: Importazione diretta del file SQL (universale, più adatto alla Community Edition)

Questo metodo ripristina i dati operando direttamente sul database, bypassando il plugin "Gestore backup", pertanto non presenta le restrizioni dei plugin Pro/Enterprise.

### Caratteristiche principali

* **Vantaggi**:
  1. **Nessuna restrizione di versione**: applicabile a tutti gli utenti NocoBase, inclusa la Community Edition.
  2. **Alta compatibilità**: non dipende dallo strumento di `dump` interno all'applicazione; è sufficiente potersi connettere al database per operare.
  3. **Alta tolleranza ai guasti**: se la soluzione include plugin commerciali che non possiede, le relative funzioni non verranno attivate, ma ciò non influirà sul normale utilizzo delle altre funzioni e l'applicazione potrà avviarsi correttamente.
* **Limitazioni**:
  1. **Richiede competenze operative sul database**: l'utente deve possedere competenze di base nel funzionamento del database, come ad esempio saper eseguire un file `.sql`.
  2. **Perdita dei file di sistema**: **questo metodo comporterà la perdita di tutti i file di sistema**, inclusi i file dei modelli di stampa, i file caricati nei campi file delle tabelle, ecc.

### Passaggi operativi

**Passaggio 1: Preparare un database pulito**

Prepari un database nuovo di zecca e vuoto per i dati che sta per importare.

**Passaggio 2: Importare il file `.sql` nel database**

Ottenga il file del database scaricato (solitamente in formato `.sql`) e importi il suo contenuto nel database preparato al passaggio precedente. Esistono diversi modi per farlo, a seconda del Suo ambiente:

* **Opzione A: Tramite riga di comando del server (esempio con Docker)**
  Se utilizza Docker per installare NocoBase e il database, può caricare il file `.sql` sul server e quindi utilizzare il comando `docker exec` per eseguire l'importazione. Supponendo che il Suo container PostgreSQL si chiami `my-nocobase-db` e il nome del file sia `ticket_system.sql`:

  ```bash
  # Copiare il file sql all'interno del container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Entrare nel container ed eseguire il comando di importazione
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Opzione B: Tramite client di database remoto**
  Se il Suo database espone una porta, può utilizzare qualsiasi client grafico per database (come DBeaver, Navicat, pgAdmin, ecc.) per connettersi al database, aprire una nuova finestra di query, incollare l'intero contenuto del file `.sql` ed eseguirlo.

**Passaggio 3: Connettere il database e avviare l'applicazione**

Configuri i parametri di avvio di NocoBase (come le variabili d'ambiente `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, ecc.) affinché puntino al database in cui ha appena importato i dati. Quindi, avvii normalmente il servizio NocoBase.

### Note

* **Permessi del database**: questo metodo richiede di disporre di un account e di una password che possano operare direttamente sul database.
* **Stato dei plugin**: dopo l'importazione riuscita, sebbene i dati dei plugin commerciali siano presenti nel sistema, se non ha installato e attivato localmente i plugin corrispondenti, le relative funzioni non verranno visualizzate né saranno utilizzabili, ma ciò non causerà il crash dell'applicazione.

---

## Riepilogo e confronto

| Caratteristica | Metodo 1: Gestore backup | Metodo 2: Importazione diretta SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Utenti destinatari** | Utenti **Pro/Enterprise** | **Tutti gli utenti** (inclusa Community Edition) |
| **Semplicità operativa** | ⭐⭐⭐⭐⭐ (Molto semplice, operazione UI) | ⭐⭐⭐ (Richiede conoscenze di base del database) |
| **Requisiti ambientali** | **Rigorosi**, database e versioni di sistema devono essere altamente compatibili | **Generali**, richiede compatibilità del database |
| **Dipendenza dai plugin** | **Forte dipendenza**, i plugin vengono verificati durante il ripristino; la mancanza di qualsiasi plugin causerà il **fallimento del ripristino**. | **Le funzioni dipendono fortemente dai plugin**. I dati possono essere importati indipendentemente e il sistema dispone delle funzioni di base. Tuttavia, se mancano i plugin corrispondenti, le relative funzioni saranno **completamente inutilizzabili**. |
| **File di sistema** | **Integralmente conservati** (modelli di stampa, file caricati, ecc.) | **Andranno persi** (modelli di stampa, file caricati, ecc.) |
| **Scenari consigliati** | Utenti aziendali con ambiente controllato e coerente, che necessitano di funzionalità complete | Mancanza di alcuni plugin, ricerca di alta compatibilità e flessibilità, utenti non Pro/Enterprise, accettazione della mancanza delle funzioni file |

Speriamo che questo tutorial possa aiutarLa a distribuire correttamente il sistema ticket. Se riscontra problemi durante l'operazione, non esiti a contattarci in qualsiasi momento!