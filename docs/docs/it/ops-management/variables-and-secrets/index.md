---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Variabili e Segreti

## Introduzione

Configurazione e gestione centralizzata delle variabili d'ambiente e dei segreti per l'archiviazione di dati sensibili, il riutilizzo dei dati di configurazione e l'isolamento della configurazione dell'ambiente.

## Differenze da `.env`

| **Caratteristica**               | **File `.env`**                                                                                    | **Variabili e Segreti configurati dinamicamente**                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Posizione di archiviazione**      | Archiviato nel file `.env` nella directory principale del progetto                                            | Archiviato nella tabella `environmentVariables` nel database                                                                                                      |
| **Metodo di caricamento**        | Caricato in `process.env` utilizzando strumenti come `dotenv` all'avvio dell'applicazione                     | Letto dinamicamente e caricato in `app.environment` all'avvio dell'applicazione                                                                                   |
| **Metodo di modifica**   | Richiede la modifica diretta del file e il riavvio dell'applicazione affinché le modifiche abbiano effetto | Supporta la modifica in fase di esecuzione; le modifiche hanno effetto immediatamente dopo il ricaricamento della configurazione dell'applicazione                                                    |
| **Isolamento dell'ambiente** | Ogni ambiente (sviluppo, test, produzione) richiede una manutenzione separata dei file `.env`  | Ogni ambiente (sviluppo, test, produzione) richiede una manutenzione separata dei dati nella tabella `environmentVariables`                                   |
| **Scenari applicabili**  | Adatto per configurazioni statiche fisse, come le informazioni del database principale per l'applicazione    | Adatto per configurazioni dinamiche che richiedono frequenti aggiustamenti o sono legate alla logica di business, come database esterni, informazioni di archiviazione file, ecc. |

## Installazione

Il plugin è integrato, non è necessaria un'installazione separata.

## Utilizzo

### Riutilizzo dei dati di configurazione

Ad esempio, se più punti del flusso di lavoro richiedono nodi email e la configurazione SMTP, la configurazione SMTP comune può essere archiviata nelle variabili d'ambiente.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Archiviazione di dati sensibili

Archiviazione di varie informazioni di configurazione di database esterni, chiavi di archiviazione di file cloud, ecc.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolamento della configurazione dell'ambiente

In diversi ambienti come sviluppo, test e produzione, vengono utilizzate strategie di gestione della configurazione indipendenti per garantire che le configurazioni e i dati di ciascun ambiente non interferiscano tra loro. Ogni ambiente ha le proprie impostazioni, variabili e risorse indipendenti, il che evita conflitti tra gli ambienti di sviluppo, test e produzione e garantisce che il sistema funzioni come previsto in ogni ambiente.

Ad esempio, la configurazione per i servizi di archiviazione file potrebbe differire tra gli ambienti di sviluppo e produzione, come mostrato di seguito:

Ambiente di Sviluppo

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Ambiente di Produzione

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Gestione delle variabili d'ambiente

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Aggiunta di variabili d'ambiente

- Supporta l'aggiunta singola e in blocco
- Supporta l'archiviazione in chiaro e crittografata

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Aggiunta singola

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Aggiunta in blocco

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Note

### Riavvio dell'applicazione

Dopo aver modificato o eliminato le variabili d'ambiente, apparirà un messaggio nella parte superiore che invita a riavviare l'applicazione. Le modifiche alle variabili d'ambiente avranno effetto solo dopo il riavvio dell'applicazione.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Archiviazione crittografata

I dati crittografati per le variabili d'ambiente utilizzano la crittografia simmetrica AES. La PRIVATE KEY per la crittografia e la decrittografia è archiviata nella directory di storage. Si prega di conservarla con cura; se persa o sovrascritta, i dati crittografati non potranno essere decifrati.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Plugin attualmente supportati per le variabili d'ambiente

### Azione: Richiesta personalizzata

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Autenticazione: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Autenticazione: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Autenticazione: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Autenticazione: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Autenticazione: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Autenticazione: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Fonte dati: MariaDB esterno

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Fonte dati: MySQL esterno

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Fonte dati: Oracle esterno

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Fonte dati: PostgreSQL esterno

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Fonte dati: SQL Server esterno

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Fonte dati: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Fonte dati: API REST

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Archiviazione file: Locale

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Archiviazione file: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Archiviazione file: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Archiviazione file: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Archiviazione file: S3 Pro

Non adattato

### Mappa: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Mappa: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Impostazioni email

Non adattato

### Notifica: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Moduli pubblici

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Impostazioni di sistema

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verifica: SMS Aliyun

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verifica: SMS Tencent

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Flusso di lavoro

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)