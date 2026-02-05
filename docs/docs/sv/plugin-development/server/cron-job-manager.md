:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# CronJobManager – Hantering av schemalagda uppgifter

`CronJobManager` är en hanterare för schemalagda uppgifter som NocoBase tillhandahåller, baserad på [cron](https://www.npmjs.com/package/cron). Den låter **plugin** registrera schemalagda uppgifter på servern för att periodiskt utföra specifik logik.

## Grundläggande användning

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Utförs dagligen kl. 00:00
      onTick: async () => {
        console.log('Daglig uppgift: rensa temporär data');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Startar automatiskt
    });
  }

  async cleanTemporaryData() {
    // Utför rensningslogiken här
  }
}
```

## Parameterbeskrivning

Typdefinitionen för `CronJobParameters` är följande (från [cron](https://www.npmjs.com/package/cron)):

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

| Parameter        | Typ                        | Beskrivning                                                                                             |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Tidsuttryck för den schemalagda uppgiften. Stöder standard cron-uttryck, till exempel `0 0 * * *` betyder att den körs dagligen kl. 00:00. |
| **onTick**       | `function`                 | Uppgiftens huvudfunktion. Den kommer att utlösas vid den angivna tiden.                                 |
| **onComplete**   | `function`                 | Utförs när uppgiften stoppas med `job.stop()` eller efter att `onTick`-funktionen har slutförts.        |
| **timeZone**     | `string`                   | Anger exekveringstidszonen (t.ex. `Asia/Shanghai`).                                                     |
| **context**      | `any`                      | Kontexten vid exekvering av `onTick`.                                                                   |
| **runOnInit**    | `boolean`                  | Om den ska exekveras omedelbart vid initialisering.                                                     |
| **utcOffset****  | `string \| number`         | Anger tidszonsförskjutningen.                                                                           |
| **unrefTimeout** | `boolean`                  | Styr om händelseloopen ska förbli aktiv.                                                                |

## Exempel på Cron-uttryck

| Uttryck         | Betydelse               |
| --------------- | ----------------------- |
| `* * * * *`     | Utförs varje minut      |
| `0 * * * *`     | Utförs varje timme      |
| `0 0 * * *`     | Utförs dagligen kl. 00:00 |
| `0 9 * * 1`     | Utförs varje måndag kl. 09:00 |
| `*/10 * * * *`  | Utförs var 10:e minut   |

> 💡 Du kan använda [crontab.guru](https://crontab.guru/) för att få hjälp med att generera uttryck.

## Kontrollera start och stopp av uppgifter

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Starta uppgiften
job.stop();  // Stoppa uppgiften
```

:::tip

Schemalagda uppgifter startar och stoppar tillsammans med applikationen. Om det inte är absolut nödvändigt behöver ni vanligtvis inte starta eller stoppa dem manuellt.

:::