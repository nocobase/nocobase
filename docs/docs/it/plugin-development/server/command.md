:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Comando

In NocoBase, i comandi vengono utilizzati per eseguire operazioni relative ad applicazioni o plugin nella riga di comando, come l'esecuzione di task di sistema, operazioni di migrazione o sincronizzazione, l'inizializzazione della configurazione o l'interazione con istanze dell'applicazione in esecuzione. Gli sviluppatori possono definire comandi personalizzati per i plugin e registrarli tramite l'oggetto `app`, eseguendoli nella CLI con il formato `nocobase <command>`.

## Tipi di Comando

In NocoBase, la registrazione dei comandi si divide in due tipi:

| Tipo | Metodo di Registrazione | Il Plugin Deve Essere Abilitato? | Scenari Tipici |
|------|-------------------------|---------------------------------|---------------------------------------------------|
| Comando Dinamico | `app.command()` | ✅ Sì | Comandi relativi alla logica di business del plugin |
| Comando Statico | `Application.registerStaticCommand()` | ❌ No | Comandi di installazione, inizializzazione, manutenzione |

## Comandi Dinamici

Utilizzi `app.command()` per definire i comandi dei plugin. I comandi possono essere eseguiti solo dopo che il plugin è stato abilitato. I file dei comandi dovrebbero essere posizionati nella directory `src/server/commands/*.ts` all'interno della directory del plugin.

Esempio

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Descrizione

- `app.command('echo')`: Definisce un comando chiamato `echo`.
- `.option('-v, --version')`: Aggiunge un'opzione al comando.
- `.action()`: Definisce la logica di esecuzione del comando.
- `app.version.get()`: Recupera la versione corrente dell'applicazione.

Esegui Comando

```bash
nocobase echo
nocobase echo -v
```

## Comandi Statici

Utilizzi `Application.registerStaticCommand()` per la registrazione. I comandi statici possono essere eseguiti senza abilitare i plugin e sono adatti per task di installazione, inizializzazione, migrazione o debug. La registrazione avviene nel metodo `staticImport()` della classe del plugin.

Esempio

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Esegui Comando

```bash
nocobase echo
nocobase echo --version
```

Descrizione

- `Application.registerStaticCommand()` registra i comandi prima che l'applicazione venga istanziata.
- I comandi statici sono generalmente utilizzati per eseguire task globali non correlati allo stato dell'applicazione o del plugin.

## Command API

Gli oggetti comando offrono tre metodi ausiliari opzionali per controllare il contesto di esecuzione del comando:

| Metodo | Scopo | Esempio |
|----------|----------------------------------------------------------|-------------------------------------|
| `ipc()` | Comunica con le istanze dell'applicazione in esecuzione (tramite IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Verifica che la configurazione del database sia corretta | `app.command('seed').auth().action()` |
| `preload()` | Precarica la configurazione dell'applicazione (esegue `app.load()`) | `app.command('sync').preload().action()` |

Descrizione della Configurazione

- **`ipc()`**
  Per impostazione predefinita, i comandi vengono eseguiti in una nuova istanza dell'applicazione.
  Dopo aver abilitato `ipc()`, i comandi interagiscono con l'istanza dell'applicazione attualmente in esecuzione tramite comunicazione interprocesso (IPC), rendendoli adatti per comandi operativi in tempo reale (come l'aggiornamento della cache, l'invio di notifiche).

- **`auth()`**
  Verifica se la configurazione del database è disponibile prima dell'esecuzione del comando.
  Se la configurazione del database è errata o la connessione fallisce, il comando non proseguirà. È comunemente utilizzato per task che implicano scritture o letture dal database.

- **`preload()`**
  Precarica la configurazione dell'applicazione prima di eseguire il comando, equivalente all'esecuzione di `app.load()`.
  È adatto per comandi che dipendono dalla configurazione o dal contesto del plugin.

Per ulteriori metodi API, consulti [AppCommand](/api/server/app-command).

## Esempi Comuni

Inizializzare i Dati Predefiniti

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

Ricaricare la Cache per l'Istanza in Esecuzione (Modalità IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

Registrazione Statica del Comando di Installazione

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```