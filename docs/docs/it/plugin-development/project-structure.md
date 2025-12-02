:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Struttura del Progetto

Sia che Lei cloni il codice sorgente da Git, sia che inizializzi un progetto usando `create-nocobase-app`, il progetto NocoBase generato è essenzialmente un monorepo basato su **Yarn Workspace**.

## Panoramica delle Directory Principali

L'esempio seguente utilizza `my-nocobase-app/` come directory del progetto. In ambienti diversi, potrebbero esserci leggere differenze:

```bash
my-nocobase-app/
├── packages/              # Codice sorgente del progetto
│   ├── plugins/           # Codice sorgente dei plugin in fase di sviluppo (non compilati)
├── storage/               # Dati di runtime e contenuti generati dinamicamente
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugin compilati (inclusi quelli caricati tramite interfaccia utente)
│   └── tar/               # File di pacchetto dei plugin (.tar)
├── scripts/               # Script di utilità e comandi degli strumenti
├── .env*                  # Configurazioni delle variabili d'ambiente per diversi ambienti
├── lerna.json             # Configurazione dello workspace Lerna
├── package.json           # Configurazione del pacchetto radice, dichiara workspace e script
├── tsconfig*.json         # Configurazioni TypeScript (frontend, backend, mappatura dei percorsi)
├── vitest.config.mts      # Configurazione dei test unitari Vitest
└── playwright.config.ts   # Configurazione dei test E2E Playwright
```

## Descrizione della Sottodirectory packages/

La directory `packages/` contiene i moduli core di NocoBase e i pacchetti estensibili. Il contenuto dipende dall'origine del progetto:

- **Progetti creati tramite `create-nocobase-app`**: Per impostazione predefinita, include solo `packages/plugins/`, utilizzato per archiviare il codice sorgente dei plugin personalizzati. Ogni sottodirectory è un pacchetto npm indipendente.
- **Repository del codice sorgente ufficiale clonato**: È possibile visualizzare più sottodirectory, come `core/`, `plugins/`, `pro-plugins/`, `presets/`, ecc., che corrispondono rispettivamente al core del framework, ai plugin integrati e alle soluzioni predefinite ufficiali.

In ogni caso, `packages/plugins` è la posizione principale per lo sviluppo e il debug dei plugin personalizzati.

## Directory di Runtime storage/

`storage/` archivia i dati generati in fase di runtime e gli output di build. Le descrizioni delle sottodirectory comuni sono le seguenti:

- `apps/`: Configurazione e cache per scenari multi-applicazione.
- `logs/`: Log di runtime e output di debug.
- `uploads/`: File e risorse multimediali caricati dall'utente.
- `plugins/`: Plugin impacchettati caricati tramite interfaccia utente o importati tramite CLI.
- `tar/`: Pacchetti plugin compressi generati dopo l'esecuzione di `yarn build <plugin> --tar`.

> Di solito si consiglia di aggiungere la directory `storage` a `.gitignore` e di gestirla separatamente durante il deployment o il backup.

## Configurazione dell'Ambiente e Script del Progetto

- `.env`, `.env.test`, `.env.e2e`: Utilizzati rispettivamente per l'esecuzione locale, i test unitari/di integrazione e i test end-to-end.
- `scripts/`: Contiene script di manutenzione comuni (come l'inizializzazione del database, utility di rilascio, ecc.).

## Percorsi di Caricamento e Priorità dei Plugin

I plugin possono esistere in più posizioni. NocoBase li caricherà nel seguente ordine di priorità all'avvio:

1. La versione del codice sorgente in `packages/plugins` (per lo sviluppo e il debug locale).
2. La versione impacchettata in `storage/plugins` (caricata tramite interfaccia utente o importata tramite CLI).
3. I pacchetti di dipendenza in `node_modules` (installati tramite npm/yarn o integrati nel framework).

Quando un plugin con lo stesso nome esiste sia nella directory sorgente che in quella impacchettata, il sistema darà priorità al caricamento della versione sorgente, facilitando le sovrascritture locali e il debug.

## Modello di Directory del Plugin

Crea un plugin usando la CLI:

```bash
yarn pm create @my-project/plugin-hello
```

La struttura della directory generata è la seguente:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Output di build (generato su richiesta)
├── src/                     # Directory del codice sorgente
│   ├── client/              # Codice frontend (blocchi, pagine, modelli, ecc.)
│   │   ├── plugin.ts        # Classe principale del plugin lato client
│   │   └── index.ts         # Punto di ingresso lato client
│   ├── locale/              # Risorse multilingue (condivise tra frontend e backend)
│   ├── swagger/             # Documentazione OpenAPI/Swagger
│   └── server/              # Codice lato server
│       ├── collections/     # Definizioni di collezioni
│       ├── commands/        # Comandi personalizzati
│       ├── migrations/      # Script di migrazione del database
│       ├── plugin.ts        # Classe principale del plugin lato server
│       └── index.ts         # Punto di ingresso lato server
├── index.ts                 # Esportazione del bridge frontend e backend
├── client.d.ts              # Dichiarazioni di tipo frontend
├── client.js                # Artefatto di build frontend
├── server.d.ts              # Dichiarazioni di tipo lato server
├── server.js                # Artefatto di build lato server
├── .npmignore               # Configurazione di ignoranza per la pubblicazione
└── package.json
```

> Una volta completata la build, la directory `dist/` e i file `client.js`, `server.js` verranno caricati all'abilitazione del plugin.
> Durante lo sviluppo, è sufficiente modificare la directory `src/`. Prima della pubblicazione, esegua `yarn build <plugin>` o `yarn build <plugin> --tar`.