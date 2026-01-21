:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# CronJobManager

De `CronJobManager` is een taakplanner die NocoBase aanbiedt, gebaseerd op [cron](https://www.npmjs.com/package/cron). Hiermee kunnen **plugins** geplande taken op de server registreren voor het periodiek uitvoeren van specifieke logica.

## Basisgebruik

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Voert dagelijks om 00:00 uit
      onTick: async () => {
        console.log('Dagelijkse taak: tijdelijke gegevens opschonen');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Automatisch starten
    });
  }

  async cleanTemporaryData() {
    // Voer hier de opschoonlogica uit
  }
}
```

## Parameterbeschrijving

De `CronJobParameters`-typedefinitie is als volgt (van [cron](https://www.npmjs.com/package/cron)):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| Parameter        | Type                       | Beschrijving                                                                                             |
| ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | De tijdsuitdrukking voor de geplande taak. Ondersteunt standaard cron-uitdrukkingen, bijvoorbeeld `0 0 * * *` betekent dagelijks om 00:00 uur uitvoeren. |
| **onTick**       | `function`                 | De hoofdfunctie van de taak. Wordt op het opgegeven tijdstip geactiveerd.                                |
| **onComplete**   | `function`                 | Wordt uitgevoerd wanneer de taak wordt gestopt met `job.stop()` of nadat de `onTick`-functie is voltooid. |
| **timeZone**     | `string`                   | Specificeert de uitvoeringstijdzone (bijv. `Asia/Shanghai`).                                             |
| **context**      | `any`                      | De context bij het uitvoeren van `onTick`.                                                               |
| **runOnInit**    | `boolean`                  | Of de taak onmiddellijk één keer moet worden uitgevoerd bij initialisatie.                               |
| **utcOffset**    | `string \| number`         | Specificeert de tijdzone-offset.                                                                         |
| **unrefTimeout** | `boolean`                  | Bepaalt of de event loop actief blijft.                                                                  |

## Voorbeelden van Cron-uitdrukkingen

| Uitdrukking      | Betekenis               |
| ---------------- | ----------------------- |
| `* * * * *`      | Elke minuut uitvoeren   |
| `0 * * * *`      | Elk uur uitvoeren       |
| `0 0 * * *`      | Dagelijks om 00:00 uur uitvoeren |
| `0 9 * * 1`      | Elke maandag om 09:00 uur uitvoeren |
| `*/10 * * * *`   | Elke 10 minuten uitvoeren |

> 💡 U kunt [crontab.guru](https://crontab.guru/) gebruiken om uitdrukkingen te genereren.

## Taken starten en stoppen

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Start de taak
job.stop();  // Stop de taak
```

:::tip

Geplande taken starten en stoppen samen met de applicatie. U hoeft ze doorgaans niet handmatig te starten of te stoppen, tenzij dit echt nodig is.

:::