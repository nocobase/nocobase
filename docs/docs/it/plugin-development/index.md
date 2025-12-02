:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica sullo sviluppo di plugin

NocoBase adotta un'**architettura a microkernel**, dove il core è responsabile solo della gestione del ciclo di vita dei **plugin**, della gestione delle dipendenze e dell'incapsulamento delle funzionalità di base. Tutte le funzionalità di business sono fornite sotto forma di **plugin**. Pertanto, comprendere la struttura organizzativa, il ciclo di vita e le modalità di gestione dei **plugin** è il primo passo per personalizzare NocoBase.

## Concetti chiave

- **Plug and Play**: I **plugin** possono essere installati, abilitati o disabilitati a seconda delle necessità, consentendo una combinazione flessibile delle funzionalità di business senza dover modificare il codice.
- **Integrazione Full-stack**: I **plugin** includono tipicamente implementazioni sia lato server che lato client, garantendo la coerenza tra la logica dei dati e le interazioni dell'interfaccia utente.

## Struttura di base di un plugin

Ogni **plugin** è un pacchetto npm indipendente, che tipicamente contiene la seguente struttura di directory:

```bash
plugin-hello/
├─ package.json          # Nome del plugin, dipendenze e metadati del plugin NocoBase
├─ client.js             # Artefatto di build frontend, caricato a runtime
├─ server.js             # Artefatto di build server-side, caricato a runtime
├─ src/
│  ├─ client/            # Codice sorgente lato client, può registrare blocchi, azioni, campi, ecc.
│  └─ server/            # Codice sorgente lato server, può registrare risorse, eventi, comandi, ecc.
```

## Convenzioni delle directory e ordine di caricamento

NocoBase scansiona le seguenti directory per caricare i **plugin** per impostazione predefinita:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugin in fase di sviluppo (massima priorità)
└── storage/
    └── plugins/          # Plugin compilati, ad esempio plugin caricati o pubblicati
```

- `packages/plugins`: Utilizzato per lo sviluppo locale di **plugin**, supporta la compilazione e il debugging in tempo reale.
- `storage/plugins`: Contiene i **plugin** compilati, come quelli delle edizioni commerciali o di terze parti.

## Ciclo di vita e stati dei plugin

Un **plugin** attraversa tipicamente le seguenti fasi:

1.  **Creazione (create)**: Crea un template di **plugin** tramite CLI.
2.  **Pull (pull)**: Scarica il pacchetto del **plugin** localmente, ma non è ancora stato scritto nel database.
3.  **Abilitazione (enable)**: Alla prima abilitazione, esegue "registrazione + inizializzazione"; le abilitazioni successive caricano solo la logica.
4.  **Disabilitazione (disable)**: Interrompe l'esecuzione del **plugin**.
5.  **Rimozione (remove)**: Rimuove completamente il **plugin** dal sistema.

:::tip

- `pull` si occupa solo di scaricare il pacchetto del **plugin**; il processo di installazione effettivo viene attivato dalla prima `enable`.
- Se un **plugin** viene solo `pull`ato ma non abilitato, non verrà caricato.

:::

### Esempi di comandi CLI

```bash
# 1. Crea lo scheletro del plugin
yarn pm create @my-project/plugin-hello

# 2. Effettua il pull del pacchetto del plugin (scarica o collega)
yarn pm pull @my-project/plugin-hello

# 3. Abilita il plugin (si installa automaticamente alla prima abilitazione)
yarn pm enable @my-project/plugin-hello

# 4. Disabilita il plugin
yarn pm disable @my-project/plugin-hello

# 5. Rimuovi il plugin
yarn pm remove @my-project/plugin-hello
```

## Interfaccia di gestione dei plugin

Acceda al gestore dei **plugin** nel browser per visualizzare e gestire i **plugin** in modo intuitivo:

**URL predefinito:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gestore dei plugin](https://static-docs.nocobase.com/20251030195350.png)