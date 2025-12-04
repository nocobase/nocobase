:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Commando's op de Commandoregel

In NocoBase worden commando's gebruikt om acties uit te voeren die gerelateerd zijn aan applicaties of plugins via de commandoregel. Denk hierbij aan het uitvoeren van systeemtaken, migratie- of synchronisatieoperaties, het initialiseren van configuraties, of het communiceren met actieve applicatie-instanties. Ontwikkelaars kunnen aangepaste commando's definiëren voor plugins en deze registreren via het `app`-object, waarna u ze in de CLI kunt uitvoeren als `nocobase <command>`.

## Typen commando's

In NocoBase is het registreren van commando's onderverdeeld in twee typen:

| Type | Registratiemethode | Moet de plugin ingeschakeld zijn? | Typische scenario's |
|------|--------------------|-----------------------------------|----------------------|
| Dynamisch commando | `app.command()` | ✅ Ja | Commando's gerelateerd aan plugin-functionaliteit |
| Statisch commando | `Application.registerStaticCommand()` | ❌ Nee | Installatie-, initialisatie- en onderhoudscommando's |

## Dynamische commando's

Gebruik `app.command()` om plugin-commando's te definiëren. Deze commando's kunnen alleen worden uitgevoerd nadat de plugin is ingeschakeld. Commando-bestanden moeten in de `src/server/commands/*.ts`-map van de plugin-directory worden geplaatst.

Voorbeeld

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

Uitleg

- `app.command('echo')`: Definieert een commando met de naam `echo`.
- `.option('-v, --version')`: Voegt een optie toe aan het commando.
- `.action()`: Definieert de uitvoerlogica van het commando.
- `app.version.get()`: Haalt de huidige applicatieversie op.

Commando uitvoeren

```bash
nocobase echo
nocobase echo -v
```

## Statische commando's

Gebruik `Application.registerStaticCommand()` om te registreren. Statische commando's kunnen worden uitgevoerd zonder dat plugins ingeschakeld hoeven te zijn. Dit is handig voor installatie-, initialisatie-, migratie- of debugtaken. Registreer ze in de `staticImport()`-methode van de plugin-klasse.

Voorbeeld

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

Commando uitvoeren

```bash
nocobase echo
nocobase echo --version
```

Uitleg

- `Application.registerStaticCommand()` registreert commando's voordat de applicatie wordt geïnstantieerd.
- Statische commando's worden doorgaans gebruikt voor het uitvoeren van globale taken die onafhankelijk zijn van de status van de applicatie of plugin.

## Commando API

Commando-objecten bieden drie optionele hulpmethoden om de uitvoeringscontext van een commando te beheren:

| Methode | Doel | Voorbeeld |
|------|------|------|
| `ipc()` | Communiceert met actieve applicatie-instanties (via IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Controleert of de databaseconfiguratie correct is | `app.command('seed').auth().action()` |
| `preload()` | Laadt de applicatieconfiguratie vooraf (voert `app.load()` uit) | `app.command('sync').preload().action()` |

Uitleg configuratie

- **`ipc()`**
  Standaard worden commando's uitgevoerd in een nieuwe applicatie-instantie.
  Na het inschakelen van `ipc()` communiceren commando's via interprocescommunicatie (IPC) met de momenteel actieve applicatie-instantie. Dit is geschikt voor real-time operatiecommando's (zoals het verversen van de cache of het verzenden van meldingen).

- **`auth()`**
  Controleert vóór de uitvoering van het commando of de databaseconfiguratie beschikbaar is.
  Als de databaseconfiguratie onjuist is of de verbinding mislukt, wordt het commando niet verder uitgevoerd. Vaak gebruikt voor taken die database-schrijf- of leesbewerkingen omvatten.

- **`preload()`**
  Laadt de applicatieconfiguratie voorafgaand aan de uitvoering van het commando, wat gelijkstaat aan het uitvoeren van `app.load()`.
  Geschikt voor commando's die afhankelijk zijn van de configuratie of de plugin-context.

Voor meer API-methoden, zie [AppCommand](/api/server/app-command).

## Veelvoorkomende voorbeelden

Standaardgegevens initialiseren

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Standaard admin-gebruiker geïnitialiseerd.');
  });
```

Cache opnieuw laden voor actieve instantie (IPC-modus)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Actieve applicatie vraagt om cache opnieuw te laden...');
  });
```

Statische registratie van installatiecommando

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('NocoBase-omgeving wordt ingesteld...');
    });
});
```