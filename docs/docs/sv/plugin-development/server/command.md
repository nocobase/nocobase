:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Kommandon

I NocoBase använder ni kommandon för att utföra operationer relaterade till applikationer eller plugin i kommandoraden. Detta kan vara att köra systemuppgifter, utföra migreringar eller synkroniseringar, initiera konfiguration, eller interagera med körande applikationsinstanser. Utvecklare kan definiera anpassade kommandon för plugin och registrera dem via `app`-objektet, för att sedan köra dem i CLI som `nocobase <command>`.

## Kommando-typer

I NocoBase delas registreringen av kommandon in i två typer:

| Typ              | Registreringsmetod                    | Kräver plugin aktivering? | Typiska scenarier                      |
| ---------------- | ------------------------------------- | ------------------------- | --------------------------------------- |
| Dynamiskt kommando | `app.command()`                       | ✅ Ja                     | Plugin-relaterade affärsfunktioner      |
| Statiskt kommando | `Application.registerStaticCommand()` | ❌ Nej                    | Installations-, initierings- och underhållskommandon |

## Dynamiska kommandon

Använd `app.command()` för att definiera plugin-kommandon. Kommandon kan bara köras efter att plugin har aktiverats. Kommandofiler ska placeras i `src/server/commands/*.ts` i plugin-katalogen.

Exempel

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

Beskrivning

- `app.command('echo')`: Definierar ett kommando med namnet `echo`.
- `.option('-v, --version')`: Lägger till ett alternativ till kommandot.
- `.action()`: Definierar logiken för kommandoexekvering.
- `app.version.get()`: Hämtar den aktuella applikationsversionen.

Kör kommando

```bash
nocobase echo
nocobase echo -v
```

## Statiska kommandon

Använd `Application.registerStaticCommand()` för att registrera. Statiska kommandon kan köras utan att plugin behöver aktiveras, vilket gör dem lämpliga för installations-, initierings-, migrerings- eller felsökningsuppgifter. Registrera dem i plugin-klassens `staticImport()`-metod.

Exempel

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

Kör kommando

```bash
nocobase echo
nocobase echo --version
```

Beskrivning

- `Application.registerStaticCommand()`: Registrerar kommandon innan applikationen instansieras.
- Statiska kommandon används vanligtvis för att utföra globala uppgifter som är oberoende av applikationens eller plugin:ets tillstånd.

## Kommando-API

Kommandoobjekt erbjuder tre valfria hjälpmetoder för att styra kommandots exekveringskontext:

| Metod     | Syfte                                       | Exempel                               |
| --------- | ------------------------------------------- | ------------------------------------- |
| `ipc()`   | Kommunicera med körande applikationsinstanser (via IPC) | `app.command('reload').ipc().action()` |
| `auth()`  | Verifiera att databaskonfigurationen är korrekt | `app.command('seed').auth().action()` |
| `preload()` | Förladdar applikationskonfiguration (kör `app.load()`) | `app.command('sync').preload().action()` |

Konfigurationsbeskrivning

- **`ipc()`**
  Som standard körs kommandon i en ny applikationsinstans. När ni aktiverar `ipc()` interagerar kommandon med den för närvarande körande applikationsinstansen via interprocesskommunikation (IPC), vilket är lämpligt för realtidsoperationer (som att uppdatera cache, skicka meddelanden).

- **`auth()`**
  Kontrollerar om databaskonfigurationen är tillgänglig innan kommandot körs. Om databaskonfigurationen är felaktig eller anslutningen misslyckas, fortsätter kommandot inte. Används ofta för uppgifter som involverar databas-skrivningar eller -läsningar.

- **`preload()`**
  Förladdar applikationskonfigurationen innan kommandot körs, vilket motsvarar att köra `app.load()`. Lämpligt för kommandon som är beroende av konfiguration eller plugin-kontext.

För fler API-metoder, se [AppCommand](/api/server/app-command).

## Vanliga exempel

Initiera standarddata

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

Ladda om cache för körande instans (IPC-läge)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

Statisk registrering av installationskommando

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```