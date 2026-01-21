:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Migration

Vid utveckling och uppdatering av NocoBase-plugins kan databasstrukturer eller konfigurationer ändras på ett inkompatibelt sätt. För att säkerställa smidiga uppgraderingar erbjuder NocoBase en **Migration**-mekanism för att hantera dessa ändringar genom att skriva migrationsfiler. I den här guiden får ni en systematisk genomgång av hur Migration används och dess utvecklingsflöde.

## Konceptet Migration

Migration är ett skript som automatiskt körs vid plugin-uppgraderingar och används för att lösa följande problem:

- Justeringar av datatabellstrukturer (t.ex. lägga till fält, ändra fälttyper)
- Datamigrering (t.ex. massuppdateringar av fältvärden)
- Uppdateringar av plugin-konfigurationer eller intern logik

Tidpunkten för när en Migration körs delas in i tre kategorier:

| Typ | Utlösningstidpunkt | Exekveringsscenario |
|------|----------|----------|
| `beforeLoad` | Innan alla plugin-konfigurationer laddas | |
| `afterSync`  | Efter att samlingskonfigurationer har synkroniserats med databasen (samlingsstrukturen har redan ändrats) | |
| `afterLoad`  | Efter att alla plugin-konfigurationer har laddats | |

## Skapa migrationsfiler

Migrationsfiler ska placeras i `src/server/migrations/*.ts` i plugin-katalogen. NocoBase erbjuder kommandot `create-migration` för att snabbt generera migrationsfiler.

```bash
yarn nocobase create-migration [options] <name>
```

Valfria parametrar

| Parameter | Beskrivning |
|------|------|
| `--pkg <pkg>` | Ange plugin-paketnamn |
| `--on [on]`  | Ange exekveringstidpunkt, alternativ: `beforeLoad`, `afterSync`, `afterLoad` |

Exempel

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Den genererade migrationsfilens sökväg är följande:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Filens initiala innehåll:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Skriv uppgraderingslogik här
  }
}
```

> ⚠️ `appVersion` används för att identifiera den version som uppgraderingen riktar sig mot. Miljöer med versioner som är lägre än den angivna versionen kommer att köra denna migration.

## Skriva Migrationer

I migrationsfiler kan ni via `this` komma åt följande vanliga egenskaper och API:er för att enkelt hantera databasen, plugins och applikationsinstanser:

Vanliga egenskaper

- **`this.app`**  
  Nuvarande NocoBase-applikationsinstans. Kan användas för att komma åt globala tjänster, plugins eller konfigurationer.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Databasinstans, tillhandahåller gränssnitt för att hantera modeller (samlingar).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Nuvarande plugin-instans, kan användas för att komma åt pluginets anpassade metoder.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelize-instans, kan direkt exekvera rå SQL eller transaktionsoperationer.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize QueryInterface, används ofta för att modifiera tabellstrukturer, till exempel att lägga till fält eller ta bort tabeller.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Exempel på att skriva en Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Använd queryInterface för att lägga till ett fält
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Använd db för att komma åt datamodeller
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Kör pluginets anpassade metod
    await this.plugin.customMethod();
  }
}
```

Utöver de vanliga egenskaper som listats ovan, tillhandahåller Migration även omfattande API:er. För detaljerad dokumentation, se [Migration API](/api/server/migration).

## Utlös Migration

Exekveringen av en Migration utlöses av kommandot `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Vid uppgradering bestämmer systemet exekveringsordningen baserat på Migration-typen och `appVersion`.

## Testa Migration

Vid plugin-utveckling rekommenderas det att använda en **Mock Server** för att testa om migrationen körs korrekt, för att undvika att skada verklig data.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Plugin-namn
      version: '0.18.0-alpha.5', // Version före uppgradering
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Skriv valideringslogik här, till exempel kontrollera om fält existerar, om datamigreringen lyckades
  });
});
```

> Tips: Genom att använda en Mock Server kan ni snabbt simulera uppgraderingsscenarier och verifiera Migrationens exekveringsordning och dataändringar.

## Rekommendationer för utvecklingspraxis

1.  **Dela upp Migrationer**  
    Försök att generera en migrationsfil per uppgradering för att bibehålla atomicitet och förenkla felsökning.
2.  **Ange exekveringstidpunkt**  
    Välj `beforeLoad`, `afterSync` eller `afterLoad` baserat på vilka objekt ni hanterar, för att undvika beroenden till moduler som inte har laddats.
3.  **Hantera versionshantering**  
    Använd `appVersion` för att tydligt specificera vilken version migrationen är avsedd för, för att förhindra upprepad exekvering.
4.  **Testtäckning**  
    Verifiera migrationen på en Mock Server innan ni utför uppgraderingen i en verklig miljö.