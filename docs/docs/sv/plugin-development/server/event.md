:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Händelser

NocoBases server utlöser motsvarande händelser under applikationens livscykel, plugin-programmens livscykel och databasoperationer. Plugin-utvecklare kan lyssna på dessa händelser för att implementera utökad logik, automatiska operationer eller anpassade beteenden.

NocoBases händelsesystem är huvudsakligen uppdelat i två nivåer:

- **`app.on()` - Applikationsnivåhändelser**: Lyssna på applikationens livscykelhändelser, som start, installation, aktivering av plugin-program med mera.
- **`db.on()` - Databasnivåhändelser**: Lyssna på operationer på datamodellnivå, som att skapa, uppdatera, ta bort poster med mera.

Båda ärver från Node.js `EventEmitter` och stöder de standardiserade gränssnitten `.on()`, `.off()` och `.emit()`. NocoBase har även utökat stödet för `emitAsync`, som används för att asynkront utlösa händelser och vänta tills alla lyssnare har slutfört sin exekvering.

## Var du registrerar händelselyssnare

Händelselyssnare bör generellt registreras i plugin-programmets `beforeLoad()`-metod, vilket säkerställer att händelserna är redo under plugin-programmets laddningsfas och att efterföljande logik kan svara korrekt.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Lyssna på applikationshändelser
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase har startat');
    });

    // Lyssna på databashändelser
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nytt inlägg: ${model.get('title')}`);
      }
    });
  }
}
```

## Lyssna på applikationshändelser `app.on()`

Applikationshändelser används för att fånga upp förändringar i NocoBase-applikationens och plugin-programmens livscykel, vilket är lämpligt för initialiseringslogik, resursregistrering eller detektering av plugin-beroenden.

### Vanliga händelsetyper

| Händelsenamn                  | Utlösningstidpunkt              | Typiska användningsområden             |
|-------------------------------|---------------------------------|----------------------------------------|
| `beforeLoad` / `afterLoad`    | Före / efter applikationsladdning | Registrera resurser, initiera konfiguration |
| `beforeStart` / `afterStart`  | Före / efter tjänststart        | Starta uppgifter, skriva ut startloggar |
| `beforeInstall` / `afterInstall` | Före / efter applikationsinstallation | Initiera data, importera mallar        |
| `beforeStop` / `afterStop`    | Före / efter tjänststopp        | Rensa resurser, spara tillstånd       |
| `beforeDestroy` / `afterDestroy` | Före / efter applikationsförstöring | Ta bort cache, koppla från anslutningar |
| `beforeLoadPlugin` / `afterLoadPlugin` | Före / efter plugin-laddning    | Ändra plugin-konfiguration eller utöka funktionalitet |
| `beforeEnablePlugin` / `afterEnablePlugin` | Före / efter plugin-aktivering  | Kontrollera beroenden, initiera plugin-logik |
| `beforeDisablePlugin` / `afterDisablePlugin` | Före / efter plugin-inaktivering | Rensa plugin-resurser                  |
| `afterUpgrade`                | Efter att applikationsuppgradering slutförts | Utföra datamigrering eller kompatibilitetsfixar |

Exempel: Lyssna på applikationsstartshändelse

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase-tjänsten har startat!');
});
```

Exempel: Lyssna på plugin-laddningshändelse

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin-programmet ${plugin.name} har laddats`);
});
```

## Lyssna på databashändelser `db.on()`

Databashändelser kan fånga upp olika dataförändringar på modellnivå, vilket är lämpligt för granskning, synkronisering, automatisk ifyllning och andra operationer.

### Vanliga händelsetyper

| Händelsenamn                          | Utlösningstidpunkt                       |
|---------------------------------------|------------------------------------------|
| `beforeSync` / `afterSync`            | Före / efter synkronisering av databasstruktur |
| `beforeValidate` / `afterValidate`    | Före / efter datavalidering              |
| `beforeCreate` / `afterCreate`        | Före / efter att poster skapas           |
| `beforeUpdate` / `afterUpdate`        | Före / efter att poster uppdateras       |
| `beforeSave` / `afterSave`            | Före / efter spara (inkluderar skapa och uppdatera) |
| `beforeDestroy` / `afterDestroy`      | Före / efter att poster tas bort         |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Efter operationer som inkluderar associerad data |
| `beforeDefineCollection` / `afterDefineCollection` | Före / efter att samlingar definieras |
| `beforeRemoveCollection` / `afterRemoveCollection` | Före / efter att samlingar tas bort   |

Exempel: Lyssna på händelsen efter att data har skapats

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Data har skapats!');
});
```

Exempel: Lyssna på händelsen innan data uppdateras

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Data håller på att uppdateras!');
});
```