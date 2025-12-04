:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Příkazy

V NocoBase se příkazy používají ke spouštění operací z příkazové řádky souvisejících s aplikacemi nebo pluginy, například spouštění systémových úloh, provádění migrací nebo synchronizací, inicializace konfigurace, nebo interakce s běžícími instancemi aplikace. Vývojáři mohou pro pluginy definovat vlastní příkazy a registrovat je prostřednictvím objektu `app`, které se pak v CLI spouštějí ve formátu `nocobase <příkaz>`.

## Typy příkazů

V NocoBase se registrace příkazů dělí na dva typy:

| Typ             | Způsob registrace                     | Je nutné mít plugin povolen? | Typické scénáře                         |
|-----------------|---------------------------------------|------------------------------|-----------------------------------------|
| Dynamický příkaz | `app.command()`                       | ✅ Ano                       | Příkazy související s logikou pluginu   |
| Statický příkaz | `Application.registerStaticCommand()` | ❌ Ne                        | Příkazy pro instalaci, inicializaci, údržbu |

## Dynamické příkazy

Pro definování příkazů pluginu použijte `app.command()`. Příkazy lze spustit až po povolení pluginu. Soubory s příkazy by měly být umístěny v adresáři pluginu `src/server/commands/*.ts`.

Příklad

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

Popis

- `app.command('echo')`: Definuje příkaz s názvem `echo`.  
- `.option('-v, --version')`: Přidá k příkazu volbu.  
- `.action()`: Definuje logiku spuštění příkazu.  
- `app.version.get()`: Získá aktuální verzi aplikace.

Spuštění příkazu

```bash
nocobase echo
nocobase echo -v
```

## Statické příkazy

Pro registraci použijte `Application.registerStaticCommand()`. Statické příkazy lze spustit, aniž by bylo nutné povolit plugin, což je vhodné pro úlohy spojené s instalací, inicializací, migrací nebo laděním. Registrují se v metodě `staticImport()` třídy pluginu.

Příklad

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

Spuštění příkazu

```bash
nocobase echo
nocobase echo --version
```

Popis

- `Application.registerStaticCommand()`: Registruje příkazy před instanciací aplikace.  
- Statické příkazy se obvykle používají k provádění globálních úloh, které nesouvisí se stavem aplikace nebo pluginu.  

## API příkazů

Objekty příkazů poskytují tři volitelné pomocné metody pro řízení kontextu spuštění příkazu:

| Metoda    | Účel                                              | Příklad                               |
|-----------|---------------------------------------------------|---------------------------------------|
| `ipc()`   | Komunikuje s běžícími instancemi aplikace (prostřednictvím IPC) | `app.command('reload').ipc().action()` |
| `auth()`  | Ověří, zda je konfigurace databáze správná        | `app.command('seed').auth().action()` |
| `preload()` | Přednačte konfiguraci aplikace (spustí `app.load()`) | `app.command('sync').preload().action()` |

Popis konfigurace

- **`ipc()`**  
  Ve výchozím nastavení se příkazy spouštějí v nové instanci aplikace.  
  Po povolení `ipc()` příkazy interagují s aktuálně běžící instancí aplikace prostřednictvím meziprocesové komunikace (IPC), což je vhodné pro příkazy v reálném čase (např. obnovení cache, odesílání oznámení).

- **`auth()`**  
  Před spuštěním příkazu zkontroluje, zda je konfigurace databáze dostupná.  
  Pokud je konfigurace databáze chybná nebo se připojení nezdaří, příkaz nebude pokračovat. Běžně se používá pro úlohy zahrnující zápis nebo čtení z databáze.

- **`preload()`**  
  Před spuštěním příkazu přednačte konfiguraci aplikace, což je ekvivalentní spuštění `app.load()`.  
  Vhodné pro příkazy, které závisí na konfiguraci nebo kontextu pluginu.

Další metody API naleznete v [AppCommand](/api/server/app-command).

## Běžné příklady

Inicializace výchozích dat

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Inicializován výchozí uživatel admin.');
  });
```

Znovu načtení cache pro běžící instanci (režim IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Žádám běžící aplikaci o opětovné načtení cache...');
  });
```

Statická registrace instalačního příkazu

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Nastavuji prostředí NocoBase...');
    });
});
```