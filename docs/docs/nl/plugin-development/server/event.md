:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Event

De server van NocoBase genereert events (gebeurtenissen) tijdens de levenscyclus van de applicatie, de levenscyclus van plugins en databasebewerkingen. Plugin-ontwikkelaars kunnen naar deze events luisteren om uitbreidingslogica, geautomatiseerde handelingen of aangepast gedrag te implementeren.

Het eventsysteem van NocoBase is hoofdzakelijk verdeeld in twee niveaus:

- **`app.on()` - Events op applicatieniveau**: Luister naar levenscyclus-events van de applicatie, zoals het starten, installeren of inschakelen van plugins.
- **`db.on()` - Events op databaseniveau**: Luister naar operationele events op datamodel-niveau, zoals het aanmaken, bijwerken of verwijderen van records.

Beide erven over van Node.js's `EventEmitter` en ondersteunen de standaard `.on()`, `.off()` en `.emit()` interfaces. NocoBase biedt ook uitgebreide ondersteuning voor `emitAsync`, dat wordt gebruikt om events asynchroon te activeren en te wachten tot alle listeners hun uitvoering hebben voltooid.

## Waar u event-listeners registreert

Event-listeners moeten over het algemeen worden geregistreerd in de `beforeLoad()`-methode van de plugin. Dit zorgt ervoor dat de events al klaar zijn tijdens de laadfase van de plugin en dat de daaropvolgende logica correct kan reageren.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Luister naar applicatie-events
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase is gestart');
    });

    // Luister naar database-events
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nieuw bericht: ${model.get('title')}`);
      }
    });
  }
}
```

## Luisteren naar applicatie-events `app.on()`

Applicatie-events worden gebruikt om veranderingen in de levenscyclus van de NocoBase-applicatie en plugins vast te leggen. Ze zijn geschikt voor initialisatielogica, resourceregistratie of het detecteren van plugin-afhankelijkheden.

### Veelvoorkomende event-types

| Eventnaam | Moment van activering | Typische toepassingen |
|-----------|-----------------------|-----------------------|
| `beforeLoad` / `afterLoad` | Voor / na het laden van de applicatie | Resources registreren, configuratie initialiseren |
| `beforeStart` / `afterStart` | Voor / na het starten van de service | Taken starten, opstartlogs afdrukken |
| `beforeInstall` / `afterInstall` | Voor / na de installatie van de applicatie | Gegevens initialiseren, sjablonen importeren |
| `beforeStop` / `afterStop` | Voor / na het stoppen van de service | Resources opschonen, status opslaan |
| `beforeDestroy` / `afterDestroy` | Voor / na het vernietigen van de applicatie | Cache verwijderen, verbindingen verbreken |
| `beforeLoadPlugin` / `afterLoadPlugin` | Voor / na het laden van een plugin | Plugin-configuratie aanpassen of functionaliteit uitbreiden |
| `beforeEnablePlugin` / `afterEnablePlugin` | Voor / na het inschakelen van een plugin | Afhankelijkheden controleren, plugin-logica initialiseren |
| `beforeDisablePlugin` / `afterDisablePlugin` | Voor / na het uitschakelen van een plugin | Plugin-resources opschonen |
| `afterUpgrade` | Na het voltooien van een applicatie-upgrade | Gegevensmigratie of compatibiliteitsfixes uitvoeren |

Voorbeeld: Luisteren naar het opstart-event van de applicatie

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase-service is gestart!');
});
```

Voorbeeld: Luisteren naar het laad-event van een plugin

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} is geladen`);
});
```

## Luisteren naar database-events `db.on()`

Database-events kunnen diverse gegevenswijzigingen op modelniveau vastleggen. Ze zijn geschikt voor auditing, synchronisatie, automatisch aanvullen en andere bewerkingen.

### Veelvoorkomende event-types

| Eventnaam | Moment van activering |
|-----------|-----------------------|
| `beforeSync` / `afterSync` | Voor / na het synchroniseren van de databasestructuur |
| `beforeValidate` / `afterValidate` | Voor / na gegevensvalidatie |
| `beforeCreate` / `afterCreate` | Voor / na het aanmaken van records |
| `beforeUpdate` / `afterUpdate` | Voor / na het bijwerken van records |
| `beforeSave` / `afterSave` | Voor / na het opslaan (inclusief aanmaken en bijwerken) |
| `beforeDestroy` / `afterDestroy` | Voor / na het verwijderen van records |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Na bewerkingen die gekoppelde gegevens bevatten |
| `beforeDefineCollection` / `afterDefineCollection` | Voor / na het definiëren van collecties |
| `beforeRemoveCollection` / `afterRemoveCollection` | Voor / na het verwijderen van collecties |

Voorbeeld: Luisteren naar het event na het aanmaken van gegevens

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Gegevens zijn aangemaakt!');
});
```

Voorbeeld: Luisteren naar het event vóór het bijwerken van gegevens

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Gegevens staan op het punt te worden bijgewerkt!');
});
```