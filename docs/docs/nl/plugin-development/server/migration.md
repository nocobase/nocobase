:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Migration

Tijdens de ontwikkeling en updates van NocoBase-plugins kunnen de databasestructuren of configuraties van plugins incompatibele wijzigingen ondergaan. Om een soepele upgrade te garanderen, biedt NocoBase een **Migration**-mechanisme. Dit mechanisme maakt het mogelijk om deze wijzigingen af te handelen door migration-bestanden te schrijven. Deze handleiding helpt u systematisch inzicht te krijgen in het gebruik en de ontwikkelingsworkflow van Migration.

## Het concept van Migration

Een Migration is een script dat automatisch wordt uitgevoerd tijdens plugin-upgrades. Het wordt gebruikt om de volgende problemen op te lossen:

- Aanpassingen aan de datatabelstructuur (zoals het toevoegen van velden, wijzigen van veldtypen, enz.)
- Gegevensmigratie (bijvoorbeeld het in bulk bijwerken van veldwaarden)
- Updates van plugin-configuratie of interne logica

De uitvoeringstijd van een Migration is onderverdeeld in drie typen:

| Type | Triggermoment | Uitvoeringsscenario |
|------|---------------|---------------------|
| `beforeLoad` | Voordat alle plugin-configuraties zijn geladen | |
| `afterSync`  | Nadat collectie-configuraties zijn gesynchroniseerd met de database (de collectiestructuur is al gewijzigd) | |
| `afterLoad`  | Nadat alle plugin-configuraties zijn geladen | |

## Migration-bestanden aanmaken

Migration-bestanden moeten worden geplaatst in `src/server/migrations/*.ts` binnen de plugin-map. NocoBase biedt de `create-migration`-opdracht om snel migration-bestanden te genereren.

```bash
yarn nocobase create-migration [options] <name>
```

Optionele parameters

| Parameter | Beschrijving |
|-----------|--------------|
| `--pkg <pkg>` | Specificeer de pakketnaam van de plugin |
| `--on [on]`  | Specificeer het uitvoeringsmoment, opties: `beforeLoad`, `afterSync`, `afterLoad` |

Voorbeeld

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Het gegenereerde migration-bestandspad is als volgt:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Initiële bestandsinhoud:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Schrijf hier de upgradelogica
  }
}
```

> ⚠️ `appVersion` wordt gebruikt om de versie aan te geven waarop de upgrade gericht is. Omgevingen met een versie lager dan de gespecificeerde versie zullen deze migration uitvoeren.

## Migration schrijven

In Migration-bestanden kunt u via `this` de volgende veelgebruikte eigenschappen en API's benaderen, wat het eenvoudig maakt om databases, plugins en applicatie-instanties te beheren:

Veelgebruikte eigenschappen

- **`this.app`**  
  De huidige NocoBase-applicatie-instantie. Kan worden gebruikt om toegang te krijgen tot globale services, plugins of configuratie.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  De database service-instantie, biedt interfaces voor het uitvoeren van bewerkingen op modellen (collecties).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  De huidige plugin-instantie, kan worden gebruikt om toegang te krijgen tot aangepaste methoden van de plugin.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  De Sequelize-instantie, kan direct ruwe SQL of transactie-bewerkingen uitvoeren.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize's QueryInterface, vaak gebruikt om tabelstructuren te wijzigen, zoals het toevoegen van velden, verwijderen van tabellen, enz.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Voorbeeld van een Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Gebruik queryInterface om een veld toe te voegen
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Gebruik db om toegang te krijgen tot datamodellen
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Voer de aangepaste methode van de plugin uit
    await this.plugin.customMethod();
  }
}
```

Naast de hierboven genoemde veelgebruikte eigenschappen, biedt Migration ook uitgebreide API's. Voor gedetailleerde documentatie, zie [Migration API](/api/server/migration).

## Migration activeren

De uitvoering van een Migration wordt geactiveerd door de `nocobase upgrade`-opdracht:

```bash
$ yarn nocobase upgrade
```

Tijdens de upgrade bepaalt het systeem de uitvoeringsvolgorde op basis van het Migration-type en `appVersion`.

## Migration testen

Bij de ontwikkeling van plugins wordt aangeraden een **Mock Server** te gebruiken om te testen of de migration correct wordt uitgevoerd, om zo schade aan echte gegevens te voorkomen.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Naam van de plugin
      version: '0.18.0-alpha.5', // Versie vóór de upgrade
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Schrijf validatielogica, bijvoorbeeld controleren of een veld bestaat, of gegevensmigratie is gelukt
  });
});
```

> Tip: Met een Mock Server kunt u snel upgradescenario's simuleren en de uitvoeringsvolgorde van Migration en gegevenswijzigingen verifiëren.

## Aanbevelingen voor ontwikkelingspraktijken

1.  **Splits Migration**  
    Probeer per upgrade één migration-bestand te genereren. Dit bevordert de atomiciteit en vereenvoudigt het oplossen van problemen.
2.  **Specificeer het uitvoeringsmoment**  
    Kies `beforeLoad`, `afterSync` of `afterLoad` op basis van de te bewerken objecten, om afhankelijkheden van niet-geladen modules te voorkomen.
3.  **Let op versiebeheer**  
    Gebruik `appVersion` om duidelijk de versie te specificeren waarvoor de migration van toepassing is, om herhaalde uitvoering te voorkomen.
4.  **Testdekking**  
    Valideer de migration op een Mock Server voordat u de upgrade in een echte omgeving uitvoert.