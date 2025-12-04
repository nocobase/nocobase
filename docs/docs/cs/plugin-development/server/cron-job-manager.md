:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# CronJobManager

`CronJobManager` je správce plánovaných úloh, který NocoBase poskytuje a je založen na [cronu](https://www.npmjs.com/package/cron). Umožňuje pluginům registrovat plánované úlohy na serveru pro pravidelné spouštění specifické logiky.

## Základní použití

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Spustí se denně v 00:00
      onTick: async () => {
        console.log('Denní úloha: vyčištění dočasných dat');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Automatické spuštění
    });
  }

  async cleanTemporaryData() {
    // Zde implementujte logiku čištění
  }
}
```

## Popis parametrů

Typ `CronJobParameters` je definován následovně (z [cronu](https://www.npmjs.com/package/cron)):

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

| Parametr         | Typ                        | Popis                                                                                              |
| :--------------- | :------------------------- | :------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Časový výraz pro plánovanou úlohu. Podporuje standardní cron výrazy, například `0 0 * * *` znamená spuštění denně v 00:00. |
| **onTick**       | `function`                 | Hlavní funkce úlohy. Bude spuštěna v určený čas.                                                   |
| **onComplete**   | `function`                 | Spustí se, když je úloha zastavena pomocí `job.stop()` nebo po dokončení funkce `onTick`.         |
| **start**        | `boolean`                  | Zda se má úloha spustit ihned po vytvoření.                                                        |
| **timeZone**     | `string`                   | Určuje časovou zónu pro spuštění (např. `Asia/Shanghai`).                                          |
| **context**      | `any`                      | Kontext při spouštění `onTick`.                                                                    |
| **runOnInit**    | `boolean`                  | Zda se má úloha spustit jednou ihned při inicializaci.                                             |
| **utcOffset**    | `string \| number`         | Určuje časový posun UTC.                                                                           |
| **unrefTimeout** | `boolean`                  | Určuje, zda má smyčka událostí zůstat aktivní.                                                     |

## Příklady Cron výrazů

| Výraz          | Význam                    |
| :------------- | :------------------------ |
| `* * * * *`    | Spustí se každou minutu   |
| `0 * * * *`    | Spustí se každou hodinu   |
| `0 0 * * *`    | Spustí se denně v 00:00   |
| `0 9 * * 1`    | Spustí se každé pondělí v 09:00 |
| `*/10 * * * *` | Spustí se každých 10 minut |

> 💡 Pro generování výrazů můžete použít [crontab.guru](https://crontab.guru/).

## Řízení spouštění a zastavování úloh

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Spustí úlohu
job.stop();  // Zastaví úlohu
```

:::tip

Plánované úlohy se spouštějí a zastavují společně s aplikací. Obvykle je nemusíte spouštět ani zastavovat ručně, pokud to není nezbytně nutné.

:::